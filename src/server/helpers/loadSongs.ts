import fs from "fs";
import express from "express";
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
} from "../db/schema.js";
import { eq } from "drizzle-orm";
import path from "path";
import { getAudioDurationInSeconds } from "get-audio-duration";
import { isAudio } from "./isAudio.js";
import { importMusicMetadata } from "./audioMetadata.js";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg/index.js";
import { ICommonTagsResult } from "music-metadata";
import { AnyPgTable } from "drizzle-orm/pg-core";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
const { Pool } = pg;
import { Album } from "../types/types.js";
import { getAlbumToInsert, getSongsToInsert } from "./dbHelpers.js";
import { drizzle } from "drizzle-orm/node-postgres";

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

export const loadSongs = (app: express.Application): Promise<Album[]> => {
  const musicDir = process.env.MUSIC_DIRECTORY as string;
  return processPaths([path.resolve(musicDir)]).then((filePromises) => {
    return Promise.all(filePromises).then((md5s) => processMd5s(app, md5s));
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
          md5File(actualFilePath).then((md5) => ({ md5, filePath: actualFilePath }))
        );
      }
    }

    return new Promise((resolve, reject) => {
      Promise.all(tempPaths)
        .then((dirs) => processDirectories(parentDir, dirs))
        .then((files) => Promise.all([...filePromises, ...files]))
        .then((files: { md5: string; filePath: string }[]) => {
          return resolve(files);
        });
    });
  }

  function processDirectories(
    parentDir: string,
    directories: { p: string; files: fs.Dirent[] }[]
  ): Promise<
    {
      md5: string;
      filePath: string;
    }[]
  > {
    const pathsProcessing: Promise<{ md5: string; filePath: string }[]>[] = [];

    for (let i = 0; i < directories.length; i++) {
      const newPath = path.join(parentDir, directories[i].p);
      pathsProcessing.push(processPaths(directories[i].files, newPath));
    }

    return Promise.all(pathsProcessing).then((paths) => paths.flat());
  }
};

function getAlbumFromRows(app: express.Application, rows: innerJoinReturn[]): Album | undefined {
  var albumObj: Album | undefined = rows.reduce((acc: Album | undefined, val: innerJoinReturn) => {
    if (acc === undefined) {
      return {
        name: val.albums.name ?? "Unknown Album Name",
        yearReleased: val.albums.year || 1970,
        albumArtist:
          (val.albums.albumArtist && findArtistName(rows, val.albums.albumArtist)) ||
          "Unknown Artist",
        artists: [val.artists.name || "Unknown Artist"],
        genres: [val.genres.name || "Unknown Genre"],
        songs: [val.songs],
        inDb: true,
      };
    } else {
      acc.artists.push(val.artists.name || "Unknown Artist");
      acc.genres.push(val.genres.name || "Unknown Artist");
    }
    return acc;
  }, undefined);
  return albumObj;
}

function findArtistName(artistList: innerJoinReturn[], artistId: string): string {
  for (let i = 0; i < artistList.length; i++) {
    if (artistList[i].artists.id === artistId) {
      return artistList[i].artists.name;
    }
  }
  return "Artist not found";
}

function processMd5s(
  app: express.Application,
  md5s: { md5: string; filePath: string }[]
): Promise<Album[]> {
  console.log("these are the md5s received", md5s);
  console.log("FILES WITH MD5s NOT IN DB:");

  let pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  return new Promise((resolve, reject) => {
    pool.connect((err, client, release) => {
      if (err) return console.error(err);
      let db = drizzle(client);
      Promise.all(
        md5s.map(async ({ md5, filePath }) => {
          return new Promise<boolean | Album>((resolve, reject) => {
            db.select()
              .from(songs)
              .innerJoin(albums, eq(songs.albumId, albums.id))
              .innerJoin(albumArtists, eq(albumArtists.albumId, albums.id))
              .innerJoin(albumGenres, eq(albumGenres.albumId, albums.id))
              .innerJoin(genres, eq(albumGenres.genreId, genres.id))
              .innerJoin(artists, eq(albumArtists.artistId, artists.id))
              .where(eq(songs.md5, md5))
              .then((rows: innerJoinReturn[]) => {
                if (rows.length === 0) {
                  resolve(getSongInfo(app, filePath, md5));

                  // TODO: use a .then on the getSongInfo to insert it into the database
                  // And once it's in the database, then we don't have to worry about it
                  // And we can just return that 'Albums object'
                } else {
                  const ret = getAlbumFromRows(app, rows);
                  resolve(ret === undefined ? false : ret);
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
                }
              })
              .catch((error: any) => {
                console.log("encountered error when trying to lookup songs", error);
                return reject(error);
              });
          });
        })
      )
        .then((songList) => songList.filter((song) => typeof song !== "boolean") as Album[])
        .then((songList: Album[]) => {
          // songList is an array of Albums or booleans
          // could be in the database or could need to be added.
          // Does it matter if I just spam insert a bunch of data that already exists?
          const songsNotInDb: Album[] = songList.filter((song) => !song.inDb);
          const mergedAlbums: Map<string, Album> = new Map();
          for (let i = 0; i < songsNotInDb.length; i++) {
            const normalizedName = songsNotInDb[i].name.toLocaleLowerCase().trim().normalize();
            let song = mergedAlbums.get(normalizedName);
            if (!song?.name) {
              mergedAlbums.set(normalizedName, JSON.parse(JSON.stringify(songsNotInDb[i])));
            } else {
              song?.songs.push(songsNotInDb[i].songs[0]);
            }
          }
          console.log("merged albums:", mergedAlbums);

          // now that albums are merged into a similar sort of grouping, we can insert into the database.
          var inserts: Promise<void>[] = [];
          return new Promise<Album[]>((resolve, reject) => {
            /* var mergedAlbumsKeys = Array.from(mergedAlbums.keys());

          for (var i = 0; i < mergedAlbumsKeys.length; i++) {
            inserts.push(insertIntoDb(app, mergedAlbums.get(mergedAlbumsKeys[i]) as Album));
          } */
            insertAllIntoDb(db, mergedAlbums).then(() => {
              console.table(songList.map((album) => album.songs.map((s) => s.md5)).flat());
              resolve(songList.flat());
            });
            //eventually this is what I want: but need to finish inserts first. resolve(songList.map((album) => album.songs[0].md5));
          });
        })
        .then((songList: Album[]) => {
          resolve(songList);
        })
        .catch((err) => {
          reject(err);
        })
        .finally(() => release());
    });
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

function insertAllIntoDb(db: NodePgDatabase, albumList: Map<string, Album>): Promise<void> {
  const artistLookUps = Array.from(albumList.values()).flatMap((album: Album) =>
    album.artists.map((artist: string) =>
      db.select().from(artists).where(eq(artists.name, artist)).execute()
    )
  );
  const genreLookUps = Array.from(albumList.values()).flatMap((album) =>
    album.genres.map((genre) => db.select().from(genres).where(eq(genres.name, genre)).execute())
  );

  return Promise.all([Promise.all(artistLookUps), Promise.all(genreLookUps)]).then(
    async (returnFromDb: [ReturningArtists[][], ReturningGenres[][]]) => {
      const uniqueElements = (arr: string[]) => [...new Set(arr)];

      const uniqueCol = (
        table: AnyPgTable,
        col: string,
        existingArr: any[],
        tag: string = "name"
      ) => {
        return uniqueFromObject(albumList, col, existingArr).map((val: any) => ({ [tag]: val }));
      };

      const insertIntoTable = (table: AnyPgTable, values: any[]): Promise<any> => {
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

      const uniqueArtists = uniqueCol(artists, "artists", returnedArtistNames);
      const uniqueGenres = uniqueCol(genres, "genres", returnedGenreNames);
      let artistInsert = insertIntoTable(artists, uniqueArtists);
      let genreInsert = insertIntoTable(genres, uniqueGenres);

      const inserts: [ReturningArtists[], ReturningGenres[]] = await Promise.all([
        artistInsert,
        genreInsert,
      ]);

      const nameToId = <T>(arr: T[], tagKey: keyof T, tagValue: keyof T): Map<any, any> => {
        const map = new Map<any, any>();
        arr.forEach((a: T) => {
          if (a[tagValue] !== undefined) {
            map.set(a[tagValue], a[tagKey]);
          }
        });
        return map;
      };

      const artistNameToId = nameToId<ReturningArtists>(
        [...inserts[0], ...returnFromDb[0]].flat() as ReturningArtists[],
        "id",
        "name"
      );
      const genreNameToId = nameToId(
        [...inserts[1], ...returnFromDb[1]].flat() as ReturningGenres[],
        "id",
        "name"
      );

      var albumsToInsert = Array.from(albumList.values()).map((album: Album) =>
        getAlbumToInsert(album, artistNameToId.get(album.albumArtist))
      );

      const insertedAlbums: ReturningAlbums[] = await insertIntoTable(albums, albumsToInsert);

      const albumToId = insertedAlbums.reduce((acc, cur) => {
        if (cur.name && cur.id) {
          acc[cur.name as string] = cur.id;
        }
        return acc;
      }, {} as { [key: string]: string });

      const songsToInsert = Array.from(albumList.values()).flatMap((album) =>
        getSongsToInsert(album, albumToId[album.name])
      );

      const albumArtistsToInsert = Array.from(albumList.values()).flatMap((album) =>
        album.artists.map((artist) => ({
          albumId: albumToId[album.name],
          artistId: artistNameToId.get(artist),
        }))
      );

      const albumGenresToInsert = Array.from(albumList.values()).flatMap((album) =>
        album.genres.map((genre) => ({
          albumId: albumToId[album.name],
          genreId: genreNameToId.get(genre),
        }))
      );

      return Promise.all([
        insertIntoTable(songs, songsToInsert),
        insertIntoTable(albumArtists, albumArtistsToInsert),
        insertIntoTable(albumGenres, albumGenresToInsert),
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

async function getSongInfo(
  app: express.Application,
  filePath: string,
  md5: string
): Promise<Album | boolean> {
  return new Promise<Album | boolean>(async (resolve, reject) => {
    const fileD: number = await new Promise((resolve, reject) =>
      fs.open(filePath, (err, fd) => {
        if (err) reject(err);
        else resolve(fd);
      })
    );

    fs.read(fileD, Buffer.alloc(16), 0, 16, 0, async (err, _bytesRead, data) => {
      if (err) {
        reject(err);
      }
      try {
        const isThisAudio = isAudio(data);
        console.log("isAudio", isThisAudio, "for:", filePath);
        if (!isThisAudio) return resolve(false);

        let duration = getAudioDurationInSeconds(filePath).then(
          (durationInSeconds) => durationInSeconds * 1000
        );
        let tags = await useParseFile(filePath).then((tags) => tags.common);

        let imageChecking = checkIfFileExists(getPath(app, md5, "jpg")).catch(async () => {
          if (tags.picture && tags.picture.length > 0) {
            const newImage = await sharp(tags.picture[0].data).resize(256).jpeg().toBuffer();
            const streamingPath = getPath(app, md5, "jpg");
            fs.writeFile(streamingPath, newImage, (err) => {
              if (err) {
                console.log("Error occurred when trying to write new image to disk:", err);
              }
            });
          }
        });

        let audioFileChecking = checkIfFileExists(getPath(app, md5, "mp4")).catch(async () => {
          const streamingPath = getPath(app, md5, "mp4");
          return new Promise<void>((resolve, reject) => {
            ffmpeg(filePath as string, {})
              .withNoVideo()
              .withAudioCodec("aac")
              .withAudioBitrate(192)
              .output(streamingPath)
              .on("end", () => {
                console.log("finished converting", filePath, "to", streamingPath);
                resolve();
              })
              .on("error", (err) => {
                console.log("An error occurred when trying to convert the audio file:", err);
                reject(err);
              })
              .run();
          });
        });

        Promise.all([duration, tags, imageChecking, audioFileChecking])
          .then(async ([duration, tags, imageProcessedAndSaved, audioFileOptimized]) => {
            const albumObj: Album = craftAlbumObj(tags, md5, app, filePath, duration);
            resolve(albumObj);
          })
          .catch(reject);
      } catch (err) {
        reject(err);
      }
    });
  });
}

function checkIfFileExists(filePath: string) {
  return new Promise<void>((resolve, reject) => {
    fs.access(filePath, (err) => {
      if (err) {
        return reject(err);
      } else resolve();
    });
  });
}

function craftAlbumObj(
  tags: ICommonTagsResult,
  md5: string,
  app: express.Application,
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
    artists: (!!tags.artists?.length?.valueOf() && tags.artists) || [albumArtist],
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
        name: tags.title || "No title available for this song.MD5:" + md5,
      },
    ],
    inDb: false,
  };
}

function formatLyrics(lyrics: string[]): string[] {
  return lyrics.length === 1 ? lyrics[0].split("/\r?\n/g") : lyrics;
}

function getPath(app: express.Application, fileName: string, ext: string) {
  return path.resolve(app.locals.__dirname, "../public/streaming/", fileName + "." + ext);
}
