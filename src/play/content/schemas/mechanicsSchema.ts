import { z } from "zod";

import { contentIdSchema } from "./gameSchema";
import {
  ownedContentReferenceSchema,
  sharedContentReferenceSchema,
} from "./ownershipSchema";

const sideSchema = z.enum(["left", "right"]);
const positiveBeat = z.number().positive().max(32);

const interruptionMechanicBaseSchema = z.object({
  schemaVersion: z.literal(1),
  id: contentIdSchema,
});

export const interruptionMechanicSchema = z.discriminatedUnion("kind", [
  interruptionMechanicBaseSchema.extend({
    kind: z.literal("sequence"),
    choiceCount: z.number().int().min(2).max(3),
    stepCount: z.number().int().min(1).max(8),
  }).strict(),
  interruptionMechanicBaseSchema.extend({
    kind: z.literal("hold"),
    pressWindowBeats: positiveBeat,
    holdBeats: positiveBeat,
  }).strict(),
]);

const tapEventSchema = z.object({
  action: z.literal("tap"),
  side: sideSchema,
  atBeat: z.number().nonnegative(),
}).strict();

const holdEventSchema = z.object({
  action: z.literal("hold"),
  side: sideSchema,
  atBeat: z.number().nonnegative(),
  durationBeats: positiveBeat,
}).strict();

const restEventSchema = z.object({
  action: z.literal("rest"),
  atBeat: z.number().nonnegative(),
  durationBeats: positiveBeat,
}).strict();

export const rhythmPatternSchema = z.object({
  schemaVersion: z.literal(1),
  id: contentIdSchema,
  cycleBeats: positiveBeat,
  events: z.array(z.discriminatedUnion("action", [
    tapEventSchema,
    holdEventSchema,
    restEventSchema,
  ])).min(1),
}).strict().superRefine((rhythm, context) => {
  const occupied: Array<{ from: number; to: number; action: "tap" | "hold" | "rest" }> = [];
  let actionable = 0;
  for (const [index, event] of rhythm.events.entries()) {
    const end = event.action === "tap"
      ? event.atBeat
      : event.atBeat + event.durationBeats;
    if (event.atBeat >= rhythm.cycleBeats || end > rhythm.cycleBeats) {
      context.addIssue({
        code: "custom",
        message: "event must fit inside cycleBeats",
        path: ["events", index],
      });
    }
    if (event.action !== "rest") actionable += 1;
    const collision = occupied.some((previous) =>
      eventsOverlap(event.action, event.atBeat, end, previous));
    if (collision) {
      context.addIssue({
        code: "custom",
        message: "events and declared rests must not overlap",
        path: ["events", index],
      });
    }
    occupied.push({
      from: event.atBeat,
      to: end,
      action: event.action,
    });
  }
  if (actionable === 0) {
    context.addIssue({ code: "custom", message: "must contain an actionable event" });
  }
});

function eventsOverlap(
  action: "tap" | "hold" | "rest",
  from: number,
  to: number,
  previous: { from: number; to: number; action: "tap" | "hold" | "rest" },
): boolean {
  if (action === "tap" && previous.action === "tap") return from === previous.from;
  if (action === "tap") return from >= previous.from && from < previous.to;
  if (previous.action === "tap") return previous.from >= from && previous.from < to;
  return Math.max(from, previous.from) < Math.min(to, previous.to);
}

function createPhaseSchema<T extends z.ZodType>(referenceSchema: T) {
  return z.object({
  id: contentIdSchema,
  durationMs: z.number().int().positive(),
  rhythm: referenceSchema,
  beatIntervalMs: z.number().int().positive(),
  timingWindowMs: z.number().int().nonnegative(),
  leadInBeats: z.number().int().nonnegative(),
  pressurePerSecond: z.number().nonnegative(),
  recoveryPerAction: z.number().nonnegative(),
  safetyPenaltyPerMiss: z.number().nonnegative().default(0),
  resistanceGainPerHit: z.number().min(0).max(1),
  resistanceLossPerMiss: z.number().min(0).max(1),
  resistanceRecoveryBonus: z.number().nonnegative(),
  presentationIntensity: z.object({
    from: z.number().min(0).max(1),
    to: z.number().min(0).max(1),
  }).strict(),
  }).strict().superRefine((phase, context) => {
  if (phase.timingWindowMs * 2 >= phase.beatIntervalMs) {
    context.addIssue({
      code: "custom",
      message: "must be less than half beatIntervalMs",
      path: ["timingWindowMs"],
    });
  }
  });
}

const phaseSchema = createPhaseSchema(ownedContentReferenceSchema);
const sharedPhaseSchema = createPhaseSchema(sharedContentReferenceSchema);

function createDramaticCurveSchema<T extends z.ZodType>(phases: T) {
  return z.object({
    schemaVersion: z.literal(1),
    id: contentIdSchema,
    startingSafety: z.number().min(0).max(1),
    resolutionDurationMs: z.number().int().nonnegative(),
    // How far ahead the apparatus announces each sided demand, in beats.
    //
    // Expressed against the score's own grid rather than in milliseconds, so it
    // stays musically placed as the tempo changes between phases. A half-beat
    // lead puts the announcement on the offbeat, between one strike and the
    // next; a whole beat puts it on the preceding beat.
    approachLeadBeats: z.number().positive().max(4),
    phases: z.array(phases).min(1),
  }).strict().superRefine((curve, context) => {
  const curvePhases = curve.phases as readonly {
    id: string;
    presentationIntensity: { from: number; to: number };
  }[];
  const ids = curvePhases.map(({ id }) => id);
  if (new Set(ids).size !== ids.length) {
    context.addIssue({ code: "custom", message: "phase IDs must be unique", path: ["phases"] });
  }
  for (let index = 1; index < curvePhases.length; index += 1) {
    if (curvePhases[index - 1].presentationIntensity.to
      !== curvePhases[index].presentationIntensity.from) {
      context.addIssue({
        code: "custom",
        message: "adjacent presentation intensity must be continuous",
        path: ["phases", index, "presentationIntensity", "from"],
      });
    }
  }
  });
}

export const dramaticCurveSchema = createDramaticCurveSchema(phaseSchema);
export const sharedDramaticCurveSchema = createDramaticCurveSchema(sharedPhaseSchema);

export const episodeMechanicDefinitionsSchema = z.object({
  rhythms: z.array(rhythmPatternSchema).default([]),
  dramaticCurves: z.array(dramaticCurveSchema).default([]),
  interruptions: z.array(interruptionMechanicSchema).default([]),
}).strict();

export const mechanicCatalogueSchema = z.object({
  schemaVersion: z.literal(1),
  rhythms: z.array(z.object({ id: contentIdSchema, file: z.string() }).strict()).min(1),
  dramaticCurves: z.array(z.object({ id: contentIdSchema, file: z.string() }).strict()),
  interruptions: z.array(z.object({ id: contentIdSchema, file: z.string() }).strict()).default([]),
}).strict();

export type RhythmPatternContent = z.infer<typeof rhythmPatternSchema>;
export type DramaticCurveContent = z.infer<typeof dramaticCurveSchema>;
type ParsedEpisodeMechanicDefinitions = z.infer<typeof episodeMechanicDefinitionsSchema>;
export type EpisodeMechanicDefinitions = Omit<ParsedEpisodeMechanicDefinitions, "interruptions"> & {
  readonly interruptions?: ParsedEpisodeMechanicDefinitions["interruptions"];
};
export type InterruptionMechanicContent = z.infer<typeof interruptionMechanicSchema>;
