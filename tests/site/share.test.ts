import { describe, expect, it, vi } from "vitest";

import {
  describeShareOutcome,
  shareSite,
  siteShareClipboardText,
  SITE_SHARE_TEXT,
  SITE_SHARE_TITLE,
} from "../../src/site/share";

const SITE_URL = "https://example.org/";

describe("site sharing", () => {
  it("shares the canonical site through the device share sheet", async () => {
    const share = vi.fn(async () => undefined);
    const copy = vi.fn(async () => undefined);

    await expect(shareSite(SITE_URL, { share, copy })).resolves.toBe("shared");
    expect(share).toHaveBeenCalledWith({
      title: SITE_SHARE_TITLE,
      text: SITE_SHARE_TEXT,
      url: SITE_URL,
    });
    expect(copy).not.toHaveBeenCalled();
  });

  it("copies the title, description and link when there is no share sheet", async () => {
    const copy = vi.fn(async () => undefined);

    await expect(shareSite(SITE_URL, { copy })).resolves.toBe("copied");
    expect(copy).toHaveBeenCalledWith(siteShareClipboardText(SITE_URL));
    expect(siteShareClipboardText(SITE_URL)).toBe(
      [SITE_SHARE_TITLE, SITE_SHARE_TEXT, SITE_URL].join("\n"),
    );
  });

  it("does not copy after the reader dismisses the share sheet", async () => {
    const copy = vi.fn(async () => undefined);
    const share = vi.fn(async () => {
      throw new DOMException("Cancelled", "AbortError");
    });

    await expect(shareSite(SITE_URL, { share, copy })).resolves.toBe("cancelled");
    expect(copy).not.toHaveBeenCalled();
    expect(describeShareOutcome("cancelled")).toBe("");
  });

  it("falls back to the clipboard when the share sheet fails", async () => {
    const copy = vi.fn(async () => undefined);
    const share = vi.fn(async () => {
      throw new DOMException("Not allowed", "NotAllowedError");
    });

    await expect(shareSite(SITE_URL, { share, copy })).resolves.toBe("copied");
  });

  it("reports failure when neither route is available", async () => {
    await expect(shareSite(SITE_URL, {})).resolves.toBe("failed");
    await expect(
      shareSite(SITE_URL, { copy: async () => Promise.reject(new Error("blocked")) }),
    ).resolves.toBe("failed");
  });
});
