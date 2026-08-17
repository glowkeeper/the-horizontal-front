import { describe, expect, it } from "vitest";

import audioCatalogueContent from "../../../src/play/content/audio/catalog.json";
import episodeContent from "../../../src/play/content/episodes/the-alarm.json";
import { audio, game, mechanics } from "../../../src/play/content/game";
import { loadEpisode } from "../../../src/play/content/loadEpisode";
import {
  compileSoundscape,
  createEpisodeAudioScope,
  loadAudioLibrary,
} from "../../../src/play/content/loadAudio";
import {
  audioCueRoles,
  audioCueSchema,
  audioSoundscapeSchema,
} from "../../../src/play/content/schemas/audioSchema";
import { composeCue, getCueDurationMs } from "../../../src/play/audio/composeCue";
import {
  collectDueCues,
  createCueScheduler,
} from "../../../src/play/audio/cueScheduler";

const cueModules = import.meta.glob("../../../src/play/content/audio/cues/*.json", {
  eager: true,
  import: "default",
});
const soundscapeModules = import.meta.glob(
  "../../../src/play/content/audio/soundscapes/*.json",
  { eager: true, import: "default" },
);

// The loader addresses modules by their content-relative key.
const rekey = (modules: Record<string, unknown>, directory: string) =>
  Object.fromEntries(Object.entries(modules).map(([key, value]) => [
    `./audio/${directory}/${key.split("/").pop()}`,
    value,
  ]));

const cues = rekey(cueModules, "cues");
const soundscapes = rekey(soundscapeModules, "soundscapes");

const toneLayer = {
  kind: "tone" as const,
  wave: "sine" as const,
  startFrequencyHz: 440,
  endFrequencyHz: 220,
  delayMs: 0,
  attackMs: 2,
  holdMs: 10,
  releaseMs: 40,
  gain: 0.5,
  pan: 0,
  space: 0,
};

describe("audio grammar", () => {
  it("bounds every synthesis parameter so authoring errors are caught", () => {
    expect(() => audioCueSchema.parse({
      schemaVersion: 1,
      id: "out-of-range",
      layers: [{ ...toneLayer, startFrequencyHz: 40_000 }],
    })).toThrow();
    expect(() => audioCueSchema.parse({
      schemaVersion: 1,
      id: "over-gain",
      layers: [{ ...toneLayer, gain: 4 }],
    })).toThrow();
    expect(() => audioCueSchema.parse({
      schemaVersion: 1,
      id: "unknown-field",
      layers: [{ ...toneLayer, wobble: 3 }],
    })).toThrow();
    expect(() => audioCueSchema.parse({
      schemaVersion: 1,
      id: "off-the-stage",
      layers: [{ ...toneLayer, pan: 2 }],
    })).toThrow();
    expect(() => audioCueSchema.parse({
      schemaVersion: 1,
      id: "no-layers",
      layers: [],
    })).toThrow();
  });

  it("rejects a cue that could never be heard", () => {
    expect(() => audioCueSchema.parse({
      schemaVersion: 1,
      id: "silent",
      layers: [{ ...toneLayer, gain: 0 }],
    })).toThrow(/never be heard/);
    expect(() => audioCueSchema.parse({
      schemaVersion: 1,
      id: "instant",
      layers: [{ ...toneLayer, attackMs: 0, holdMs: 0, releaseMs: 0 }],
    })).toThrow(/never be heard/);
  });

  it("requires a soundscape to cover every semantic role", () => {
    const complete = audioSoundscapeSchema.parse(
      soundscapes["./audio/soundscapes/office-apparatus.json"],
    );
    expect(Object.keys(complete.cues).sort()).toEqual([...audioCueRoles].sort());

    const { "tap-hit": _omitted, ...incomplete } = complete.cues;
    expect(() => audioSoundscapeSchema.parse({
      ...complete,
      cues: incomplete,
    })).toThrow();
  });

  it("loads the real catalogue and resolves every shared reference", () => {
    const library = loadAudioLibrary(audioCatalogueContent, cues, soundscapes);
    expect(library.cues.size).toBeGreaterThan(0);
    expect(library.soundscapes.has("office-apparatus")).toBe(true);
  });

  it("rejects a catalogued cue whose file is missing, and a file left uncatalogued", () => {
    expect(() => loadAudioLibrary(
      { schemaVersion: 1, cues: [{ id: "ghost", file: "ghost.json" }], soundscapes: [] },
      {},
      {},
    )).toThrow(/catalogued but missing/);
    expect(() => loadAudioLibrary(
      { schemaVersion: 1, cues: [], soundscapes: [] },
      cues,
      {},
    )).toThrow(/not catalogued/);
  });

  it("forbids a shared soundscape from reaching episode-owned cues", () => {
    const shared = audioSoundscapeSchema.parse(
      soundscapes["./audio/soundscapes/office-apparatus.json"],
    );
    expect(() => loadAudioLibrary(
      audioCatalogueContent,
      cues,
      {
        "./audio/soundscapes/office-apparatus.json": {
          ...shared,
          cues: { ...shared.cues, "tap-hit": { source: "episode", id: "private-clack" } },
        },
      },
    )).toThrow(/shared content may reference shared content only/);
  });

  it("keeps episode cues private and refuses to shadow a shared identifier", () => {
    const privateCue = { schemaVersion: 1 as const, id: "private-clack", layers: [toneLayer] };
    const scope = createEpisodeAudioScope("the-alarm", [privateCue], audio);
    expect(scope.cues.has("private-clack")).toBe(true);

    expect(() => createEpisodeAudioScope("the-alarm", [privateCue, privateCue], audio))
      .toThrow(/duplicate episode audio cue/);
    expect(() => createEpisodeAudioScope(
      "the-alarm",
      [{ ...privateCue, id: "stamp-left" }],
      audio,
    )).toThrow(/shadows a shared definition/);
  });

  it("reports an unknown soundscape against the episode that selected it", () => {
    const scope = createEpisodeAudioScope("the-alarm", [], audio);
    expect(() => compileSoundscape({ source: "shared", id: "nonexistent" }, [], scope))
      .toThrow(/the-alarm references unknown shared soundscape nonexistent/);
  });

  it("compiles the real episode soundscape with every role resolved to a cue", () => {
    const episode = loadEpisode(episodeContent, mechanics, audio);
    expect(episode.audio.id).toBe("office-apparatus");
    for (const role of audioCueRoles) {
      expect(episode.audio.cues.get(role)?.layers.length).toBeGreaterThan(0);
    }
    for (const listed of game.episodes) {
      expect(listed.audio.cues.size).toBe(audioCueRoles.length);
    }
  });
});

describe("the score's shape", () => {
  const episode = game.entryEpisode;
  const { beatTimesMs, cues: scoredCues, durationMs } = episode.confrontation.resistance;

  it("keeps a beat for every beat, not only the ones that ask for something", () => {
    // The defect this fixes: scored cues are sparse, so a score built only from
    // them falls silent through rests and the player loses the pulse.
    expect(beatTimesMs.length).toBeGreaterThan(scoredCues.length * 2);
    expect(beatTimesMs).toEqual([...beatTimesMs].sort((a, b) => a - b));
    expect(beatTimesMs[0]).toBe(0);
    expect(beatTimesMs.at(-1)).toBeLessThan(durationMs);
  });

  it("lands every scored cue on a beat, so demands accent the pulse", () => {
    const grid = new Set(beatTimesMs);
    const offGrid = scoredCues.filter(({ atMs }) => !grid.has(atMs));
    expect(offGrid).toEqual([]);
  });

  it("gives the two sides audibly different demands", () => {
    const left = episode.audio.cues.get("cue-due-left");
    const right = episode.audio.cues.get("cue-due-right");
    expect(left?.id).not.toBe(right?.id);

    const pitch = (cue: typeof left) => cue?.layers
      .filter((layer) => layer.kind === "tone")
      .map((layer) => (layer as { startFrequencyHz: number }).startFrequencyHz) ?? [];
    // Pitch, not just stereo position: a player on a mono speaker, or with
    // hearing in one ear, must still be able to tell the sides apart.
    expect(Math.max(...pitch(right))).toBeGreaterThan(Math.max(...pitch(left)));

    const pan = (cue: typeof left) => cue?.layers.map((layer) => layer.pan) ?? [];
    expect(pan(left).every((value) => value < 0)).toBe(true);
    expect(pan(right).every((value) => value > 0)).toBe(true);
  });

  it("escalates the ambience with dramatic intensity", () => {
    const { ambience } = episode.audio;
    expect(ambience.strainGain).toBeGreaterThan(ambience.restGain);
    for (const layer of ambience.layers) {
      const [rest, strain] = layer.kind === "tone"
        ? [layer.restFrequencyHz, layer.strainFrequencyHz]
        : [layer.restCutoffHz, layer.strainCutoffHz];
      // Every layer must move, or it is a drone pretending to be tension.
      expect(strain).toBeGreaterThan(rest);
    }
  });
});

describe("cue composition", () => {
  it("applies the soundscape master gain and keeps layer timing", () => {
    const cue = { schemaVersion: 1 as const, id: "two-layer", layers: [
      toneLayer,
      { ...toneLayer, delayMs: 25, gain: 0.4 },
    ] };
    const voices = composeCue(cue, 0.5);
    expect(voices.map(({ gain }) => gain)).toEqual([0.25, 0.2]);
    expect(voices.map(({ startAtMs }) => startAtMs)).toEqual([0, 25]);
    expect(getCueDurationMs(cue)).toBe(25 + 2 + 10 + 40);
  });

  it("drops layers that cannot be heard rather than building silent nodes", () => {
    const voices = composeCue({
      schemaVersion: 1,
      id: "part-silent",
      layers: [toneLayer, { ...toneLayer, gain: 0 }],
    }, 1);
    expect(voices).toHaveLength(1);
  });

  it("treats a master gain outside the unit interval as clamped", () => {
    expect(composeCue({ schemaVersion: 1, id: "clamped", layers: [toneLayer] }, 9)[0].gain)
      .toBe(toneLayer.gain);
  });
});

describe("cue scheduling", () => {
  const times = [1000, 1500, 2000, 2500];

  it("hands over only cues inside the lookahead window, once each", () => {
    let state = createCueScheduler();
    const first = collectDueCues(state, times, 900, 150);
    expect(first.due).toEqual([{ index: 0, inMs: 100 }]);
    state = first.next;

    const again = collectDueCues(state, times, 950, 150);
    expect(again.due).toEqual([]);
    state = again.next;

    const second = collectDueCues(state, times, 1400, 150);
    expect(second.due).toEqual([{ index: 1, inMs: 100 }]);
  });

  it("plays a cue immediately rather than dropping it after a stalled frame", () => {
    // A long frame leaves two cues already past due; both still sound, late,
    // rather than leaving a hole in the rhythm. The cue at 2000 sits beyond the
    // 1816ms horizon and waits its turn.
    const { due } = collectDueCues(createCueScheduler(), times, 1800, 16);
    expect(due).toEqual([
      { index: 0, inMs: 0 },
      { index: 1, inMs: 0 },
    ]);
  });

  it("starts the score again when the clock rewinds on a restart", () => {
    const played = collectDueCues(createCueScheduler(), times, 2600, 16);
    expect(played.due).toHaveLength(4);
    const restarted = collectDueCues(played.next, times, 0, 1100);
    expect(restarted.due.map(({ index }) => index)).toEqual([0]);
  });

  it("never schedules a cue in the past", () => {
    const { due } = collectDueCues(createCueScheduler(), times, 5000, 100);
    expect(due.every(({ inMs }) => inMs >= 0)).toBe(true);
  });
});
