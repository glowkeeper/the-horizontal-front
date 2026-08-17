import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { marked } from "marked";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const sourceEntryPages = [
  { source: "src/site/pages/home.html", output: "index.html" },
  { source: "src/site/pages/commons.html", output: "commons/index.html" },
  { source: "src/site/pages/sound.html", output: "sound/index.html" },
  { source: "src/play/index.html", output: "play/index.html" },
];

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

const repositoryLink = `<a class="repository-link" href="https://github.com/glowkeeper/the-horizontal-front" aria-label="The Horizontal Front repository on GitHub"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.8-1.6 6.8-7A5.4 5.4 0 0 0 19.4 4 5 5 0 0 0 19.3.5S18.2.1 15 1.8a13.4 13.4 0 0 0-7 0C4.8.1 3.7.5 3.7.5A5 5 0 0 0 3.6 4a5.4 5.4 0 0 0-1.4 3.7c0 5.4 3.5 6.6 6.8 7A4.8 4.8 0 0 0 8 18v4"/><path d="M8 19c-3 .9-3-1.5-4-2"/></svg><span>GitHub</span></a>`;

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const repositoryBlobBase =
  "https://github.com/glowkeeper/the-horizontal-front/blob/main/";

/**
 * Point every repository link somewhere that resolves.
 *
 * The seven governing documents are published as site pages, so links between
 * them become site paths and a reader never leaves. Everything else in the
 * repository — the architecture notes, the grammar reference, the research —
 * is contributor documentation that deliberately stays on GitHub, where it sits
 * beside the source it describes.
 *
 * Those links must become absolute. A repository-relative path survives being
 * rendered into HTML and then resolves against the page it landed on, so
 * `docs/game-concept.md` linked from the contribute page became
 * `/contribute/docs/game-concept.md` and pointed at nothing. Worse, a static
 * host with an HTML fallback answers that with a page rather than an error, so
 * the reader gets something that is neither the document nor a visible failure.
 */
function rewriteInternalLinks(markdown) {
  let rewritten = markdown;

  for (const [source, publicPath] of internalLinks) {
    rewritten = rewritten.replaceAll(`](${source})`, `](${publicPath})`);
  }

  // Anything still pointing at a repository path is documentation that lives on
  // GitHub. Absolute URLs and in-page anchors are left alone.
  rewritten = rewritten.replaceAll(
    /\]\((?!https?:|\/|#)([^)\s]+)\)/g,
    (match, target) => `](${repositoryBlobBase}${target})`,
  );

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
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="theme-color" content="#f3e8d0" />
    <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <title>${escapeHtml(title)} — The Horizontal Front</title>
  </head>
  <body>
    <a class="skip-link" href="#main-content">Skip to content</a>
    <header class="site-header">
      <a class="site-name" href="/">The Horizontal Front</a>
      <nav aria-label="Primary navigation">
        <a href="/">Home</a>
        <a href="/play/">Play</a>
        <a href="/commons/">The Commons</a>
        <a href="/sound/">Sound</a>
        ${repositoryLink}
      </nav>
    </header>
    <main id="main-content" class="${documentPage ? "document-page" : "site-main"}">
      ${content}
      <aside class="repository-anchor" aria-label="Public repository">
        <p>This document, its history and the project’s public decision process are maintained in the <a href="https://github.com/glowkeeper/the-horizontal-front">GitHub repository</a>.</p>
      </aside>
    </main>
    <footer class="site-footer">
      <p>Free to play. No ads. No tracking. No purchases ✊ 🛏️</p>
      <nav aria-label="Project information">
        <a href="/charter/">Charter</a>
        <a href="/governance/">Governance</a>
        <a href="/identity/">Identity</a>
        <a href="/contribute/">Contribute</a>
        <a href="/licences/">Licences</a>
        ${repositoryLink}
      </nav>
    </footer>
    <script type="module" src="/src/site/main.ts"></script>
  </body>
</html>
`;
}

async function writePage(output, html) {
  const outputPath = join(projectRoot, output);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html);
}

for (const page of sourceEntryPages) {
  const html = await readFile(join(projectRoot, page.source), "utf8");
  await writePage(page.output, html);
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
