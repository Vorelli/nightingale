import { NextFunction, Request, Response } from "express";

import session from "express-session/index.js";
import pgSession2 from "connect-pg-simple/index.js";
import pg from "pg";
const { Pool } = pg;

export const sessionsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let pgSession = pgSession2(session);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const options = {
    store: new pgSession({ pool }),
    secret: process.env.COOKIE_SECRET ?? "hiellafikdalsjdf",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
  };
  return session(options)(req, res, next);
};
