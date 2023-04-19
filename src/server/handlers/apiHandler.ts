import express, { Response, Request } from "express";
import {
  ReturningPlaylists,
  albumArtists,
  albumGenres,
  albums,
  artists,
  genres,
  playlists,
  songs,
} from "../db/schema.js";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm/expressions.js";
import { Pool } from "pg";
import { appWithExtras } from "../types/types.js";
import { nextSong, previousSong, sendSync } from "../helpers/queue.js";
const router = express.Router();

router.get("/songs", (req, res) => {
  console.log((res.locals.db as NodePgDatabase).select().from(songs).toSQL());

  const query = `
  SELECT
  song_data.md5,
  song_data.path,
  song_data.duration,
  song_data."albumId",
  song_data.track,
  song_data."diskCharacter",
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
          songs."diskCharacter",
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

  return (res.locals.pool as Pool).query(query).then((result) => {
    const data = result.rows.map((row) => {
      return {
        ...row,
        albumArtist: row.albumArtist,
        lyrics: row.lyrics?.split("\n"),
        year: row.year,
        albumId: undefined,
      };
    });
    res.json(data);
  });
});

router.get("/playlists", (req, res) => {
  return res.locals.db
    .select()
    .from(playlists)
    .then((result: ReturningPlaylists[]) => {
      console.log(result);
      const data = result;
      res.json(data);
    });
});

function toObject(toBeJson: any) {
  return JSON.parse(
    JSON.stringify(
      toBeJson,
      (key, value) => (typeof value === "bigint" ? value.toString() : value) // return everything else unchanged
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
  console.log("before parse", req.query.newTime);
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
