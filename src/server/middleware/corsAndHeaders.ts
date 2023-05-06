import cors from "cors";
import { NextFunction, Request, Response } from "express";

const allowlist = [
  "toscanonatale.dev",
  "www.toscanonatale.dev",
  "http://localhost:4444",
  "http://192.168.0.200:8080",
  "http://192.168.0.200:8080/",
  undefined,
];
var corsOptions = function (req: Request, callback: Function) {
  var corsOps = {
    origin: allowlist.includes(req.headers.referer || req.headers.origin),
  };
  console.log("corsOptions:", corsOps);
  callback(null, corsOps);
};

export const setCorsAndHeaders = [
  function (req: Request, res: Response, next: NextFunction) {
    let remote = req.headers.referer || req.headers.origin || "http://localhost:3000";
    remote = remote[remote.length - 1] === "/" ? remote.slice(0, -1) : remote;
    res.header(
      "Access-Control-Allow-Origin",
      allowlist.includes(remote) ? remote : req.headers.host
    );
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
  },
  /* function (req: Request, res: Response, next: NextFunction) {
    req.headers.origin = req.headers.origin || req.headers.host;
    next();
  }, */
  cors(corsOptions),
  (req: Request, res: Response, next: NextFunction) => {
    console.log("end headers", res.getHeaders());
    next();
  },
];
