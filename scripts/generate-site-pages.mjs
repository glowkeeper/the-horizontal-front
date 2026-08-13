import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { marked } from "marked";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const documentPages = [
  {
    source: "PROJECT_CHARTER.md",
    output: "charter/index.html",
    description: "The protected commitments governing The Horizontal Front.",
  },
  {
    source: "GOVERNANCE.md",
    output: "governance/index.html",
    description: "How decisions, participation and stewardship work.",
  },
  {
    source: "IDENTITY.md",
    output: "identity/index.html",
    description: "A commons-oriented approach to canonical project identity.",
  },
  {
    source: "CONTRIBUTING.md",
    output: "contribute/index.html",
    description: "How to contribute while preserving the project charter.",
  },
  {
    source: "LICENSE.md",
    output: "licences/index.html",
    description: "How the software and cultural work are licensed.",
  },
];

const licencePages = [
  {
    source: "LICENSES/AGPL-3.0-or-later.txt",
    output: "licences/agpl/index.html",
    title: "GNU Affero General Public License",
    description: "The complete AGPL version 3 licence text for project software.",
  },
  {
    source: "LICENSES/CC-BY-SA-4.0.txt",
    output: "licences/cc-by-sa/index.html",
    title: "Creative Commons Attribution-ShareAlike 4.0",
    description: "The complete CC BY-SA 4.0 licence text for cultural work.",
  },
];

const internalLinks = new Map([
  ["PROJECT_CHARTER.md", "/charter/"],
  ["GOVERNANCE.md", "/governance/"],
  ["IDENTITY.md", "/identity/"],
  ["CONTRIBUTING.md", "/contribute/"],
  ["LICENSE.md", "/licences/"],
  ["LICENSES/AGPL-3.0-or-later.txt", "/licences/agpl/"],
  ["LICENSES/CC-BY-SA-4.0.txt", "/licences/cc-by-sa/"],
]);

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function rewriteInternalLinks(markdown) {
  let rewritten = markdown;

  for (const [source, publicPath] of internalLinks) {
    rewritten = rewritten.replaceAll(`](${source})`, `](${publicPath})`);
  }

  return rewritten;
}

function extractTitle(markdown) {
  return markdown.match(/^#\s+(.+)$/m)?.[1] ?? "The Horizontal Front";
}

function pageTemplate({ title, description, content, documentPage = false }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="theme-color" content="#111111" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <title>${escapeHtml(title)} — The Horizontal Front</title>
  </head>
  <body>
    <a class="skip-link" href="#main-content">Skip to content</a>
    <header class="site-header">
      <a class="site-name" href="/">The Horizontal Front</a>
      <nav aria-label="Primary navigation">
        <a href="/play/">Play</a>
        <a href="/commons/">The Commons</a>
        <a href="https://github.com/glowkeeper/the-horizontal-front">Source</a>
      </nav>
    </header>
    <main id="main-content" class="${documentPage ? "document-page" : "site-main"}">
      ${content}
    </main>
    <footer class="site-footer">
      <p>Free to play. No ads. No tracking. No purchases.</p>
      <nav aria-label="Project information">
        <a href="/charter/">Charter</a>
        <a href="/governance/">Governance</a>
        <a href="/identity/">Identity</a>
        <a href="/contribute/">Contribute</a>
        <a href="/licences/">Licences</a>
      </nav>
    </footer>
    <script type="module" src="/src/site.ts"></script>
  </body>
</html>
`;
}

async function writePage(output, html) {
  const outputPath = join(projectRoot, output);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html);
}

for (const page of documentPages) {
  const markdown = await readFile(join(projectRoot, page.source), "utf8");
  const title = extractTitle(markdown);
  const content = await marked.parse(rewriteInternalLinks(markdown));

  await writePage(
    page.output,
    pageTemplate({
      title,
      description: page.description,
      content,
      documentPage: true,
    }),
  );
}

for (const page of licencePages) {
  const licenceText = await readFile(join(projectRoot, page.source), "utf8");
  const content = `<article><h1>${escapeHtml(page.title)}</h1><pre class="licence-text">${escapeHtml(licenceText)}</pre></article>`;

  await writePage(
    page.output,
    pageTemplate({
      title: page.title,
      description: page.description,
      content,
      documentPage: true,
    }),
  );
}

console.log("Generated public governance and licence pages.");
