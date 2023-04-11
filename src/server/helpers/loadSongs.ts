import fs, { PathLike } from "fs";
import express from "express";
import md5File from "md5-file";
import { songs } from "../db/schema.js";
import { eq } from "drizzle-orm/expressions.js";
import path from "path";
import { getAudioDurationInSeconds } from "get-audio-duration";
import { isAudio } from "./isAudio.js";
import { importMusicMetadata } from "./audioMetadata.js";
import sharp from "sharp";
import { CuteFFMPEG, FFMPEGRequest } from "cute-ffmpeg";
import { fileURLToPath } from "url";
import { ICommonTagsResult } from "music-metadata";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ffmpeg = new CuteFFMPEG({ overwrite: true });

async function useParseFile(filePath: string) {
  return (await importMusicMetadata())(filePath);
}

export const loadSongs = (app: express.Application) => {
  const pathToMd5 = new Map();
  let filePromises: Promise<{ md5: string; path: string }>[] = [];

  return processPaths([
    path.resolve(app.locals.__dirname, process.env.MUSIC_DIRECTORY as string),
  ]).then(() => {
    console.log("finished processing all paths!");
    return Promise.all(filePromises).then((md5s) => processMd5s(app, md5s));
  });

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
        filePromises.push(getMd5(actualFilePath).then((md5) => ({ md5, path: actualFilePath })));
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

function processMd5s(app: express.Application, md5s: { md5: string; path: string }[]) {
  app.locals.songs = [];

  md5s.forEach(async ({ md5, path }) => {
    const songList = await app.locals.db.select().from(songs).where(eq(songs.md5, md5));

    if (songList.length === 0) {
      app.locals.songs.push(getSongInfo(app, path, md5));
    } else {
      app.locals.songs.push(songList[0]);
    }
  });

  Promise.all(app.locals.songs)
    .then((res) => res.filter((val) => !!val))
    .then((res) => (app.locals.songs = res));
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

function getSongInfo(app: express.Application, filePath: string, md5: string) {
  console.log("getting song info for", filePath);
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

        resolve(
          Promise.all([duration, tags]).then(async ([duration, tags]) => {
            await processTags(app, tags, md5);
            console.log("music info for:", filePath, "below:");
            console.log("duration:", duration, "tags:", tags);
            console.log(Object.keys(tags));
            return [duration, tags];
          })
        );
      } catch (err) {
        reject(err);
      }
    });
  });
}

async function processTags(app: express.Application, tags: ICommonTagsResult, md5: string) {
  if (tags.picture?.length && tags.picture.length > 0) {
    const newImage = await sharp(tags.picture[0].data).resize(256).jpeg().toBuffer();
    const streamingPath = path.resolve(
      __dirname,
      process.env.STREAMING_DIR as string,
      md5 + ".jpg"
    );
    fs.writeFile(streamingPath, newImage, (err) => {
      if (err) {
        console.log("Error occurred when trying to write new image to disk:", err);
      } else {
        console.log("Wrote new image to", streamingPath);
      }
    });
  }
}
