import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv-esm";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
await config({ path: path.join(__dirname, "../.env") });
import { firstRun } from "./server.js";
import https from "https";

const [app, httpsServer] = firstRun();

const PORT = parseInt(process.env.PORT as string) || 4000;
const HTTP_PORT = parseInt(process.env.HTTP_PORT as string) || 3000;
const ADDRESS = process.env.ADDRESS || "0.0.0.0";

if (httpsServer) {
  (httpsServer as https.Server).listen(PORT, ADDRESS, () => {
    console.log("App listening at ", ADDRESS + ":" + PORT);
  });
}

app.listen(HTTP_PORT, ADDRESS, () => {
  console.log("App listening at ", ADDRESS + ":" + HTTP_PORT);
});
