import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { marked } from "marked";

import {
  footerNavigation,
  internalLinkTargets,
  primaryNavigation,
  sitePages,
} from "./site-pages.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const { homepage } = JSON.parse(
  await readFile(join(projectRoot, "package.json"), "utf8"),
);
const siteOrigin = homepage.replace(/\/$/, "");

const sourceEntryPages = sitePages.filter(({ kind }) => kind === "source");

const documentPages = sitePages.filter(({ kind }) => kind === "document");

const licencePages = sitePages.filter(({ kind }) => kind === "licence");

const internalLinks = internalLinkTargets;

/**
 * Both navigations are rendered from the page list, so publishing a page and
 * forgetting to link it cannot happen. `/roadmap/` was published without a
 * link from anywhere in the chrome, which is how this was noticed.
 */
function navigationLinks(pages, currentRoute) {
  return pages
    .map(({ route, nav }) => {
      const current = route === currentRoute ? ' aria-current="page"' : "";
      return `<a href="${route}"${current}>${nav.label}</a>`;
    })
    .join("\n        ");
}

/**
 * Authored entry pages carry the same chrome as generated ones, so they take
 * their navigation from the same list rather than each keeping a copy.
 */
function fillNavigation(page, html) {
  const { route, documentShell } = page;

  // A page carrying the site chrome must ask for both navigations. Checking
  // only for leftover markers would let an authored page omit them entirely
  // and build with no navigation at all, which is the quieter mistake.
  if (documentShell !== false) {
    const missing = ["PRIMARY_NAVIGATION", "FOOTER_NAVIGATION"]
      .filter((marker) => !html.includes(`<!--${marker}-->`));
    if (missing.length > 0) {
      throw new Error(
        `${page.source} is a document-shell page but has no `
          + `${missing.join(" or ")} placeholder. Add it, or mark the page `
          + "documentShell: false in scripts/site-pages.mjs.",
      );
    }
  }

  return html
    .replace("<!--PRIMARY_NAVIGATION-->", navigationLinks(primaryNavigation, route))
    .replace("<!--FOOTER_NAVIGATION-->", navigationLinks(footerNavigation, route));
}

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
 * The governing documents in the repository root are published as site pages, so
 * links between them become site paths and a reader never leaves. Everything
 * else in the repository — the architecture notes, the grammar reference, the
 * research — is contributor documentation that deliberately stays on GitHub,
 * where it sits beside the source it describes. Deliberately no count here: a
 * hand-maintained one had already drifted before anyone noticed.
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

function pageTemplate({
  title,
  description,
  content,
  documentPage = false,
  robots = "",
  repositoryAnchor = true,
}) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="description" content="${escapeHtml(description)}" />${robots ? `\n    <meta name="robots" content="${escapeHtml(robots)}" />` : ""}
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
        ${navigationLinks(primaryNavigation)}
        ${repositoryLink}
      </nav>
    </header>
    <main id="main-content" class="${documentPage ? "document-page" : "site-main"}">
      ${content}${repositoryAnchor ? `
      <aside class="repository-anchor" aria-label="Public repository">
        <p>This document, its history and the project’s public decision process are maintained in the <a href="https://github.com/glowkeeper/the-horizontal-front">GitHub repository</a>.</p>
      </aside>` : ""}
    </main>
    <footer class="site-footer">
      <p class="footer-mark">Free to play. No ads. No tracking. No purchases<img src="/assets/mark.svg" alt="" width="20" height="20" /></p>
      <nav aria-label="Project information">
        ${navigationLinks(footerNavigation)}
        ${repositoryLink}
      </nav>
    </footer>
    <script type="module" src="/src/site/main.ts"></script>
  </body>
</html>
`;
}

/**
 * Canonical URLs, derived from the route rather than declared per page.
 *
 * Every page needs one, because the public host answers an unmatched path with
 * the home page rather than an error. A typo, a stale link or a crawler probing
 * `/ads.txt` all return indexable HTML, so without a canonical URL the same
 * document is discoverable under unlimited addresses. The canonical link is
 * what tells a search engine which one of them is the page.
 *
 * Deriving it from the output path is the point. A per-page declaration is a
 * value someone can copy from the page above and forget to change, and a wrong
 * canonical URL is worse than none: it points a real page at a different one.
 * Here a page cannot be given the wrong route, and a page added later cannot be
 * given no route at all.
 */
function canonicalUrl(output) {
  const route = output === "index.html"
    ? "/"
    : `/${output.slice(0, -"index.html".length)}`;

  return `${siteOrigin}${route}`;
}

/**
 * `canonical: false` exists for exactly one page: the 404.
 *
 * A canonical URL is a claim that this document is the authoritative version of
 * some address. An error page is not the authoritative version of anything, and
 * the address that produced it should not exist at all. Pointing it at the home
 * page would be worse than saying nothing, because it would invite a search
 * engine to treat every mistyped URL as a legitimate alias for the front page —
 * the exact duplication the canonical URLs were added to stop.
 */
async function writePage(output, html, { canonical = true } = {}) {
  if (html.includes('rel="canonical"')) {
    throw new Error(`Page already declares a canonical URL: ${output}`);
  }
  if (!html.includes("</head>")) {
    throw new Error(`Page has no head: ${output}`);
  }

  let finalHtml = html;

  if (canonical) {
    if (!output.endsWith("index.html")) {
      throw new Error(`Page output must be a clean-route index file: ${output}`);
    }

    const link = `  <link rel="canonical" href="${canonicalUrl(output)}" />\n  `;
    finalHtml = html.replace("</head>", `${link}</head>`);
  }

  const outputPath = join(projectRoot, output);

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, finalHtml);
}

for (const page of sourceEntryPages) {
  const html = await readFile(join(projectRoot, page.source), "utf8");
  await writePage(page.output, fillNavigation(page, html));
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

/*
 * The 404 page, and why the host needs it to exist.
 *
 * Cloudflare Pages infers a single-page application when a build ships no
 * top-level `404.html`, and answers every unmatched path with the home page and
 * a 200. That is how `/robots.txt` came to return HTML. This file is what tells
 * the host the site is what it actually is — eleven real pages — so an address
 * that does not exist can say so.
 *
 * It is the one page excluded from the sitemap, the one page asking not to be
 * indexed, and the one page without a canonical URL. `follow` is kept so that
 * the links out of it are still worth crawling.
 */
const notFoundContent = `<article>
        <h1>Page not found</h1>
        <p>Management has no record of this page. It may have been moved, renamed, or filed somewhere nobody is willing to admit to.</p>
        <p>Nothing is broken, and nothing is required of you. Everything below is still exactly where it should be.</p>
        <ul>
          <li><a href="/">The front page</a></li>
          <li><a href="/play/">Play the game</a></li>
          <li><a href="/commons/">How the commons works</a></li>
          <li><a href="/sound/">The sound library</a></li>
        </ul>
      </article>`;

await writePage(
  "404.html",
  pageTemplate({
    title: "Page not found",
    description: "That page does not exist on The Horizontal Front.",
    content: notFoundContent,
    documentPage: true,
    robots: "noindex, follow",
    repositoryAnchor: false,
  }),
  { canonical: false },
);

console.log("Generated public governance, licence and not-found pages.");
