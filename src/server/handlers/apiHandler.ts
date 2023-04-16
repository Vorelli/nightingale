import express from "express";
import { albumArtists, albumGenres, albums, artists, genres, songs } from "../db/schema.js";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm/expressions.js";
import { Pool } from "pg";
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

export default router;
