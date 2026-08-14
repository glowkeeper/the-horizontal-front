import type {
  ConfrontationConfig,
  InterruptionConfig,
  ResistanceConfig,
  RhythmGuideEvent,
  ScoredRhythmCue,
} from "../engine/types";
import type { InterruptionCompositionContent } from "./schemas/episodeSchema";
import {
  dramaticCurveSchema,
  mechanicCatalogueSchema,
  interruptionMechanicSchema,
  rhythmPatternSchema,
  sharedDramaticCurveSchema,
  type DramaticCurveContent,
  type EpisodeMechanicDefinitions,
  type InterruptionMechanicContent,
  type RhythmPatternContent,
} from "./schemas/mechanicsSchema";
import type { OwnedContentReference } from "./schemas/ownershipSchema";
import type { ContentModules } from "./loadGame";

export type MechanicLibrary = {
  readonly rhythms: ReadonlyMap<string, RhythmPatternContent>;
  readonly dramaticCurves: ReadonlyMap<string, DramaticCurveContent>;
  readonly interruptions: ReadonlyMap<string, InterruptionMechanicContent>;
};

export type EpisodeMechanicScope = {
  readonly episodeId: string;
  readonly shared: MechanicLibrary;
  readonly rhythms: ReadonlyMap<string, RhythmPatternContent>;
  readonly dramaticCurves: ReadonlyMap<string, DramaticCurveContent>;
  readonly interruptions: ReadonlyMap<string, InterruptionMechanicContent>;
};

export function loadMechanicLibrary(
  catalogueContent: unknown,
  rhythmModules: ContentModules,
  curveModules: ContentModules,
  interruptionModules: ContentModules = {},
): MechanicLibrary {
  const catalogue = mechanicCatalogueSchema.parse(catalogueContent);
  const rhythms = loadEntries(catalogue.rhythms, "rhythms", rhythmModules, rhythmPatternSchema.parse);
  const dramaticCurves = loadEntries(
    catalogue.dramaticCurves,
    "dramatic-curves",
    curveModules,
    sharedDramaticCurveSchema.parse,
  );
  const interruptions = loadEntries(
    catalogue.interruptions,
    "interruptions",
    interruptionModules,
    interruptionMechanicSchema.parse,
  );
  for (const curve of dramaticCurves.values()) {
    for (const phase of curve.phases) {
      if (!rhythms.has(phase.rhythm.id)) {
        throw new Error(`Shared dramatic curve ${curve.id} references unknown shared rhythm ${phase.rhythm.id}`);
      }
    }
  }
  return { rhythms, dramaticCurves, interruptions };
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
  const interruptions = mapEpisodeDefinitions(
    episodeId,
    "interruption",
    definitions?.interruptions ?? [],
    shared.interruptions,
  );
  const scope = { episodeId, shared, rhythms, dramaticCurves, interruptions };
  for (const curve of dramaticCurves.values()) {
    for (const phase of curve.phases) {
      resolveOwnedDefinition("rhythm", phase.rhythm, scope, shared.rhythms, rhythms);
    }
  }
  return scope;
}

export function resolveInterruptionMechanic(
  reference: OwnedContentReference,
  scope: EpisodeMechanicScope,
): InterruptionMechanicContent {
  return resolveOwnedDefinition(
    "interruption",
    reference,
    scope,
    scope.shared.interruptions,
    scope.interruptions,
  );
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
      resistanceGainPerHit: phase.resistanceGainPerHit,
      resistanceLossPerMiss: phase.resistanceLossPerMiss,
      resistanceRecoveryBonus: phase.resistanceRecoveryBonus,
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

export function compileConfrontationConfig(
  dramaticCurveReference: OwnedContentReference,
  compositions: readonly InterruptionCompositionContent[],
  scope: EpisodeMechanicScope,
): ConfrontationConfig {
  const resistance = compileResistanceConfig(dramaticCurveReference, scope);
  const curve = resolveOwnedDefinition(
    "dramatic curve",
    dramaticCurveReference,
    scope,
    scope.shared.dramaticCurves,
    scope.dramaticCurves,
  );
  const interruptions: InterruptionConfig[] = compositions.map((composition) => {
    const phaseIndex = curve.phases.findIndex(({ id }) => id === composition.trigger.phase);
    if (phaseIndex < 0) {
      throw new Error(`${scope.episodeId} interruption ${composition.id} references unknown phase ${composition.trigger.phase}`);
    }
    const phase = curve.phases[phaseIndex];
    const compiledPhase = resistance.phases[phaseIndex];
    const rhythm = resolveOwnedDefinition(
      "rhythm", phase.rhythm, scope, scope.shared.rhythms, scope.rhythms,
    );
    const beatMs = phase.beatIntervalMs;
    const cycleMs = rhythm.cycleBeats * beatMs;
    if (composition.trigger.afterBeats >= rhythm.cycleBeats) {
      throw new Error(`${scope.episodeId} interruption ${composition.id} trigger afterBeats must fall inside its rhythm cycle`);
    }
    const startsAtMs = compiledPhase.startsAtMs
      + phase.leadInBeats * beatMs
      + composition.trigger.afterCycles * cycleMs
      + composition.trigger.afterBeats * beatMs;
    const warningStartsAtMs = startsAtMs - composition.warningBeats * beatMs;
    const endsAtMs = startsAtMs + composition.activeBeats * beatMs;
    const returnsAtMs = endsAtMs
      + composition.returnCountInBeats * beatMs
      - phase.timingWindowMs;
    if (warningStartsAtMs < compiledPhase.startsAtMs || returnsAtMs > compiledPhase.endsAtMs) {
      throw new Error(`${scope.episodeId} interruption ${composition.id} must fit inside phase ${phase.id}`);
    }
    const mechanic = resolveInterruptionMechanic(composition.mechanic, scope);
    if (mechanic.kind !== composition.kind) {
      throw new Error(`${scope.episodeId} interruption ${composition.id} composition kind must match ${mechanic.id}`);
    }
    let interaction: InterruptionConfig["interaction"];
    if (composition.kind === "sequence" && mechanic.kind === "sequence") {
      if (composition.choices.length !== mechanic.choiceCount
        || composition.steps.length !== mechanic.stepCount) {
        throw new Error(`${scope.episodeId} interruption ${composition.id} must supply ${mechanic.choiceCount} choices and ${mechanic.stepCount} steps`);
      }
      const choiceIds = new Set(composition.choices.map(({ id }) => id));
      if (choiceIds.size !== composition.choices.length
        || composition.steps.some((step) => !choiceIds.has(step))) {
        throw new Error(`${scope.episodeId} interruption ${composition.id} steps must reference unique local choices`);
      }
      if (new Set(composition.choices.map(({ key }) => key)).size !== composition.choices.length) {
        throw new Error(`${scope.episodeId} interruption ${composition.id} choice keys must be unique`);
      }
      interaction = { kind: "sequence", choices: composition.choices, steps: composition.steps };
    } else if (composition.kind === "hold" && mechanic.kind === "hold") {
      if (mechanic.pressWindowBeats + mechanic.holdBeats > composition.activeBeats) {
        throw new Error(`${scope.episodeId} interruption ${composition.id} activeBeats cannot contain its press and hold windows`);
      }
      interaction = {
        kind: "hold",
        pressDeadlineMs: startsAtMs + mechanic.pressWindowBeats * beatMs,
        requiredHoldMs: mechanic.holdBeats * beatMs,
      };
    } else {
      throw new Error(`${scope.episodeId} interruption ${composition.id} has an incompatible mechanic`);
    }
    return {
      id: composition.id, warningStartsAtMs, startsAtMs, endsAtMs, returnsAtMs,
      consequences: composition.consequences,
      presentation: composition.presentation,
      copy: composition.copy, interaction,
    };
  }).sort((left, right) => left.startsAtMs - right.startsAtMs);
  for (let index = 1; index < interruptions.length; index += 1) {
    if (interruptions[index].warningStartsAtMs < interruptions[index - 1].returnsAtMs) {
      throw new Error(`${scope.episodeId} interruption windows must not overlap`);
    }
  }
  for (const attack of interruptions) {
    const collision = resistance.guideEvents.find((event) => {
      const interval = guideEventInterval(event);
      return interval.startsAtMs < attack.startsAtMs
        && interval.endsAtMs > attack.startsAtMs;
    });
    if (collision) {
      throw new Error(
        `${scope.episodeId} interruption ${attack.id} starts during a ${collision.action} event`,
      );
    }
  }
  const overlapsAttack = (startsAtMs: number, endsAtMs: number) =>
    interruptions.some((attack) =>
      endsAtMs > attack.startsAtMs && startsAtMs < attack.returnsAtMs);
  const cues = resistance.cues.filter((cue) => {
    const interval = cueInterval(cue);
    return !overlapsAttack(interval.startsAtMs, interval.endsAtMs);
  });
  const guideEvents = resistance.guideEvents.flatMap((event) => {
    const interval = guideEventInterval(event);
    if (!overlapsAttack(interval.startsAtMs, interval.endsAtMs)) return [event];
    if (event.action === "tap" || event.action === "hold") return [];
    return subtractInterruptionWindows(event, interruptions);
  });
  for (const attack of interruptions) {
    const phaseIndex = resistance.phases.findIndex((phase) =>
      attack.startsAtMs >= phase.startsAtMs && attack.startsAtMs < phase.endsAtMs);
    guideEvents.push({
      action: "interruption", atMs: attack.startsAtMs,
      endsAtMs: attack.endsAtMs, phaseIndex,
    });
    guideEvents.push({
      action: "count-in", atMs: attack.endsAtMs,
      endsAtMs: attack.returnsAtMs, phaseIndex,
    });
  }
  guideEvents.sort((left, right) => left.atMs - right.atMs);
  return { resistance: { ...resistance, cues, guideEvents }, interruptions };
}

function cueInterval(cue: ScoredRhythmCue): {
  readonly startsAtMs: number;
  readonly endsAtMs: number;
} {
  return {
    startsAtMs: cue.atMs - cue.timingWindowMs,
    endsAtMs: (cue.releaseAtMs ?? cue.atMs) + cue.timingWindowMs,
  };
}

function guideEventInterval(event: RhythmGuideEvent): {
  readonly startsAtMs: number;
  readonly endsAtMs: number;
} {
  return {
    startsAtMs: event.action === "tap" || event.action === "hold"
      ? event.atMs - event.timingWindowMs
      : event.atMs,
    endsAtMs: event.endsAtMs,
  };
}

function subtractInterruptionWindows(
  event: Extract<RhythmGuideEvent, { readonly action: "rest" | "count-in" | "interruption" }>,
  interruptions: readonly InterruptionConfig[],
): RhythmGuideEvent[] {
  let segments = [{ startsAtMs: event.atMs, endsAtMs: event.endsAtMs }];
  for (const attack of interruptions) {
    segments = segments.flatMap((segment) => {
      if (segment.endsAtMs <= attack.startsAtMs
        || segment.startsAtMs >= attack.returnsAtMs) return [segment];
      return [
        segment.startsAtMs < attack.startsAtMs
          ? { startsAtMs: segment.startsAtMs, endsAtMs: attack.startsAtMs }
          : null,
        segment.endsAtMs > attack.returnsAtMs
          ? { startsAtMs: attack.returnsAtMs, endsAtMs: segment.endsAtMs }
          : null,
      ].filter((candidate): candidate is { startsAtMs: number; endsAtMs: number } =>
        candidate !== null && candidate.endsAtMs > candidate.startsAtMs);
    });
  }
  return segments.map((segment) => ({
    ...event,
    atMs: segment.startsAtMs,
    endsAtMs: segment.endsAtMs,
  }));
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
  if (phaseIndex === 0 && firstCycleMs > phaseStartMs) {
    guideTarget.push({
      action: "count-in",
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
          timingWindowMs: phase.timingWindowMs,
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
        timingWindowMs: phase.timingWindowMs,
        releaseAtMs,
        endsAtMs: Math.min(releaseAtMs + phase.timingWindowMs, phaseEndMs),
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
