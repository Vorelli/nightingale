import {} from "dotenv/config";
import express from "express";
import path from "path";
import { pool, db } from "./db/schema.js";
import https from "https";
import fs from "fs";
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
import { Song, appWithExtras } from "./types/types.js";
import cors from "cors";
import setDefaultPlaylist from "./helpers/setDefaultPlaylist.js";

let httpsServer: null | https.Server = null;
var appStart: express.Application = express();
var { app, getWss }: express_ws.Instance = express_ws(appStart);
if (process.env.KEY_PATH && process.env.CERT_PATH) {
  var options = {
    key: fs.readFileSync(path.resolve(__dirname, process.env.KEY_PATH as string)),
    cert: fs.readFileSync(path.resolve(__dirname, process.env.CERT_PATH as string)),
  };
  httpsServer = https.createServer(options, appStart);
  ({ getWss } = express_ws(app, httpsServer));
}

const corsOptions = {
  origin: "http://localhost:8080",
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.locals.getWss = getWss;
app.locals.db = db;
app.locals.__dirname = __dirname;
app.locals.shuffleBy = "random";
app.locals.wait = new Promise<void>((resolve, reject) => {
  loadSongs(app)
    .then(async (albums) => {
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
      await setDefaultPlaylist(app as appWithExtras);
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
console.log("static path:", path.join(__dirname, "../public"));
attachWebsocketRoutes(app);
app.use("/api", apiHandler);

export { app, httpsServer };
