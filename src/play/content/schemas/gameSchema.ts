import { z } from "zod";
import {
  contentIdPattern,
  getCopyPlaceholders,
  hasStrayCopyBraces,
} from "../contentRules.mjs";

const shortCopy = z.string().trim().min(1).max(120);
const bodyCopy = z.string().trim().min(1).max(600);
const templateCopy = z.string().trim().min(1).max(500);

export const contentIdSchema = z.string().regex(
  contentIdPattern,
  "must be lowercase kebab-case without numeric sequence segments",
);

const contentReferenceSchema = z.object({
  id: contentIdSchema,
  file: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/),
}).strict().superRefine(({ id, file }, context) => {
  if (file !== `${id}.json`) {
    context.addIssue({
      code: "custom",
      message: "filename must exactly match its content ID",
      path: ["file"],
    });
  }
});

const campaignTextSchema = z.object({
  headline: shortCopy,
  body: bodyCopy,
}).strict();

function copyTemplate(...required: string[]) {
  return templateCopy.superRefine((template, context) => {
    const placeholders = getCopyPlaceholders(template);
    if (
      hasStrayCopyBraces(template)
      || new Set(placeholders).size !== placeholders.length
      ||
      placeholders.length !== required.length
      || required.some((key) => !placeholders.includes(key))
    ) {
      context.addIssue({
        code: "custom",
        message: `must contain exactly: ${required.map((key) => `{${key}}`).join(", ")}`,
      });
    }
  });
}

const interfaceCopySchema = z.object({
  pageTitle: shortCopy,
  pageDescription: shortCopy,
  exitLabel: shortCopy,
  gameAriaLabel: shortCopy,
  loadingStatus: shortCopy,
  campaignsHeading: shortCopy,
  campaignsInstructions: shortCopy,
  campaignsStatus: copyTemplate("title", "headline"),
  briefingInstructions: shortCopy,
  briefingStatus: copyTemplate("title", "headline", "body"),
  retryEpisode: shortCopy,
  acceptOutcome: shortCopy,
  resultStatus: copyTemplate("outcome", "feedback"),
  resolutionStatus: copyTemplate("outcome", "feedback"),
  replayCampaign: shortCopy,
  returnToCampaigns: shortCopy,
  debriefingStatus: copyTemplate("headline", "body", "scoreLabel", "score"),
}).strict();

export const campaignSchema = z.object({
  schemaVersion: z.literal(1),
  id: contentIdSchema,
  title: z.string().trim().min(1),
  briefing: campaignTextSchema,
  episodes: z.array(contentReferenceSchema).min(1),
  debriefing: campaignTextSchema.extend({
    scoreLabel: z.string().trim().min(1),
  }).strict(),
}).strict();

export const gameSchema = z.object({
  schemaVersion: z.literal(1),
  id: contentIdSchema,
  title: z.string().trim().min(1),
  interface: interfaceCopySchema,
  mechanics: z.object({
    resistance: z.object({
      leftControl: shortCopy,
      rightControl: shortCopy,
      secondsRemaining: copyTemplate("seconds"),
      now: copyTemplate("side"),
      cueTap: copyTemplate("side"),
      cueHold: copyTemplate("side"),
      cueHolding: shortCopy,
      cueReleaseNow: shortCopy,
      cueRest: shortCopy,
      cueCountIn: shortCopy,
      cueHitNow: shortCopy,
      tap: copyTemplate("side"),
      hold: copyTemplate("side"),
      release: copyTemplate("side"),
      hit: copyTemplate("side"),
      wrongSide: copyTemplate("side"),
      tooEarly: copyTemplate("side"),
      missed: copyTemplate("side"),
      releasedEarly: copyTemplate("side"),
    }).strict(),
    interruptions: z.object({
      sequenceProgress: copyTemplate("instruction", "current", "total"),
      holdReady: shortCopy,
      holdHolding: shortCopy,
      holdRelease: shortCopy,
    }).strict(),
  }).strict(),
  campaigns: z.array(contentReferenceSchema).min(1),
}).strict();

export type CampaignContent = z.infer<typeof campaignSchema>;
export type GameContent = z.infer<typeof gameSchema>;
