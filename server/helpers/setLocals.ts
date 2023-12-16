import fs from "fs";
import https from "https";
import path from "path";
import { type Application } from "express";
import express_ws, { WithWebsocketMethod } from "express-ws";
import type WebSocket from "ws";
import { WebSocketServer } from "ws";
import { dbMigrate } from "../../db/schema.js";
import { loadSongsAndWait } from "../middleware/waitForSongsToLoad.js";

export default function setLocals(
  app: Application,
  getWss: () => WebSocketServer,
  appStart: Application,
  __dirname: string
): https.Server | null {
  const httpGetWss = getWss;
  let httpsServer = null;
  if (
    process.env.KEY_PATH !== undefined &&
    process.env.CERT_PATH !== undefined
  ) {
    const options = {
      key: fs.readFileSync(path.resolve(process.env.KEY_PATH)),
      cert: fs.readFileSync(path.resolve(process.env.CERT_PATH))
    };
    httpsServer = https.createServer(options, appStart);
    ({ getWss } = express_ws(app, httpsServer));
  }
  const db = dbMigrate(__dirname);
  app.locals.getWss = () => {
    const httpClients = httpGetWss();
    Array.from(getWss().clients.values()).forEach((client: WebSocket) =>
      httpClients.clients.add(client)
    );
    return { clients: httpClients.clients };
  };
  app.locals.__dirname = __dirname;
  app.locals.shuffleBy = "random";
  app.locals.db = db;
  app.locals.infoDir = path.resolve(__dirname, "../public/info");
  app.locals.loadingSongs = loadSongsAndWait(
    app as WithWebsocketMethod & Application
  );
  return httpsServer;
}
