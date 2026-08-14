import { describe, expect, it } from "vitest";

import { game } from "../../../src/play/content/game";
import {
  advanceConfrontation,
  applyConfrontationInput,
  createConfrontation,
  getConfrontationControlOwner,
  getInterruptionPresentationState,
} from "../../../src/play/engine/confrontation";
import type { Confrontation, ConfrontationConfig } from "../../../src/play/engine/types";
import { getRhythmGuide } from "../../../src/play/engine/resistance";

const config: ConfrontationConfig = {
  resistance: game.entryEpisode.confrontation.resistance,
  interruptions: game.entryEpisode.confrontation.interruptions,
};

describe("confrontation coordinator", () => {
  it("protects the opening count-in before handing over resistance controls", () => {
    const confrontation = createConfrontation(config);
    const opening = config.resistance.guideEvents.find(
      ({ action, atMs }) => action === "count-in" && atMs === 0,
    );
    if (!opening) throw new Error("test requires an opening count-in");
    expect(getConfrontationControlOwner(confrontation)).toBe("none");
    expect(getConfrontationControlOwner(advanceConfrontation(
      confrontation,
      opening.endsAtMs,
    ))).toBe("resistance");
  });

  it("removes a judged note from the guide immediately", () => {
    const cue = config.resistance.cues[0];
    let confrontation = advanceConfrontation(createConfrontation(config), cue.atMs);
    confrontation = applyConfrontationInput(confrontation, {
      kind: "resistance", side: cue.side, action: "press", atMs: cue.atMs,
    });
    expect(getRhythmGuide(confrontation.resistance).some(
      (item) => (item.action === "tap" || item.action === "hold")
        && item.atMs === cue.atMs,
    )).toBe(false);
  });

  it("compiles interruptions onto non-overlapping musical windows", () => {
    expect(config.interruptions.map(({ id }) => id)).toEqual([
      "quick-call-from-management",
      "urgent-email-from-management",
    ]);
    for (const attack of config.interruptions) {
      expect(attack.warningStartsAtMs).toBeLessThan(attack.startsAtMs);
      expect(attack.startsAtMs).toBeLessThan(attack.endsAtMs);
      expect(attack.endsAtMs).toBeLessThan(attack.returnsAtMs);
      expect(config.resistance.cues.some((cue) =>
        cue.atMs + cue.timingWindowMs > attack.startsAtMs
        && cue.atMs - cue.timingWindowMs < attack.returnsAtMs)).toBe(false);
      expect(config.resistance.guideEvents).toContainEqual(expect.objectContaining({
        action: "interruption",
        atMs: attack.startsAtMs,
        endsAtMs: attack.endsAtMs,
      }));
      expect(config.resistance.guideEvents).toContainEqual(expect.objectContaining({
        action: "count-in",
        atMs: attack.endsAtMs,
        endsAtMs: attack.returnsAtMs,
      }));
    }
  });

  it("warns while resistance owns input, then transfers ownership exactly at the boundary", () => {
    const attack = config.interruptions[0];
    let confrontation = advanceConfrontation(
      createConfrontation(config),
      attack.warningStartsAtMs,
    );
    expect(getInterruptionPresentationState(confrontation).stage).toBe("warning");
    expect(getConfrontationControlOwner(confrontation)).toBe("resistance");
    confrontation = advanceConfrontation(confrontation, attack.startsAtMs);
    expect(getInterruptionPresentationState(confrontation).stage).toBe("active");
    expect(getConfrontationControlOwner(confrontation)).toBe("interruption");
    confrontation = advanceConfrontation(confrontation, attack.endsAtMs);
    expect(getInterruptionPresentationState(confrontation).stage).toBe("returning");
    expect(getConfrontationControlOwner(confrontation)).toBe("none");
  });

  it("resolves the ordered Quick Call by recognition and suspends input until return", () => {
    const attack = config.interruptions[0];
    expect(attack.interaction.kind).toBe("sequence");
    if (attack.interaction.kind !== "sequence") return;
    let confrontation = advanceConfrontation(createConfrontation(config), attack.startsAtMs);
    const startingSafety = confrontation.resistance.state.duvetSafety;
    for (const [index, choiceId] of attack.interaction.steps.entries()) {
      confrontation = applyConfrontationInput(confrontation, {
        kind: "sequence", choiceId, atMs: attack.startsAtMs + index * 50,
      });
    }
    expect(confrontation.activeInterruption).toMatchObject({
      outcome: "success", sequenceStep: attack.interaction.steps.length,
    });
    expect(confrontation.resistance.state.duvetSafety)
      .toBeCloseTo(Math.min(1, startingSafety + attack.consequences.successSafety));
    expect(getConfrontationControlOwner(confrontation)).toBe("none");
    confrontation = advanceConfrontation(confrontation, attack.returnsAtMs);
    expect(confrontation.completedOutcomes).toEqual(["success"]);
    expect(getConfrontationControlOwner(confrontation)).toBe("resistance");
  });

  it("distinguishes a wrong Quick Call choice from expiration", () => {
    const attack = config.interruptions[0];
    if (attack.interaction.kind !== "sequence") return;
    const expected = attack.interaction.steps[0];
    const wrong = attack.interaction.choices.find(({ id }) => id !== expected)?.id;
    if (!wrong) throw new Error("test requires a wrong choice");
    let confrontation = advanceConfrontation(createConfrontation(config), attack.startsAtMs);
    confrontation = applyConfrontationInput(confrontation, {
      kind: "sequence", choiceId: wrong, atMs: attack.startsAtMs,
    });
    expect(confrontation.activeInterruption).toMatchObject({
      outcome: "failure", feedback: "failure",
    });

    const expired = advanceConfrontation(createConfrontation(config), attack.endsAtMs + 1);
    expect(expired.activeInterruption).toMatchObject({
      outcome: "failure", feedback: "expired",
    });
  });

  it("handles successful, early and cancelled Urgent Email holds without stuck input", () => {
    const ready = reachSecondInterruption();
    const attack = config.interruptions[1];
    if (attack.interaction.kind !== "hold") return;
    const pressedAt = attack.startsAtMs + 20;

    let successful = applyConfrontationInput(ready, {
      kind: "hold", action: "press", atMs: pressedAt,
    });
    successful = applyConfrontationInput(successful, {
      kind: "hold", action: "release",
      atMs: pressedAt + attack.interaction.requiredHoldMs,
    });
    expect(successful.activeInterruption).toMatchObject({
      outcome: "success", holdStartedAtMs: null,
    });

    let early = applyConfrontationInput(ready, {
      kind: "hold", action: "press", atMs: pressedAt,
    });
    early = applyConfrontationInput(early, {
      kind: "hold", action: "release", atMs: pressedAt + 100,
    });
    expect(early.activeInterruption).toMatchObject({
      outcome: "failure", feedback: "failure", holdStartedAtMs: null,
    });

    let cancelled = applyConfrontationInput(ready, {
      kind: "hold", action: "press", atMs: pressedAt,
    });
    const safetyBeforeCancellation = cancelled.resistance.state.duvetSafety;
    cancelled = applyConfrontationInput(cancelled, {
      kind: "hold", action: "cancel", atMs: pressedAt + 100,
    });
    expect(cancelled.activeInterruption).toMatchObject({
      outcome: "cancelled", feedback: "cancelled", holdStartedAtMs: null,
    });
    expect(cancelled.resistance.state.duvetSafety).toBe(safetyBeforeCancellation);
  });

  it("ignores cancellation unless a hold is actually in progress", () => {
    const ready = reachSecondInterruption();
    const unchanged = applyConfrontationInput(ready, {
      kind: "hold", action: "cancel",
      atMs: ready.resistance.state.elapsedMs,
    });
    expect(unchanged.activeInterruption).toEqual(ready.activeInterruption);
  });

  it("reports a late Urgent Email press instead of silently ignoring it", () => {
    const ready = reachSecondInterruption();
    const attack = config.interruptions[1];
    if (attack.interaction.kind !== "hold") return;
    const late = applyConfrontationInput(ready, {
      kind: "hold",
      action: "press",
      atMs: attack.interaction.pressDeadlineMs + 1,
    });
    expect(late.activeInterruption).toMatchObject({
      outcome: "failure",
      feedback: "expired",
    });
  });

  it("pauses pressure and input while previewing the post-interruption return", () => {
    const attack = config.interruptions[0];
    let confrontation = advanceConfrontation(createConfrontation(config), attack.startsAtMs);
    confrontation = advanceConfrontation(confrontation, attack.endsAtMs + 1);
    const safetyAfterConsequence = confrontation.resistance.state.duvetSafety;
    expect(getInterruptionPresentationState(confrontation).stage).toBe("returning");
    expect(getConfrontationControlOwner(confrontation)).toBe("none");
    expect(getRhythmGuide(confrontation.resistance).some(
      ({ action }) => action === "tap" || action === "hold",
    )).toBe(true);

    confrontation = advanceConfrontation(confrontation, attack.returnsAtMs - 1);
    expect(confrontation.resistance.state.duvetSafety)
      .toBeCloseTo(safetyAfterConsequence);
    expect(getConfrontationControlOwner(confrontation)).toBe("none");
  });

  it("discards resistance input while an interruption owns the controls", () => {
    const attack = config.interruptions[0];
    const ready = advanceConfrontation(createConfrontation(config), attack.startsAtMs);
    const nextCueStep = ready.resistance.state.nextRhythmStep;
    const ignored = applyConfrontationInput(ready, {
      kind: "resistance", side: "left", action: "press", atMs: attack.startsAtMs,
    });
    expect(ignored.resistance.state.nextRhythmStep).toBe(nextCueStep);
    expect(ignored.resistance.state.lastRhythmJudgement)
      .toEqual(ready.resistance.state.lastRhythmJudgement);
  });
});

function reachSecondInterruption(): Confrontation {
  const first = config.interruptions[0];
  if (first.interaction.kind !== "sequence") throw new Error("first attack must be sequence");
  let confrontation = advanceConfrontation(createConfrontation(config), first.startsAtMs);
  for (const choiceId of first.interaction.steps) {
    confrontation = applyConfrontationInput(confrontation, {
      kind: "sequence", choiceId,
      atMs: confrontation.resistance.state.elapsedMs,
    });
  }
  confrontation = advanceConfrontation(confrontation, first.returnsAtMs);
  return advanceConfrontation(confrontation, config.interruptions[1].startsAtMs);
}
