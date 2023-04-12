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
} from "../db/schema.js";
import { eq } from "drizzle-orm/expressions.js";
import path from "path";
import { getAudioDurationInSeconds } from "get-audio-duration";
import { isAudio } from "./isAudio.js";
import { importMusicMetadata } from "./audioMetadata.js";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg/index.js";
import { ICommonTagsResult } from "music-metadata";

interface innerJoinReturn {
  songs: Songs;
  albums: Albums;
  artists: Artists;
  albumArtists: AlbumArtists;
  genres: Genres;
  albumGenres: AlbumGenres;
}

interface Song {
  md5: string | null;
  path: string | null;
  duration: number | null;
  track: number | null;
  lyrics: string[] | null;
  diskCharacter: number | null;
}

interface Album {
  name: string;
  yearReleased: number;
  albumArtist: string;
  artists: string[];
  genres: string[];
  songs: Song[];
}

async function useParseFile(filePath: string) {
  return (await importMusicMetadata())(filePath);
}

export const loadSongs = (app: express.Application): Promise<Album[]> => {
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
          getMd5(actualFilePath).then((md5) => ({ md5, filePath: actualFilePath }))
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
): Promise<Album[]> {
  const allSongs: Promise<Album | boolean>[] = [];
  const allUnprocessedSongs: Promise<Album | boolean>[] = [];

  md5s.forEach(async ({ md5, filePath }) => {
    app.locals.db
      .select()
      .from(songs)
      .innerJoin(albums, eq(songs.albumId, albums.id))
      .innerJoin(albumArtists, eq(albumArtists.albumId, albums.id))
      .innerJoin(albumGenres, eq(albumGenres.albumId, albums.id))
      .innerJoin(genres, eq(albumGenres.genreId, genres.id))
      .innerJoin(artists, eq(albumArtists.artistId, artists.id))
      .then((rows: innerJoinReturn[]) => {
        if (rows.length === 0) {
          allUnprocessedSongs.push(getSongInfo(app, filePath, md5));

          // TODO: use a .then on the getSongInfo to insert it into the database
          // And once it's in the database, then we don't have to worry about it
          // And we can just return that 'Albums object'
        } else {
          allSongs.push(Promise.resolve(getAlbumFromRows(app, rows)));
        }
      });
  });

  return Promise.all(allSongs)
    .then((res) => res.filter((val) => typeof val !== "boolean"))
    .then((res) => (app.locals.songs = res))
    .then((songs) => songs as unknown as Album[])
    .then((songs: Album[]) => {
      return new Promise((resolve, reject) => {
        Promise.all(allUnprocessedSongs)
          .then(() => {
            // process the unprocessed songs in here.
            // Add them to the db
            // And then add them to the songs array
            // And eventually resolve the array of songs.
            // Processing includes combining album objects together.
            // Eventually, we'd want one album object per album with the same number
            // of songs within the album as song objects on the album.
            // So the constraint which two albums are equal are if: album name is equal and so is the albumArtist
          })
          .then(() => {
            //should have the songs in here at this point.
            // So just add them to the original songs array and just resolve that.
          })
          .catch((err) => reject(err));
      });
    });
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

function getMd5(filePath: string) {
  return md5File(filePath);
}

function getSongInfo(
  app: express.Application,
  filePath: string,
  md5: string
): Promise<Album | boolean> {
  return new Promise(async (resolve, reject) => {
    const fileOpened: number = await new Promise((resolve, reject) =>
      fs.open(filePath, (err, fd) => {
        if (err) reject(err);
        else resolve(fd);
      })
    );

    fs.read(fileOpened, Buffer.alloc(16), 0, 16, 0, async (err, bytesRead, data) => {
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
          const albumArtist =
            tags.albumartist ||
            tags.artist ||
            (tags.artists?.length && tags.artists[0]) ||
            "No artist name given";
          console.log("fullpath", filePath);
          const albumObj: Album = {
            name: tags.album || "No Album Name Given",
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
                lyrics: tags.lyrics || [
                  "No lyrics available for this song. Consider adding them with an ID3 tag editor!",
                ],
                diskCharacter: tags.disk.no || 0,
              },
            ],
          };
          return Promise.all([imageProcessedAndSaved, audioFileOptimized]).then(() =>
            resolve(albumObj)
          );
        });
      } catch (err) {
        reject(err);
      }
    });
  });
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

function getPath(app: express.Application, md5: string, ext: string) {
  return path.resolve(app.locals.__dirname, process.env.STREAMING_DIR as string, md5 + "." + ext);
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
