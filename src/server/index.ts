require("dotenv").config();
import { app, httpsServer } from "./server";

const PORT = parseInt(process.env.PORT as string) || 443;
const HTTP_PORT = parseInt(process.env.HTTP_PORT as string) || 80;
const ADDRESS = process.env.ADDRESS || "0.0.0.0";

httpsServer.listen(PORT, ADDRESS, () => {
  console.log("App listening at ", ADDRESS + ":" + PORT);
});

app.listen(HTTP_PORT, ADDRESS, () => {
  console.log("App listening at ", ADDRESS + ":" + HTTP_PORT);
});
