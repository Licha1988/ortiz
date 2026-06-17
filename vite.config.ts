import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: ".",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  build: {
    outDir: "dist-export",
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: "vite-entry.html",
      output: {
        format: "iife",
        inlineDynamicImports: true,
        entryFileNames: "app.js",
        chunkFileNames: "app-[hash].js",
        assetFileNames: "app[extname]",
      },
    },
  },
});
