/**
 * Author-facing meanings for the phase fields.
 *
 * The field names, their order and their existence come from the Zod schema;
 * only the prose lives here, because no schema knows what a number is *for*.
 * The generator refuses to run when this table and the schema disagree, so
 * adding a phase field forces a line of documentation rather than silently
 * shipping an undocumented one.
 */
export const phaseFieldMeanings = {
  id: "Author-facing phase name. It has no special engine behaviour.",
  durationMs: "Positive phase duration.",
  rhythm: "Shared or same-episode rhythm reference.",
  beatIntervalMs: "Milliseconds per beat.",
  timingWindowMs:
    "Input tolerance on either side of a beat; less than half a beat.",
  leadInBeats:
    "Whole beats before this phase's first rhythm cycle. On the first phase this creates READY.",
  pressurePerSecond: "Opposing-actor pressure while play is active.",
  recoveryPerAction: "Safety recovered by a successful action.",
  safetyPenaltyPerMiss:
    "Non-negative safety penalty for a miss; defaults to zero.",
  resistanceGainPerHit: "Persistent resistance gained by a hit, from 0 to 1.",
  resistanceLossPerMiss: "Persistent resistance lost by a miss, from 0 to 1.",
  resistanceRecoveryBonus:
    "Recovery multiplier supplied by accumulated resistance.",
  presentationIntensity: "`from` and `to`, each from 0 to 1.",
};
