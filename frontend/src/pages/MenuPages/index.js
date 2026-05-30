// src/index.js
// This file serves as an alternative entry point (for CRA compatibility).
// Vite uses main.jsx as the primary entry — this re-exports from it.

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css";

const root = document.getElementById("root");

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
