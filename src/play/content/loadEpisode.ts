import type { ConfrontationConfig, ResistanceConfig } from "../engine/types";
import {
  compileConfrontationConfig,
  createEpisodeMechanicScope,
  type MechanicLibrary,
} from "./loadMechanics";
import { episodeSchema, type EpisodeContent } from "./schemas/episodeSchema";

export interface Episode extends Omit<EpisodeContent, "confrontation"> {
  readonly confrontation: Omit<EpisodeContent["confrontation"], "resistance" | "interruptions"> & {
    readonly resistance: ResistanceConfig;
    readonly interruptions: ConfrontationConfig["interruptions"];
    readonly dramaticCurve: EpisodeContent["confrontation"]["resistance"]["dramaticCurve"];
  };
}

export function loadEpisode(content: unknown, mechanics: MechanicLibrary): Episode {
  const episode = episodeSchema.parse(content);
  const dramaticCurve = episode.confrontation.resistance.dramaticCurve;
  const scope = createEpisodeMechanicScope(
    episode.id,
    episode.definitions,
    mechanics,
  );
  const confrontation = compileConfrontationConfig(
    dramaticCurve,
    episode.confrontation.interruptions,
    scope,
  );
  return {
    ...episode,
    confrontation: {
      ...episode.confrontation,
      dramaticCurve,
      resistance: confrontation.resistance,
      interruptions: confrontation.interruptions,
    },
  };
}
