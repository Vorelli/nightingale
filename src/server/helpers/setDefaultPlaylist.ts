import { type Application, type WithWebsocketMethod } from 'express-ws'
import { type PlaylistSongs, playlistSongs, playlists } from '../db/schema.js'
import { eq } from 'drizzle-orm'

export function playlistFromQueue (queue: string[], playlistId: string): PlaylistSongs[] {
  return queue.map((songMd5: string, i: number) => {
    const playlistSong: PlaylistSongs = { order: i, songMd5, playlistId }
    return playlistSong
  })
}

export default async function setDefaultPlaylist (app: Application & WithWebsocketMethod): Promise<void> {
  const defaultQueue = app.locals.queues[app.locals.queueIndex]
  const { db } = app.locals
  await db.select().from(playlists).where(eq(playlists.name, 'Default'))
    .then(async (currentDefaultPlaylists) => {
      // If the default playlist exists, delete its songs from playlistSongs
      return await Promise.all([currentDefaultPlaylists.map(playlist => {
        return db.delete(playlistSongs).where(eq(playlistSongs.playlistId, playlist.id))
      })])
    }).then(() => db.delete(playlists).where(eq(playlists.name, 'Default')))
    .then(() => db.insert(playlists).values([{ name: 'Default' }]).returning())
    .then(defaultPlaylist => {
      const pSongs = playlistFromQueue(defaultQueue, defaultPlaylist[0].id)
      return db.insert(playlistSongs).values(pSongs)
    }).then(() => { }).catch(err => {
      console.log('error occurred when trying to set the default playlist')
      throw err
    })
}
