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
  // The demand is sided, because the player has to know which hand to answer
  // with. Two roles rather than one panned cue keeps that decision in content,
  // where it can differ in pitch and timbre as well as position.
  "cue-due-left",
  "cue-due-right",
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
  "management-bluster",
  "victory",
  "forced-verticalisation",
  "interface-action",
] as const;

export const audioCueRoleSchema = z.enum(audioCueRoles);

const gainSchema = z.number().min(0).max(1);
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
  }).strict(),
  z.object({
    kind: z.literal("noise"),
    filter: z.enum(["lowpass", "highpass", "bandpass"]),
    restCutoffHz: audibleFrequencySchema,
    strainCutoffHz: audibleFrequencySchema,
    resonance: z.number().min(0.1).max(30),
    gain: gainSchema,
    pan: panSchema,
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
