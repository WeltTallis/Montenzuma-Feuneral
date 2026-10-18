import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { GlobalStyle } from "./GlobalStyle";
import "./GlobalStyle/global.css";
import { initAnalytics } from "./utils/analytics";

function initApp() {
  const container = document.getElementById("root");
  if (!container) return;
  try { initAnalytics(); } catch (e) { console.warn("analytics init failed", e); }
  const root = createRoot(container);
  root.render(
    <BrowserRouter future={{ v7_relativeSplatUrl: true, v7_startTransition: true }}>
      <App />
      <GlobalStyle />
    </BrowserRouter>
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

export { initApp };
