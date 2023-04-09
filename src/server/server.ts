import express, { Request, Response, NextFunction } from "express";
import expressWs from "express-ws";
import cors, { CorsRequest } from "cors";

var expressApp = express();
var { app, getWss, applyTo } = expressWs(expressApp);

const allowlist = ["http://localhost:4444", undefined];
var corsOptions = function (req: Request, callback: Function) {
  var corsOps = {
    origin: allowlist.includes(req.headers["origin"]),
  };
  console.log(req.header("Origin"));
  console.log(req.headers["origin"]);
  // db.loadOrigins is an example call to load
  // a list of origins from a backing database
  callback(null, corsOps);
};
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", req.header("origin"));
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});
app.use(function (req, res, next) {
  req.headers.origin = req.headers.origin || req.headers.host;
  next();
});
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log("incoming", req.method, "at", req.path);
  next();
});
app.use(cors(corsOptions));

app.get("/", (req: Request, res: Response, next: NextFunction): void => {
  res.json({ message: "Connected!" });
});

app.ws("/echo", function (ws, req) {
  ws.on("message", function (msg) {
    ws.send(msg);
  });
});

export default app;
