import { composeCue } from "../play/audio/composeCue";
import { collectDueCreaks, createCreakState } from "../play/audio/creakScheduler";
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

/**
 * Every transport control is the same kind of thing: a toggle that says what it
 * will do next and reports its state to assistive technology. Only the score
 * looks different, because it is the page's headline action — but it behaves
 * identically, so nothing here starts one way and stops another.
 */
function setToggle(control: Element | null, playing: boolean): void {
  if (!(control instanceof HTMLButtonElement)) return;
  control.setAttribute("aria-pressed", String(playing));
  const label = playing ? control.dataset.stop : control.dataset.start;
  if (label) control.textContent = label;
}

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
      setToggle(control, false);
      return;
    }
    bed = output.startAmbience(soundscape.ambience, soundscape.gain);
    bed.setIntensity(Number(slider?.value ?? 0));
    setToggle(control, true);
  });
});

slider?.addEventListener("input", () => {
  const value = Number(slider.value);
  showIntensity(value);
  bed?.setIntensity(value);
  presence?.setIntensity(value);
});

// Management's bed shares the dramatic-intensity control, because in play both
// clock-driven beds are moved by one signal. Two sliders would imply they can be
// set independently, and would give a screen reader two identically named
// controls.
let presence: AmbienceHandle | null = null;

document.querySelector("#presence-toggle")?.addEventListener("click", (event) => {
  const control = event.currentTarget as HTMLButtonElement;
  void output.unlock().then(() => {
    if (presence) {
      presence.stop();
      presence = null;
      setToggle(control, false);
      return;
    }
    presence = output.startAmbience(soundscape.managementPresence, soundscape.gain);
    presence.setIntensity(Number(slider?.value ?? 0));
    setToggle(control, true);
  });
});

// The creaking is a train of separate cues rather than a bed, so auditioning it
// means running the same scheduler the confrontation runs and feeding it a
// danger the listener controls.
let creaking: number | null = null;
let groan: AmbienceHandle | null = null;
let creakState = createCreakState();
const dangerSlider = document.querySelector<HTMLInputElement>("#danger");
const dangerReadout = document.querySelector<HTMLElement>("#danger-readout");

function stopCreaking(): void {
  if (creaking !== null) {
    globalThis.clearInterval(creaking);
    creaking = null;
  }
  groan?.stop();
  groan = null;
  setToggle(document.querySelector("#creak-toggle"), false);
}

document.querySelector("#creak-toggle")?.addEventListener("click", (event) => {
  const control = event.currentTarget as HTMLButtonElement;
  void output.unlock().then(() => {
    if (creaking !== null) {
      stopCreaking();
      return;
    }
    creakState = createCreakState();
    groan = output.startAmbience(soundscape.resistanceStrain, soundscape.gain);
    groan.setIntensity(Number(dangerSlider?.value ?? 0));
    const startedAt = performance.now();
    setToggle(control, true);
    creaking = globalThis.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      const danger = Number(dangerSlider?.value ?? 0);
      const burst = collectDueCreaks(creakState, danger, elapsed, soundscape.resistanceCreak);
      creakState = burst.next;
      for (const creak of burst.due) {
        output.play(
          composeCue(soundscape.resistanceCreak.cue, soundscape.gain * creak.gainScale),
          creak.inMs,
        );
      }
    }, 16);
  });
});

dangerSlider?.addEventListener("input", () => {
  const value = Number(dangerSlider.value);
  if (dangerReadout) dangerReadout.textContent = value.toFixed(2);
  groan?.setIntensity(value);
});

const cueTimes = resistance.cues.map(({ atMs }) => atMs);
const cueSides = resistance.cues.map(({ side }) => side);
const countInTimes = resistance.guideEvents
  .filter((event) => event.action === "count-in")
  .map(({ atMs }) => atMs);
const accented = new Set(cueTimes);
// The same selection the confrontation makes, so auditioning the score here
// hears what the episode plays rather than an older arrangement of it.
const downbeatTimes = resistance.downbeatTimesMs;
const downbeats = new Set(downbeatTimes);
const pulseTimes = resistance.beatTimesMs
  .filter((atMs) => !accented.has(atMs) && !downbeats.has(atMs));
const approaches = resistance.cues
  .map((cue) => ({ atMs: cue.approachAtMs, side: cue.side }))
  .filter(({ atMs }) => !accented.has(atMs))
  .sort((left, right) => left.atMs - right.atMs);
const approachTimes = approaches.map(({ atMs }) => atMs);
const approachSides = approaches.map(({ side }) => side);

let running: number | null = null;

function stopScore(): void {
  if (running !== null) {
    globalThis.clearInterval(running);
    running = null;
  }
  bed?.stop();
  bed = null;
  presence?.stop();
  presence = null;
  stopCreaking();
  setToggle(document.querySelector("#ambience-toggle"), false);
  setToggle(document.querySelector("#presence-toggle"), false);
  setToggle(document.querySelector("#play-score"), false);
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
    let cycle = createCueScheduler();
    let approaching = createCueScheduler();
    if (!bed) {
      bed = output.startAmbience(soundscape.ambience, soundscape.gain);
      setToggle(document.querySelector("#ambience-toggle"), true);
    }
    if (!presence) {
      presence = output.startAmbience(soundscape.managementPresence, soundscape.gain);
      setToggle(document.querySelector("#presence-toggle"), true);
    }
    setToggle(document.querySelector("#play-score"), true);
    const startedAt = performance.now();
    running = globalThis.setInterval(() => {
      const elapsed = performance.now() - startedAt;

      const ticks = collectDueCues(count, countInTimes, elapsed, 100);
      count = ticks.next;
      for (const tick of ticks.due) output.play(voicesFor("count-in"), tick.inMs);

      const underneath = collectDueCues(pulse, pulseTimes, elapsed, 100);
      pulse = underneath.next;
      for (const tick of underneath.due) output.play(voicesFor("beat"), tick.inMs);

      const bars = collectDueCues(cycle, downbeatTimes, elapsed, 100);
      cycle = bars.next;
      for (const bar of bars.due) output.play(voicesFor("downbeat"), bar.inMs);

      const rising = collectDueCues(approaching, approachTimes, elapsed, 100);
      approaching = rising.next;
      for (const cue of rising.due) {
        output.play(
          voicesFor(approachSides[cue.index] === "left"
            ? "cue-approach-left"
            : "cue-approach-right"),
          cue.inMs,
        );
      }

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
      presence?.setIntensity(intensity);
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
  grounding.textContent = `Everything on this page is ${episode.title}, the `
    + `opening episode of ${campaign.title}. It is one episode's soundscape, not `
    + `the whole game's.`;
}

const scoreEpisode = document.querySelector("#score-episode");
if (scoreEpisode) scoreEpisode.textContent = episode.title;

const scopeDetail = document.querySelector("#scope-detail");
if (scopeDetail) {
  scopeDetail.textContent = `Every cue, both beds and the score below belong to `
    + `one soundscape — the one ${episode.title} selects, in the campaign `
    + `${campaign.title}. Another episode picks its instrumentation from its own `
    + `setting, so a different workplace will sound nothing like this without a `
    + `line of code changing. What is general here is the vocabulary; what you `
    + `are hearing is one episode's use of it.`;
}

const summary = document.querySelector("#library-summary");
if (summary) {
  summary.textContent = `${soundscape.cues.size} cues, two beds and a creak `
    + `train, scored across ${(resistance.durationMs / 1000).toFixed(0)} seconds `
    + `as ${cueTimes.length} sided demands, each announced ahead of itself, over `
    + `${pulseTimes.length} unaccented beats and ${downbeatTimes.length} downbeats.`;
}
