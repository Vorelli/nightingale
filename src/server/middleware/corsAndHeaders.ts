import cors, { CorsRequest } from "cors";
import { NextFunction, Request, Response } from "express";

const allowlist = [
  "toscanonatale.dev",
  "www.toscanonatale.dev",
  "http://localhost:4444",
  undefined,
];
var corsOptions = function (req: Request, callback: Function) {
  var corsOps = {
    origin: allowlist.includes(req.headers.origin || req.headers.host),
  };
  callback(null, corsOps);
};

export const setCorsAndHeaders = [
  function (req: Request, res: Response, next: NextFunction) {
    res.header(
      "Access-Control-Allow-Origin",
      req.headers.origin || req.headers.host
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header("Access-Control-Allow-Credentials", "true");
    next();
  },
  function (req: Request, res: Response, next: NextFunction) {
    req.headers.origin = req.headers.origin || req.headers.host;
    next();
  },
  cors(corsOptions),
];
