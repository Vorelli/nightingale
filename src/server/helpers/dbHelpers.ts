import { type Album } from '../types/types.js'
import {
  type NewSongs,
  type NewArtists,
  type NewGenres,
  type NewAlbums,
  type NewAlbumArtists,
  type NewAlbumGenres
} from '../db/schema.js'

export function getSongsToInsert (album: Album, albumId: string): NewSongs[] {
  const songsToInsert = []
  for (let i = 0; i < album.songs.length; i++) {
    const s = album.songs[i] as NewSongs
    s.albumId = albumId
    songsToInsert.push(s)
  }
  return songsToInsert
}

export function getArtistsToInsert (album: Album): NewArtists[] {
  const firstArtist = album.albumArtist
  const artists = []
  for (let i = 0; i < album.artists.length; i++) {
    const artist = album.artists[i]
    const newArtist: NewArtists = { name: firstArtist }
    if (firstArtist === artist) artists.unshift(newArtist)
    else artists.push(newArtist)
  }
  return artists
}

export function getGenresToInsert (album: Album): NewGenres[] {
  const genres = []
  for (let i = 0; i < album.genres.length; i++) {
    const newGenres: NewGenres = { name: album.genres[i] }
    genres.push(newGenres)
  }
  return genres
}

export function getAlbumToInsert (album: Album, artistId: string): NewAlbums {
  const newAlbum: NewAlbums = {
    name: album.name,
    year: album.yearReleased,
    albumArtist: artistId
  }
  return newAlbum
}

export function getAlbumArtistsToInsert (albumId: string, artistIds: string[]): NewAlbumArtists[] {
  const albumArtists = []
  for (let i = 0; i < artistIds.length; i++) {
    const newAlbumArtists: NewAlbumArtists = {
      albumId,
      artistId: artistIds[i]
    }
    albumArtists.push(newAlbumArtists)
  }
  return albumArtists
}

export function getAlbumGenresToInsert (albumId: string, genreIds: string[]): NewAlbumGenres[] {
  const albumGenres = []
  for (let i = 0; i < genreIds.length; i++) {
    const newAlbumGenres: NewAlbumGenres = {
      albumId,
      genreId: genreIds[i]
    }
    albumGenres.push(newAlbumGenres)
  }
  return albumGenres
}
