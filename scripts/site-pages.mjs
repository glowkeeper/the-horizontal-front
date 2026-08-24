/**
 * Every public page the site publishes, in one place.
 *
 * Adding `/roadmap/` previously meant editing nine lists across the generator,
 * the Vite config, the static-build check, the browser suite and `.gitignore`.
 * Most of those fail loudly when forgotten. Two do not: a missing Vite entry
 * lets the build pass while producing no page at all, and a missing browser
 * route quietly drops the page out of the assertions that would have caught a
 * broken link or an unreachable route home.
 *
 * So the list lives here and everything else derives from it.
 *
 * `kind` says how a page is produced:
 *   `source`   — an HTML entry point authored under `src/`.
 *   `document` — a repository Markdown file rendered into the site shell.
 *   `licence`  — a plain-text licence rendered into the site shell.
 *
 * `nav` places a page in the site chrome. A page with no `nav` is reachable
 * but not listed — the licence texts, reached from the licences page. Both
 * navigations are rendered from these entries in list order, so a page cannot
 * be published and then be unreachable by anyone who does not know its URL.
 *
 * `canonical: false` marks a page that exists but is deliberately not part of
 * the published route set: the 404, which must never be indexed, listed in the
 * sitemap or given a clean route.
 */
export const sitePages = [
  {
    route: "/",
    nav: { group: "primary", label: "Home" },
    output: "index.html",
    entry: "home",
    kind: "source",
    source: "src/site/pages/home.html",
  },
  {
    route: "/404.html",
    output: "404.html",
    entry: "notFound",
    kind: "generated",
    canonical: false,
  },
  {
    route: "/play/",
    nav: { group: "primary", label: "Play" },
    output: "play/index.html",
    entry: "play",
    kind: "source",
    source: "src/play/index.html",
    // The game itself, not a document page. Document-shell assertions in the
    // browser suite exclude it for that reason rather than by oversight.
    documentShell: false,
  },
  {
    route: "/commons/",
    nav: { group: "primary", label: "The Commons" },
    output: "commons/index.html",
    entry: "commons",
    kind: "source",
    source: "src/site/pages/commons.html",
  },
  {
    route: "/sound/",
    nav: { group: "primary", label: "Sound" },
    output: "sound/index.html",
    entry: "sound",
    kind: "source",
    source: "src/site/pages/sound.html",
  },
  {
    route: "/charter/",
    nav: { group: "footer", label: "Charter" },
    output: "charter/index.html",
    entry: "charter",
    kind: "document",
    source: "PROJECT_CHARTER.md",
    description: "The protected commitments governing The Horizontal Front.",
  },
  {
    route: "/governance/",
    nav: { group: "footer", label: "Governance" },
    output: "governance/index.html",
    entry: "governance",
    kind: "document",
    source: "GOVERNANCE.md",
    description: "How decisions, participation and stewardship work.",
  },
  {
    route: "/identity/",
    nav: { group: "footer", label: "Identity" },
    output: "identity/index.html",
    entry: "identity",
    kind: "document",
    source: "IDENTITY.md",
    description: "A commons-oriented approach to canonical project identity.",
  },
  {
    route: "/contribute/",
    nav: { group: "footer", label: "Contribute" },
    output: "contribute/index.html",
    entry: "contribute",
    kind: "document",
    source: "CONTRIBUTING.md",
    description: "How to contribute while preserving the project charter.",
  },
  {
    route: "/roadmap/",
    nav: { group: "footer", label: "Roadmap" },
    output: "roadmap/index.html",
    entry: "roadmap",
    kind: "document",
    source: "ROADMAP.md",
    description: "What the project intends to do next, and what help is wanted.",
  },
  {
    route: "/licences/",
    nav: { group: "footer", label: "Licences" },
    output: "licences/index.html",
    entry: "licences",
    kind: "document",
    source: "LICENSE.md",
    description: "How the software and cultural work are licensed.",
  },
  {
    route: "/licences/agpl/",
    output: "licences/agpl/index.html",
    entry: "licences/agpl",
    kind: "licence",
    source: "LICENSES/AGPL-3.0-or-later.txt",
    title: "GNU Affero General Public License",
    description: "The complete AGPL version 3 licence text for project software.",
    // Reached from /licences/ rather than the primary navigation, and not
    // given a clean route alias in the offline cache.
    cleanRoute: false,
  },
  {
    route: "/licences/cc-by-sa/",
    output: "licences/cc-by-sa/index.html",
    entry: "licences/cc-by-sa",
    kind: "licence",
    source: "LICENSES/CC-BY-SA-4.0.txt",
    title: "Creative Commons Attribution-ShareAlike 4.0",
    description: "The complete CC BY-SA 4.0 licence text for cultural work.",
    cleanRoute: false,
  },
];

/** Pages that belong in the sitemap, the crawler files and the route set. */
export const canonicalPages = sitePages.filter(
  ({ canonical }) => canonical !== false,
);

/** Pages whose clean route must be answerable from the offline cache. */
export const cleanRoutePages = canonicalPages.filter(
  ({ cleanRoute }) => cleanRoute !== false,
);

/** Pages rendered into the shared site shell, so they carry its chrome. */
export const documentShellPages = canonicalPages.filter(
  ({ documentShell }) => documentShell !== false,
);

/** The header navigation, in list order. */
export const primaryNavigation = sitePages.filter(
  ({ nav }) => nav?.group === "primary",
);

/** The footer navigation, in list order. */
export const footerNavigation = sitePages.filter(
  ({ nav }) => nav?.group === "footer",
);

/** Repository files that should link to their published route, not their path. */
export const internalLinkTargets = new Map(
  sitePages
    .filter(({ kind }) => kind === "document" || kind === "licence")
    .map(({ source, route }) => [source, route]),
);

/** Top-level directories the build writes and Git must therefore ignore. */
export const generatedPaths = sitePages
  .map(({ output }) => (output.includes("/") ? `/${output.split("/")[0]}/` : `/${output}`))
  .filter((path, index, all) => all.indexOf(path) === index);
