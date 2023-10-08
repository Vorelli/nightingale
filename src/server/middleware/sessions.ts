import { type NextFunction, type Request, type Response } from 'express'

import session from 'express-session/index.js'
import sqliteStoreFactory from 'express-session-sqlite'
import bettersqlite3 from 'better-sqlite3'
import path from 'path'

export function sessionsMiddleware (req: Request, res: Response, next: NextFunction): void {
  const SQLiteStore = sqliteStoreFactory(session)
  if (process.env.COOKIE_SECRET === undefined || process.env.COOKIE_SECRET === '') throw new Error('Failed to provide cookie secret in .env: Add COOKIE_SECRET to your .env')

  const options = {
    store: new SQLiteStore({
      driver: bettersqlite3,
      path: path.resolve(process.env.MUSIC_DIRECTORY as string, 'music.db'),
      ttl: 30000
    }),
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }
  }

  session(options)(req, res, next)
}
