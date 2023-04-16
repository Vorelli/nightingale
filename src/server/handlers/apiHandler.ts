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
    console.log(data);
    res.json(data);
    /*
    return {
          ...songs,
          albumArtist: artistsMap.get(albums.albumArtist || ""),
          artists: albumArtistsMap.get(albums.id),
          albumName: albums.name,
          genres: albumsGenresMap.get(albums.id),
          lyrics: songs.lyrics?.split("\n"),
          year: albums.year,
          albumId: undefined,
        };
    */
  });

  (res.locals.db as NodePgDatabase)
    .select()
    .from(songs)
    .innerJoin(albums, eq(albums.id, songs.albumId))
    .innerJoin(albumArtists, eq(albums.id, albumArtists.albumId))
    .innerJoin(artists, eq(artists.id, albumArtists.artistId))
    .innerJoin(albumGenres, eq(albums.id, albumGenres.albumId))
    .innerJoin(genres, eq(genres.id, albumGenres.genreId))
    .then((data) => {
      const artistsMap = new Map<string, string>();
      for (let i = 0; i < data.length; i++) {
        const artist = data[i].artists;
        if (!artistsMap.has(artist.id)) {
          artistsMap.set(artist.id, artist.name);
        }
      }
      console.log(Array.from(artistsMap.keys()));
      console.log(Array.from(artistsMap.values()));

      const genresMap = new Map<string, string>();
      for (let i = 0; i < data.length; i++) {
        const genre = data[i].genres;
        if (!genresMap.has(genre.id)) {
          genresMap.set(genre.id, genre.name);
        }
      }
      console.log(Array.from(genresMap.keys()));
      console.log(Array.from(genresMap.values()));

      const albumsGenresMap = new Map<string, string[]>();
      for (let i = 0; i < data.length; i++) {
        const albumGenre = data[i].albumGenres;
        if (!albumsGenresMap.has(albumGenre.albumId)) {
          albumsGenresMap.set(albumGenre.albumId, [genresMap.get(albumGenre.genreId) as string]);
        } else {
          if (genresMap.has(albumGenre.genreId)) {
            const genreName = genresMap.get(albumGenre.genreId) as string;
            const genres = albumsGenresMap.get(albumGenre.albumId);
            if (!genres?.includes(genreName)) {
              albumsGenresMap.set(albumGenre.albumId, [
                ...(albumsGenresMap.get(albumGenre.albumId) || []),
                genreName,
              ]);
            }
          }
        }
      }
      console.log(Array.from(albumsGenresMap.keys()));
      console.log(Array.from(albumsGenresMap.values()));

      const albumArtistsMap = new Map<string, string[]>();
      for (let i = 0; i < data.length; i++) {
        const albumArtist = data[i].albumArtists;
        if (!albumArtistsMap.has(albumArtist.albumId)) {
          albumArtistsMap.set(
            albumArtist.albumId,
            typeof albumArtist.artistId === "string"
              ? [
                  ...(albumArtistsMap.get(albumArtist.albumId) || []),
                  artistsMap.get(albumArtist.artistId) || "",
                ]
              : albumArtistsMap.get(albumArtist.albumId) || []
          );
        } else {
          if (artistsMap.has(albumArtist.artistId))
            albumArtistsMap.set(albumArtist.albumId, [
              artistsMap.get(albumArtist.artistId) as string,
            ]);
        }
      }
      console.log(Array.from(albumArtistsMap.keys()));
      console.log(Array.from(albumArtistsMap.values()));

      const ret = data.map((song) => {
        const { songs, albums, albumArtists, artists, albumGenres, genres } = song;
        return {
          ...songs,
          albumArtist: artistsMap.get(albums.albumArtist || ""),
          artists: albumArtistsMap.get(albums.id),
          albumName: albums.name,
          genres: albumsGenresMap.get(albums.id),
          lyrics: songs.lyrics?.split("\n"),
          year: albums.year,
          albumId: undefined,
        };
      });
      console.log(ret.length);

      res.json(ret);
    })
    .catch((err) => {});
  //res.send("Songs");
});

export default router;
