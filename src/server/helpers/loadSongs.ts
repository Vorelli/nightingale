import fs, { PathLike } from "fs";
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
  NewAlbumArtists,
  NewAlbums,
  NewGenres,
  NewAlbumGenres,
  NewSongs,
  NewArtists,
  ReturningSongs,
  ReturningArtists,
  ReturningGenres,
} from "../db/schema.js";
import { eq } from "drizzle-orm/expressions.js";
import path from "path";
import { getAudioDurationInSeconds } from "get-audio-duration";
import { isAudio } from "./isAudio.js";
import { importMusicMetadata } from "./audioMetadata.js";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg/index.js";
import { IAudioMetadata, ICommonTagsResult } from "music-metadata";
import { PgInsert, PgTable, boolean } from "drizzle-orm/pg-core/index.js";
import { NodePgDatabase } from "drizzle-orm/node-postgres/driver.js";
import { QueryResult } from "pg";
import { Album, Song } from "../types/types.js";
import {
  getAlbumToInsert,
  getArtistsToInsert,
  getGenresToInsert,
  getSongsToInsert,
  getAlbumArtistsToInsert,
  getAlbumGenresToInsert,
} from "./dbHelpers.js";
import { sql } from "drizzle-orm";

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

export const loadSongs = (app: express.Application): Promise<string[]> => {
  let filePromises: Promise<{ md5: string; filePath: string }>[] = [];

  return processPaths([
    path.resolve(app.locals.__dirname, process.env.MUSIC_DIRECTORY as string),
  ]).then(() => Promise.all(filePromises).then((md5s) => processMd5s(app, md5s)));

  function processPaths(
    pathsInMusic: fs.Dirent[] | string[],
    parentDir = ""
  ): Promise<void | string> {
    console.log("parentDir:", parentDir);

    const tempPaths: Promise<{ p: string; files: fs.Dirent[] }>[] = [];
    for (let i = 0; i < pathsInMusic.length; i++) {
      const filePath = pathsInMusic[i];
      console.log(filePath);
      if (typeof filePath === "string" || filePath.isDirectory()) {
        tempPaths.push(handleDir(filePath, parentDir));
      } else if (filePath.isFile() || filePath.isSymbolicLink()) {
        const actualFilePath = path.join(parentDir, filePath.name);
        filePromises.push(
          md5File(actualFilePath).then((md5) => ({ md5, filePath: actualFilePath }))
        );
      }
    }

    return tempPaths.length === 0
      ? Promise.resolve()
      : Promise.all(tempPaths).then((directories) => processDirectories(parentDir, directories));
  }

  function processDirectories(parentDir: string, directories: { p: string; files: fs.Dirent[] }[]) {
    const pathsProcessing = [];

    for (let i = 0; i < directories.length; i++) {
      const newPath = path.join(parentDir, directories[i].p);
      pathsProcessing.push(processPaths(directories[i].files, newPath));
    }

    return Promise.all(pathsProcessing)
      .then(() => Promise.resolve())
      .catch((err) => {
        console.log("error encountered when processing paths:", err);
      });
  }
};

function getAlbumFromRows(app: express.Application, rows: innerJoinReturn[]): Album {
  return {
    name: rows[0].albums.name ?? "Unknown Album Name",
    yearReleased: rows[0].albums.year || 1970,
    albumArtist:
      (rows[0].albums.albumArtist && findArtistName(rows, rows[0].albums.albumArtist)) ||
      "Unknown Artist Name",
    artists: rows.map((row: innerJoinReturn) => row.artists.name),
    genres: rows.map((row: innerJoinReturn) => row.genres.name),
    songs: [rows[0].songs],
    inDb: true,
  };
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
): Promise<string[]> {
  return Promise.all(
    md5s.map(async ({ md5, filePath }) => {
      return new Promise<boolean | Album>((resolve, reject) => {
        app.locals.db
          .select()
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
              resolve(getAlbumFromRows(app, rows));
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
      console.log("songs not in DB", songsNotInDb);
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
      return new Promise((resolve, reject) => {
        var mergedAlbumsKeys = Array.from(mergedAlbums.keys());
        console.log("keys", mergedAlbumsKeys);
        for (var i = 0; i < mergedAlbumsKeys.length; i++) {
          inserts.push(insertIntoDb(app, mergedAlbums.get(mergedAlbumsKeys[i]) as Album));
        }
        console.log("here are the inserts", inserts, inserts.length);
        Promise.all(inserts).then(() => {
          console.log("done doing all inserts into db! now returning all md5s!");
          console.table(songList.map((album) => album.songs.map((s) => s.md5)).flat());
          resolve(songList.map((album) => album.songs.map((s) => s.md5)).flat());
        });
        //eventually this is what I want: but need to finish inserts first. resolve(songList.map((album) => album.songs[0].md5));
      });
    });
}

/* function insertOrSelect(
  db: NodePgDatabase,
  table: PgTable<any>,
  values: { [key: string]: string }[],
  sqlValues: string,
  returnObj: object,
  idName: string = "id"
) {
  return values.map((val) => {
    db.execute(sql`WITH new_row AS (
        INSERT INTO ${table} (${sqlValues})
        SELECT ${val}
        WHERE NOT EXISTS(SELECT * FROM ${table} WHERE ${idName}=${val[idName]})
        RETURNING *
        )
        SELECT * FROM new_row
        UNION
        SELECT * FROM ${table} WHERE ${idName}=${val[idName]}`);
  });
} */

function insertIntoDb(app: express.Application, album: Album): Promise<void> {
  const db: NodePgDatabase = app.locals.db;

  // let's make sure artists and genres don't exist.
  // We'll do a lookup for both artist by name and genre by name
  console.log("looking up artists", album.artists);
  console.log("looking up genres", album.genres);

  const artistLookUps = album.artists.map((artist) =>
    db.select().from(artists).where(eq(artists.name, artist)).execute()
  );
  const genreLookUps = album.genres.map((genre) =>
    db.select().from(genres).where(eq(genres.name, genre)).execute()
  );

  return Promise.all(artistLookUps)
    .then((artistsReturned: ReturningArtists[][]) => {
      return Promise.all(genreLookUps).then((genresReturned: ReturningGenres[][]) => {
        console.log(artistsReturned.length);
        console.log(artistsReturned[0]);
        artistsReturned.forEach((a) => a.forEach((b) => console.log(b)));
        return Promise.all([Promise.all(artistLookUps), Promise.all(genreLookUps)]);
      });
    })
    .then(async (returnFromDb: [ReturningArtists[][], ReturningGenres[][]]) => {
      console.log(album.artists, returnFromDb[0]);
      const returnedArtistNames = (returnFromDb[0] as ReturningArtists[][]).map(
        (a) => a.length !== 0 && a[0].name
      );
      console.log(album.artists.filter((artist: string) => !returnedArtistNames.includes(artist)));
      const artistsToInsert = album.artists
        .filter((artist: string) => !returnedArtistNames.includes(artist))
        .map((name: string) => ({ name } as NewArtists));

      console.log(returnFromDb[1], album.genres);
      const returnedGenreNames = (returnFromDb[1] as ReturningGenres[][]).map(
        (g) => g.length !== 0 && g[0].name
      );
      const genresToInsert = album.genres
        .filter((genre: string) => !returnedGenreNames.includes(genre))
        .map((name: string) => ({ name } as NewGenres));

      console.log("artistsToInsert", artistsToInsert, "genresToInsert", genresToInsert);

      const artistInsert =
        artistsToInsert.length > 0
          ? await db.insert(artists).values(artistsToInsert).returning({ artistId: artists.id })
          : new Array();
      const genreInsert =
        genresToInsert.length > 0
          ? await db.insert(genres).values(genresToInsert).returning({ genreId: genres.id })
          : new Array();

      const returnedArtistIds = (returnFromDb[0] as ReturningArtists[][]).map((a) => ({
        artistId: a.length !== 0 && a[0].id,
      }));
      const returnedGenreIds = (returnFromDb[1] as ReturningGenres[][]).map((a) => {
        console.log(a);
        return { genreId: a.length !== 0 && a[0].id };
      });

      console.log(genreInsert, returnedGenreIds);
      return Promise.all([
        artistInsert.concat(...returnedArtistIds),
        genreInsert.concat(...returnedGenreIds),
      ]);
    })
    .then((returnedInserts: [{ artistId: string }[], { genreId: string }[]]) => {
      console.log("return after first two inserts", returnedInserts);
      var albumToInsert = getAlbumToInsert(album, returnedInserts[0][0].artistId);
      var inserts = db.insert(albums).values(albumToInsert).returning({ albumId: albums.id });
      return Promise.all([inserts]).then((albumReturns: [{ albumId: string }[]]) => {
        return Promise.all([returnedInserts[0], returnedInserts[1], albumReturns[0]]);
      });
    })
    .then(
      (returnedInserts: [{ artistId: string }[], { genreId: string }[], { albumId: string }[]]) => {
        var songsToInsert = getSongsToInsert(album, returnedInserts[2][0].albumId);
        var albumArtistsToInsert = getAlbumArtistsToInsert(
          returnedInserts[2][0].albumId,
          returnedInserts[0].map((obj) => obj.artistId)
        );
        var albumGenresToInsert = getAlbumGenresToInsert(
          returnedInserts[2][0].albumId,
          returnedInserts[1].map((o) => o.genreId)
        );
        console.log("albumGenres To insert", albumGenres);
        console.log("songs to insert", songsToInsert);
        return Promise.all([
          db.insert(songs).values(songsToInsert),
          db.insert(albumArtists).values(albumArtistsToInsert),
          db.insert(albumGenres).values(albumGenresToInsert),
        ]);
      }
    )
    .then((results) => {
      console.log("results from the inserts", results);
      return undefined;
    })
    .catch((err) => {
      console.log("error encountered when trying to insert songs into the db", err);
    }); //(returnedArtists: Artists[]), (returnedGenres: Genres[])]);
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

var numRunners = 0;
const runnerLimit = 24;
async function getSongInfo(
  app: express.Application,
  filePath: string,
  md5: string
): Promise<Album | boolean> {
  while (numRunners >= runnerLimit) {
    await new Promise<void>((r) => setTimeout(() => r(), 100));
  }

  return new Promise<Album | boolean>(async (resolve, reject) => {
    numRunners++;
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
        let tags = useParseFile(filePath).then((tags) => tags.common);

        Promise.all([duration, tags]).then(async ([duration, tags]) => {
          const imageProcessedAndSaved = processImageFromTags(app, tags, md5);
          const audioFileOptimized = optimizeAudioFile(app, filePath, md5);
          const albumObj: Album = craftAlbumObj(tags, md5, app, filePath, duration);
          return Promise.all([]).then(() => {
            //imageProcessedAndSaved, audioFileOptimized]).then(() => {
            resolve(albumObj);
          });
        });
      } catch (err) {
        reject(err);
      }
    });
  }).then((res) => {
    numRunners--;
    return res;
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
          path.resolve(app.locals.__dirname, process.env.MUSIC_DIRECTORY as string),
          path.resolve(filePath)
        ),
        duration: duration || 10000,
        track: tags.track.no || 0,
        lyrics:
          (tags.lyrics && formatLyrics(tags.lyrics))?.join("\n") ||
          "No lyrics available for this song. Consider adding them with an ID3 tag editor!",
        diskCharacter: tags.disk.no || 0,
        name: tags.title || "No title available for this song.MD5:" + md5,
      },
    ],
    inDb: false,
  };
}

function formatLyrics(lyrics: string[]): string[] {
  console.log("LENGTH", lyrics.length);

  if (lyrics.length === 1) {
    let splitWithN = lyrics[0].split("\r\n");
    console.log("should be first line", splitWithN[0]);
    return splitWithN;
  } else {
    return lyrics;
  }
}

function getPath(app: express.Application, md5: string, ext: string) {
  return path.resolve(app.locals.__dirname, process.env.STREAMING_DIR as string, md5 + "." + ext);
}

async function processImageFromTags(
  app: express.Application,
  tags: ICommonTagsResult,
  md5: string
) {
  if (tags.picture?.length && tags.picture.length > 0) {
    const newImage = await sharp(tags.picture[0].data).resize(256).jpeg().toBuffer();
    const streamingPath = getPath(app, md5, "jpg");
    fs.writeFile(streamingPath, newImage, (err) => {
      if (err) {
        console.log("Error occurred when trying to write new image to disk:", err);
      } else {
        console.log("Wrote new image to", streamingPath);
      }
    });
  }
}

function optimizeAudioFile(app: express.Application, filePath: PathLike, md5: string) {
  const streamingPath = getPath(app, md5, "mp4");
  return new Promise<void>((resolve, reject) => {
    ffmpeg(filePath as string)
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
}
