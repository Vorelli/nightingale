import path from "path";
import express from "express";
import { dbMigrate } from "./db/schema";
import https from "https";
import fs from "fs";
import express_ws from "express-ws";
import compression from "compression";
import morgan from "morgan";

import { sessionsMiddleware } from "./middleware/sessions";
import { setCorsAndHeaders } from "./middleware/corsAndHeaders";
import { attachWebsocketRoutes } from "./middleware/attachWebSocketRoutes";
import { loadSongs } from "./helpers/loadSongs";
import apiHandler from "./handlers/apiHandler";
import { initializeQueue, advanceTime } from "./helpers/queue";
import { Album, Song, appWithExtras } from "./types/types";
import setDefaultPlaylist from "./helpers/setDefaultPlaylist";
import { IncomingMessage, Server, ServerResponse } from "http";

async function firstRun(
  __dirname: string
): Promise<
  [appWithExtras, Server<typeof IncomingMessage, typeof ServerResponse> | null]
> {
  const [db, pool] = await dbMigrate(__dirname);
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

  if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));
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
  app.locals.pool = pool;
  app.locals.db = db;
  const infoDir = path.resolve(__dirname, "../public/info");
  app.locals.infoDir = infoDir;
  app.locals.wait = new Promise<void>((resolve, reject) => {
    loadSongs(app as appWithExtras, db)
      .then(async (albums) => {
        const md5s = albums.flatMap((album: Album) =>
          album.songs.map((s: Song) => s.md5)
        );
        const md5ToSong = albums.reduce(
          (acc: { [key: string]: Song }, album) => {
            album.songs.forEach((song) => {
              acc[song.md5] = song;
            });
            return acc;
          },
          {}
        );
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
