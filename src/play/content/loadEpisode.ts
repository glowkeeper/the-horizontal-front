import type { ResistanceConfig } from "../engine/types";
import {
  compileResistanceConfig,
  createEpisodeMechanicScope,
  type MechanicLibrary,
} from "./loadMechanics";
import { episodeSchema, type EpisodeContent } from "./schemas/episodeSchema";

export interface Episode extends Omit<EpisodeContent, "confrontation"> {
  readonly confrontation: Omit<EpisodeContent["confrontation"], "resistance"> & {
    readonly resistance: ResistanceConfig;
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
  return {
    ...episode,
    confrontation: {
      ...episode.confrontation,
      dramaticCurve,
      resistance: compileResistanceConfig(dramaticCurve, scope),
    },
  };
}
