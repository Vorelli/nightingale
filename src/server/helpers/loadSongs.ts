import fs, { PathLike } from "fs";
import express from "express";
import md5File from "md5-file";
import { getAudioTypeFromBuffer } from "audio-type-detect";
import { songs } from "../db/schema.js";
import { eq } from "drizzle-orm/expressions.js";
import path from "path";
import { getAudioDurationInSeconds } from "get-audio-duration";
import { inspect } from "util";
import { isAudio } from "./isAudio.js";
import { importMusicMetadata } from "./audioMetadata.js";
import sharp from "sharp";
import { CuteFFMPEG, FFMPEGRequest } from "cute-ffmpeg";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ffmpeg = new CuteFFMPEG({ overwrite: true });

async function useParseFile(filePath: string) {
  return (await importMusicMetadata())(filePath);
}

/**
 * This function takes the express app in as a a parameter and by reading from the music directory set in the .env,
 * we can summarily process all files and sub-directories. And by process, I mean, if it's a file, and we can determine
 * that it's also a music file, let's get all of its tag information, md5, duration, etc and load it into the database.
 * That is, if that file's md5 isn't already in our database. If it is, we can assume that the tagging and duration process
 * is already taken care of for those files.
 * @param app The express application. Assumes app.locals has __dirname and db (drizzle) properties.
 * @return {Promise<void>} which resolves when finished loading songs into db and processing conversions.
 */
export const loadSongs = (app: express.Application): Promise<void> => {
  const pathToMd5: Map<string, string> = new Map<string, string>();
  let filePromises: Promise<{ md5: string; path: string }>[] = [];
  return processPaths([
    path.resolve(app.locals.__dirname, process.env.MUSIC_DIRECTORY as string),
  ]).then(() => {
    console.log("finished processing all paths!");
    return Promise.all(filePromises).then((md5s) => {
      // what do we do with md5s?
      // can lookup in database.
      // check for entry.
      // if there is no entry, lets make sure it's a music file
      // and then we can try to get tags from the file
      // and we can also get duration while this is going on.
      const md5ToSong = {};

      app.locals.songs = [];
      md5s.forEach(async ({ md5, path }) => {
        const song = await app.locals.db.select().from(songs).where(eq(songs.md5, md5));
        console.log(song);
        if (song.length === 0) {
          // we need to create the database entry. so lets get all the necessary information.
          app.locals.songs.push(getSongInfo(app, path, md5));
        } else {
          // we need to do something with this song entity. do we store it somewhere? in our collection of songs?

          // before we just push it to the app.locals.songs, do we need to get any other information, like tags?
          // should we just do that in the original query?
          app.locals.songs.push(song[0]);
        }
      });
      Promise.all(app.locals.songs).then((res) => res.filter((val) => !!val));
    });
  });

  /**
   * This function takes in a file path/dirent for a directory and processes their child directories and files.
   * @param filePath {fs.Direct} or {string} for the directories' location.
   * @param parentDir {string} of the parent directory to search in for said directory.
   * @returns A {Promise} which resolves to an {object} with a path {p} and an array of {files} as {fs.Dirent}s.
   */
  function handleDir(
    filePath: fs.Dirent | string,
    parentDir = ""
  ): Promise<{ p: PathLike; files: fs.Dirent[] }> {
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
   * Processes a path for music enumeration purposes. Obtains list of
   * @param pathsInMusic An array of fs.Dirent objects (which can be obtained through fs.readDir)
   * @param parentDir The parent directory for which said path is located. Full path obtained through __dirname + string/dirent.name.
   * @return {Promise<void>} which resolves when finished processing paths and rejects any error encountered.
   */
  function processPaths(pathsInMusic: fs.Dirent[] | string[], parentDir = ""): Promise<void> {
    console.log("parentDir:", parentDir);
    const tempPaths: Promise<{ p: PathLike; files: fs.Dirent[] }>[] = [];
    for (let i = 0; i < pathsInMusic.length; i++) {
      const filePath = pathsInMusic[i];
      console.log(filePath);
      if (typeof filePath === "string" || filePath.isDirectory()) {
        tempPaths.push(handleDir(filePath, parentDir));
      } else if (filePath.isFile() || filePath.isSymbolicLink()) {
        const actualFilePath = path.join(parentDir, filePath.name);

        filePromises.push(
          getMd5(actualFilePath).then((md5) => ({
            md5,
            path: actualFilePath,
          }))
        ); // was last here !!! TODO: Finish processing files
        // if (!audioType) continue; // check if audio file is of a valid format (invalid returns false)

        // pathToMd5.set(path.name, await getAudioType(path.name));
      }
    }

    return tempPaths.length === 0
      ? Promise.resolve()
      : Promise.all(tempPaths)
          .then((directories: { p: PathLike; files: fs.Dirent[] }[]) => {
            var pathsProcessing: Promise<void>[] = [];
            for (let i = 0; i < directories.length; i++) {
              const newPath = path.join(parentDir, directories[i].p as string);
              pathsProcessing.push(processPaths(directories[i].files, newPath));
            }
            return Promise.all(pathsProcessing);
          })
          .then((_) => Promise.resolve())
          .catch((err) => {
            console.log("error encountered when processing paths:", err);
          });
  }
};

/**
 * The function generates the MD5 of a file using md5File.
 * @param filePath the filepath to generate the MD5 hash from.
 * @returns {Promise<string>} which resolves to the MD5.
 */
function getMd5(filePath: string) {
  return md5File(filePath);
}

/**
 * This function takes in a file path of a song and gets the song info for that file path. It has too many responsibilities at the moment. Need to break it up.
 * @param app {express.Application} for which it expects
 * @param filePath A {PathLike} object which points to a file.
 * @param md5 MD5 of said file so we don't need to calculate it again to save converted files under.
 * @returns A promise which resolves to false if it's not a processable audio file or an object of information needed for the db.
 */
function getSongInfo(
  app: express.Application,
  filePath: PathLike,
  md5: string
): Promise<boolean | object> {
  console.log(
    "this should be right for the relative path:",
    (filePath as string).slice(process.env.MUSIC_DIRECTORY?.length)
  );
  console.log("getting song info for", filePath);
  return new Promise(async (resolve, reject) => {
    const fileOpened: number = await (() => {
      return new Promise((resolve, reject) =>
        fs.open(filePath, (err, fd) => {
          if (err) reject(err);
          else resolve(fd);
        })
      );
    })();

    fs.read(fileOpened, Buffer.alloc(16), 0, 16, 0, async (err, bytesRead, data) => {
      if (err) {
        reject(err);
      }
      try {
        const isThisAudio = isAudio(data);
        console.log("isAudio", isThisAudio, "for:", filePath);
        if (!isThisAudio) return resolve(false);

        let duration = getAudioDurationInSeconds(filePath as string).then(
          (durationInSeconds) => durationInSeconds * 1000
        );

        let tags = useParseFile(filePath as string).then((tags) => tags.common);

        resolve(
          Promise.all([duration, tags]).then(async ([duration, tags]) => {
            if (tags.picture?.length && tags.picture.length > 0) {
              function afterWrite(err: Error | null) {
                if (err) {
                  console.log("Error occurred when trying to write new image to disk:", err);
                } else {
                  console.log(
                    "Wrote new image to",
                    path.resolve(__dirname, process.env.STREAMING_DIR as string, md5)
                  );
                }
              }

              const newImage = await sharp(tags.picture[0].data).resize(256).jpeg().toBuffer();
              const streamingPath = path.resolve(
                __dirname,
                process.env.STREAMING_DIR as string,
                md5 + ".jpg"
              );
              fs.writeFile(streamingPath, newImage, afterWrite);
            }

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
    // let tags = parseFile(path as string)
    //   .then((metadata) => inspect(metadata))
    //   .then((obj) => console.log(obj));
  });
}
