import "./whyrr.ts";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./components/App";
import "./index.css";
import store from "./redux/store";
import { Provider } from "react-redux";

document.addEventListener("DOMContentLoaded", () => {
  while (document.getElementById("app")?.firstChild) {
    let app = document.getElementById("app");
    if (!app) {
      return;
    } else {
      if (app.firstChild) app.removeChild(app.firstChild);
    }
  }

  const rootElement: HTMLElement = document.getElementById("app") as HTMLElement;
  const root = createRoot(rootElement);
  root.render(
    <Provider store={store}>
      <App />
    </Provider>
  );
});
