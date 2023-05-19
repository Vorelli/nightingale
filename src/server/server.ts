import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import express from "express";
import { dbMigrate } from "./db/schema.js";
import https from "https";
import fs from "fs";
import express_ws from "express-ws";
import compression from "compression";

import { sessionsMiddleware } from "./middleware/sessions.js";
import { setCorsAndHeaders } from "./middleware/corsAndHeaders.js";
import { attachWebsocketRoutes } from "./middleware/attachWebSocketRoutes.js";
import { loadSongs } from "./helpers/loadSongs.js";
import apiHandler from "./handlers/apiHandler.js";
import { initializeQueue, advanceTime } from "./helpers/queue.js";
import { Song, appWithExtras } from "./types/types.js";
import setDefaultPlaylist from "./helpers/setDefaultPlaylist.js";
import { IncomingMessage, Server, ServerResponse } from "http";

async function firstRun(): Promise<
  [appWithExtras, Server<typeof IncomingMessage, typeof ServerResponse> | null]
> {
  await dbMigrate();
  let httpsServer: null | https.Server = null;
  var appStart: express.Application = express();
  var { app, getWss }: express_ws.Instance = express_ws(appStart);
  var httpGetWss = getWss;
  if (process.env.KEY_PATH && process.env.CERT_PATH) {
    var options = {
      key: fs.readFileSync(path.resolve(process.env.KEY_PATH as string)),
      cert: fs.readFileSync(path.resolve(process.env.CERT_PATH as string)),
    };
    httpsServer = https.createServer(options, appStart);
    ({ getWss } = express_ws(app, httpsServer));
  }

  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.locals.getWss = function () {
    const httpClients = httpGetWss();
    const httpsClients = Array.from(getWss().clients.values());
    for (let i = 0; i < httpsClients.length; i++) {
      httpClients.clients.add(httpsClients[i]);
    }
    return { clients: httpClients.clients };
  };
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
  app.use(setCorsAndHeaders);
  app.options("*", setCorsAndHeaders);
  app.use(sessionsMiddleware);

  app.use(express.static(path.join(__dirname, "../public")));
  attachWebsocketRoutes(app);
  app.use("/api", apiHandler);
  return [app as appWithExtras, httpsServer];
}

export { firstRun };
