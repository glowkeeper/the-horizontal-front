import { z } from "zod";

import { contentIdSchema } from "./gameSchema";
import { ownedContentReferenceSchema } from "./ownershipSchema";

/**
 * The finite set of moments the game can sound.
 *
 * A soundscape must supply a cue for every role, so a silent moment is an
 * authoring decision expressed as a quiet cue rather than an omission the
 * engine has to guess about. Adding a role is an engine change; choosing what
 * a role sounds like is content.
 */
export const audioCueRoles = [
  "count-in",
  // The apparatus keeps time on every beat, whether or not the beat asks for
  // anything. Without it the score falls silent through rests and the player
  // loses the pulse they are meant to be resisting.
  "beat",
  // The beat that begins a rhythm cycle. A uniform tick tells the player the
  // tempo but not where they are in it; accenting the cycle makes the grid
  // countable, which is what lets them predict where the next demand falls.
  "downbeat",
  // The demand is sided, because the player has to know which hand to answer
  // with. Two roles rather than one panned cue keeps that decision in content,
  // where it can differ in pitch and timbre as well as position.
  "cue-due-left",
  "cue-due-right",
  // The apparatus winds up before it strikes, announcing which side it is about
  // to demand while there is still time to answer.
  //
  // Synchronising to a rhythm is anticipatory rather than reactive, so a sided
  // signal arriving at the instant of the demand cannot be answered on time by
  // anyone: without these roles the score can only be read on screen, never
  // heard. The approach carries the same information as the strike, earlier and
  // quieter. See `docs/research/audio-led-rhythm-cueing.md`.
  "cue-approach-left",
  "cue-approach-right",
  "tap-hit",
  "tap-miss",
  // Resistance and bed movement: the frame itself, hauled up a notch or
  // settling back as the player wins ground. Judgement cues answer the player;
  // these answer Management.
  "resistance-strain",
  "resistance-ease",
  "hold-start",
  "hold-release",
  "hold-broken",
  "interruption-warning",
  "interruption-input",
  "interruption-success",
  "interruption-failure",
  "interruption-return",
  "opposing-actor-voice",
  "outcome-success",
  "outcome-failure",
  "interface-action",
] as const;

export const audioCueRoleSchema = z.enum(audioCueRoles);

const gainSchema = z.number().min(0).max(1);
const unitIntervalSchema = z.number().min(0).max(1);
const envelopeMsSchema = z.number().nonnegative().max(4_000);
const offsetMsSchema = z.number().nonnegative().max(4_000);
const audibleFrequencySchema = z.number().min(20).max(16_000);

const panSchema = z.number().min(-1).max(1);

const layerBaseSchema = {
  // Layers start relative to the cue, so one stamp can be a thump with its
  // click a few milliseconds behind it rather than two separate cues.
  delayMs: offsetMsSchema,
  attackMs: envelopeMsSchema,
  holdMs: envelopeMsSchema,
  releaseMs: envelopeMsSchema,
  gain: gainSchema,
  // Stereo position, -1 to 1. It reinforces a sided cue for players on
  // headphones without ever being the only signal, since the same cues also
  // differ in pitch and timbre and the visual guide carries the same
  // information regardless.
  pan: panSchema,
  // How much of this layer is also sent to the room, 0 to 1.
  //
  // Space is separation: two sounds in the same frequency range stop competing
  // when one of them is plainly further away. The send is additive, so a layer
  // with space keeps its dry timing intact and gains a tail. Defaults to none,
  // because a cue the player is expected to answer should sit right in front of
  // them.
  space: gainSchema.default(0),
};

/**
 * Two synthesis primitives cover the workplace apparatus this game scores
 * itself with: pitched metal and machinery resonance from `tone`, and the
 * impacts, hisses and clatter of paper and mechanism from `noise`.
 */
export const audioLayerSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("tone"),
    wave: z.enum(["sine", "square", "triangle", "sawtooth"]),
    startFrequencyHz: audibleFrequencySchema,
    endFrequencyHz: audibleFrequencySchema,
    ...layerBaseSchema,
  }).strict(),
  z.object({
    kind: z.literal("noise"),
    filter: z.enum(["lowpass", "highpass", "bandpass"]),
    startCutoffHz: audibleFrequencySchema,
    endCutoffHz: audibleFrequencySchema,
    resonance: z.number().min(0.1).max(30),
    ...layerBaseSchema,
  }).strict(),
]);

export const audioCueSchema = z.object({
  schemaVersion: z.literal(1),
  id: contentIdSchema,
  layers: z.array(audioLayerSchema).min(1).max(8),
}).strict().superRefine((cue, context) => {
  if (cue.layers.every((layer) => layer.gain === 0)) {
    context.addIssue({
      code: "custom",
      message: "every layer is silent, so the cue can never be heard; remove it or give a layer gain",
    });
  }
  if (cue.layers.every((layer) => layer.attackMs + layer.holdMs + layer.releaseMs === 0)) {
    context.addIssue({
      code: "custom",
      message: "every layer has a zero-length envelope, so the cue can never be heard",
    });
  }
});

/**
 * A continuously sounding layer, held for as long as the confrontation lasts.
 *
 * Unlike a cue it has no envelope, because it never ends on its own. What it
 * has instead is two settings of itself — one at rest, one under full dramatic
 * intensity — and the engine moves between them as pressure rises. That
 * movement is what makes an episode feel like it is tightening.
 */
export const ambienceLayerSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("tone"),
    wave: z.enum(["sine", "square", "triangle", "sawtooth"]),
    restFrequencyHz: audibleFrequencySchema,
    strainFrequencyHz: audibleFrequencySchema,
    gain: gainSchema,
    pan: panSchema,
    space: gainSchema.default(0),
  }).strict(),
  z.object({
    kind: z.literal("noise"),
    filter: z.enum(["lowpass", "highpass", "bandpass"]),
    restCutoffHz: audibleFrequencySchema,
    strainCutoffHz: audibleFrequencySchema,
    resonance: z.number().min(0.1).max(30),
    gain: gainSchema,
    pan: panSchema,
    space: gainSchema.default(0),
  }).strict(),
]);

export const audioAmbienceSchema = z.object({
  restGain: gainSchema,
  strainGain: gainSchema,
  /** How quickly the bed follows a change in intensity. */
  responseMs: z.number().int().positive().max(10_000),
  layers: z.array(ambienceLayerSchema).min(1).max(6),
}).strict();

export const audioSoundscapeSchema = z.object({
  schemaVersion: z.literal(1),
  id: contentIdSchema,
  gain: gainSchema,
  ambience: audioAmbienceSchema,
  /**
   * The antagonist, audible throughout rather than only when they interrupt.
   *
   * Follows the dramatic curve, so Management grumbles more as the working day
   * advances however well the player is doing — the same signal their pose
   * strain uses, and the same argument: the clock is Management's weapon.
   * Authored low, because it is a presence rather than an event.
   */
  opposingActorPresence: audioAmbienceSchema,
  /**
   * The sustained component of the structure under load, following danger.
   *
   * The creak train carries the information; this carries the body. Transients
   * separated by silence are heard as separate events, so a run of creaks with
   * nothing between them reads as a series of squeaks rather than as one object
   * being worked. A quiet continuous groan in the same register binds them.
   *
   * It is not a substitute for the creaks and must stay well under them: on its
   * own, a sustained layer following danger is just a hum.
   */
  resistanceStrain: audioAmbienceSchema,
  /**
   * The resistance complaining under load, following physical danger.
   *
   * Not a bed. A structure under stress emits discrete bursts whose rate and
   * amplitude both climb as it approaches failure, so this authors a train of
   * creaks rather than a sustained tone: a continuous oscillator following
   * danger sounds like a hum, not like timber being worked.
   */
  resistanceStressBursts: z.object({
    cue: ownedContentReferenceSchema,
    minimumDanger: unitIntervalSchema,
    restIntervalMs: z.number().int().positive().max(10_000),
    strainIntervalMs: z.number().int().positive().max(10_000),
    restGain: gainSchema,
    strainGain: gainSchema,
    intervalPattern: z.array(z.number().positive().max(4)).min(2).max(12),
  }).strict().superRefine((creak, context) => {
    if (creak.strainIntervalMs >= creak.restIntervalMs) {
      context.addIssue({
        code: "custom",
        message: "creaking must quicken under load, so strainIntervalMs must be shorter than restIntervalMs",
        path: ["strainIntervalMs"],
      });
    }
    if (creak.intervalPattern.every((value) => value === creak.intervalPattern[0])) {
      context.addIssue({
        code: "custom",
        message: "an even interval pattern reads as machinery rather than stick-slip; vary it",
        path: ["intervalPattern"],
      });
    }
  }),
  cues: z.object(
    Object.fromEntries(
      audioCueRoles.map((role) => [role, ownedContentReferenceSchema]),
    ) as Record<typeof audioCueRoles[number], typeof ownedContentReferenceSchema>,
  ).strict(),
}).strict();

export const audioCatalogueSchema = z.object({
  schemaVersion: z.literal(1),
  cues: z.array(z.object({
    id: contentIdSchema,
    file: z.string().min(1),
  }).strict()),
  soundscapes: z.array(z.object({
    id: contentIdSchema,
    file: z.string().min(1),
  }).strict()),
}).strict();

export const episodeAudioSchema = z.object({
  soundscape: ownedContentReferenceSchema,
}).strict();

export type AudioCueRole = z.infer<typeof audioCueRoleSchema>;
export type AmbienceLayerContent = z.infer<typeof ambienceLayerSchema>;
export type AudioAmbienceContent = z.infer<typeof audioAmbienceSchema>;
export type AudioLayerContent = z.infer<typeof audioLayerSchema>;
export type AudioCueContent = z.infer<typeof audioCueSchema>;
export type AudioSoundscapeContent = z.infer<typeof audioSoundscapeSchema>;
export type EpisodeAudioContent = z.infer<typeof episodeAudioSchema>;
