import { NextFunction, Request, Response } from "express";

const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);

export const sessionsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const options = {
    store: new pgSession({ pool: res.locals.pool }),
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
  };
  return session(options)(req, res, next);
};
