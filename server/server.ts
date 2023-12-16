import { type IncomingMessage, type Server, type ServerResponse } from "http";
import type https from "https";
import path from "path";
import compression from "compression";
import express from "express";
import express_ws, {
  type Application,
  type WithWebsocketMethod
} from "express-ws";
import morgan from "morgan";
import { type WsInstance } from "./types/types.js";

import apiHandler from "./handlers/apiHandler.js";
import setLocals from "./helpers/setLocals.js";
import { attachWebsocketRoutes } from "./middleware/attachWebSocketRoutes.js";
// import { sessionsMiddleware } from './middleware/sessions.js'
import { setCorsAndHeaders } from "./middleware/corsAndHeaders.js";

async function firstRun(
  __dirname: string
): Promise<
  [
    Application & WithWebsocketMethod,
    Server<typeof IncomingMessage, typeof ServerResponse> | null
  ]
> {
  const appStart: express.Application = express();
  const { app, getWss }: WsInstance = express_ws(appStart);
  const httpsServer: https.Server | null = setLocals(
    app,
    getWss,
    appStart,
    __dirname
  );

  if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(setCorsAndHeaders);
  app.options("*", setCorsAndHeaders);
  // app.use(sessionsMiddleware) TODO: Fix sessions middleware

  console.log("public path:", path.resolve(__dirname, "../public"));
  app.use(express.static(path.resolve(__dirname, "../public")));
  attachWebsocketRoutes(app);
  app.use("/api", apiHandler);
  return [app, httpsServer];
}

export { firstRun };
