import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { db, pool } from "./db/schema";
import { sessionsMiddleware } from "./middleware/sessions";
import { setCorsAndHeaders } from "./middleware/corsAndHeaders";
import { logger } from "./middleware/logger";
import { attachPool } from "./middleware/attachPool";
import https from "https";
import fs from "fs";
const express_ws = require("express-ws");

var options = {
  key: fs.readFileSync(process.env.KEY_PATH as string),
  cert: fs.readFileSync(process.env.CERT_PATH as string),
};
var app: any = express();
var httpsServer = https.createServer(options, app);

var expressWs = express_ws(app);
var expressWss = express_ws(app, httpsServer);

app.use(attachPool(pool));
app.use(setCorsAndHeaders);
app.use(sessionsMiddleware);
app.use(logger);
app.use(express.static(path.join(__dirname, "../public")));
// app.use("");

app.ws("/", function (ws: any, req: Request) {
  ws.on("connection", function () {
    ws.send("hello!");
  });
});

app.ws("/echo", function (ws: any, req: Request) {
  ws.once("open", (ev: Event) => {
    console.log("open. event:", ev);
  });

  ws.on("message", function (msg: string) {
    ws.send(msg);
  });
});

export { app, httpsServer };
