import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { db, pool } from "./db/schema";
import https from "https";
import fs from "fs";
import { WithWebsocketMethod } from "express-ws";
import express_ws from "express-ws";

import { sessionsMiddleware } from "./middleware/sessions";
import { setCorsAndHeaders } from "./middleware/corsAndHeaders";
import { logger } from "./middleware/logger";
import { attachPgPool } from "./middleware/attachPool";
import { attachWebsocketRoutes } from "./middleware/attachWebSocketRoutes";

var options = {
  key: fs.readFileSync(process.env.KEY_PATH as string),
  cert: fs.readFileSync(process.env.CERT_PATH as string),
};
var appStart: express.Application = express();
var httpsServer = https.createServer(options, appStart);

var { app }: { app: express.Application & WithWebsocketMethod } =
  express_ws(appStart);
express_ws(app, httpsServer);

app.use(attachPgPool(pool));
app.use(setCorsAndHeaders);
app.use(sessionsMiddleware);
app.use(logger);
app.use(express.static(path.join(__dirname, "../public")));
attachWebsocketRoutes(app);

export { app, httpsServer };
