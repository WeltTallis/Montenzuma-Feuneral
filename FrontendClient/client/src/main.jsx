import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

function initApp() {
  const container = document.getElementById("root");
  if (!container) return;
  const root = createRoot(container);
  root.render(
    <BrowserRouter future={{ v7_relativeSplatUrl: true, v7_startTransition: true }}>
      <App />
    </BrowserRouter>
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

export { initApp };
