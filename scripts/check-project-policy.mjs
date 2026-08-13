import { readFile, readdir } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

function requirePolicy(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listFiles(path)));
    } else {
      files.push(path);
    }
  }

  return files;
}

const packageJson = JSON.parse(
  await readFile(join(projectRoot, "package.json"), "utf8"),
);

requirePolicy(
  packageJson.private === true,
  "package.json must remain private because this project is distributed as a static application, not an npm package.",
);
requirePolicy(
  packageJson.license === "AGPL-3.0-or-later",
  'package.json must retain the selected "AGPL-3.0-or-later" software licence.',
);

const [agplText, creativeCommonsText, licensingGuide, identityPolicy] =
  await Promise.all([
    readFile(join(projectRoot, "LICENSES/AGPL-3.0-or-later.txt"), "utf8"),
    readFile(join(projectRoot, "LICENSES/CC-BY-SA-4.0.txt"), "utf8"),
    readFile(join(projectRoot, "LICENSE.md"), "utf8"),
    readFile(join(projectRoot, "IDENTITY.md"), "utf8"),
  ]);

requirePolicy(
  agplText.includes("GNU AFFERO GENERAL PUBLIC LICENSE") &&
    agplText.includes("Version 3, 19 November 2007"),
  "The official AGPL-3.0 licence text must remain present.",
);
requirePolicy(
  creativeCommonsText.includes("Attribution-ShareAlike 4.0 International"),
  "The official CC BY-SA 4.0 licence text must remain present.",
);
requirePolicy(
  licensingGuide.includes("AGPL-3.0-or-later") &&
    licensingGuide.includes("CC-BY-SA-4.0"),
  "LICENSE.md must retain the software and cultural-work licensing boundary.",
);
requirePolicy(
  identityPolicy.includes("The project will not seek patents") &&
    identityPolicy.includes("does not currently intend to register a trademark"),
  "IDENTITY.md must retain the no-patent and non-registration commitments.",
);

const prohibitedDependencyFragments = [
  "advert",
  "amplitude",
  "analytics",
  "firebase",
  "mixpanel",
  "paypal",
  "posthog",
  "segment",
  "sentry",
  "stripe",
  "telemetry",
];
const directDependencies = {
  ...packageJson.dependencies,
  ...packageJson.optionalDependencies,
};

for (const dependencyName of Object.keys(directDependencies)) {
  const normalisedName = dependencyName.toLowerCase();
  const prohibitedFragment = prohibitedDependencyFragments.find((fragment) =>
    normalisedName.includes(fragment),
  );

  requirePolicy(
    !prohibitedFragment,
    `Direct runtime dependency "${dependencyName}" matches prohibited policy category "${prohibitedFragment}".`,
  );
}

const runtimePaths = [
  join(projectRoot, "src/site/pages/home.html"),
  join(projectRoot, "src/site/pages/commons.html"),
  join(projectRoot, "src/play/index.html"),
  ...(await listFiles(join(projectRoot, "src"))),
  ...(await listFiles(join(projectRoot, "public"))),
].filter((path) => [".css", ".html", ".js", ".json", ".ts", ".webmanifest"].includes(extname(path)));

const remoteUrlPattern = /\bhttps?:\/\//i;
const remoteEmbeddedResourcePattern = /(?:src|action)=["']https?:\/\/|@import\s+["']https?:\/\/|url\(\s*["']?https?:\/\//i;
const outboundApiPatterns = [
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
  /\bWebSocket\s*\(/,
  /\bEventSource\s*\(/,
  /\bsendBeacon\s*\(/,
];

for (const path of runtimePaths) {
  const source = await readFile(path, "utf8");
  const displayPath = relative(projectRoot, path);
  const containsRemoteRuntimeResource =
    extname(path) === ".html"
      ? remoteEmbeddedResourcePattern.test(source)
      : remoteUrlPattern.test(source);

  requirePolicy(
    !containsRemoteRuntimeResource,
    `${displayPath} embeds a remote runtime resource. Pages may link outward, but the application must remain self-contained.`,
  );

  if (displayPath.startsWith("src/")) {
    for (const pattern of outboundApiPatterns) {
      requirePolicy(
        !pattern.test(source),
        `${displayPath} uses outbound network API ${pattern}. Discuss and update the policy check before adding network behaviour.`,
      );
    }
  }
}

const indexHtml = await readFile(
  join(projectRoot, "src/site/pages/home.html"),
  "utf8",
);
const commonsHtml = await readFile(
  join(projectRoot, "src/site/pages/commons.html"),
  "utf8",
);
const playHtml = await readFile(join(projectRoot, "src/play/index.html"), "utf8");
const mainSource = await readFile(join(projectRoot, "src/play/main.ts"), "utf8");
const sitePageGenerator = await readFile(
  join(projectRoot, "scripts/generate-site-pages.mjs"),
  "utf8",
);
const serviceWorkerRegistration = await readFile(
  join(projectRoot, "src/shared/registerServiceWorker.ts"),
  "utf8",
);
const themeTokens = await readFile(
  join(projectRoot, "src/shared/theme/tokens.css"),
  "utf8",
);
const bootScene = await readFile(
  join(projectRoot, "src/play/phaser/scenes/BootScene.ts"),
  "utf8",
);

requirePolicy(
  indexHtml.includes('rel="manifest" href="/manifest.webmanifest"'),
  "index.html must link the offline web-app manifest.",
);
requirePolicy(
  indexHtml.includes("Content-Security-Policy"),
  "index.html must retain its restrictive Content Security Policy.",
);
requirePolicy(
  indexHtml.includes("A free, open-source game about collective power") &&
    indexHtml.includes('href="/commons/"') &&
    indexHtml.match(/github\.com\/glowkeeper\/the-horizontal-front/g)?.length >= 3,
  "The public landing page must lead with the strong brief and link to The Commons and public repository from its header, body and footer.",
);
requirePolicy(
  commonsHtml.match(/github\.com\/glowkeeper\/the-horizontal-front/g)?.length >= 3,
  "The Commons page must link to the public repository from its header, body and footer.",
);
requirePolicy(
  sitePageGenerator.includes('class="repository-link"') &&
    sitePageGenerator.includes('class="repository-anchor"') &&
    sitePageGenerator.includes("GitHub repository"),
  "Generated public documents must link to the repository in their navigation and explanatory text.",
);
requirePolicy(
  indexHtml.includes('src="/src/site/main.ts"') &&
    !indexHtml.includes('src="/src/play/main.ts"'),
  "The public landing page must use the lightweight site entry and must not load Phaser.",
);
requirePolicy(
  playHtml.includes('src="/src/play/main.ts"'),
  "The /play/ page must retain the isolated Phaser entry.",
);
requirePolicy(
  [
    "--colour-duvet-cream",
    "--colour-ink-charcoal",
    "--colour-resistance-red",
    "--colour-work-light-blue",
    "--colour-management-gold",
    "--colour-paper-white",
  ].every((role) => themeTokens.includes(role)) &&
    themeTokens.includes("--font-interface") &&
    themeTokens.includes("--font-game") &&
    themeTokens.includes("--space-md") &&
    themeTokens.includes("--space-3xl"),
  "The shared semantic colour, typography and spacing roles must remain defined in tokens.css.",
);
requirePolicy(
  indexHtml.includes('<meta name="theme-color" content="#f3e8d0"') &&
    playHtml.includes('<meta name="theme-color" content="#f3e8d0"'),
  "The public site and game must use duvet cream for browser theme chrome.",
);
requirePolicy(
  bootScene.includes("THE MONDAY UPRISING") &&
    bootScene.includes("Management has been notified of absolutely nothing.") &&
    bootScene.includes("The Horizontal Front is coming soon ✊ 🛏️"),
  "The pre-release Phaser scene must retain the approved coming-soon notice.",
);
requirePolicy(
  mainSource.includes('import "../shared/registerServiceWorker"'),
  "The Phaser entry must register the production service worker.",
);
requirePolicy(
  serviceWorkerRegistration.includes("clearDevelopmentServiceWorkers") &&
    serviceWorkerRegistration.includes("registration.unregister()"),
  "Development must clear stale project service workers so cached releases cannot mask current source.",
);

if (failures.length > 0) {
  console.error("Project policy check failed:\n");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log("Project policy check passed.");
}
