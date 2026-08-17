import { describe, expect, it } from "vitest";

import { getCampaignCardPlacements } from "../../../src/play/phaser/campaignMenuLayout";

describe("campaign menu layout", () => {
  it("keeps five campaign cards inside the available canvas area", () => {
    const cards = getCampaignCardPlacements(5);
    expect(cards).toHaveLength(5);
    expect(cards.every(({ centreY, height }) =>
      centreY - height / 2 >= 225 && centreY + height / 2 <= 610)).toBe(true);
    expect(cards.every((card) =>
      card.titleOffset - card.titleFontSize / 2 >= -card.height / 2
      && card.summaryOffset + card.summaryFontSize / 2 <= card.height / 2,
    )).toBe(true);
    expect(cards.every((card, index) => index === cards.length - 1
      || card.centreY + card.summaryOffset + card.summaryFontSize / 2
        < cards[index + 1].centreY + cards[index + 1].titleOffset
          - cards[index + 1].titleFontSize / 2)).toBe(true);
  });

  it("fails explicitly when paging becomes necessary", () => {
    expect(() => getCampaignCardPlacements(6)).toThrow(/requires paging/);
  });
});
