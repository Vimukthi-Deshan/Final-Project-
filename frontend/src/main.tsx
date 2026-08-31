import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { isLoggedIn } from "./lib/auth";
import "./styles.css";

// Send unauthenticated visitors to the public verify page, not a login wall.
if (!isLoggedIn() && window.location.pathname === "/") {
  window.history.replaceState(null, "", "/verify");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
