import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(rootDir, "public", "offline.html");

function assetDataUri(relativePath, mimeType) {
  const buffer = readFileSync(path.join(rootDir, relativePath));
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

const nextLogo = assetDataUri("public/next.svg", "image/svg+xml");
const vercelLogo = assetDataUri("public/vercel.svg", "image/svg+xml");

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light dark">
    <title>Create Next App - Offline</title>
    <style>
      :root {
        --background: #ffffff;
        --foreground: #171717;
        --page: #fafafa;
        --card: #ffffff;
        --muted: #52525b;
        --border: rgba(0, 0, 0, 0.08);
        --hover-border: transparent;
        --secondary-hover: rgba(0, 0, 0, 0.04);
      }

      @media (prefers-color-scheme: dark) {
        :root {
          --background: #0a0a0a;
          --foreground: #ededed;
          --page: #000000;
          --card: #000000;
          --muted: #a1a1aa;
          --border: rgba(255, 255, 255, 0.145);
          --hover-border: transparent;
          --secondary-hover: #1a1a1a;
        }

        .logo-invert {
          filter: invert(1);
        }
      }

      * {
        box-sizing: border-box;
      }

      html,
      body {
        min-height: 100%;
      }

      body {
        margin: 0;
        background: var(--background);
        color: var(--foreground);
        font-family: Arial, Helvetica, sans-serif;
      }

      .page {
        align-items: center;
        background: var(--page);
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-height: 100vh;
      }

      .main {
        align-items: center;
        background: var(--card);
        display: flex;
        flex: 1;
        flex-direction: column;
        justify-content: space-between;
        max-width: 48rem;
        padding: 8rem 4rem;
        width: 100%;
      }

      .copy {
        align-items: center;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        text-align: center;
      }

      h1 {
        color: var(--foreground);
        font-size: 1.875rem;
        font-weight: 600;
        letter-spacing: -0.025em;
        line-height: 2.5rem;
        margin: 0;
        max-width: 20rem;
      }

      p {
        color: var(--muted);
        font-size: 1.125rem;
        line-height: 2rem;
        margin: 0;
        max-width: 28rem;
      }

      .text-link {
        color: var(--foreground);
        font-weight: 500;
        text-decoration: underline;
      }

      .actions {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
      }

      .button {
        align-items: center;
        border-radius: 9999px;
        display: inline-flex;
        font-size: 1rem;
        font-weight: 500;
        gap: 0.5rem;
        height: 3rem;
        justify-content: center;
        padding: 0 1.25rem;
        text-decoration: none;
        transition: background-color 150ms ease, border-color 150ms ease;
        width: 100%;
      }

      .button-primary {
        background: var(--foreground);
        color: var(--background);
      }

      .button-primary:hover {
        background: #383838;
      }

      @media (prefers-color-scheme: dark) {
        .button-primary:hover {
          background: #cccccc;
        }
      }

      .button-secondary {
        border: 1px solid var(--border);
        color: var(--foreground);
      }

      .button-secondary:hover {
        background: var(--secondary-hover);
        border-color: var(--hover-border);
      }

      .logo-next {
        height: auto;
        width: 100px;
      }

      .logo-vercel {
        height: 16px;
        width: 16px;
      }

      @media (min-width: 640px) {
        .main {
          align-items: flex-start;
        }

        .copy {
          align-items: flex-start;
          text-align: left;
        }
      }

      @media (min-width: 768px) {
        .actions {
          flex-direction: row;
          width: auto;
        }

        .button {
          width: 158px;
        }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <main class="main">
        <img class="logo-next logo-invert" src="${nextLogo}" alt="Next.js logo" width="100" height="20">

        <div class="copy">
          <h1>To get started, edit the page.tsx file.</h1>
          <p>
            Looking for a starting point or more instructions? Head over to
            <span class="text-link">Templates</span>
            or the
            <span class="text-link">Learning</span>
            center.
          </p>
        </div>

        <div class="actions">
          <span class="button button-primary" role="button" aria-disabled="true">
            <img class="logo-vercel logo-invert" src="${vercelLogo}" alt="Vercel logomark" width="16" height="16">
            Deploy Now
          </span>
          <span class="button button-secondary" role="button" aria-disabled="true">
            Documentation
          </span>
        </div>
      </main>
    </div>
  </body>
</html>
`;

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, html);
console.log(`Wrote ${path.relative(rootDir, outputPath)}`);
