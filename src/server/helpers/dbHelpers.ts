import { Song, Album } from "../types/types";
import {
  NewSongs,
  NewArtists,
  NewGenres,
  NewAlbums,
  NewAlbumArtists,
  NewAlbumGenres,
} from "../db/schema.js";

export function getSongsToInsert(album: Album, albumId: string): NewSongs[] {
  const songsToInsert = [];
  for (var i = 0; i < album.songs.length; i++) {
    const s = album.songs[i] as NewSongs;
    s.albumId = albumId;
    songsToInsert.push(s);
  }
  return songsToInsert;
}

export function getArtistsToInsert(album: Album): NewArtists[] {
  const firstArtist = album.albumArtist;
  const artists = [];
  for (let i = 0; i < album.artists.length; i++) {
    const artist = album.artists[i];
    if (firstArtist === artist) artists.unshift({ name: firstArtist } as NewArtists);
    else artists.push({ name: artist } as NewArtists);
  }
  return artists;
}

export function getGenresToInsert(album: Album): NewGenres[] {
  const genres = [];
  for (let i = 0; i < album.genres.length; i++) {
    genres.push({ name: album.genres[i] } as NewGenres);
  }
  return genres;
}

export function getAlbumToInsert(album: Album, artistId: string): NewAlbums {
  console.log(album, artistId);
  return {
    name: album.name,
    year: album.yearReleased,
    albumArtist: artistId,
  } as NewAlbums;
}

export function getAlbumArtistsToInsert(albumId: string, artistIds: string[]): NewAlbumArtists[] {
  const albumArtists = [];
  for (let i = 0; i < artistIds.length; i++) {
    albumArtists.push({
      albumId: albumId,
      artistId: artistIds[i],
    } as NewAlbumArtists);
  }
  return albumArtists;
}

export function getAlbumGenresToInsert(albumId: string, genreIds: string[]): NewAlbumGenres[] {
  const albumGenres = [];
  for (let i = 0; i < genreIds.length; i++) {
    albumGenres.push({
      albumId,
      genreId: genreIds[i],
    } as NewAlbumGenres);
  }
  return albumGenres;
}
