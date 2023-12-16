import { type Request } from "express";
import type express from "express";
import { type WithWebsocketMethod } from "express-ws";
import { type WebSocket } from "ws";

export const attachWebsocketRoutes = (
	app: express.Application & WithWebsocketMethod,
): void => {
	app.ws("/", (ws: WebSocket, _req: Request) => {
		ws.on("connection", () => {
			ws.send("hello!");
		});
	});
};
