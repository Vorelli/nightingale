import {} from "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { pool, db } from "./db/schema.js";
import https from "https";
import fs from "fs";
import { WithWebsocketMethod } from "express-ws";
import express_ws from "express-ws";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { sessionsMiddleware } from "./middleware/sessions.js";
import { setCorsAndHeaders } from "./middleware/corsAndHeaders.js";
import { logger } from "./middleware/logger.js";
import { attachPgPool } from "./middleware/attachPool.js";
import { attachWebsocketRoutes } from "./middleware/attachWebSocketRoutes.js";
import { loadSongs } from "./helpers/loadSongs.js";
import apiHandler from "./handlers/apiHandler.js";
import { initializeQueue, advanceTime } from "./helpers/queue.js";
import { NodePgClient } from "drizzle-orm/node-postgres/session.js";
import { Song } from "./types/types.js";

export interface appWithExtras extends express.Application, WithWebsocketMethod {
  locals: {
    md5s: string[];
    db: NodePgClient;
    __dirname: string;
    queues: string[][];
    queueIndex: number;
    currentTime: bigint;
    lastTimestamp: bigint;
    shuffleBy: string;
    md5ToSong: { [key: string]: Song };
    status: "PLAYING" | "PAUSED";
    getWss: Function;
  };
}

var options = {
  key: fs.readFileSync(path.resolve(__dirname, process.env.KEY_PATH as string)),
  cert: fs.readFileSync(path.resolve(__dirname, process.env.CERT_PATH as string)),
};
var appStart: express.Application = express();
var httpsServer = https.createServer(options, appStart);

var { app }: express_ws.Instance = express_ws(appStart);
var { getWss } = express_ws(app, httpsServer);

app.locals.getWss = getWss;
console.log(getWss().clients.forEach((client) => {}));
app.locals.db = db;
app.locals.__dirname = __dirname;
app.locals.shuffleBy = "random";
app.locals.wait = new Promise<void>((resolve, reject) => {
  loadSongs(app)
    .then((albums) => {
      const md5s = albums.flatMap((album) => album.songs.map((s) => s.md5));
      const md5ToSong = albums.reduce((acc: { [key: string]: Song }, album) => {
        album.songs.forEach((song) => {
          acc[song.md5] = song;
        });
        return acc;
      }, {});
      app.locals.md5s = md5s;
      app.locals.md5ToSong = md5ToSong;
      initializeQueue(app as appWithExtras);
      setTimeout(advanceTime.bind(null, app as appWithExtras), 10);
    })
    .then(() => resolve())
    .catch((err) => {
      reject(err);
      console.log("error occurred when trying to process paths.", err);
    });
});

app.use(async (_req, _res, next) => {
  await app.locals.wait; //Wait until songs are loaded before trying to resolve requests.
  next();
});
app.use(attachPgPool(pool, db));
app.use(setCorsAndHeaders);
app.use(sessionsMiddleware);
app.use(logger);

app.use(express.static(path.join(__dirname, "../public")));
attachWebsocketRoutes(app);
app.use("/api", apiHandler);

export { app, httpsServer };
