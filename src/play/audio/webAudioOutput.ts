import type { AudioAmbienceContent } from "../content/schemas/audioSchema";
import type { ScheduledVoice } from "./composeCue";

/** A bed that keeps sounding until stopped, tracking dramatic intensity. */
export type AmbienceHandle = {
  setIntensity(intensity: number): void;
  stop(): void;
};

export type AudioOutput = {
  readonly isSupported: boolean;
  /** Browsers refuse to start audio before a gesture; call this from one. */
  unlock(): Promise<void>;
  play(voices: readonly ScheduledVoice[], inMs: number): void;
  startAmbience(ambience: AudioAmbienceContent, masterGain: number): AmbienceHandle;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  suspend(): void;
  resume(): void;
  /** Silence everything already committed to the audio clock. */
  stopAll(): void;
  dispose(): void;
};

const NOISE_BUFFER_SECONDS = 1;
const MUTE_RAMP_SECONDS = 0.01;
const SILENCE_GAIN = 0.0001;

type AudioContextConstructor = new () => AudioContext;

function getAudioContextConstructor(): AudioContextConstructor | null {
  const candidate = (globalThis as { AudioContext?: AudioContextConstructor }).AudioContext
    ?? (globalThis as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;
  return candidate ?? null;
}

/**
 * The only module that touches Web Audio. Everything above it works in plain
 * data, so cue composition, scheduling and mute rules stay testable without an
 * audio device, and an environment with no Web Audio at all degrades to silence
 * rather than failing.
 */
export function createAudioOutput(): AudioOutput {
  const Constructor = getAudioContextConstructor();
  if (!Constructor) return createSilentOutput();

  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let noiseBuffer: AudioBuffer | null = null;
  let muted = false;
  let disposed = false;
  const active = new Set<AudioScheduledSourceNode>();

  function ensureContext(): AudioContext | null {
    if (disposed) return null;
    if (!context) {
      context = new Constructor!();
      master = context.createGain();
      master.gain.setValueAtTime(muted ? 0 : 1, context.currentTime);
      master.connect(context.destination);
      noiseBuffer = createNoiseBuffer(context);
    }
    return context;
  }

  function releaseWhenDone(node: AudioScheduledSourceNode): void {
    active.add(node);
    node.onended = () => {
      active.delete(node);
      node.disconnect();
    };
  }

  return {
    isSupported: true,

    async unlock(): Promise<void> {
      const ready = ensureContext();
      if (ready && ready.state === "suspended") await ready.resume();
    },

    play(voices, inMs): void {
      if (voices.length === 0) return;
      const ready = ensureContext();
      if (!ready || !master || !noiseBuffer) return;
      // A muted game should cost nothing, not run a silent synth graph.
      if (muted) return;
      const startAt = ready.currentTime + Math.max(0, inMs) / 1000;
      for (const voice of voices) {
        const voiceStart = startAt + voice.startAtMs / 1000;
        const envelope = ready.createGain();
        connectThroughPan(ready, envelope, master, voice.source.pan);
        applyEnvelope(envelope.gain, voiceStart, voice, ready);

        if (voice.source.kind === "tone") {
          const oscillator = ready.createOscillator();
          oscillator.type = voice.source.wave;
          rampFrequency(
            oscillator.frequency,
            voiceStart,
            voice,
            voice.source.startFrequencyHz,
            voice.source.endFrequencyHz,
          );
          oscillator.connect(envelope);
          startAndStop(oscillator, voiceStart, voice);
          releaseWhenDone(oscillator);
        } else {
          const noise = ready.createBufferSource();
          noise.buffer = noiseBuffer;
          noise.loop = true;
          const filter = ready.createBiquadFilter();
          filter.type = voice.source.filter;
          filter.Q.setValueAtTime(voice.source.resonance, voiceStart);
          rampFrequency(
            filter.frequency,
            voiceStart,
            voice,
            voice.source.startCutoffHz,
            voice.source.endCutoffHz,
          );
          noise.connect(filter);
          filter.connect(envelope);
          startAndStop(noise, voiceStart, voice);
          releaseWhenDone(noise);
        }
      }
    },

    startAmbience(ambience, masterGain): AmbienceHandle {
      const ready = ensureContext();
      if (!ready || !master || !noiseBuffer) return silentAmbience();
      const bed = ready.createGain();
      bed.gain.setValueAtTime(ambience.restGain * masterGain, ready.currentTime);
      bed.connect(master);

      const sources: AudioScheduledSourceNode[] = [];
      const sweeps: { param: AudioParam; rest: number; strain: number }[] = [];
      for (const layer of ambience.layers) {
        const level = ready.createGain();
        level.gain.setValueAtTime(layer.gain, ready.currentTime);
        connectThroughPan(ready, level, bed, layer.pan);

        if (layer.kind === "tone") {
          const oscillator = ready.createOscillator();
          oscillator.type = layer.wave;
          oscillator.frequency.setValueAtTime(layer.restFrequencyHz, ready.currentTime);
          oscillator.connect(level);
          oscillator.start();
          sources.push(oscillator);
          sweeps.push({
            param: oscillator.frequency,
            rest: layer.restFrequencyHz,
            strain: layer.strainFrequencyHz,
          });
        } else {
          const noise = ready.createBufferSource();
          noise.buffer = noiseBuffer;
          noise.loop = true;
          const filter = ready.createBiquadFilter();
          filter.type = layer.filter;
          filter.Q.setValueAtTime(layer.resonance, ready.currentTime);
          filter.frequency.setValueAtTime(layer.restCutoffHz, ready.currentTime);
          noise.connect(filter);
          filter.connect(level);
          noise.start();
          sources.push(noise);
          sweeps.push({
            param: filter.frequency,
            rest: layer.restCutoffHz,
            strain: layer.strainCutoffHz,
          });
        }
      }

      const response = ambience.responseMs / 1000;
      let stopped = false;
      return {
        setIntensity(intensity): void {
          if (stopped || !context) return;
          const amount = Math.min(1, Math.max(0, intensity));
          const now = context.currentTime;
          // setTargetAtTime glides rather than steps, so a bed that tightens
          // with pressure never clicks as the value changes each frame.
          bed.gain.setTargetAtTime(
            (ambience.restGain + (ambience.strainGain - ambience.restGain) * amount) * masterGain,
            now,
            response,
          );
          for (const sweep of sweeps) {
            sweep.param.setTargetAtTime(
              sweep.rest + (sweep.strain - sweep.rest) * amount,
              now,
              response,
            );
          }
        },
        stop(): void {
          if (stopped) return;
          stopped = true;
          for (const source of sources) {
            try {
              source.stop();
            } catch {
              // Already stopped.
            }
            source.disconnect();
          }
          bed.disconnect();
        },
      };
    },

    setMuted(nextMuted): void {
      muted = nextMuted;
      if (!context || !master) return;
      // Ramp rather than step, because an instant gain change on a sounding
      // voice is an audible click.
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setValueAtTime(master.gain.value, context.currentTime);
      master.gain.linearRampToValueAtTime(
        muted ? 0 : 1,
        context.currentTime + MUTE_RAMP_SECONDS,
      );
      if (muted) stopEverything(active);
    },

    isMuted: () => muted,

    suspend(): void {
      void context?.suspend().catch(() => undefined);
    },

    resume(): void {
      void context?.resume().catch(() => undefined);
    },

    stopAll(): void {
      stopEverything(active);
    },

    dispose(): void {
      disposed = true;
      stopEverything(active);
      void context?.close().catch(() => undefined);
      context = null;
      master = null;
      noiseBuffer = null;
    },
  };
}

/**
 * Places a node in the stereo field, adding a panner only when the layer
 * actually asks to move. A centred layer keeps the shorter graph.
 */
function connectThroughPan(
  context: AudioContext,
  source: AudioNode,
  destination: AudioNode,
  pan: number,
): void {
  if (pan === 0 || typeof context.createStereoPanner !== "function") {
    source.connect(destination);
    return;
  }
  const panner = context.createStereoPanner();
  panner.pan.setValueAtTime(pan, context.currentTime);
  source.connect(panner);
  panner.connect(destination);
}

function silentAmbience(): AmbienceHandle {
  return { setIntensity: () => undefined, stop: () => undefined };
}

function applyEnvelope(
  gain: AudioParam,
  startAt: number,
  voice: ScheduledVoice,
  context: AudioContext,
): void {
  const attackEnd = startAt + voice.attackMs / 1000;
  const holdEnd = attackEnd + voice.holdMs / 1000;
  const releaseEnd = holdEnd + voice.releaseMs / 1000;
  gain.setValueAtTime(SILENCE_GAIN, Math.max(startAt, context.currentTime));
  gain.linearRampToValueAtTime(voice.gain, attackEnd);
  gain.setValueAtTime(voice.gain, holdEnd);
  // Exponential decay reads as a physical impact where a linear fade reads as
  // a synthetic one, and it cannot reach zero, hence the tiny floor.
  gain.exponentialRampToValueAtTime(SILENCE_GAIN, releaseEnd);
}

function rampFrequency(
  frequency: AudioParam,
  startAt: number,
  voice: ScheduledVoice,
  fromHz: number,
  toHz: number,
): void {
  const endAt = startAt + (voice.attackMs + voice.holdMs + voice.releaseMs) / 1000;
  frequency.setValueAtTime(fromHz, startAt);
  if (fromHz !== toHz) frequency.exponentialRampToValueAtTime(Math.max(1, toHz), endAt);
}

function startAndStop(
  node: AudioScheduledSourceNode,
  startAt: number,
  voice: ScheduledVoice,
): void {
  node.start(startAt);
  node.stop(startAt + (voice.attackMs + voice.holdMs + voice.releaseMs) / 1000);
}

function stopEverything(active: Set<AudioScheduledSourceNode>): void {
  for (const node of [...active]) {
    try {
      node.stop();
    } catch {
      // Already stopped, which is exactly the state we wanted.
    }
    active.delete(node);
  }
}

/**
 * One second of reproducible noise, looped by every noise layer.
 *
 * The generator is seeded rather than `Math.random`, so a given build always
 * produces the same sound and a tuning change is the only thing that can alter
 * it — the reproducibility the audio production rules ask for.
 */
function createNoiseBuffer(context: AudioContext): AudioBuffer {
  const length = Math.floor(context.sampleRate * NOISE_BUFFER_SECONDS);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const samples = buffer.getChannelData(0);
  let seed = 0x2f6e2b1;
  for (let index = 0; index < length; index += 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    samples[index] = (seed / 0x100000000) * 2 - 1;
  }
  return buffer;
}

function createSilentOutput(): AudioOutput {
  let muted = false;
  return {
    isSupported: false,
    unlock: async () => undefined,
    play: () => undefined,
    startAmbience: () => silentAmbience(),
    setMuted: (next) => { muted = next; },
    isMuted: () => muted,
    suspend: () => undefined,
    resume: () => undefined,
    stopAll: () => undefined,
    dispose: () => undefined,
  };
}
