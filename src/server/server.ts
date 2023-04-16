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
import initializeQueue from "./helpers/initializeQueue.js";
import { NodePgClient } from "drizzle-orm/node-postgres/session.js";

export interface appWithExtras extends express.Application, WithWebsocketMethod {
  locals: {
    md5s: string[];
    db: NodePgClient;
    __dirname: string;
    queues: string[][];
    queueIndex: number;
    currentTime: number;
    originalTimestamp: NodeJS.HRTime;
    lastTimestamp: NodeJS.HRTime;
    shuffleBy: string;
  };
}

var options = {
  key: fs.readFileSync(path.resolve(__dirname, process.env.KEY_PATH as string)),
  cert: fs.readFileSync(path.resolve(__dirname, process.env.CERT_PATH as string)),
};
var appStart: express.Application = express();
var httpsServer = https.createServer(options, appStart);

var { app }: { app: express.Application & WithWebsocketMethod } = express_ws(appStart);
express_ws(app, httpsServer);
app.locals.db = db;
app.locals.__dirname = __dirname;
app.locals.shuffleBy = "random";
loadSongs(app)
  .then((md5s) => {
    app.locals.md5s = md5s;
    initializeQueue(app as appWithExtras);
  })
  .catch((err) => console.log("error occurred when trying to process paths."));

app.use(attachPgPool(pool, db));
app.use(setCorsAndHeaders);
app.use(sessionsMiddleware);
app.use(logger);

app.use(express.static(path.join(__dirname, "../public")));
attachWebsocketRoutes(app);
app.use("/api", apiHandler);

export { app, httpsServer };
