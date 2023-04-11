import { render } from "solid-js/web";
import App from "./components/App";

document.addEventListener("DOMContentLoaded", () => {
  while (document.getElementById("app")?.firstChild) {
    let app = document.getElementById("app");
    if (!app) {
      return;
    } else {
      app.removeChild(app.firstChild);
    }
  }

  render(App, document.getElementById("app"));
});
