import { readFile } from "fs";
import path from "path";
import queryString from "querystring";
import { eq } from "drizzle-orm";
import express, {
  type Application,
  type Request,
  type Response
} from "express";
import { type WebSocket } from "ws";
import {
  type ReturningAlbumArtists,
  type ReturningAlbumGenres,
  type ReturningAlbums,
  type ReturningArtists,
  type ReturningGenres,
  type ReturningSongs,
  albumArtists,
  albumGenres,
  albums,
  artists,
  genres,
  messages,
  playlistSongs,
  playlists,
  songs
} from "../../db/schema.js";
import { nextSong, previousSong, sendSync } from "../helpers/queue.js";
import {
  type ClientFriendlyPlaylistData,
  type ClientFriendlySongData
} from "../types/types.js";
import { WithWebsocketMethod } from "express-ws";
const router = express.Router();

router.get("/songs", (req, res) => {
  try {
    const { db } = req.app.locals;
    const songsData = db
      .select()
      .from(songs)
      .innerJoin(albums, eq(albums.id, songs.albumId))
      .all();
    const artistsData = db
      .select()
      .from(artists)
      .innerJoin(albumArtists, eq(albumArtists.artistId, artists.id))
      .all();
    const genresData = db
      .select()
      .from(genres)
      .innerJoin(albumGenres, eq(albumGenres.genreId, genres.id))
      .all();
    const jsonFormat: ClientFriendlySongData[] = transformSongQueryToJSON(
      songsData,
      artistsData,
      genresData
    );
    res.json(jsonFormat);
  } catch (err) {
    console.error("error occurred when trying to collect song data", err);
    res.sendStatus(500);
  }
});

function readFileAndThen(
  fileName: string,
  res: Response,
  cb: (data: Buffer) => void
): void {
  const infoDir = (res.app as Application).locals.infoDir;
  readFile(path.resolve(infoDir, fileName), {}, (err, data) => {
    if (err !== null) {
      console.error("failed to find or read the info.txt file:", err);
      return res.sendStatus(500);
    }
    cb(data);
  });
}

function readFilesAndThen(
  fileNames: string[],
  res: Response,
  cb: (data: Buffer[]) => void
): void {
  const data = new Array<Buffer>(fileNames.length);
  let saved = 0;

  function saveToData(i: number, d: Buffer): void {
    data[i] = d;
    saved++;
    if (saved === fileNames.length) {
      cb(data);
    }
  }
  for (let i = 0; i < fileNames.length; i++) {
    readFileAndThen(fileNames[i], res, saveToData.bind(null, i));
  }
}

router.post("/inquiry", (req, res) => {
  let { name, message, contact } = req.body;
  name = queryString.escape(name);
  message = queryString.escape(message);
  contact = queryString.escape(contact);
  if (name.length > 0 && message.length > 0 && contact.length > 0) {
    try {
      req.app.locals.db
        .insert(messages)
        .values({ name, body: message, contact })
        .all();
      return res.status(200).json({ message: "success" });
    } catch (err) {
      console.log(
        "error encountered when trying to add message to the database:",
        err
      );
      return res.sendStatus(500);
    }
  } else {
    return res.sendStatus(400);
  }
});

router.get("/resume", (_req, res) => {
  function sendData(data: Buffer[]): void {
    const resume = data[0];
    res.json({
      personal: {
        name: process.env.NAME,
        data: data[1].toString()
      },
      resume
    });
  }

  readFilesAndThen(["resume.pdf", "personal.html"], res, sendData);
});

router.get("/info", (req, res) => {
  const infoDir = (req.app as Application).locals.infoDir;
  readFile(path.resolve(infoDir, "info.txt"), {}, (err, data) => {
    if (err !== null) {
      console.error("failed to find or read the info.txt file:", err);
      return res.sendStatus(500);
    }
    res.json({ info: data.toString() });
  });
});

router.get("/projects", (_req, res) => {
  readFileAndThen("projects.json", res, (data: Buffer) => {
    res.status(200).send(data);
  });
});

router.get("/playlists", (req, res) => {
  try {
    const playlistsData = req.app.locals.db
      .select()
      .from(playlists)
      .innerJoin(playlistSongs, eq(playlistSongs.playlistId, playlists.id))
      .all();
    const data = playlistsData.reduce<ClientFriendlyPlaylistData>(
      (acc, val, i) => {
        acc[val.playlists.id] = acc[val.playlists.id] ?? {};
        acc[val.playlists.id].name = val.playlists.name;
        acc[val.playlists.id].songs =
          acc[val.playlists.id].songs ?? new Array<string>();
        acc[val.playlists.id].songs[val.playlistSongs.order ?? i] =
          val.playlistSongs.songMd5 ?? "NO MD5 FOUND";
        return acc;
      },
      {}
    );
    res.json(data);
  } catch (err) {
    console.error(
      "Error occurred when trying to look up playlists from database.",
      err
    );
    res.sendStatus(500);
  }
});

function toObject(toBeJson: any): any {
  return JSON.parse(
    JSON.stringify(
      toBeJson,
      (_key, value) => (typeof value === "bigint" ? value.toString() : value) // return everything else unchanged
    )
  );
}

router.get("/sync", (req, res) => {
  const { status, currentTime, queues, queueIndex } = (req.app as Application)
    .locals;
  const sync = {
    currentTime: (currentTime / BigInt(Math.pow(10, 6))).toString() ?? 0,
    currentSong: queues[queueIndex][0],
    status
  };

  res.status(200).send(toObject(sync));
});

router.put("/playpause", (req, res) => {
  const app = req.app as Application;
  app.locals.status = app.locals.status === "PLAYING" ? "PAUSED" : "PLAYING";
  app.locals.getWss().clients.forEach((client: WebSocket) => {
    client.send(app.locals.status);
    if (app.locals.status === "PAUSED") client.send("sync");
  });
  res.sendStatus(200);
});

router.put("/play", (req, res) => {
  const app = req.app as Application;
  app.locals.status = "PLAYING";
  app.locals.getWss().clients.forEach((client: WebSocket) => {
    client.send(app.locals.status);
  });
  res.sendStatus(200);
});

router.put("/pause", (req, res) => {
  const app = req.app as Application;
  app.locals.status = "PAUSED";
  app.locals.getWss().clients.forEach((client: WebSocket) => {
    client.send(app.locals.status);
  });
  res.sendStatus(200);
});

router.put("/next", (req, res) => {
  nextSong(req.app as Application & WithWebsocketMethod);
  sendSync(req.app as Application & WithWebsocketMethod);
  res.sendStatus(200);
});

router.put("/prev", (req, res) => {
  previousSong(req.app as Application & WithWebsocketMethod);
  res.sendStatus(200);
});

router.put("/time", (req: Request, res: Response) => {
  const parsedNewTime =
    typeof req.query.newTime === "string" && parseFloat(req.query.newTime);
  if (parsedNewTime !== false && !isNaN(parsedNewTime)) {
    const app = req.app as Application;
    app.locals.currentTime = BigInt(parsedNewTime);
    app.locals.getWss().clients.forEach((client: WebSocket) => {
      client.send(
        "setTime " + app.locals.currentTime / BigInt(Math.pow(10, 6))
      );
    });
    res.sendStatus(200);
  } else {
    res.sendStatus(400);
  }
});

function transformSongQueryToJSON(
  songsData: Array<{
    songs: ReturningSongs;
    albums: ReturningAlbums;
  }>,
  artistsData: Array<{
    artists: ReturningArtists;
    albumArtists: ReturningAlbumArtists;
  }>,
  genresData: Array<{
    albumGenres: ReturningAlbumGenres;
    genres: ReturningGenres;
  }>
): ClientFriendlySongData[] {
  return songsData.map((songData) => {
    const songJSON: ClientFriendlySongData = {
      md5: songData.songs.md5,
      path: songData.songs.path ?? "Path not found for some reason...?",
      duration: songData.songs.duration,
      track: songData.songs.track ?? 0,
      lyrics:
        songData.songs.lyrics ??
        "No lyrics available for this song. Consider adding them with an ID3 tag editor!",
      name:
        songData.songs.name ??
        "No title available for this song. MD5:" + songData.songs.md5,
      albumName:
        songData.albums.name ??
        "No Album Name Given. Add one using an ID3 editor!",
      year: songData.albums.year ?? 1970,
      albumArtist:
        artistsData.find(
          (artist) => artist.artists.id === songData.albums.albumArtistId
        )?.artists.name ?? "No artist name found. Add one using an ID3 editor!",
      genres: genresData
        .filter(
          (genreData) => genreData.albumGenres.albumId === songData.albums.id
        )
        .map((genreData) => genreData.genres.name),
      artists: artistsData
        .filter(
          (artistData) => artistData.albumArtists.albumId === songData.albums.id
        )
        .map((artistData) => artistData.artists.name),
      albumId: "" + songData.albums.id,
      albumArtistId:
        "" +
          artistsData.find(
            (artist) => artist.artists.id === songData.albums.albumArtistId
          )?.artists.id ?? 0
    };
    return songJSON;
  });
}

export default router;
