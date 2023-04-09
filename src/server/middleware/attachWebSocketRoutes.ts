import express, { Request } from "express";
import { WithWebsocketMethod } from "express-ws";
import { WebSocket } from "ws";

export const attachWebsocketRoutes = (
  app: express.Application & WithWebsocketMethod
) => {
  app.ws("/", function (ws: WebSocket, req: Request) {
    ws.on("connection", function () {
      ws.send("hello!");
    });
  });

  app.ws("/echo", function (ws: WebSocket, req: Request) {
    ws.once("open", (ev: Event) => {
      console.log("open. event:", ev);
    });

    ws.on("message", function (msg: string) {
      ws.send(msg);
    });
  });
};
