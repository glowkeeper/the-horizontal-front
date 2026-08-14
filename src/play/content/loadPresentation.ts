import type { Episode } from "./loadEpisode";
import {
  resistanceLayoutSchema,
  resistanceSkinSchema,
  interruptionSkinSchema,
  type InterruptionSkin,
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
const interruptionSkinModules = import.meta.glob(
  "./presentation/interruption-skins/{shared,episodes/*}/*.json",
  { eager: true, import: "default" },
);

type InterruptionSkinRecord = {
  readonly owner: "shared" | string;
  readonly content: InterruptionSkin;
};

export function loadInterruptionSkinLibrary(
  modules: Readonly<Record<string, unknown>> = interruptionSkinModules,
): ReadonlyMap<string, InterruptionSkinRecord> {
  const records = new Map<string, InterruptionSkinRecord>();
  const sharedIds = new Set<string>();
  const episodeIds = new Map<string, Set<string>>();
  for (const [path, raw] of Object.entries(modules)) {
    const match = /^\.\/presentation\/interruption-skins\/(shared|episodes\/([a-z0-9]+(?:-[a-z0-9]+)*))\/([a-z0-9]+(?:-[a-z0-9]+)*)\.json$/.exec(path);
    if (!match) throw new Error(`Invalid interruption skin path: ${path}`);
    const content = interruptionSkinSchema.parse(raw);
    if (content.id !== match[3]) {
      throw new Error(`Interruption skin ID must match its filename: ${path}`);
    }
    const owner = match[1] === "shared" ? "shared" : match[2];
    records.set(path, { owner, content });
    if (owner === "shared") sharedIds.add(content.id);
    else {
      const ownedIds = episodeIds.get(owner) ?? new Set<string>();
      ownedIds.add(content.id);
      episodeIds.set(owner, ownedIds);
    }
  }
  for (const [episodeId, ownedIds] of episodeIds) {
    for (const id of ownedIds) {
      if (sharedIds.has(id)) {
        throw new Error(
          `${episodeId} episode interruption skin ${id} shadows a shared definition`,
        );
      }
    }
  }
  return records;
}

const interruptionSkinLibrary = loadInterruptionSkinLibrary();

export type LoadedPresentation = {
  readonly layout: ResistanceLayoutContent;
  readonly skin: ResistanceSkin;
  readonly interruptionSkins: ReadonlyMap<string, InterruptionSkin>;
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

function loadInterruptionSkin(
  episodeId: string,
  reference: { readonly source: "shared" | "episode"; readonly id: string },
): InterruptionSkin {
  const path = reference.source === "shared"
    ? `./presentation/interruption-skins/shared/${reference.id}.json`
    : `./presentation/interruption-skins/episodes/${episodeId}/${reference.id}.json`;
  const record = interruptionSkinLibrary.get(path);
  if (record === undefined) {
    throw new Error(`Missing ${reference.source} interruption skin: ${reference.id}`);
  }
  return record.content;
}

export function assertInterruptionSkinCompatibility(
  skin: InterruptionSkin,
  mechanic: "sequence" | "hold",
): void {
  if (!skin.supports.includes(mechanic)) {
    throw new Error(`Interruption skin ${skin.id} does not support ${mechanic}`);
  }
}

export function assertVisibleInterruptionReturns(
  episode: Episode,
  layout: ResistanceLayoutContent,
): void {
  const { feedback, leftControl, rightControl } = layout.anchors;
  const speed = layout.controls.noteTravelPixelsPerMs;

  for (const interruption of episode.confrontation.interruptions) {
    const firstCue = episode.confrontation.resistance.cues.find(
      (cue) => cue.atMs - cue.timingWindowMs >= interruption.returnsAtMs,
    );
    if (firstCue === undefined) {
      throw new Error(
        `Interruption ${interruption.id} must return before a playable resistance cue`,
      );
    }
    const target = firstCue.side === "left" ? leftControl : rightControl;
    const travelDurationMs = Math.abs(target.x - feedback.x) / speed;
    if (firstCue.atMs - travelDurationMs < interruption.endsAtMs) {
      throw new Error(
        `Interruption ${interruption.id} return count-in cannot show the complete approach of its first resistance cue`,
      );
    }
  }
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
    ...skin.bed.duvetOverlayParts,
    ...skin.environment.baseParts,
    ...skin.environment.intensityParts.map(({ part }) => part),
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
  for (const state of skin.bed.duvetStates) {
    const asset = assetsById.get(state.asset.id);
    if (asset === undefined) continue;
    const shared = asset.file.startsWith("shared/");
    const ownedByEpisode = asset.file.startsWith(`episodes/${episodeId}/`);
    if (state.asset.source === "shared" && !shared) {
      throw new Error(`asset ${state.asset.id} is marked shared but is episode-owned`);
    }
    if (state.asset.source === "episode" && !ownedByEpisode) {
      throw new Error(`asset ${state.asset.id} is not owned by episode ${episodeId}`);
    }
  }
  for (const state of skin.managementStates) {
    for (const reference of state.assets) {
      const asset = assetsById.get(reference.asset.id);
      if (asset === undefined) continue;
      const shared = asset.file.startsWith("shared/");
      const ownedByEpisode = asset.file.startsWith(`episodes/${episodeId}/`);
      if (reference.asset.source === "shared" && !shared) {
        throw new Error(`asset ${reference.asset.id} is marked shared but is episode-owned`);
      }
      if (reference.asset.source === "episode" && !ownedByEpisode) {
        throw new Error(`asset ${reference.asset.id} is not owned by episode ${episodeId}`);
      }
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
  assertVisibleInterruptionReturns(episode, layout);

  const interruptionSkins = new Map<string, InterruptionSkin>();
  for (const interruption of episode.confrontation.interruptions) {
    const interruptionSkin = loadInterruptionSkin(
      episode.id,
      interruption.presentation.skin,
    );
    assertInterruptionSkinCompatibility(
      interruptionSkin,
      interruption.interaction.kind,
    );
    interruptionSkins.set(interruption.id, interruptionSkin);
  }

  return { layout, skin, interruptionSkins };
}
