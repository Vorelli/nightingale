import { type NextFunction, type Request, type Response } from 'express'

import session from 'express-session/index.js'
import pgSession2 from 'connect-pg-simple/index.js'

export function sessionsMiddleware (req: Request, res: Response, next: NextFunction): void {
  const PgSession = pgSession2(session)
  const { pool } = req.app.locals
  if (process.env.COOKIE_SECRET === undefined || process.env.COOKIE_SECRET === '') throw new Error('Failed to provide cookie secret in .env: Add COOKIE_SECRET to your .env')
  const options = {
    store: new PgSession({ pool }),
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }
  }
  session(options)(req, res, next)
}
