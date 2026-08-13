import type {
  ResistanceConfig,
  RhythmGuideEvent,
  ScoredRhythmCue,
} from "../engine/types";
import {
  dramaticCurveSchema,
  mechanicCatalogueSchema,
  rhythmPatternSchema,
  sharedDramaticCurveSchema,
  type DramaticCurveContent,
  type EpisodeMechanicDefinitions,
  type RhythmPatternContent,
} from "./schemas/mechanicsSchema";
import type { OwnedContentReference } from "./schemas/ownershipSchema";
import type { ContentModules } from "./loadGame";

export type MechanicLibrary = {
  readonly rhythms: ReadonlyMap<string, RhythmPatternContent>;
  readonly dramaticCurves: ReadonlyMap<string, DramaticCurveContent>;
};

export type EpisodeMechanicScope = {
  readonly episodeId: string;
  readonly shared: MechanicLibrary;
  readonly rhythms: ReadonlyMap<string, RhythmPatternContent>;
  readonly dramaticCurves: ReadonlyMap<string, DramaticCurveContent>;
};

export function loadMechanicLibrary(
  catalogueContent: unknown,
  rhythmModules: ContentModules,
  curveModules: ContentModules,
): MechanicLibrary {
  const catalogue = mechanicCatalogueSchema.parse(catalogueContent);
  const rhythms = loadEntries(catalogue.rhythms, "rhythms", rhythmModules, rhythmPatternSchema.parse);
  const dramaticCurves = loadEntries(
    catalogue.dramaticCurves,
    "dramatic-curves",
    curveModules,
    sharedDramaticCurveSchema.parse,
  );
  for (const curve of dramaticCurves.values()) {
    for (const phase of curve.phases) {
      if (!rhythms.has(phase.rhythm.id)) {
        throw new Error(`Shared dramatic curve ${curve.id} references unknown shared rhythm ${phase.rhythm.id}`);
      }
    }
  }
  return { rhythms, dramaticCurves };
}

export function createEpisodeMechanicScope(
  episodeId: string,
  definitions: EpisodeMechanicDefinitions | undefined,
  shared: MechanicLibrary,
): EpisodeMechanicScope {
  const rhythms = mapEpisodeDefinitions(
    episodeId,
    "rhythm",
    definitions?.rhythms ?? [],
    shared.rhythms,
  );
  const dramaticCurves = mapEpisodeDefinitions(
    episodeId,
    "dramatic curve",
    definitions?.dramaticCurves ?? [],
    shared.dramaticCurves,
  );
  const scope = { episodeId, shared, rhythms, dramaticCurves };
  for (const curve of dramaticCurves.values()) {
    for (const phase of curve.phases) {
      resolveOwnedDefinition("rhythm", phase.rhythm, scope, shared.rhythms, rhythms);
    }
  }
  return scope;
}

export function compileResistanceConfig(
  dramaticCurveReference: OwnedContentReference,
  scope: EpisodeMechanicScope,
): ResistanceConfig {
  const curve = resolveOwnedDefinition(
    "dramatic curve",
    dramaticCurveReference,
    scope,
    scope.shared.dramaticCurves,
    scope.dramaticCurves,
  );
  let startsAtMs = 0;
  const cues: ScoredRhythmCue[] = [];
  const guideEvents: RhythmGuideEvent[] = [];
  const phases = curve.phases.map((phase, phaseIndex) => {
    const rhythm = resolveOwnedDefinition(
      "rhythm",
      phase.rhythm,
      scope,
      scope.shared.rhythms,
      scope.rhythms,
    );
    compilePhaseCues(
      rhythm,
      phase,
      phaseIndex,
      startsAtMs,
      cues,
      guideEvents,
    );
    const compiled = {
      id: phase.id,
      startsAtMs,
      endsAtMs: startsAtMs + phase.durationMs,
      pressurePerSecond: phase.pressurePerSecond,
      recoveryPerAction: phase.recoveryPerAction,
      safetyPenaltyPerMiss: phase.safetyPenaltyPerMiss,
      momentumGain: phase.momentumGain,
      momentumLoss: phase.momentumLoss,
      momentumRecoveryBonus: phase.momentumRecoveryBonus,
      presentationIntensity: phase.presentationIntensity,
    };
    startsAtMs = compiled.endsAtMs;
    return compiled;
  });
  cues.sort((left, right) => left.atMs - right.atMs);
  guideEvents.sort((left, right) => left.atMs - right.atMs);
  const alignedGuideEvents = alignPausesWithInputWindows(guideEvents, cues);
  return {
    durationMs: startsAtMs,
    resolutionDurationMs: curve.resolutionDurationMs,
    startingSafety: curve.startingSafety,
    phases,
    cues,
    guideEvents: alignedGuideEvents,
  };
}

function alignPausesWithInputWindows(
  guideEvents: readonly RhythmGuideEvent[],
  cues: readonly ScoredRhythmCue[],
): RhythmGuideEvent[] {
  return guideEvents.flatMap((event) => {
    if (event.action !== "rest" && event.action !== "count-in") return [event];
    const nextCue = cues.find((cue) =>
      cue.atMs >= event.atMs && cue.atMs <= event.endsAtMs);
    if (!nextCue) return [event];
    const endsAtMs = Math.min(
      event.endsAtMs,
      nextCue.atMs - nextCue.timingWindowMs,
    );
    return endsAtMs > event.atMs ? [{ ...event, endsAtMs }] : [];
  });
}

function resolveOwnedDefinition<T>(
  kind: string,
  reference: OwnedContentReference,
  scope: EpisodeMechanicScope,
  shared: ReadonlyMap<string, T>,
  episode: ReadonlyMap<string, T>,
): T {
  const definition = reference.source === "shared"
    ? shared.get(reference.id)
    : episode.get(reference.id);
  if (!definition) {
    throw new Error(
      `${scope.episodeId} references unknown ${reference.source} ${kind} ${reference.id}`,
    );
  }
  return definition;
}

function mapEpisodeDefinitions<T extends { readonly id: string }>(
  episodeId: string,
  kind: string,
  definitions: readonly T[],
  shared: ReadonlyMap<string, unknown>,
): ReadonlyMap<string, T> {
  const mapped = new Map<string, T>();
  for (const definition of definitions) {
    if (mapped.has(definition.id)) {
      throw new Error(`${episodeId} has duplicate episode ${kind} ${definition.id}`);
    }
    if (shared.has(definition.id)) {
      throw new Error(`${episodeId} episode ${kind} ${definition.id} shadows a shared definition`);
    }
    mapped.set(definition.id, definition);
  }
  return mapped;
}

function compilePhaseCues(
  rhythm: RhythmPatternContent,
  phase: DramaticCurveContent["phases"][number],
  phaseIndex: number,
  phaseStartMs: number,
  target: ScoredRhythmCue[],
  guideTarget: RhythmGuideEvent[],
): void {
  const phaseEndMs = phaseStartMs + phase.durationMs;
  const cycleMs = rhythm.cycleBeats * phase.beatIntervalMs;
  const firstCycleMs = phaseStartMs + phase.leadInBeats * phase.beatIntervalMs;
  if (firstCycleMs > phaseStartMs) {
    guideTarget.push({
      action: phaseIndex === 0 ? "count-in" : "rest",
      atMs: phaseStartMs,
      endsAtMs: firstCycleMs,
      phaseIndex,
    });
  }
  for (let cycleStartMs = firstCycleMs; cycleStartMs < phaseEndMs; cycleStartMs += cycleMs) {
    for (const event of rhythm.events) {
      const atMs = cycleStartMs + event.atBeat * phase.beatIntervalMs;
      if (atMs >= phaseEndMs) continue;
      if (event.action === "rest") {
        const endsAtMs = atMs + event.durationBeats * phase.beatIntervalMs;
        if (endsAtMs <= phaseEndMs) {
          guideTarget.push({ action: "rest", atMs, endsAtMs, phaseIndex });
        }
        continue;
      }
      const base = {
        side: event.side,
        atMs,
        timingWindowMs: phase.timingWindowMs,
        phaseIndex,
      };
      if (event.action === "tap") {
        target.push({ ...base, action: "tap", releaseAtMs: null });
        guideTarget.push({
          action: "tap", side: event.side, atMs,
          endsAtMs: atMs + phase.timingWindowMs,
          phaseIndex,
        });
        continue;
      }
      const releaseAtMs = atMs + event.durationBeats * phase.beatIntervalMs;
      if (releaseAtMs > phaseEndMs) continue;
      target.push({ ...base, action: "hold", releaseAtMs });
      guideTarget.push({
        action: "hold", side: event.side, atMs,
        endsAtMs: releaseAtMs,
        phaseIndex,
      });
    }
  }
}

function loadEntries<T extends { readonly id: string }>(
  entries: readonly { readonly id: string; readonly file: string }[],
  directory: string,
  modules: ContentModules,
  parse: (content: unknown) => T,
): ReadonlyMap<string, T> {
  const ids = new Set<string>();
  const files = new Set<string>();
  const loaded = new Map<string, T>();
  for (const entry of entries) {
    if (ids.has(entry.id)) {
      throw new Error(`Duplicate ${directory} catalogue ID: ${entry.id}`);
    }
    if (files.has(entry.file)) {
      throw new Error(`Duplicate ${directory} catalogue file: ${entry.file}`);
    }
    if (entry.file !== `${entry.id}.json`) throw new Error(`${directory} filename must match ID: ${entry.id}`);
    ids.add(entry.id);
    files.add(entry.file);
    const path = `./mechanics/${directory}/${entry.file}`;
    const content = modules[path];
    if (content === undefined) throw new Error(`Missing mechanic file: ${path}`);
    const parsed = parse(content);
    if (parsed.id !== entry.id) throw new Error(`Mechanic ID mismatch for ${path}`);
    loaded.set(parsed.id, parsed);
  }
  const unlisted = Object.keys(modules).filter((path) => !entries.some(({ file }) => path === `./mechanics/${directory}/${file}`));
  if (unlisted.length > 0) throw new Error(`Unlisted mechanic files: ${unlisted.join(", ")}`);
  return loaded;
}
