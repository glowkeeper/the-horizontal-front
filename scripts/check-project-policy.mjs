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
  "package.json must remain private until the project licences are chosen.",
);
requirePolicy(
  packageJson.license === "UNLICENSED",
  'package.json must use "UNLICENSED" until explicit licences are chosen.',
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
  join(projectRoot, "index.html"),
  ...(await listFiles(join(projectRoot, "src"))),
  ...(await listFiles(join(projectRoot, "public"))),
].filter((path) => [".css", ".html", ".js", ".json", ".ts", ".webmanifest"].includes(extname(path)));

const remoteUrlPattern = /\bhttps?:\/\//i;
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

  requirePolicy(
    !remoteUrlPattern.test(source),
    `${displayPath} contains a remote HTTP(S) URL. Runtime files must remain self-contained.`,
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

const indexHtml = await readFile(join(projectRoot, "index.html"), "utf8");
const mainSource = await readFile(join(projectRoot, "src/main.ts"), "utf8");

requirePolicy(
  indexHtml.includes('rel="manifest" href="/manifest.webmanifest"'),
  "index.html must link the offline web-app manifest.",
);
requirePolicy(
  indexHtml.includes("Content-Security-Policy"),
  "index.html must retain its restrictive Content Security Policy.",
);
requirePolicy(
  mainSource.includes('import "./registerServiceWorker"'),
  "src/main.ts must register the production service worker.",
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
