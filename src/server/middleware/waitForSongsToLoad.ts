import { type Request, type Response, type NextFunction } from 'express'
import { loadSongs } from '../helpers/loadSongs.js'
import { type Album, type Song } from '../types/types.js'
import { advanceTime, initializeQueue } from '../helpers/queue.js'
import setDefaultPlaylist from '../helpers/setDefaultPlaylist.js'
import { type Application } from 'express-ws'
import fs from 'fs/promises'
import path from 'path'

export async function loadSongsAndWait (app: Application): Promise<Album[]> {
  try {
    await fs.mkdir(path.join(app.locals.__dirname, 'public', 'streaming')).catch(err => { console.log(err) })
    const albums = await loadSongs(app)
    const md5s = albums.flatMap((album: Album) => album.songs.map((s: Song) => s.md5))
    const md5ToSong = albums.reduce(
      (acc: Record<string, Song>, album_1) => {
        album_1.songs.forEach((song) => {
          acc[song.md5] = song
        })
        return acc
      },
      {}
    )
    app.locals.md5s = md5s
    app.locals.md5ToSong = md5ToSong
    initializeQueue(app)
    await setDefaultPlaylist(app)
    advanceTime(app)
    app.use(waitForSongsToLoad)
    return albums
  } catch (err) {
    console.log('error occurred when trying to process paths.', err)
    throw err
  }
}

export function waitForSongsToLoad (req: Request, _res: Response, next: NextFunction): void {
  if (req.app.locals.loadingSongs !== undefined) {
    void req.app.locals.loadingSongs.finally(() => { next() })
  } else { next() }
}
