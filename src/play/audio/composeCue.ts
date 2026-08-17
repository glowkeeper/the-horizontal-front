import type { AudioCueContent, AudioLayerContent } from "../content/schemas/audioSchema";

/**
 * A layer resolved into something an output device can play: absolute timing
 * within the cue and a final gain. This stays free of Web Audio so the
 * composition rules can be tested without an audio device.
 */
export type ScheduledVoice = {
  readonly startAtMs: number;
  readonly attackMs: number;
  readonly holdMs: number;
  readonly releaseMs: number;
  readonly gain: number;
  readonly source: AudioLayerContent;
};

export function composeCue(
  cue: AudioCueContent,
  masterGain: number,
): readonly ScheduledVoice[] {
  const master = clamp01(masterGain);
  return cue.layers
    .map((layer) => ({
      startAtMs: layer.delayMs,
      attackMs: layer.attackMs,
      holdMs: layer.holdMs,
      releaseMs: layer.releaseMs,
      gain: layer.gain * master,
      source: layer,
    }))
    // Silent layers still cost an oscillator and a filter node each, and a cue
    // may reasonably mute one layer while keeping the rest.
    .filter((voice) => voice.gain > 0 && voice.attackMs + voice.holdMs + voice.releaseMs > 0);
}

export function getCueDurationMs(cue: AudioCueContent): number {
  return cue.layers.reduce(
    (longest, layer) => Math.max(
      longest,
      layer.delayMs + layer.attackMs + layer.holdMs + layer.releaseMs,
    ),
    0,
  );
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
