import { describe, expect, it } from "vitest";

import {
  collectDueCreaks,
  createCreakState,
  type CreakConfig,
} from "../../../src/play/audio/creakScheduler";

const config: CreakConfig = {
  minimumDanger: 0.1,
  restIntervalMs: 1_000,
  strainIntervalMs: 200,
  restGain: 0.25,
  strainGain: 1,
  intervalPattern: [1, 0.5, 1.5],
};

function run(danger: number, untilMs: number): number[] {
  let state = createCreakState();
  const times: number[] = [];
  for (let elapsed = 0; elapsed <= untilMs; elapsed += 16) {
    const { due, next } = collectDueCreaks(state, danger, elapsed, config);
    state = next;
    for (const creak of due) times.push(elapsed + creak.inMs);
  }
  return times;
}

describe("creak scheduler", () => {
  it("stays silent while the structure is barely loaded", () => {
    expect(run(0, 5_000)).toEqual([]);
    expect(run(0.09, 5_000)).toEqual([]);
  });

  it("creaks faster as the load rises", () => {
    // Rate follows danger, because acoustic emission from a structure under
    // stress accelerates as it approaches failure rather than ticking over.
    const light = run(0.2, 6_000).length;
    const heavy = run(0.9, 6_000).length;
    expect(light).toBeGreaterThan(0);
    expect(heavy).toBeGreaterThan(light * 2);
  });

  it("spaces the creaks unevenly", () => {
    const times = run(0.8, 6_000);
    const gaps = times.slice(1).map((at, index) => at - times[index]);
    // Stick-slip does not arrive on a beat: an evenly spaced train would read
    // as machinery rather than as timber gripping and releasing.
    expect(new Set(gaps.map((gap) => Math.round(gap / 10))).size)
      .toBeGreaterThan(1);
  });

  it("grows louder with the load it was made under", () => {
    const quiet = collectDueCreaks(createCreakState(), 0.15, 0, config);
    const loud = collectDueCreaks(createCreakState(), 1, 0, config);
    expect(quiet.due[0].gainScale).toBeLessThan(loud.due[0].gainScale);
    expect(loud.due[0].gainScale).toBeCloseTo(config.strainGain);
  });

  it("does not pay off a debt of silence when ground is suddenly lost", () => {
    // Twenty seconds held safely, then danger arrives. The structure starts
    // complaining from that moment; it does not owe creaks for the time it
    // spent unloaded.
    let state = createCreakState();
    for (let elapsed = 0; elapsed <= 20_000; elapsed += 16) {
      state = collectDueCreaks(state, 0, elapsed, config).next;
    }
    const { due } = collectDueCreaks(state, 0.9, 20_016, config);
    expect(due.length).toBe(1);
  });

  it("cannot dump a backlog after a stalled frame", () => {
    // A backgrounded tab returns one enormous delta. Catching up is right, but
    // only within reason: an unbounded loop would fire hundreds of creaks into
    // a single frame.
    let state = createCreakState();
    state = collectDueCreaks(state, 0.9, 0, config).next;
    const { due } = collectDueCreaks(state, 0.9, 60_000, config);
    expect(due.length).toBeLessThanOrEqual(8);
  });

  it("restarts cleanly when the episode does", () => {
    let state = createCreakState();
    for (let elapsed = 0; elapsed <= 8_000; elapsed += 100) {
      state = collectDueCreaks(state, 0.7, elapsed, config).next;
    }
    const restarted = collectDueCreaks(state, 0.7, 0, config);
    expect(restarted.next.step).toBe(0);
  });
});
