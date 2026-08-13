export type CampaignCardPlacement = {
  readonly centreY: number;
  readonly height: number;
  readonly titleOffset: number;
  readonly summaryOffset: number;
  readonly titleFontSize: number;
  readonly summaryFontSize: number;
};

import { maximumCampaignsWithoutPaging } from "../content/contentRules.mjs";

export function getCampaignCardPlacements(
  count: number,
): readonly CampaignCardPlacement[] {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error("campaign menu must contain at least one campaign");
  }
  if (count > maximumCampaignsWithoutPaging) {
    throw new Error("campaign menu requires paging");
  }
  const top = 225;
  const bottom = 610;
  const gap = 12;
  const maximumHeight = 130;
  const height = Math.min(maximumHeight, (bottom - top - gap * (count - 1)) / count);
  const titleFontSize = Math.min(24, Math.floor(height * 0.28));
  const summaryFontSize = Math.min(20, Math.floor(height * 0.23));
  const titleOffset = -height * 0.22;
  const summaryOffset = height * 0.22;
  return Array.from({ length: count }, (_, index) => ({
    centreY: top + height / 2 + index * (height + gap),
    height,
    titleOffset,
    summaryOffset,
    titleFontSize,
    summaryFontSize,
  }));
}
