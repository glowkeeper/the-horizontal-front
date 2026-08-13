import type { Episode } from "./schemas/episodeSchema";
import {
  resistanceLayoutSchema,
  resistanceSkinSchema,
  type ResistanceLayoutContent,
  type ResistanceSkin,
} from "./schemas/presentationSchema";
import { assertSensiblePresentation } from "./validatePresentation";
import { presentationAssets } from "./presentationAssets";

const layoutModules = import.meta.glob("./presentation/layouts/*.json", {
  eager: true,
  import: "default",
});
const skinModules = import.meta.glob(
  "./presentation/skins/{shared,episodes/*}/*.json",
  { eager: true, import: "default" },
);

export type LoadedPresentation = {
  readonly layout: ResistanceLayoutContent;
  readonly skin: ResistanceSkin;
};

function loadLayout(id: string): ResistanceLayoutContent {
  const path = `./presentation/layouts/${id}.json`;
  const content = layoutModules[path];
  if (content === undefined) {
    throw new Error(`Missing presentation layout: ${id}`);
  }
  const layout = resistanceLayoutSchema.parse(content);
  if (layout.id !== id) {
    throw new Error(`Layout ID mismatch: expected ${id}`);
  }
  return layout;
}

function loadSkin(episodeId: string, id: string): {
  readonly content: ResistanceSkin;
  readonly owner: "shared" | string;
} {
  const candidates = [
    {
      path: `./presentation/skins/episodes/${episodeId}/${id}.json`,
      owner: episodeId,
    },
    {
      path: `./presentation/skins/shared/${id}.json`,
      owner: "shared" as const,
    },
  ];
  const matches = candidates.filter(({ path }) => skinModules[path] !== undefined);
  if (matches.length === 0) {
    throw new Error(`Missing presentation skin: ${id}`);
  }
  if (matches.length > 1) {
    throw new Error(`Ambiguous presentation skin for ${episodeId}: ${id}`);
  }

  const [{ path, owner }] = matches;
  const content = resistanceSkinSchema.parse(skinModules[path]);
  if (content.id !== id) {
    throw new Error(`Skin ID mismatch: expected ${id}`);
  }
  return { content, owner };
}

export function assertAssetOwnership(
  episodeId: string,
  skinOwner: "shared" | string,
  skin: ResistanceSkin,
  assets: typeof presentationAssets = presentationAssets,
): void {
  const assetsById = new Map(
    assets.map((asset) => [asset.id, asset]),
  );
  const parts = [
    ...skin.bed.staticParts,
    ...skin.bed.sleeperParts,
    skin.bed.duvet,
    ...skin.managementParts,
  ];

  for (const part of parts) {
    if (part.shape !== "image") continue;
    const asset = assetsById.get(part.asset);
    if (asset === undefined) continue;

    const shared = asset.file.startsWith("shared/");
    const ownedByEpisode = asset.file.startsWith(`episodes/${episodeId}/`);
    if (skinOwner === "shared" && !shared) {
      throw new Error(`shared skin ${skin.id} cannot use episode asset ${part.asset}`);
    }
    if (!shared && !ownedByEpisode) {
      throw new Error(
        `skin ${skin.id} cannot use asset ${part.asset} owned by another episode`,
      );
    }
  }
}

export function loadPresentation(episode: Episode): LoadedPresentation {
  const selection = episode.confrontation.presentation;
  const layout = loadLayout(selection.layout);
  const { content: skin, owner } = loadSkin(episode.id, selection.skin);

  if (skin.layout !== layout.id) {
    throw new Error(`Skin ${skin.id} is incompatible with layout ${layout.id}`);
  }

  const assetIds = new Set(presentationAssets.map(({ id }) => id));
  assertSensiblePresentation(layout, skin, assetIds);
  assertAssetOwnership(episode.id, owner, skin);

  return { layout, skin };
}
