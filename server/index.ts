import { isIPv4 } from "net";
import path from "path";
import { fileURLToPath } from "url";
import { firstRun } from "./server.js";

const __dirname = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

console.log(
  "devmode:",
  process.env.DEV === "true",
  "envpath:",
  path.join(__dirname, "./env")
);
console.log(process.env.TRYTHIS_ONE);
console.log(process.env.ANOTHER);
console.log(process.env.MUSIC_DIR);

const [app, httpsServer] = await firstRun(__dirname);

const parsedPort = parseInt(process.env.PORT ?? "");
const PORT = !Number.isNaN(parsedPort) ? parsedPort : 4000;
const parsedHttpPort = parseInt(process.env.HTTP_PORT ?? "");
const HTTP_PORT = !Number.isNaN(parsedHttpPort) ? parsedHttpPort : 3000;
if (process.env.ADDRESS !== undefined && !isIPv4(process.env.ADDRESS)) {
  throw new Error(
    `Please provide a valid address to bind to in the .env: ${process.env.ADDRESS}`
  );
}
const ADDRESS = process.env.ADDRESS ?? "0.0.0.0";

if (httpsServer !== null) {
  httpsServer.listen(PORT, ADDRESS, () => {
    console.log(`Https App listening @ ${ADDRESS}:${PORT}`);
  });
}

app.listen(HTTP_PORT, ADDRESS, () => {
  console.log(`Http App listening @ ${ADDRESS}:${HTTP_PORT}`);
});
