/**
 * Reads the Vite build output (dist-export/) and produces a single
 * self-contained HTML file with CSS inlined in <head> and JS as a
 * plain <script> at the end of <body>.
 *
 * Keeping the <script> out of <head> avoids HTML-parser confusion
 * caused by any HTML-like content inside the JS bundle (e.g. template
 * literals in generateReportHTML).
 */

import fs   from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT     = path.resolve(__dirname, "..");
const OUT      = path.join(ROOT, "dist-export");
const DEST     = path.join(ROOT, "casa-ortiz-interactive.html");

// ── Read Vite's output HTML ───────────────────────────────────────────────────
const htmlSrc = path.join(OUT, "vite-entry.html");
if (!fs.existsSync(htmlSrc)) {
  console.error("❌  dist-export/vite-entry.html not found.");
  process.exit(1);
}
let html = fs.readFileSync(htmlSrc, "utf8");

// ── Read generated assets ─────────────────────────────────────────────────────
const jsFile  = path.join(OUT, "app.js");
const cssFile = path.join(OUT, "app.css");

if (!fs.existsSync(jsFile)) {
  console.error("❌  dist-export/app.js not found.");
  process.exit(1);
}

const js  = fs.readFileSync(jsFile,  "utf8");
const css = fs.existsSync(cssFile) ? fs.readFileSync(cssFile, "utf8") : "";

// ── Remove all <script src=...> and <link rel="stylesheet" ...> tags ─────────
html = html.replace(/<script\b[^>]*\bsrc=[^>]*><\/script>/gi, "");
html = html.replace(/<link\b[^>]*\brel=["']stylesheet["'][^>]*\/?>/gi, "");

// ── Inject <style> into <head> ────────────────────────────────────────────────
// Use a replacer function to avoid special $-patterns in CSS being interpreted
// by String.prototype.replace (e.g. $` inserts the pre-match string).
if (css) {
  html = html.replace("</head>", () => `<style>\n${css}\n</style>\n</head>`);
}

// ── Inject <script> at END of <body> (after all HTML elements) ────────────────
// Plain <script> (no type="module") works in any browser/webview.
// Replacer function prevents $`, $', $& in the JS from being treated as special.
const safeJs = js.replace(/<\/script>/gi, "<\\/script>");
html = html.replace("</body>", () => `<script>\n${safeJs}\n</script>\n</body>`);

// ── Write output ──────────────────────────────────────────────────────────────
fs.writeFileSync(DEST, html, "utf8");

const sizeKB = (fs.statSync(DEST).size / 1024).toFixed(0);
console.log(`\n✅  casa-ortiz-interactive.html  (${sizeKB} KB)`);
console.log(`   → ${DEST}`);
