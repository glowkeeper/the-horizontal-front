import type { CompiledSoundscape } from "../content/loadAudio";
import type { AudioCueRole } from "../content/schemas/audioSchema";
import { composeCue, type ScheduledVoice } from "./composeCue";
import {
  createAudioOutput,
  type AmbienceHandle,
  type AudioOutput,
} from "./webAudioOutput";

export type SoundscapePlayer = {
  play(role: AudioCueRole): void;
  schedule(role: AudioCueRole, inMs: number): void;
  /**
   * Move the bed towards the current dramatic intensity, starting it if it is
   * not yet sounding. Called every frame, so unmuting mid-episode brings the
   * bed in on the next one.
   */
  setIntensity(intensity: number): void;
  unlock(): Promise<void>;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  suspend(): void;
  resume(): void;
  /**
   * Stop the bed while leaving scheduled cues alone, so an outcome sting still
   * sounds over a room that has gone quiet.
   */
  stopAmbience(): void;
  /** Leave no cue sounding after a scene ends; the device itself survives. */
  stop(): void;
};

const MUTE_PREFERENCE_KEY = "the-horizontal-front:audio-muted";

let sharedOutput: AudioOutput | null = null;

/**
 * One audio device for the whole game.
 *
 * Browsers permit a limited number of audio contexts, and a device created per
 * scene would lose its unlocked state on every transition — the player would
 * have to gesture again to hear anything after a scene change.
 */
export function getSharedAudioOutput(): AudioOutput {
  if (!sharedOutput) {
    sharedOutput = createAudioOutput();
    sharedOutput.setMuted(readMutePreference());
  }
  return sharedOutput;
}

/**
 * Mute is a player preference rather than a scene's business, so it is set
 * through the shared device and remembered across reloads.
 */
export function setGlobalMuted(muted: boolean): void {
  getSharedAudioOutput().setMuted(muted);
  writeMutePreference(muted);
}

export function isGlobalMuted(): boolean {
  return getSharedAudioOutput().isMuted();
}

export function createSoundscapePlayer(
  soundscape: CompiledSoundscape,
  output: AudioOutput = getSharedAudioOutput(),
): SoundscapePlayer {
  // Composed once: a cue's voices never change, and rebuilding them per hit
  // would allocate during the most timing-sensitive moment in the game.
  const voices = new Map<AudioCueRole, readonly ScheduledVoice[]>();
  for (const [role, cue] of soundscape.cues) {
    voices.set(role, composeCue(cue, soundscape.gain));
  }

  const emit = (role: AudioCueRole, inMs: number): void => {
    const cue = voices.get(role);
    if (cue) output.play(cue, inMs);
  };

  let ambience: AmbienceHandle | null = null;

  return {
    play: (role) => emit(role, 0),
    schedule: (role, inMs) => emit(role, inMs),
    setIntensity(intensity): void {
      // A muted game builds no synth graph at all, so the bed waits rather
      // than running silently behind a zero gain.
      if (!ambience && !output.isMuted()) {
        ambience = output.startAmbience(soundscape.ambience, soundscape.gain);
      }
      ambience?.setIntensity(intensity);
    },
    unlock: () => output.unlock(),
    setMuted(muted): void {
      output.setMuted(muted);
      writeMutePreference(muted);
    },
    isMuted: () => output.isMuted(),
    suspend: () => output.suspend(),
    resume: () => output.resume(),
    stopAmbience(): void {
      ambience?.stop();
      ambience = null;
    },
    stop(): void {
      ambience?.stop();
      ambience = null;
      output.stopAll();
    },
  };
}

function readMutePreference(): boolean {
  try {
    return globalThis.localStorage?.getItem(MUTE_PREFERENCE_KEY) === "true";
  } catch {
    // Storage can be unavailable or blocked; audible is the sane default.
    return false;
  }
}

function writeMutePreference(muted: boolean): void {
  try {
    globalThis.localStorage?.setItem(MUTE_PREFERENCE_KEY, String(muted));
  } catch {
    // A preference we cannot persist is not a reason to fail playback.
  }
}
