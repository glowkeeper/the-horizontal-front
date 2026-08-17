import type { ConfrontationConfig, ResistanceConfig } from "../engine/types";
import {
  compileSoundscape,
  createEpisodeAudioScope,
  type AudioLibrary,
  type CompiledSoundscape,
} from "./loadAudio";
import {
  compileConfrontationConfig,
  createEpisodeMechanicScope,
  type MechanicLibrary,
} from "./loadMechanics";
import { episodeSchema, type EpisodeContent } from "./schemas/episodeSchema";
import { parseContent } from "./parseContent";

export interface Episode extends Omit<EpisodeContent, "confrontation" | "audio"> {
  readonly confrontation: Omit<EpisodeContent["confrontation"], "resistance" | "interruptions"> & {
    readonly resistance: ResistanceConfig;
    readonly interruptions: ConfrontationConfig["interruptions"];
    readonly dramaticCurve: EpisodeContent["confrontation"]["resistance"]["dramaticCurve"];
  };
  readonly audio: CompiledSoundscape;
}

export function loadEpisode(
  content: unknown,
  mechanics: MechanicLibrary,
  audio: AudioLibrary,
): Episode {
  const episode = parseContent("Episode content", episodeSchema, content);
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
  const audioScope = createEpisodeAudioScope(episode.id, episode.audio.cues, audio);
  return {
    ...episode,
    confrontation: {
      ...episode.confrontation,
      dramaticCurve,
      resistance: confrontation.resistance,
      interruptions: confrontation.interruptions,
    },
    audio: compileSoundscape(
      episode.audio.soundscape,
      episode.audio.soundscapes,
      audioScope,
    ),
  };
}
