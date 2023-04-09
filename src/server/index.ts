require("dotenv").config();
import app from "./server";
import https from "https";
import fs from "fs";

var options = {
  key: fs.readFileSync(process.env.KEY_PATH as string),
  cert: fs.readFileSync(process.env.CERT_PATH as string),
};
var httpsServer = https.createServer(options, app);
console.log(options);

const PORT = parseInt(process.env.PORT as string) || 443;
const HTTP_PORT = parseInt(process.env.HTTP_PORT as string) || 80;
const ADDRESS = process.env.ADDRESS || "0.0.0.0";

httpsServer.listen(PORT, ADDRESS, () => {
  console.log("App listening at ", ADDRESS + ":" + PORT);
});

app.listen(HTTP_PORT, ADDRESS, () => {
  console.log("App listening at ", ADDRESS + ":" + HTTP_PORT);
});
