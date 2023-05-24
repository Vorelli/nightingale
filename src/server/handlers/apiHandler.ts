import express, { Response, Request } from "express";
import { playlistSongs, playlists } from "../db/schema.js";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { appWithExtras } from "../types/types.js";
import { nextSong, previousSong, sendSync } from "../helpers/queue.js";
const router = express.Router();

router.get("/songs", (req, res) => {
  const query = `
  SELECT
  song_data.md5,
  song_data.path,
  song_data.duration,
  song_data."albumId",
  song_data.track,
  song_data.lyrics,
  song_data.song_name AS "name",
  song_data.album_id,
  song_data.album_name AS "albumName",
  song_data.year,
  album_artist_data.name AS "albumArtist",
  song_data.genres,
  artist_data.artists
FROM
  (
      SELECT
          songs.md5,
          songs.path,
          songs.duration,
          songs."albumId",
          songs.track,
          songs.lyrics,
          songs.name AS song_name,
          albums.id AS album_id,
          albums.name AS album_name,
          albums.year,
          albums."albumArtist",
          array_agg(genres.name) AS genres
      FROM
          songs
          JOIN albums ON songs."albumId" = albums.id
          JOIN "albumGenres" ON albums.id = "albumGenres"."albumId"
          JOIN genres ON "albumGenres"."genreId" = genres.id
      GROUP BY
          songs.md5,
          albums.id
  ) AS song_data
  JOIN (
      SELECT
          albums.id AS album_id,
          array_agg(artists.name) AS artists
      FROM
          albums
          JOIN "albumArtists" ON albums.id = "albumArtists"."albumId"
          JOIN artists ON "albumArtists"."artistId" = artists.id
      GROUP BY
          albums.id
  ) AS artist_data ON song_data.album_id = artist_data.album_id
  JOIN artists AS album_artist_data ON song_data."albumArtist" = album_artist_data.id;
`;

  return new Promise((resolve, reject) => {
    (req.app as appWithExtras).locals.pool.connect((err, client, release) => {
      if (err) reject(err);
      client.query(query, (err, result) => {
        release();
        if (err) return reject(res.json(err));
        const data = result.rows.map((row) => {
          return {
            ...row,
            albumArtist: row.albumArtist,
            lyrics: row.lyrics?.split("\n"),
            year: row.year,
            albumId: undefined,
          };
        });
        resolve(res.json(data));
      });
    });
  });
});

router.get("/playlists", (req, res) => {
  return (req.app as appWithExtras).locals.db
    .select()
    .from(playlists)
    .innerJoin(playlistSongs, eq(playlistSongs.playlistId, playlists.id))
    .then((result) => {
      const data = result.reduce((acc, val) => {
        acc[val.playlists.id] = acc[val.playlists.id] || {};
        acc[val.playlists.id].songs = acc[val.playlists.id].songs || [];
        acc[val.playlists.id].songs[val.playlistSongs.order || 0] =
          val.playlistSongs.songMd5 || "missingMd5";
        acc[val.playlists.id].id = val.playlists.id;
        acc[val.playlists.id].name = val.playlists.name;
        return acc;
      }, {} as { [key: string]: { [key: string]: any } });
      res.json(data);
    });
});

function toObject(toBeJson: any) {
  return JSON.parse(
    JSON.stringify(
      toBeJson,
      (_key, value) => (typeof value === "bigint" ? value.toString() : value) // return everything else unchanged
    )
  );
}

router.get("/sync", (req, res) => {
  const { status, currentTime, queues, queueIndex } = (req.app as appWithExtras).locals;
  const sync = {
    currentTime: (currentTime && (currentTime / BigInt(Math.pow(10, 6))).toString()) || 0,
    currentSong: queues[queueIndex][0],
    status: status,
  };

  res.status(200).send(toObject(sync));
});

router.put("/playpause", (req, res) => {
  const app = req.app as appWithExtras;
  app.locals.status = app.locals.status === "PLAYING" ? "PAUSED" : "PLAYING";
  app.locals.getWss().clients.forEach((client: WebSocket) => {
    client.send(app.locals.status);
    if (app.locals.status === "PAUSED") client.send("sync");
  });
  res.sendStatus(200);
});

router.put("/play", (req, res) => {
  const app = req.app as appWithExtras;
  app.locals.status = "PLAYING";
  app.locals.getWss().clients.forEach((client: WebSocket) => {
    client.send(app.locals.status);
  });
  res.sendStatus(200);
});

router.put("/pause", (req, res) => {
  const app = req.app as appWithExtras;
  app.locals.status = "PAUSED";
  app.locals.getWss().clients.forEach((client: WebSocket) => {
    client.send(app.locals.status);
  });
  res.sendStatus(200);
});

router.put("/next", (req, res) => {
  nextSong(req.app as appWithExtras);
  sendSync(req.app as appWithExtras);
  res.sendStatus(200);
});

router.put("/prev", (req, res) => {
  previousSong(req.app as appWithExtras);
  res.sendStatus(200);
});

router.put("/time", (req: Request, res: Response) => {
  const parsedNewTime = typeof req.query.newTime === "string" && parseFloat(req.query.newTime);
  if (
    req.query &&
    typeof req.query.newTime === "string" &&
    parsedNewTime &&
    !isNaN(parsedNewTime)
  ) {
    const app = req.app as appWithExtras;
    app.locals.currentTime = BigInt(parsedNewTime);
    app.locals.getWss().clients.forEach((client: WebSocket) => {
      client.send("setTime " + app.locals.currentTime / BigInt(Math.pow(10, 6)));
    });
    res.sendStatus(200);
  } else {
    res.sendStatus(400);
  }
});

export default router;
