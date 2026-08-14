import { readFile, readdir } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assetFilePattern,
  contentIdPattern,
  findPlaceholderIdSegment,
  maximumCampaignsWithoutPaging,
} from "../src/play/content/contentRules.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

function requirePolicy(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

async function findEmbeddedPlayerCopy(directory) {
  // This is a deliberately small regression tripwire for direct literals at
  // presentation call sites, not a semantic proof. Schemas, TypeScript and
  // review remain the authoritative copy boundary; indirect values require
  // ordinary code review until an AST-based policy becomes worthwhile.
  const findings = [];
  const files = (await listFiles(directory)).filter((file) => file.endsWith(".ts"));
  for (const file of files) {
    const source = await readFile(file, "utf8");
    const literalCopyPatterns = [
      /\.text\((?:[^,]+,){2}\s*["'`][^"'`\s]/g,
      /\.setText\(\s*["'`][^"'`\s]/g,
      /\bannounce\(\s*["'`][^"'`\s]/g,
      /\bcreateButton\((?:[^,]+,){4}\s*["'`][^"'`\s]/g,
    ];
    for (const pattern of literalCopyPatterns) {
      for (const match of source.matchAll(pattern)) {
        const line = source.slice(0, match.index).split("\n").length;
        findings.push(`${relative(projectRoot, file)}:${line}`);
      }
    }
  }
  return findings;
}

async function findHardCodedPresentationValues(directory) {
  const findings = [];
  const files = directory.endsWith(".ts")
    ? [directory]
    : (await listFiles(directory)).filter((file) => file.endsWith(".ts"));
  const authoredValuePatterns = [
    /fontSize\s*:\s*["'`]\d/g,
    /\.setDepth\(\s*-?\d/g,
    /\.setAlpha\(\s*0?\.\d/g,
    /\.setStrokeStyle\(\s*\d/g,
  ];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    for (const pattern of authoredValuePatterns) {
      for (const match of source.matchAll(pattern)) {
        const line = source.slice(0, match.index).split("\n").length;
        findings.push(`${relative(projectRoot, file)}:${line}`);
      }
    }
  }
  return findings;
}

async function listFiles(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
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
const packageLock = JSON.parse(
  await readFile(join(projectRoot, "package-lock.json"), "utf8"),
);
const mcpConfig = JSON.parse(
  await readFile(join(projectRoot, ".mcp.json"), "utf8"),
);
const gitignore = await readFile(join(projectRoot, ".gitignore"), "utf8");
const browserReviewServer =
  mcpConfig.mcpServers?.["playwright-browser-review"];
const browserReviewArgs = browserReviewServer?.args ?? [];
const browserReviewFlagValue = (flag) => {
  const index = browserReviewArgs.indexOf(flag);
  return index === -1 ? undefined : browserReviewArgs[index + 1];
};

const gamePath = join(projectRoot, "src/play/content/game.json");
const mechanicCataloguePath = join(
  projectRoot,
  "src/play/content/mechanics/catalog.json",
);
const assetCatalogPath = join(
  projectRoot,
  "src/play/content/presentation/asset-catalog.json",
);
const assetRoot = join(projectRoot, "src/play/content/presentation/assets");
const gameData = JSON.parse(await readFile(gamePath, "utf8"));
const mechanicCatalogueData = JSON.parse(
  await readFile(mechanicCataloguePath, "utf8"),
);
const campaignData = await Promise.all(gameData.campaigns.map(async ({ file }) =>
  JSON.parse(await readFile(
    join(projectRoot, "src/play/content/campaigns", file),
    "utf8",
  ))));
const episodeReferences = campaignData.flatMap(({ episodes }) => episodes);
const assetCatalogData = JSON.parse(await readFile(assetCatalogPath, "utf8"));
const campaignIds = new Set(gameData.campaigns.map(({ id }) => id));
const episodeIds = new Set(
  episodeReferences.map(({ id }) => id),
);
const referencesMatchIds = (references) => references.every(({ id, file }) =>
  contentIdPattern.test(id) && file === `${id}.json`);
const campaignRoot = join(projectRoot, "src/play/content/campaigns");
const episodeRoot = join(projectRoot, "src/play/content/episodes");
const discoveredCampaignFiles = (await listFiles(campaignRoot)).map((file) =>
  relative(campaignRoot, file).split("\\").join("/"));
const discoveredEpisodeFiles = (await listFiles(episodeRoot)).map((file) =>
  relative(episodeRoot, file).split("\\").join("/"));
const mechanicRoot = join(projectRoot, "src/play/content/mechanics");
const discoveredRhythmFiles = (await listFiles(join(mechanicRoot, "rhythms")))
  .map((file) => relative(join(mechanicRoot, "rhythms"), file).split("\\").join("/"))
  .filter((file) => file.endsWith(".json"));
const discoveredCurveFiles = (await listFiles(join(mechanicRoot, "dramatic-curves")))
  .map((file) => relative(join(mechanicRoot, "dramatic-curves"), file).split("\\").join("/"))
  .filter((file) => file.endsWith(".json"));
const discoveredInterruptionFiles = (await listFiles(join(mechanicRoot, "interruptions")))
  .map((file) => relative(join(mechanicRoot, "interruptions"), file).split("\\").join("/"))
  .filter((file) => file.endsWith(".json"));
const embeddedPlayerCopy = await findEmbeddedPlayerCopy(
  join(projectRoot, "src/play"),
);
const hardCodedPresentationValues = [
  ...await findHardCodedPresentationValues(
    join(projectRoot, "src/play/phaser/presentation"),
  ),
  ...await findHardCodedPresentationValues(
    join(projectRoot, "src/play/phaser/scenes/ResistanceScene.ts"),
  ),
];

requirePolicy(
  embeddedPlayerCopy.length === 0,
  `Player-visible Phaser copy must come from validated content, not string literals: ${embeddedPlayerCopy.join(", ")}`,
);
requirePolicy(
  hardCodedPresentationValues.length === 0,
  `Resistance Phaser presentation must resolve authored visual values from validated layout, skin or theme data: ${hardCodedPresentationValues.join(", ")}`,
);

requirePolicy(
  contentIdPattern.test(gameData.id) && referencesMatchIds(gameData.campaigns),
  "Game and campaign references must use durable kebab-case IDs with exactly matching filenames.",
);
requirePolicy(
  campaignData.every((campaign) =>
    contentIdPattern.test(campaign.id) && referencesMatchIds(campaign.episodes)),
  "Campaign and episode references must use durable kebab-case IDs with exactly matching filenames.",
);
requirePolicy(
  discoveredCampaignFiles.length === gameData.campaigns.length &&
    discoveredCampaignFiles.every((file) =>
      gameData.campaigns.some((entry) => entry.file === file)),
  "Every campaign file must be listed exactly once by game.json.",
);
requirePolicy(
  gameData.campaigns.length <= maximumCampaignsWithoutPaging,
  `The campaign catalogue supports at most ${maximumCampaignsWithoutPaging} campaigns before paging is implemented.`,
);
requirePolicy(
  discoveredEpisodeFiles.length === episodeReferences.length &&
    discoveredEpisodeFiles.every((file) =>
      episodeReferences.some((entry) => entry.file === file)),
  "Every episode file must be listed exactly once across game campaigns.",
);
requirePolicy(
  episodeIds.size === episodeReferences.length,
  "Episode IDs must be globally unique across campaigns.",
);
requirePolicy(
  referencesMatchIds(mechanicCatalogueData.rhythms)
    && discoveredRhythmFiles.length === mechanicCatalogueData.rhythms.length
    && discoveredRhythmFiles.every((file) =>
      mechanicCatalogueData.rhythms.some((entry) => entry.file === file)),
  "Every rhythm file must be listed exactly once with a matching durable ID in the mechanic catalogue.",
);
requirePolicy(
  referencesMatchIds(mechanicCatalogueData.dramaticCurves)
    && discoveredCurveFiles.length === mechanicCatalogueData.dramaticCurves.length
    && discoveredCurveFiles.every((file) =>
      mechanicCatalogueData.dramaticCurves.some((entry) => entry.file === file)),
  "Every dramatic-curve file must be listed exactly once with a matching durable ID in the mechanic catalogue.",
);
requirePolicy(
  referencesMatchIds(mechanicCatalogueData.interruptions)
    && discoveredInterruptionFiles.length === mechanicCatalogueData.interruptions.length
    && discoveredInterruptionFiles.every((file) =>
      mechanicCatalogueData.interruptions.some((entry) => entry.file === file)),
  "Every interruption file must be listed exactly once with a matching durable ID in the mechanic catalogue.",
);
for (const id of [
  gameData.id,
  ...gameData.campaigns.map(({ id }) => id),
  ...episodeReferences.map(({ id }) => id),
]) {
  const placeholder = findPlaceholderIdSegment(id);
  requirePolicy(
    placeholder === undefined,
    `Content ID "${id}" contains placeholder segment "${placeholder}"; use the durable creative name.`,
  );
}
const listedAssetFiles = new Set(
  assetCatalogData.assets.map(({ file }) => file),
);
const discoveredAssetFiles = (await listFiles(assetRoot))
  .map((file) => relative(assetRoot, file).split("\\").join("/"))
  .filter((file) => file !== "README.md");

requirePolicy(
  assetCatalogData.assets.every(({ file }) => assetFilePattern.test(file)),
  "Every presentation asset catalogue path must be a PNG or WebP safely namespaced under shared/, campaigns/<campaign-id>/ or episodes/<episode-id>/.",
);
requirePolicy(
  assetCatalogData.assets.every(({ file }) => {
    const match = /^campaigns\/([^/]+)\//.exec(file);
    return match === null || campaignIds.has(match[1]);
  }),
  "Every campaign-owned presentation asset must name a game campaign.",
);
requirePolicy(
  assetCatalogData.assets.every(({ file }) => {
    const match = /^episodes\/([^/]+)\//.exec(file);
    return match === null || episodeIds.has(match[1]);
  }),
  "Every episode-owned presentation asset must name an episode in a game campaign.",
);
requirePolicy(
  discoveredAssetFiles.every((file) => assetFilePattern.test(file)),
  "The presentation asset tree may contain only namespaced PNG or WebP files and its README.",
);
requirePolicy(
  [...listedAssetFiles].every((file) => discoveredAssetFiles.includes(file)),
  "Every catalogued presentation asset must exist in the asset tree.",
);
requirePolicy(
  discoveredAssetFiles.every((file) => listedAssetFiles.has(file)),
  "Every presentation asset file must have a provenance-bearing catalogue entry.",
);

const skinRoot = join(projectRoot, "src/play/content/presentation/skins");
const skinFiles = await listFiles(skinRoot);
const assetsById = new Map(
  assetCatalogData.assets.map((asset) => [asset.id, asset]),
);
const skinRecords = await Promise.all(skinFiles.map(async (file) => {
  const path = relative(skinRoot, file).split("\\").join("/");
  const content = JSON.parse(await readFile(file, "utf8"));
  const match = /^(shared|episodes\/([a-z0-9]+(?:-[a-z0-9]+)*))\/([a-z0-9]+(?:-[a-z0-9]+)*)\.json$/.exec(path);
  requirePolicy(match !== null, `Presentation skin has an invalid ownership path: ${path}`);
  if (match === null) return { path, content, owner: undefined };

  const owner = match[1] === "shared" ? "shared" : match[2];
  requirePolicy(
    content.id === match[3],
    `Presentation skin ID must match its filename: ${path}`,
  );
  requirePolicy(
    owner === "shared" || episodeIds.has(owner),
    `Episode-owned presentation skin names an unknown episode: ${path}`,
  );

  const parts = [
    ...content.bed.staticParts,
    ...content.bed.sleeperParts,
    content.bed.duvet,
    ...content.managementParts,
  ];
  for (const part of parts.filter(({ shape }) => shape === "image")) {
    const asset = assetsById.get(part.asset.id);
    requirePolicy(
      asset !== undefined,
      `Presentation skin ${content.id} references unknown asset ${part.asset.id}.`,
    );
    if (asset === undefined) continue;
    const sharedAsset = asset.file.startsWith("shared/");
    requirePolicy(
      sharedAsset || (owner !== "shared" && asset.file.startsWith(`episodes/${owner}/`)),
      `Presentation skin ${content.id} references an asset outside its ownership boundary.`,
    );
    requirePolicy(
      part.asset.source === (sharedAsset ? "shared" : "episode"),
      `Presentation skin ${content.id} asset ${part.asset.id} must explicitly name its ownership source.`,
    );
  }
  return { path, content, owner };
}));

const interruptionSkinRoot = join(
  projectRoot,
  "src/play/content/presentation/interruption-skins",
);
const interruptionSkinFiles = await listFiles(interruptionSkinRoot);
const interruptionSkinRecords = await Promise.all(
  interruptionSkinFiles.map(async (file) => {
    const path = relative(interruptionSkinRoot, file).split("\\").join("/");
    const content = JSON.parse(await readFile(file, "utf8"));
    const match = /^(shared|episodes\/([a-z0-9]+(?:-[a-z0-9]+)*))\/([a-z0-9]+(?:-[a-z0-9]+)*)\.json$/.exec(path);
    requirePolicy(match !== null, `Interruption skin has an invalid ownership path: ${path}`);
    if (match === null) return { path, content, owner: undefined };
    const owner = match[1] === "shared" ? "shared" : match[2];
    requirePolicy(
      content.id === match[3],
      `Interruption skin ID must match its filename: ${path}`,
    );
    requirePolicy(
      owner === "shared" || episodeIds.has(owner),
      `Episode-owned interruption skin names an unknown episode: ${path}`,
    );
    return { path, content, owner };
  }),
);
const sharedInterruptionSkinIds = new Set(
  interruptionSkinRecords
    .filter(({ owner }) => owner === "shared")
    .map(({ content }) => content.id),
);
for (const record of interruptionSkinRecords) {
  requirePolicy(
    record.owner === "shared" || !sharedInterruptionSkinIds.has(record.content.id),
    `Episode-owned interruption skin ${record.content.id} must not shadow a shared skin.`,
  );
}

for (const { id, file } of episodeReferences) {
  const episode = JSON.parse(
    await readFile(join(projectRoot, "src/play/content/episodes", file), "utf8"),
  );
  requirePolicy(
    episode.id === id,
    `Episode file ${file} must contain the ID ${id}.`,
  );
  const skinReference = episode.confrontation.presentation.skin;
  const skinId = skinReference.id;
  const matchingSkins = skinRecords.filter(({ content, owner }) =>
    content.id === skinId && owner === (
      skinReference.source === "shared" ? "shared" : id
    ));
  requirePolicy(
    matchingSkins.length === 1,
    `Episode ${id} must select exactly one shared or episode-owned skin named ${skinId}.`,
  );
  for (const interruption of episode.confrontation.interruptions ?? []) {
    const reference = interruption.presentation.skin;
    const matchingInterruptionSkins = interruptionSkinRecords.filter(
      ({ content, owner }) => content.id === reference.id && owner === (
        reference.source === "shared" ? "shared" : id
      ),
    );
    requirePolicy(
      matchingInterruptionSkins.length === 1,
      `Episode ${id} interruption ${interruption.id} must select exactly one owned interruption skin named ${reference.id}.`,
    );
    requirePolicy(
      matchingInterruptionSkins.length !== 1
        || matchingInterruptionSkins[0].content.supports.includes(interruption.kind),
      `Episode ${id} interruption ${interruption.id} selects an incompatible interruption skin.`,
    );
  }
}

for (const [index, campaign] of campaignData.entries()) {
  requirePolicy(
    campaign.id === gameData.campaigns[index].id,
    `Campaign file ${gameData.campaigns[index].file} must contain the ID ${gameData.campaigns[index].id}.`,
  );
}

requirePolicy(
  packageJson.private === true,
  "package.json must remain private because this project is distributed as a static application, not an npm package.",
);
requirePolicy(
  packageJson.license === "AGPL-3.0-or-later",
  'package.json must retain the selected "AGPL-3.0-or-later" software licence.',
);
requirePolicy(
  packageJson.dependencies?.["@playwright/mcp"] === undefined &&
    /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(
      packageJson.devDependencies?.["@playwright/mcp"] ?? "",
    ),
  "Playwright MCP must remain an exactly pinned development dependency, never a runtime dependency or floating range.",
);
const playwrightTestVersion = packageJson.devDependencies?.["@playwright/test"];
const mcpPlaywrightVersion =
  packageLock.packages?.["node_modules/@playwright/mcp"]?.dependencies?.playwright;
requirePolicy(
  packageJson.dependencies?.["@playwright/test"] === undefined &&
    /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(playwrightTestVersion ?? "") &&
    playwrightTestVersion === mcpPlaywrightVersion,
  "Playwright Test must be an exact development dependency matching the Playwright revision required by Playwright MCP.",
);
requirePolicy(
  browserReviewServer?.type === "stdio" &&
    browserReviewServer.command === "node" &&
    browserReviewArgs[0] ===
      "${CLAUDE_PROJECT_DIR:-.}/node_modules/@playwright/mcp/cli.js",
  "The shared browser-review MCP server must execute the lockfile-installed project package through Node.",
);
requirePolicy(
  browserReviewArgs.includes("--isolated") &&
    browserReviewArgs.includes("--headless") &&
    browserReviewFlagValue("--caps") === "vision" &&
    browserReviewFlagValue("--viewport-size") === "1280x720",
  "Browser review must use an isolated headless profile with canvas pointer capability and a stable landscape viewport.",
);
requirePolicy(
  browserReviewFlagValue("--output-dir") ===
      "${CLAUDE_PROJECT_DIR:-.}/.artifacts/browser-review" &&
    browserReviewFlagValue("--output-max-size") === "52428800" &&
    gitignore.split("\n").includes(".artifacts/"),
  "Browser-review output must be bounded and stored under the ignored .artifacts directory.",
);
requirePolicy(
  [
    "--allow-unrestricted-file-access",
    "--extension",
    "--storage-state",
    "--user-data-dir",
  ].every((flag) => !browserReviewArgs.includes(flag)) &&
    browserReviewArgs.every((argument) => !argument.includes("@latest")),
  "Browser review must not use personal or persisted browser state, unrestricted file access or floating executable versions.",
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
const resistanceScene = await readFile(
  join(projectRoot, "src/play/phaser/scenes/ResistanceScene.ts"),
  "utf8",
);
const gameSource = await readFile(
  join(projectRoot, "src/play/content/game.ts"),
  "utf8",
);
const gameContent = await readFile(
  join(projectRoot, "src/play/content/game.json"),
  "utf8",
);
const gameLoader = await readFile(
  join(projectRoot, "src/play/content/loadGame.ts"),
  "utf8",
);
const presentationLoader = await readFile(
  join(projectRoot, "src/play/content/loadPresentation.ts"),
  "utf8",
);
const bedLayout = await readFile(
  join(projectRoot, "src/play/phaser/layouts/bedHeadRightLayout.ts"),
  "utf8",
);

requirePolicy(
  indexHtml.includes('rel="manifest" href="/manifest.webmanifest"'),
  "index.html must link the offline web-app manifest.",
);
requirePolicy(
  playHtml.includes('aria-live="polite"') &&
    playHtml.includes('aria-atomic="true"') &&
    playHtml.includes("{{GAME_PAGE_TITLE}}") &&
    playHtml.includes("{{GAME_LOADING_STATUS}}") &&
    !mainSource.includes("game.interface"),
  "The game page shell must use build-time data placeholders and the live region must remain active.",
);
requirePolicy(
  presentationLoader.includes('import.meta.glob("./presentation/layouts/*.json"') &&
    presentationLoader.includes('"./presentation/skins/{shared,episodes/*}/*.json"') &&
    presentationLoader.includes("assertSensiblePresentation") &&
    bedLayout.includes("loadPresentation") &&
    !bedLayout.includes("FOOT_PIVOT_X") &&
    !bedLayout.includes("DUVET_RESTING_X"),
  "Presentation layouts and skins must be discovered, validated and interpreted as data rather than embedded composition constants.",
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
  bootScene.includes('this.scene.start("CampaignsScene")'),
  "The game bootstrap must present the validated campaign catalogue.",
);
requirePolicy(
  gameSource.includes('import.meta.glob("./campaigns/*.json"') &&
    gameSource.includes('import.meta.glob("./episodes/*.json"') &&
    gameSource.includes("loadGame") &&
    gameContent.includes('"campaigns"') &&
    gameLoader.includes("gameSchema.parse") &&
    gameLoader.includes("campaignSchema.parse") &&
    !resistanceScene.includes("content/episodes/") &&
    !resistanceScene.includes("the-alarm"),
  "ResistanceScene must receive validated content through the game and campaign hierarchy rather than importing or branching on a particular episode.",
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
