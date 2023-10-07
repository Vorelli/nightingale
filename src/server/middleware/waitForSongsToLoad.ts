import { type Request, type Response, type NextFunction } from 'express'
import { loadSongs } from '../helpers/loadSongs'
import { type Album, type Song } from '../types/types'
import { advanceTime, initializeQueue } from '../helpers/queue'
import setDefaultPlaylist from '../helpers/setDefaultPlaylist'

export default function waitForSongsToLoad (req: Request, _res: Response, next: NextFunction): void {
  loadSongs(req.app, req.app.locals.db)
    .then(async (albums) => {
      const md5s = albums.flatMap((album: Album) =>
        album.songs.map((s: Song) => s.md5)
      )
      const md5ToSong = albums.reduce(
        (acc: Record<string, Song>, album) => {
          album.songs.forEach((song) => {
            acc[song.md5] = song
          })
          return acc
        },
        {}
      )
      req.app.locals.md5s = md5s
      req.app.locals.md5ToSong = md5ToSong
      initializeQueue(req.app)
      await setDefaultPlaylist(req.app)
      setTimeout(advanceTime.bind(null, req.app), 10)
    })
    .then(() => { next() })
    .catch((err: any) => {
      console.log('error occurred when trying to process paths.', err)
      next(err)
    })
}
