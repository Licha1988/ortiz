/**
 * bundle-html.mjs
 *
 * Reads the Next.js static export (out/) and produces a single self-contained
 * HTML file with all JS and CSS inlined. No external requests needed at runtime.
 *
 * Usage:
 *   node scripts/bundle-html.mjs
 *
 * Output:
 *   casa-ortiz-interactive.html  (in project root)
 */

import fs   from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, "..");
const OUT_DIR   = path.join(ROOT, "out");
const DEST      = path.join(ROOT, "casa-ortiz-interactive.html");

if (!fs.existsSync(OUT_DIR)) {
  console.error('❌  La carpeta "out/" no existe. Primero ejecutá: npm run build');
  process.exit(1);
}

// ── Read base HTML ────────────────────────────────────────────────────────────
let html = fs.readFileSync(path.join(OUT_DIR, "index.html"), "utf8");

// ── Inline <link rel="stylesheet" href="/_next/..."> ─────────────────────────
html = html.replace(
  /<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*\/?>/gi,
  (match, href) => {
    const filePath = path.join(OUT_DIR, href.replace(/^\//, ""));
    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠  CSS not found, skipping: ${href}`);
      return "";
    }
    const css = fs.readFileSync(filePath, "utf8");
    return `<style>${css}</style>`;
  },
);

// ── Inline <script src="/_next/..."> ─────────────────────────────────────────
html = html.replace(
  /<script([^>]*?)src=["']([^"']+)["']([^>]*?)><\/script>/gi,
  (match, before, src, after) => {
    // Skip external scripts (http/https)
    if (/^https?:\/\//.test(src)) return match;

    const filePath = path.join(OUT_DIR, src.replace(/^\//, ""));
    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠  JS not found, skipping: ${src}`);
      return "";
    }
    const js = fs.readFileSync(filePath, "utf8");
    // Preserve any non-src attributes (e.g. defer, type, data-*)
    const attrs = (before + after)
      .replace(/\s*src=["'][^"']*["']/gi, "")
      .trim();
    return `<script${attrs ? " " + attrs : ""}>${js}</script>`;
  },
);

// ── Write output ──────────────────────────────────────────────────────────────
fs.writeFileSync(DEST, html, "utf8");

const sizeKB = (fs.statSync(DEST).size / 1024).toFixed(0);
console.log(`✅  ${path.basename(DEST)}  (${sizeKB} KB)`);
console.log(`   → ${DEST}`);
