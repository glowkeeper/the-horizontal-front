import {
  adjustResistanceSafety,
  advanceResistance,
  applyResistanceInput,
  createResistance,
  isResistanceCountInActive,
} from "./resistance";
import type {
  ActiveInterruptionState,
  Confrontation,
  ConfrontationConfig,
  ConfrontationControlOwner,
  ConfrontationInput,
  InterruptionOutcome,
  InterruptionPresentationState,
} from "./types";

export function createConfrontation(config: ConfrontationConfig): Confrontation {
  assertValidInterruptionTimeline(config);
  return {
    config,
    resistance: createResistance(config.resistance),
    completedOutcomes: [],
    activeInterruption: null,
  };
}

export function advanceConfrontation(
  confrontation: Confrontation,
  toMs: number,
): Confrontation {
  if (toMs < confrontation.resistance.state.elapsedMs) {
    throw new Error("confrontation time cannot move backwards");
  }
  let next = confrontation;
  while (next.resistance.state.elapsedMs < toMs
    && next.resistance.state.outcome === "active") {
    const elapsedMs = next.resistance.state.elapsedMs;
    const attack = next.config.interruptions[next.completedOutcomes.length];
    if (!attack) return withResistance(next, advanceResistance(next.resistance, toMs));

    if (!next.activeInterruption && elapsedMs < attack.startsAtMs) {
      const boundary = Math.min(toMs, attack.startsAtMs);
      next = withResistance(next, advanceResistance(next.resistance, boundary));
      continue;
    }
    if (!next.activeInterruption) {
      next = {
        ...next,
        activeInterruption: {
          index: next.completedOutcomes.length,
          sequenceStep: 0,
          holdStartedAtMs: null,
          outcome: null,
          feedback: null,
        },
      };
    }
    const active = next.activeInterruption;
    if (!active) continue;
    if (active.outcome === null && toMs > attack.endsAtMs) {
      next = withResistance(next, advanceResistance(next.resistance, attack.endsAtMs));
      next = resolveInterruption(next, "failure", "expired");
      continue;
    }
    if (toMs < attack.returnsAtMs) {
      return withResistance(next, advanceResistance(next.resistance, toMs));
    }
    next = withResistance(next, advanceResistance(next.resistance, attack.returnsAtMs));
    const outcome = next.activeInterruption?.outcome;
    if (!outcome) next = resolveInterruption(next, "failure", "expired");
    next = {
      ...next,
      completedOutcomes: [
        ...next.completedOutcomes,
        next.activeInterruption?.outcome ?? "failure",
      ],
      activeInterruption: null,
    };
  }
  return activateDueInterruption(next);
}

export function applyConfrontationInput(
  confrontation: Confrontation,
  input: ConfrontationInput,
): Confrontation {
  let next = advanceConfrontation(confrontation, input.atMs);
  if (next.resistance.state.outcome !== "active") return next;
  const owner = getConfrontationControlOwner(next);
  if (input.kind === "resistance") {
    return owner === "resistance"
      ? withResistance(next, applyResistanceInput(next.resistance, input))
      : next;
  }
  if (owner !== "interruption" || !next.activeInterruption) return next;
  const attack = next.config.interruptions[next.activeInterruption.index];
  if (input.kind === "sequence" && attack.interaction.kind === "sequence") {
    const expected = attack.interaction.steps[next.activeInterruption.sequenceStep];
    if (input.choiceId !== expected) {
      return resolveInterruption(next, "failure", "failure");
    }
    const sequenceStep = next.activeInterruption.sequenceStep + 1;
    next = { ...next, activeInterruption: { ...next.activeInterruption, sequenceStep } };
    return sequenceStep === attack.interaction.steps.length
      ? resolveInterruption(next, "success", "success")
      : next;
  }
  if (input.kind === "hold" && attack.interaction.kind === "hold") {
    if (input.action === "cancel") {
      if (next.activeInterruption.holdStartedAtMs === null) return next;
      return resolveInterruption(next, "cancelled", "cancelled");
    }
    if (input.action === "press") {
      if (next.activeInterruption.holdStartedAtMs !== null) return next;
      if (input.atMs > attack.interaction.pressDeadlineMs) {
        return resolveInterruption(next, "failure", "expired");
      }
      return {
        ...next,
        activeInterruption: {
          ...next.activeInterruption,
          holdStartedAtMs: input.atMs,
          feedback: null,
        },
      };
    }
    const startedAt = next.activeInterruption.holdStartedAtMs;
    if (startedAt === null) return next;
    return input.atMs - startedAt >= attack.interaction.requiredHoldMs
      ? resolveInterruption(next, "success", "success")
      : resolveInterruption(next, "failure", "failure");
  }
  return next;
}

export function getConfrontationControlOwner(
  confrontation: Confrontation,
): ConfrontationControlOwner {
  const active = confrontation.activeInterruption;
  if (!active) {
    return isResistanceCountInActive(confrontation.resistance)
      ? "none"
      : "resistance";
  }
  const attack = confrontation.config.interruptions[active.index];
  const elapsedMs = confrontation.resistance.state.elapsedMs;
  if (active.outcome === null && elapsedMs >= attack.startsAtMs
    && elapsedMs < attack.endsAtMs) return "interruption";
  return "none";
}

export function getInterruptionPresentationState(
  confrontation: Confrontation,
): InterruptionPresentationState {
  const elapsedMs = confrontation.resistance.state.elapsedMs;
  const active = confrontation.activeInterruption;
  if (active) {
    const interruption = confrontation.config.interruptions[active.index];
    if (active.outcome !== null && elapsedMs < interruption.endsAtMs) {
      return { stage: "resolved", interruption, state: active };
    }
    if (elapsedMs >= interruption.endsAtMs) {
      return { stage: "returning", interruption, state: active };
    }
    return { stage: "active", interruption, state: active };
  }
  const next = confrontation.config.interruptions[confrontation.completedOutcomes.length];
  if (next && elapsedMs >= next.warningStartsAtMs && elapsedMs < next.startsAtMs) {
    return { stage: "warning", interruption: next };
  }
  return { stage: "resistance" };
}

function resolveInterruption(
  confrontation: Confrontation,
  outcome: InterruptionOutcome,
  feedback: ActiveInterruptionState["feedback"],
): Confrontation {
  const active = confrontation.activeInterruption;
  if (!active || active.outcome !== null) return confrontation;
  const attack = confrontation.config.interruptions[active.index];
  const adjustment = outcome === "success"
    ? attack.consequences.successSafety
    : outcome === "failure" ? attack.consequences.failureSafety : 0;
  return {
    ...confrontation,
    resistance: adjustResistanceSafety(confrontation.resistance, adjustment),
    activeInterruption: {
      ...active,
      holdStartedAtMs: null,
      outcome,
      feedback,
    },
  };
}

function withResistance(
  confrontation: Confrontation,
  resistance: Confrontation["resistance"],
): Confrontation {
  return { ...confrontation, resistance };
}

function activateDueInterruption(confrontation: Confrontation): Confrontation {
  if (confrontation.activeInterruption) return confrontation;
  const index = confrontation.completedOutcomes.length;
  const attack = confrontation.config.interruptions[index];
  if (!attack || confrontation.resistance.state.elapsedMs < attack.startsAtMs
    || confrontation.resistance.state.elapsedMs >= attack.returnsAtMs) {
    return confrontation;
  }
  return {
    ...confrontation,
    activeInterruption: {
      index, sequenceStep: 0, holdStartedAtMs: null,
      outcome: null, feedback: null,
    },
  };
}

function assertValidInterruptionTimeline(config: ConfrontationConfig): void {
  let previousReturn = 0;
  for (const [index, attack] of config.interruptions.entries()) {
    if (!(attack.warningStartsAtMs >= previousReturn
      && attack.warningStartsAtMs < attack.startsAtMs
      && attack.startsAtMs < attack.endsAtMs
      && attack.endsAtMs < attack.returnsAtMs
      && attack.returnsAtMs <= config.resistance.durationMs)) {
      throw new Error(`interruptions[${index}] must form an ordered warning, active and return timeline`);
    }
    previousReturn = attack.returnsAtMs;
  }
}
