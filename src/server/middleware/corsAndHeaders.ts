import cors from "cors";
import { Request } from "express";

const allowlist = [
  "toscanonatale.dev",
  "www.toscanonatale.dev",
  "http://localhost:4444",
  "http://192.168.0.200:8080",
  "http://192.168.0.200:8080/",
  "http://localhost:8080",
  "http://localhost:8080/",
  undefined,
];
var corsOptions = function (req: Request, callback: Function) {
  var corsOps = {
    origin: allowlist.includes(req.headers.referer || req.headers.host || req.headers.origin),
  };
  callback(null, corsOps);
};

export const setCorsAndHeaders = [cors(corsOptions)];
