import {
  audioCatalogueSchema,
  audioCueRoles,
  audioCueSchema,
  audioSoundscapeSchema,
  type AudioCueContent,
  type AudioAmbienceContent,
  type AudioCueRole,
  type AudioSoundscapeContent,
} from "./schemas/audioSchema";
import type { OwnedContentReference } from "./schemas/ownershipSchema";
import type { ContentModules } from "./loadGame";

export type AudioLibrary = {
  readonly cues: ReadonlyMap<string, AudioCueContent>;
  readonly soundscapes: ReadonlyMap<string, AudioSoundscapeContent>;
};

export type EpisodeAudioScope = {
  readonly episodeId: string;
  readonly shared: AudioLibrary;
  readonly cues: ReadonlyMap<string, AudioCueContent>;
};

/** A soundscape with every role resolved to the cue that will actually sound. */
export type CompiledSoundscape = {
  readonly id: string;
  readonly gain: number;
  readonly ambience: AudioAmbienceContent;
  readonly managementPresence: AudioAmbienceContent;
  readonly resistanceStrain: AudioAmbienceContent;
  readonly resistanceCreak: {
    readonly cue: AudioCueContent;
    readonly minimumDanger: number;
    readonly restIntervalMs: number;
    readonly strainIntervalMs: number;
    readonly restGain: number;
    readonly strainGain: number;
    readonly intervalPattern: readonly number[];
  };
  readonly cues: ReadonlyMap<AudioCueRole, AudioCueContent>;
};

export function loadAudioLibrary(
  catalogueContent: unknown,
  cueModules: ContentModules,
  soundscapeModules: ContentModules,
): AudioLibrary {
  const catalogue = audioCatalogueSchema.parse(catalogueContent);
  const cues = loadAudioEntries(catalogue.cues, "cues", cueModules, audioCueSchema.parse);
  const soundscapes = loadAudioEntries(
    catalogue.soundscapes,
    "soundscapes",
    soundscapeModules,
    audioSoundscapeSchema.parse,
  );
  // A shared soundscape may only reach shared cues, so it stays reusable by
  // every episode rather than silently depending on one episode's private set.
  for (const soundscape of soundscapes.values()) {
    for (const role of audioCueRoles) {
      const reference = soundscape.cues[role];
      if (reference.source === "episode") {
        throw new Error(
          `Shared soundscape ${soundscape.id} role ${role} references an episode cue ${reference.id}; shared content may reference shared content only`,
        );
      }
      if (!cues.has(reference.id)) {
        throw new Error(
          `Shared soundscape ${soundscape.id} role ${role} references unknown shared audio cue ${reference.id}`,
        );
      }
    }
  }
  return { cues, soundscapes };
}

export function createEpisodeAudioScope(
  episodeId: string,
  definitions: readonly AudioCueContent[] | undefined,
  shared: AudioLibrary,
): EpisodeAudioScope {
  const cues = new Map<string, AudioCueContent>();
  for (const cue of definitions ?? []) {
    if (cues.has(cue.id)) {
      throw new Error(`${episodeId} has duplicate episode audio cue ${cue.id}`);
    }
    if (shared.cues.has(cue.id)) {
      throw new Error(`${episodeId} episode audio cue ${cue.id} shadows a shared definition`);
    }
    cues.set(cue.id, cue);
  }
  return { episodeId, shared, cues };
}

export function compileSoundscape(
  reference: OwnedContentReference,
  episodeSoundscapes: readonly AudioSoundscapeContent[] | undefined,
  scope: EpisodeAudioScope,
): CompiledSoundscape {
  const soundscape = reference.source === "shared"
    ? scope.shared.soundscapes.get(reference.id)
    : (episodeSoundscapes ?? []).find(({ id }) => id === reference.id);
  if (!soundscape) {
    throw new Error(
      `${scope.episodeId} references unknown ${reference.source} soundscape ${reference.id}`,
    );
  }
  const cues = new Map<AudioCueRole, AudioCueContent>();
  for (const role of audioCueRoles) {
    cues.set(role, resolveAudioCue(soundscape, role, scope));
  }
  return {
    id: soundscape.id,
    gain: soundscape.gain,
    ambience: soundscape.ambience,
    managementPresence: soundscape.managementPresence,
    resistanceStrain: soundscape.resistanceStrain,
    resistanceCreak: {
      ...soundscape.resistanceCreak,
      cue: resolveNamedCue(soundscape, soundscape.resistanceCreak.cue, scope),
    },
    cues,
  };
}

function resolveNamedCue(
  soundscape: AudioSoundscapeContent,
  reference: AudioSoundscapeContent["resistanceCreak"]["cue"],
  scope: EpisodeAudioScope,
): AudioCueContent {
  const cue = reference.source === "shared"
    ? scope.shared.cues.get(reference.id)
    : scope.cues.get(reference.id);
  if (!cue) {
    throw new Error(
      `${scope.episodeId} soundscape ${soundscape.id} references unknown ${reference.source} audio cue ${reference.id}`,
    );
  }
  return cue;
}

function resolveAudioCue(
  soundscape: AudioSoundscapeContent,
  role: AudioCueRole,
  scope: EpisodeAudioScope,
): AudioCueContent {
  const reference = soundscape.cues[role];
  const cue = reference.source === "shared"
    ? scope.shared.cues.get(reference.id)
    : scope.cues.get(reference.id);
  if (!cue) {
    throw new Error(
      `${scope.episodeId} soundscape ${soundscape.id} role ${role} references unknown ${reference.source} audio cue ${reference.id}`,
    );
  }
  return cue;
}

function loadAudioEntries<T extends { readonly id: string }>(
  entries: readonly { readonly id: string; readonly file: string }[],
  directory: string,
  modules: ContentModules,
  parse: (content: unknown) => T,
): ReadonlyMap<string, T> {
  const loaded = new Map<string, T>();
  for (const entry of entries) {
    if (entry.file !== `${entry.id}.json`) {
      throw new Error(`Audio ${directory} entry ${entry.id} must live in ${entry.id}.json`);
    }
    const content = modules[`./audio/${directory}/${entry.file}`];
    if (content === undefined) {
      throw new Error(`Audio ${directory} file ${entry.file} is catalogued but missing`);
    }
    const parsed = parse(content);
    if (parsed.id !== entry.id) {
      throw new Error(`Audio ${directory} file ${entry.file} declares id ${parsed.id}`);
    }
    if (loaded.has(entry.id)) {
      throw new Error(`Audio ${directory} catalogue lists ${entry.id} more than once`);
    }
    loaded.set(entry.id, parsed);
  }
  for (const key of Object.keys(modules)) {
    if (!key.startsWith(`./audio/${directory}/`)) continue;
    const file = key.slice(`./audio/${directory}/`.length);
    if (!entries.some((entry) => entry.file === file)) {
      throw new Error(`Audio ${directory} file ${file} exists but is not catalogued`);
    }
  }
  return loaded;
}
