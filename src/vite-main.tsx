import React from "react";
import ReactDOM from "react-dom/client";
import CasaOrtizApp from "@/components/CasaOrtizApp";
import "@/app/globals.css";

// Provide system-font fallbacks for the CSS variables set by Next.js's font loader
const style = document.createElement("style");
style.textContent = `
  :root {
    --font-geist-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    --font-geist-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    --font-source-serif: Georgia, "Times New Roman", serif;
  }
`;
document.head.prepend(style);

function mount() {
  const root = document.getElementById("root");
  if (!root) return;
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <CasaOrtizApp />
    </React.StrictMode>,
  );
}

// The inlined script runs in <head> before <body> is parsed — wait for DOM.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
