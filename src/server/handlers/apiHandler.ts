import express from "express";
import { albumArtists, albumGenres, albums, artists, genres, songs } from "../db/schema.js";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm/expressions.js";
const router = express.Router();

router.get("/songs", (req, res) => {
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

      const songs = data.map((song) => {
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

      res.json(songs);
    })
    .catch((err) => {});
  //res.send("Songs");
});

export default router;
