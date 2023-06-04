import fs from "fs";
import md5File from "md5-file";
import {
    AlbumArtists,
    albumArtists,
    albumGenres,
    Albums,
    albums,
    Artists,
    artists,
    AlbumGenres,
    genres,
    songs,
    Songs,
    Genres,
    ReturningArtists,
    ReturningGenres,
    ReturningAlbums,
    NewArtists,
    NewGenres
} from "../db/schema.js";
import { eq } from "drizzle-orm";
import path from "path";
import { getAudioDurationInSeconds } from "get-audio-duration";
import { importMusicMetadata } from "./audioMetadata.js";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg/index.js";
import { ICommonTagsResult } from "music-metadata";
import { AnyPgTable } from "drizzle-orm/pg-core";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Album, appWithExtras, Song } from "../types/types.js";
import { getAlbumToInsert, getSongsToInsert } from "./dbHelpers.js";

interface innerJoinReturn {
    songs: Songs;
    albums: Albums;
    artists: Artists;
    albumArtists: AlbumArtists;
    genres: Genres;
    albumGenres: AlbumGenres;
}

async function useParseFile(filePath: string) {
    return (await importMusicMetadata())(filePath);
}

export const loadSongs = async (
    app: appWithExtras,
    db: NodePgDatabase
): Promise<Album[]> => {
    const musicDir = process.env.MUSIC_DIRECTORY as string;
    return processPaths([path.resolve(musicDir)]).then(async (filePromises) => {
        return Promise.all(filePromises).then((md5s) =>
            processMd5s(app, md5s, db)
        );
    });

    function processPaths(
        pathsInMusic: fs.Dirent[] | string[],
        parentDir = ""
    ): Promise<{ md5: string; filePath: string }[]> {
        let filePromises: Promise<{ md5: string; filePath: string }>[] = [];
        const tempPaths: Promise<{ p: string; files: fs.Dirent[] }>[] = [];

        for (let i = 0; i < pathsInMusic.length; i++) {
            const filePath = pathsInMusic[i];
            if (typeof filePath === "string" || filePath.isDirectory()) {
                tempPaths.push(handleDir(filePath, parentDir));
            } else if (filePath.isFile() || filePath.isSymbolicLink()) {
                const actualFilePath = path.join(parentDir, filePath.name);
                filePromises.push(
                    md5File(actualFilePath).then((md5) => ({
                        md5,
                        filePath: actualFilePath
                    }))
                );
            }
        }

        return new Promise((resolve, reject) => {
            Promise.all(tempPaths)
                .then((dirs) => processDirectories(parentDir, dirs))
                .then((files) => Promise.all([...filePromises, ...files]))
                .then((files: { md5: string; filePath: string }[]) => {
                    return resolve(files);
                })
                .catch((err) => reject(err));
        });
    }

    async function processDirectories(
        parentDir: string,
        directories: { p: string; files: fs.Dirent[] }[]
    ): Promise<
        {
            md5: string;
            filePath: string;
        }[]
    > {
        const pathsProcessing: Promise<{ md5: string; filePath: string }[]>[] =
            [];

        for (let i = 0; i < directories.length; i++) {
            const newPath = path.join(parentDir, directories[i].p);
            pathsProcessing.push(processPaths(directories[i].files, newPath));
        }

        return Promise.all(pathsProcessing).then((paths) => paths.flat());
    }
};

interface WithOptionalAlbumId {
    albumId?: string;
}

function getAlbumFromRows(rows: innerJoinReturn[]) {
    var albumObj: Album | undefined = rows.reduce(
        (acc: Album | undefined, val: innerJoinReturn) => {
            if (acc === undefined) {
                const songs = val.songs as Songs & WithOptionalAlbumId;
                const tempAlbumId = val.songs.albumId;
                if (songs) {
                    delete (songs as WithOptionalAlbumId).albumId;
                }
                return {
                    name: val.albums.name ?? "Unknown Album Name",
                    yearReleased: val.albums.year || 1970,
                    albumArtist:
                        (val.albums.albumArtist &&
                            findArtistName(rows, val.albums.albumArtist)) ||
                        "Unknown Artist",
                    artists: [val.artists.name || "Unknown Artist"],
                    genres: [val.genres.name || "Unknown Genre"],
                    songs: [songs],
                    inDb: true,
                    albumId: tempAlbumId
                } as Album;
            } else {
                if (
                    !val.artists.name ||
                    !acc.artists.includes(val.artists.name)
                )
                    acc.artists.push(val.artists.name || "Unknown Artist");
                if (!val.genres.name || !acc.genres.includes(val.genres.name))
                    acc.genres.push(val.genres.name || "Unknown Artist");
            }
            return acc;
        },
        undefined
    );
    return albumObj;
}

function findArtistName(
    artistList: innerJoinReturn[],
    artistId: string
): string {
    for (let i = 0; i < artistList.length; i++) {
        if (artistList[i].artists.id === artistId) {
            return artistList[i].artists.name;
        }
    }
    return "Artist not found";
}

/**
 * This function compares the tags between two albums. If any of them are not matching (the user may have updated them or the tag-reading utility impoved), update the tags with the most current ones.
 * @param app Express application with extra goodies on its locals object.
 * @param a Album 1 you want to compare
 * @param b Album | boolean 2 you want to compare. This is intended to be the most recent album information (read from disk).
 * @returns void
 */
async function compareTagsAndUpdate(
    app: appWithExtras,
    a: Album,
    b: Album | boolean,
    cb: Function
) {
    const albumKeys = [
        "name",
        "yearReleased",
        "albumArtist",
        "artists",
        "genres"
    ] as (keyof Album)[];
    if (typeof b === "boolean") return;
    const keyPromises = new Array<Promise<void>>();
    for (let key of albumKeys) {
        const compA = a[key];
        const compB = b[key];
        keyPromises.push(
            new Promise((resolve, reject) => {
                if (["name", "yearReleased", "albumArtist"].includes(key)) {
                    if (compA !== compB) {
                        //return false;
                        console.log("trying to set", key, b[key]);
                        app.locals.db.update(albums).set({ [key]: b[key] });
                    }
                    resolve();
                } else {
                    const aList = a[key] as string[];
                    const bList = b[key] as string[];
                    // if a has more than b, that means we'll need to delete some and possibly update some.
                    const needToDelete = aList.filter(
                        (str) => bList.indexOf(str) === -1
                    );
                    const needToAdd = bList.filter(
                        (str) => aList.indexOf(str) === -1
                    );
                    const albumArtistI = needToDelete.reduce(
                        (acc, v, i) =>
                            acc === -1 && v === a.albumArtist ? i : acc,
                        -1
                    );
                    const table = key === "artists" ? artists : genres;
                    const entitiesNeededToBeDeleted = Promise.all(
                        needToDelete.map((name) => {
                            console.log("newName:", name, typeof name);
                            return app.locals.db
                                .select()
                                .from(table)
                                .where(eq(table.name, name));
                        })
                    );
                    entitiesNeededToBeDeleted
                        .then((entities) => entities.flat())
                        .then((entities) => {
                            if (key === "artists" && albumArtistI !== -1) {
                                // we are deleting the album artist. we need to replace it.
                                if (needToAdd.length === 0) {
                                    // we are trying to delete the album's albumArtist so lets not
                                    entities.splice(albumArtistI, 1);
                                }
                            }
                            return Promise.all(
                                entities.map((entity) =>
                                    Promise.resolve(entity.id)
                                )
                            );
                        })
                        .then((ids) =>
                            Promise.all(
                                ids.map((id) =>
                                    app.locals.db
                                        .delete(table)
                                        .where(eq(table.id, id))
                                )
                            )
                        )
                        .then(() => {
                            needToDelete.length > 0 &&
                                console.log("deleted:", needToDelete);
                            return Promise.all(
                                needToAdd.map((newName) => {
                                    console.log(
                                        "newName:",
                                        newName,
                                        typeof newName
                                    );
                                    return app.locals.db
                                        .select()
                                        .from(table)
                                        .where(eq(table.name, newName));
                                })
                            );
                        })
                        .then((existingArr) => {
                            return Promise.all(
                                needToAdd
                                    .filter((_newName, i) => {
                                        console.log(
                                            "type of albumId:",
                                            typeof a.albumId
                                        );
                                        if (
                                            existingArr[i].length > 0 &&
                                            typeof a.albumId === "string"
                                        ) {
                                            if (key === "artists") {
                                                console.log(
                                                    "adding existing artist to album:",
                                                    existingArr[i][0],
                                                    b.name
                                                );
                                                app.locals.db
                                                    .insert(albumArtists)
                                                    .values({
                                                        artistId:
                                                            existingArr[i][0]
                                                                .id,
                                                        albumId: a.albumId
                                                    });
                                            } else {
                                                console.log(
                                                    "adding existing genre to album:",
                                                    existingArr[i][0],
                                                    b.name
                                                );
                                                app.locals.db
                                                    .insert(albumGenres)
                                                    .values({
                                                        genreId:
                                                            existingArr[i][0]
                                                                .id,
                                                        albumId: a.albumId
                                                    });
                                            }
                                        }
                                        console.log(
                                            "length:",
                                            existingArr[i].length
                                        );
                                        return existingArr[i].length === 0;
                                    })
                                    .map((newName) => {
                                        console.log(
                                            "inserting into:",
                                            key,
                                            newName
                                        );
                                        return app.locals.db
                                            .insert(table)
                                            .values({ name: newName })
                                            .returning();
                                    })
                            );
                        })
                        .then((additions) => {
                            // now that we added the genres or artists, we need to:
                            //    add them to the album. (aka create relation in the join table)
                            //    now for artists, we need to keep track of if an artist was an albums' artistAlbum.
                            //    if we deleted the artistAlbum, we need to replace it.

                            const inserts = new Array<any>();
                            const albumId = a.albumId;
                            for (let i = 0; i < additions.length; i++) {
                                for (let j = 0; j < additions[i].length; j++) {
                                    if (key === "artists") {
                                        const artistId = (
                                            additions[i][j] as NewArtists
                                        ).id;
                                        if (
                                            typeof artistId === "string" &&
                                            typeof albumId === "string"
                                        ) {
                                            console.log(
                                                "inserting albumArtist:",
                                                additions[i][j].name,
                                                b.name
                                            );
                                            inserts.push(
                                                app.locals.db
                                                    .insert(albumArtists)
                                                    .values({
                                                        artistId,
                                                        albumId
                                                    })
                                            );
                                        }
                                    } else {
                                        const genreId = (
                                            additions[i][j] as NewGenres
                                        ).id;
                                        if (
                                            typeof genreId === "string" &&
                                            typeof albumId === "string"
                                        ) {
                                            console.log(
                                                "inserting albumGenre:",
                                                additions[i][j].name,
                                                b.name
                                            );
                                            inserts.push(
                                                app.locals.db
                                                    .insert(albumGenres)
                                                    .values({
                                                        genreId,
                                                        albumId
                                                    })
                                            );
                                        }
                                    }
                                }
                            }

                            const replacement = b.albumArtist;
                            let replacementI = -1;
                            for (let i = 0; i < needToAdd.length; i++) {
                                if (needToAdd[i] === replacement)
                                    replacementI = i;
                            }
                            if (albumArtistI !== -1) {
                                if (replacementI === -1) {
                                    // we just assign the first one ? i guess?
                                    replacementI = 0;
                                }
                                // great we just need to add it and then update the join table
                                Promise.all<ReturningArtists>(inserts)
                                    .then((ret) => {
                                        const newAlbumArtist =
                                            ret[replacementI];
                                        if (typeof albumId === "string") {
                                            console.log(
                                                "setting newAlbumArtist to album",
                                                b.name,
                                                newAlbumArtist.name
                                            );
                                            app.locals.db
                                                .update(albums)
                                                .set({
                                                    albumArtist:
                                                        newAlbumArtist.name
                                                })
                                                .where(eq(albums.id, albumId));
                                        }
                                    })
                                    .catch((err) =>
                                        console.log(
                                            "error occurred when doing stuff:",
                                            err
                                        )
                                    );
                            }
                            Promise.all(inserts).then(() => {
                                needToAdd.length > 0 &&
                                    console.log("inserted:", needToAdd);
                            });
                        })
                        .then(() => resolve())
                        .catch((err) => reject(err));
                }
            })
        );
    }
    let keys = Object.keys(a.songs[0]);
    const songPromises = new Array<Promise<void>>();
    for (let i = 0; i < keys.length; i++) {
        if (keys[i] === "md5") continue;
        songPromises.push(
            new Promise((resolve, reject) => {
                const key = keys[i] as keyof Song;
                if (a.songs[0][key] !== b.songs[0][key]) {
                    //return false;
                    app.locals.db
                        .update(songs)
                        .set({ [key]: b.songs[0][key] })
                        .where(eq(songs.md5, b.songs[0].md5))
                        .then(() =>
                            console.log("updated:", key, b.songs[0][key])
                        )
                        .then(resolve)
                        .catch(reject);
                } else resolve();
            })
        );
    }
    //return true;
    Promise.all([Promise.all(keyPromises), Promise.all(songPromises)]).then(
        (ret) => {
            console.log(ret);
            cb();
        }
    );
}

async function processMd5s(
    app: appWithExtras,
    md5s: { md5: string; filePath: string }[],
    db: NodePgDatabase
): Promise<Album[]> {
    console.log("FILES WITH MD5s NOT IN DB:");

    return Promise.all(
        md5s.map(async ({ md5, filePath }) => {
            return new Promise<boolean | Album>((resolve, reject) => {
                db.select()
                    .from(songs)
                    .innerJoin(albums, eq(songs.albumId, albums.id))
                    .innerJoin(
                        albumArtists,
                        eq(albumArtists.albumId, albums.id)
                    )
                    .innerJoin(albumGenres, eq(albumGenres.albumId, albums.id))
                    .innerJoin(genres, eq(albumGenres.genreId, genres.id))
                    .innerJoin(artists, eq(albumArtists.artistId, artists.id))
                    .where(eq(songs.md5, md5))
                    .then(async (rows: innerJoinReturn[]) => {
                        if (rows.length === 0) {
                            resolve(getSongInfo(app, filePath, md5));

                            // TODO: use a .then on the getSongInfo to insert it into the database
                            // And once it's in the database, then we don't have to worry about it
                            // And we can just return that 'Albums object'
                        } else {
                            const ret = getAlbumFromRows(rows);
                            //const compare = await getSongInfo(app, filePath, md5);
                            resolve(ret === undefined ? false : ret);
                            //if (ret === undefined) return resolve(false);
                            // compareTagsAndUpdate(app, ret, compare, () => resolve(ret));
                            // we need to delete the current album from the database.
                            // this should include the song.
                            // I don't think we should delete the artist or genre.
                            // These can be cleaned up when the server checks for danglers in the db
                        }
                    })
                    .catch((err) => {
                        console.error("failed db search:", err);
                        return reject(err);
                    });
            });
        })
    )
        .then(
            (ret: (Album | boolean)[]) =>
                ret.filter(
                    (a: Album | boolean) => typeof a !== "boolean"
                ) as Album[]
        )
        .then((songList: Album[]): Promise<Album[]> => {
            // songList is an array of Albums or booleans
            // could be in the database or could need to be added.
            // Does it matter if I just spam insert a bunch of data that already exists?
            const songsNotInDb: Album[] = songList.filter((song) => !song.inDb);
            const mergedAlbums: Map<string, Album> = new Map();
            for (let i = 0; i < songsNotInDb.length; i++) {
                const normalizedName = songsNotInDb[i].name
                    .toLocaleLowerCase()
                    .trim()
                    .normalize();
                let song = mergedAlbums.get(normalizedName);
                if (!song?.name) {
                    mergedAlbums.set(
                        normalizedName,
                        JSON.parse(JSON.stringify(songsNotInDb[i]))
                    );
                } else {
                    song?.songs.push(songsNotInDb[i].songs[0]);
                }
            }
            console.log("merged albums:", mergedAlbums);

            // now that albums are merged into a similar sort of grouping, we can insert into the database.
            // var inserts: Promise<void>[] = [];
            return new Promise<Album[]>((resolve, reject) => {
                insertAllIntoDb(db, mergedAlbums)
                    .then(() => {
                        /*
                name: rows[0].albums.name ?? "Unknown Album Name",
                  yearReleased: rows[0].albums.year || 1970,
                  albumArtist:
                    (rows[0].albums.albumArtist && findArtistName(rows, rows[0].albums.albumArtist)) ||
                    "Unknown Artist Name",
                    artists: rows.map((row: innerJoinReturn) => row.artists.name),
                    genres: rows.map((row: innerJoinReturn) => row.genres.name),
                  songs: [rows[0].songs],
                  inDb: true,
                */
                        console.table(
                            songList
                                .map((album) => album.songs.map((s) => s.md5))
                                .flat()
                        );
                        // resolve(songList.flat() as Album[]);
                        resolve(songList as Album[]);
                    })
                    .catch((err) => {
                        reject(err);
                    });
                //eventually this is what I want: but need to finish inserts first. resolve(songList.map((album) => album.songs[0].md5));
            });
        })
        .catch((err) => {
            console.log(
                "error occurred when trying to instert the songList into the database:",
                err
            );
            return err;
        });
}

function uniqueFromObject(objs: Map<string, any>, key: string, seen: string[]) {
    const uniqueFromObj: string[] = [];
    Array.from(objs.values()).forEach((obj) =>
        obj[key].forEach((curr: string) => {
            if (!uniqueFromObj.includes(curr) && !seen.includes(curr)) {
                uniqueFromObj.push(curr);
            }
        })
    );
    return uniqueFromObj;
}

async function insertAllIntoDb(
    db: NodePgDatabase,
    albumList: Map<string, Album>
): Promise<void> {
    const artistLookUps = Array.from(albumList.values()).flatMap(
        (album: Album) =>
            album.artists.map((artist: string) =>
                db
                    .select()
                    .from(artists)
                    .where(eq(artists.name, artist))
                    .execute()
            )
    );
    const genreLookUps = Array.from(albumList.values()).flatMap((album) =>
        album.genres.map((genre) =>
            db.select().from(genres).where(eq(genres.name, genre)).execute()
        )
    );

    return Promise.all([
        Promise.all(artistLookUps),
        Promise.all(genreLookUps)
    ]).then(
        async (returnFromDb: [ReturningArtists[][], ReturningGenres[][]]) => {
            const uniqueElements = (arr: string[]) => [...new Set(arr)];

            const uniqueCol = (
                col: string,
                existingArr: any[],
                tag: string = "name"
            ) => {
                return uniqueFromObject(albumList, col, existingArr).map(
                    (val: any) => ({
                        [tag]: val
                    })
                );
            };

            const insertIntoTable = (
                table: AnyPgTable,
                values: any[]
            ): Promise<any> => {
                return values.length === 0
                    ? Promise.resolve([])
                    : db.insert(table).values(values).returning();
            };

            const returnedArtistNames = uniqueElements(
                returnFromDb[0]
                    .map((a) => a.length !== 0 && (a[0].name as string))
                    .filter((a) => typeof a === "string") as string[]
            );

            const returnedGenreNames = uniqueElements(
                returnFromDb[1]
                    .map((a) => a.length !== 0 && (a[0].name as string))
                    .filter((a) => typeof a === "string") as string[]
            );

            const uniqueArtists = uniqueCol("artists", returnedArtistNames);
            const uniqueGenres = uniqueCol("genres", returnedGenreNames);
            console.log(
                "returned genre names and unique genre names:",
                returnedGenreNames,
                uniqueGenres
            );
            let artistInsert = insertIntoTable(artists, uniqueArtists);
            let genreInsert = insertIntoTable(genres, uniqueGenres);

            const inserts: [ReturningArtists[], ReturningGenres[]] =
                await Promise.all([artistInsert, genreInsert]);

            const nameToId = <T>(
                arr: T[],
                tagKey: keyof T,
                tagValue: keyof T
            ): Map<any, any> => {
                const map = new Map<any, any>();
                arr.forEach((a: T) => {
                    if (a[tagValue] !== undefined) {
                        map.set(a[tagValue], a[tagKey]);
                    }
                });
                return map;
            };

            const artistNameToId = nameToId<ReturningArtists>(
                [
                    ...inserts[0],
                    ...returnFromDb[0]
                ].flat() as ReturningArtists[],
                "id",
                "name"
            );
            const genreNameToId = nameToId(
                [...inserts[1], ...returnFromDb[1]].flat() as ReturningGenres[],
                "id",
                "name"
            );

            var albumsToInsert = Array.from(albumList.values()).map(
                (album: Album) =>
                    getAlbumToInsert(
                        album,
                        artistNameToId.get(album.albumArtist)
                    )
            );

            const insertedAlbums: ReturningAlbums[] = await insertIntoTable(
                albums,
                albumsToInsert
            );

            const albumToId = insertedAlbums.reduce((acc, cur) => {
                if (cur.name && cur.id) {
                    acc[cur.name as string] = cur.id;
                }
                return acc;
            }, {} as { [key: string]: string });

            const songsToInsert = Array.from(albumList.values()).flatMap(
                (album) => getSongsToInsert(album, albumToId[album.name])
            );

            const albumArtistsToInsert = Array.from(albumList.values()).flatMap(
                (album) =>
                    album.artists.map((artist) => ({
                        albumId: albumToId[album.name],
                        artistId: artistNameToId.get(artist)
                    }))
            );

            const albumGenresToInsert = Array.from(albumList.values()).flatMap(
                (album) =>
                    album.genres.map((genre) => ({
                        albumId: albumToId[album.name],
                        genreId: genreNameToId.get(genre)
                    }))
            );

            return Promise.all([
                insertIntoTable(songs, songsToInsert),
                insertIntoTable(albumArtists, albumArtistsToInsert),
                insertIntoTable(albumGenres, albumGenresToInsert)
            ]).then();
        }
    );
}

function handleDir(
    filePath: string | fs.Dirent,
    parentDir = ""
): Promise<{ p: string; files: fs.Dirent[] }> {
    return new Promise((resolve, reject) => {
        const p = typeof filePath === "string" ? filePath : filePath.name;
        const actualLocation = path.join(parentDir, p);
        fs.readdir(actualLocation, { withFileTypes: true }, (err, files) => {
            if (err) {
                console.log("failed to read directory:", err);
                reject(err);
            } else {
                resolve({ p, files });
            }
        });
    });
}

/**
 * This function resolves to an Album or a boolean depending on the outcomes.
 * @param app the express app used for its file paths on the locals object.
 * @param filePath File path of the music file. Should be an absolute path.
 * @param md5 The MD5 of the music file. Passed around for efficiency.
 * @returns Promise<Album | boolean> - A boolean is returned when it is found the file is not an audio file. An album otherwise.
 */
async function getSongInfo(
    app: appWithExtras,
    filePath: string,
    md5: string
): Promise<Album | boolean> {
    return new Promise<Album | boolean>(async (resolve, reject) => {
        try {
            return checkIfFileExists(getPath(app, md5, "mp4"))
                .then(async () => {
                    const streamingPath = getPath(app, md5, "mp4");
                    return new Promise<void>((resolve, reject) => {
                        try {
                            ffmpeg(filePath)
                                .withNoVideo()
                                .withAudioCodec("aac")
                                .withAudioBitrate(192)
                                .output(streamingPath)
                                .on("end", () => resolve())
                                .on("error", (err) => {
                                    reject(err);
                                })
                                .run();
                        } catch (err) {
                            reject(err);
                        }
                    });
                })
                .then(async () => {
                    let duration = getAudioDurationInSeconds(filePath).then(
                        (durationInSeconds) => durationInSeconds * 1000
                    );

                    let tags = await useParseFile(filePath).then(
                        (tags) => tags.common
                    );

                    let imageChecking = checkIfFileExists(
                        getPath(app, md5, "jpg")
                    ).then(async () => {
                        if (tags.picture && tags.picture.length > 0) {
                            const newImage = await sharp(tags.picture[0].data)
                                .resize(256)
                                .jpeg()
                                .toBuffer();
                            const streamingPath = getPath(app, md5, "jpg");
                            fs.writeFile(streamingPath, newImage, (err) => {
                                if (err) {
                                    console.log(
                                        "Error occurred when trying to write new image to disk:",
                                        err
                                    );
                                }
                            });
                        }
                    });

                    return Promise.all([duration, tags, imageChecking])
                        .then(
                            async ([
                                duration,
                                tags,
                                _imageProcessedAndSaved
                            ]) => {
                                const albumObj: Album = craftAlbumObj(
                                    tags,
                                    md5,
                                    filePath,
                                    duration
                                );
                                resolve(albumObj);
                            }
                        )
                        .catch(reject);
                })
                .catch((_err) => {
                    console.log("not audio:", filePath);
                    resolve(false);
                });
        } catch (err) {
            reject(err);
        }
    });
}

function checkIfFileExists(filePath: string) {
    return new Promise<boolean>((resolve, reject) => {
        fs.access(filePath, (err) => {
            if (err?.code === "ENOENT") {
                return resolve(true);
            } else reject();
        });
    });
}

function craftAlbumObj(
    tags: ICommonTagsResult,
    md5: string,
    filePath: string,
    duration: number
): Album {
    const albumArtist =
        tags.albumartist ||
        tags.artist ||
        (tags.artists?.length && tags.artists[0]) ||
        "No artist name found. Add one using an ID3 editor!";

    return {
        name: tags.album || "No Album Name Given. Add one using an ID3 editor!",
        yearReleased: tags.originalyear || tags.year || 1970,
        albumArtist: albumArtist,
        artists: (!!tags.artists?.length?.valueOf() && tags.artists) || [
            albumArtist
        ],
        genres: tags.genre || ["Genre Missing"],
        songs: [
            {
                md5,
                path: path.relative(
                    path.resolve(process.env.MUSIC_DIRECTORY as string),
                    path.resolve(filePath)
                ),
                duration: duration || 10000,
                track: tags.track.no || 0,
                lyrics:
                    (tags.lyrics && formatLyrics(tags.lyrics))?.join("\n") ||
                    "No lyrics available for this song. Consider adding them with an ID3 tag editor!",
                name:
                    tags.title || "No title available for this song.MD5:" + md5
            }
        ],
        inDb: false
    };
}

function formatLyrics(lyrics: string[]): string[] {
    return lyrics.length === 1 ? lyrics[0].split("/\r?\n/g") : lyrics;
}

function getPath(app: appWithExtras, fileName: string, ext: string) {
    return path.resolve(
        app.locals.__dirname,
        "public/streaming/",
        fileName + "." + ext
    );
}
