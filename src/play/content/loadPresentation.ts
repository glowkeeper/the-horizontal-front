import type { Episode } from "./loadEpisode";
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

function loadSkin(
  episodeId: string,
  reference: Episode["confrontation"]["presentation"]["skin"],
): {
  readonly content: ResistanceSkin;
  readonly owner: "shared" | string;
} {
  const owner = reference.source === "shared" ? "shared" : episodeId;
  const path = reference.source === "shared"
    ? `./presentation/skins/shared/${reference.id}.json`
    : `./presentation/skins/episodes/${episodeId}/${reference.id}.json`;
  if (skinModules[path] === undefined) {
    throw new Error(`Missing ${reference.source} presentation skin: ${reference.id}`);
  }
  const content = resistanceSkinSchema.parse(skinModules[path]);
  if (content.id !== reference.id) {
    throw new Error(`Skin ID mismatch: expected ${reference.id}`);
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
    const asset = assetsById.get(part.asset.id);
    if (asset === undefined) continue;

    const shared = asset.file.startsWith("shared/");
    const ownedByEpisode = asset.file.startsWith(`episodes/${episodeId}/`);
    if (skinOwner === "shared" && !shared) {
      throw new Error(`shared skin ${skin.id} cannot use episode asset ${part.asset.id}`);
    }
    if (part.asset.source === "shared" && !shared) {
      throw new Error(`asset ${part.asset.id} is marked shared but is episode-owned`);
    }
    if (part.asset.source === "episode" && !ownedByEpisode) {
      throw new Error(`asset ${part.asset.id} is not owned by episode ${episodeId}`);
    }
  }
}

export function loadPresentation(episode: Episode): LoadedPresentation {
  const selection = episode.confrontation.presentation;
  const layout = loadLayout(selection.layout.id);
  const { content: skin, owner } = loadSkin(episode.id, selection.skin);

  if (skin.layout !== layout.id) {
    throw new Error(`Skin ${skin.id} is incompatible with layout ${layout.id}`);
  }
  if (episode.confrontation.resistance.cues.some(
    ({ timingWindowMs }) => timingWindowMs > layout.controls.maximumTimingWindowMs,
  )) {
    throw new Error(
      `Layout ${layout.id} cannot display this episode's timing tolerance`,
    );
  }

  const assetIds = new Set(presentationAssets.map(({ id }) => id));
  assertSensiblePresentation(layout, skin, assetIds);
  assertAssetOwnership(episode.id, owner, skin);

  return { layout, skin };
}
