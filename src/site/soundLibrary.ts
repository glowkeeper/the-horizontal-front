import { composeCue } from "../play/audio/composeCue";
import { collectDueCues, createCueScheduler } from "../play/audio/cueScheduler";
import { createAudioOutput, type AmbienceHandle } from "../play/audio/webAudioOutput";
import { game } from "../play/content/game";
import { getDramaticIntensity } from "../play/engine/resistance";
import type { AudioCueRole } from "../play/content/schemas/audioSchema";

/**
 * The public sound library.
 *
 * It plays through the game's own audio modules rather than a copy of them, so
 * what a prospective author hears here is exactly what their episode would
 * make. Nothing is downloaded: every sound is built from the numbers in
 * `src/play/content/audio/cues/` at the moment you press the button.
 */
const campaign = game.campaigns[0];
const episode = game.entryEpisode;
const soundscape = episode.audio;
const resistance = episode.confrontation.resistance;
const output = createAudioOutput();

const voicesFor = (role: AudioCueRole) => {
  const cue = soundscape.cues.get(role);
  return cue ? composeCue(cue, soundscape.gain) : [];
};

function makeButton(name: string, detail: string, onSelect: () => void): HTMLButtonElement {
  const element = document.createElement("button");
  element.type = "button";
  element.className = "sound-button";
  const title = document.createElement("span");
  title.className = "sound-name";
  title.textContent = name;
  const role = document.createElement("span");
  role.className = "sound-role";
  role.textContent = detail;
  element.append(title, role);
  element.addEventListener("click", () => {
    void output.unlock().then(onSelect);
  });
  return element;
}

const cueList = document.querySelector("#cue-list");
if (cueList) {
  for (const [role, cue] of soundscape.cues) {
    cueList.append(makeButton(cue.id, role, () => output.play(voicesFor(role), 0)));
  }
}

let bed: AmbienceHandle | null = null;
const slider = document.querySelector<HTMLInputElement>("#intensity");
const readout = document.querySelector<HTMLElement>("#intensity-readout");

const showIntensity = (value: number): void => {
  if (readout) readout.textContent = value.toFixed(2);
};

document.querySelector("#ambience-toggle")?.addEventListener("click", (event) => {
  const control = event.currentTarget as HTMLButtonElement;
  void output.unlock().then(() => {
    if (bed) {
      bed.stop();
      bed = null;
      control.setAttribute("aria-pressed", "false");
      return;
    }
    bed = output.startAmbience(soundscape.ambience, soundscape.gain);
    bed.setIntensity(Number(slider?.value ?? 0));
    control.setAttribute("aria-pressed", "true");
  });
});

slider?.addEventListener("input", () => {
  const value = Number(slider.value);
  showIntensity(value);
  bed?.setIntensity(value);
});

const cueTimes = resistance.cues.map(({ atMs }) => atMs);
const cueSides = resistance.cues.map(({ side }) => side);
const countInTimes = resistance.guideEvents
  .filter((event) => event.action === "count-in")
  .map(({ atMs }) => atMs);
const accented = new Set(cueTimes);
const pulseTimes = resistance.beatTimesMs.filter((atMs) => !accented.has(atMs));

let running: number | null = null;

function stopScore(): void {
  if (running !== null) {
    globalThis.clearInterval(running);
    running = null;
  }
  bed?.stop();
  bed = null;
  document.querySelector("#ambience-toggle")?.setAttribute("aria-pressed", "false");
  output.stopAll();
}

document.querySelector("#play-score")?.addEventListener("click", () => {
  void output.unlock().then(() => {
    if (running !== null) {
      stopScore();
      return;
    }
    let count = createCueScheduler();
    let pulse = createCueScheduler();
    let beats = createCueScheduler();
    if (!bed) {
      bed = output.startAmbience(soundscape.ambience, soundscape.gain);
      document.querySelector("#ambience-toggle")?.setAttribute("aria-pressed", "true");
    }
    const startedAt = performance.now();
    running = globalThis.setInterval(() => {
      const elapsed = performance.now() - startedAt;

      const ticks = collectDueCues(count, countInTimes, elapsed, 100);
      count = ticks.next;
      for (const tick of ticks.due) output.play(voicesFor("count-in"), tick.inMs);

      const underneath = collectDueCues(pulse, pulseTimes, elapsed, 100);
      pulse = underneath.next;
      for (const tick of underneath.due) output.play(voicesFor("beat"), tick.inMs);

      const demands = collectDueCues(beats, cueTimes, elapsed, 100);
      beats = demands.next;
      for (const demand of demands.due) {
        output.play(
          voicesFor(cueSides[demand.index] === "left" ? "cue-due-left" : "cue-due-right"),
          demand.inMs,
        );
      }

      const intensity = getDramaticIntensity(resistance, elapsed);
      bed?.setIntensity(intensity);
      if (slider) slider.value = String(intensity);
      showIntensity(intensity);

      if (elapsed > resistance.durationMs) stopScore();
    }, 16);
  });
});

document.querySelector("#stop-all")?.addEventListener("click", stopScore);

// The library is not abstract: it is the palette one real episode is scored
// with, and naming which keeps the page honest about what is being auditioned.
const grounding = document.querySelector("#grounding");
if (grounding) {
  grounding.textContent = `Grounded in ${episode.title}, the opening episode of `
    + `${campaign.title} — the soundscape below is the one that episode plays.`;
}

const scoreEpisode = document.querySelector("#score-episode");
if (scoreEpisode) scoreEpisode.textContent = episode.title;

const summary = document.querySelector("#library-summary");
if (summary) {
  summary.textContent = `${soundscape.cues.size} cues and one ambience bed, `
    + `scored across ${(resistance.durationMs / 1000).toFixed(0)} seconds as `
    + `${cueTimes.length} sided demands over ${pulseTimes.length} unaccented beats.`;
}
