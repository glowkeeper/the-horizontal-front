/**
 * Sharing the project, from the site chrome.
 *
 * The device's own share sheet is preferred. Where there is none — most
 * desktop browsers — the link is copied to the clipboard instead. Both are
 * local browser capabilities: nothing is sent anywhere by the site itself, so
 * this sits within the no-tracking commitment rather than beside it.
 *
 * A reader who dismisses the share sheet has made a choice, so cancelling is
 * not treated as a failure and does not fall through to the clipboard.
 *
 * The link itself arrives on the control as `data-share-url`, written by the
 * page generator from `package.json`. Application code may not name a remote
 * address, and the generator already owns the site origin for canonical URLs.
 */

export const SITE_SHARE_TITLE = "The Horizontal Front";
export const SITE_SHARE_TEXT =
  "A satirical rhythm game about refusing what Management demands. Free, open source and built as a digital commons.";

export interface ShareServices {
  readonly share?: (data: ShareData) => Promise<void>;
  readonly copy?: (text: string) => Promise<void>;
}

export type ShareOutcome = "shared" | "copied" | "cancelled" | "failed";

export function siteShareClipboardText(url: string): string {
  return [SITE_SHARE_TITLE, SITE_SHARE_TEXT, url].join("\n");
}

export async function shareSite(url: string, services: ShareServices): Promise<ShareOutcome> {
  if (services.share) {
    try {
      await services.share({ title: SITE_SHARE_TITLE, text: SITE_SHARE_TEXT, url });
      return "shared";
    } catch (error) {
      if (isAbortError(error)) return "cancelled";
    }
  }

  if (services.copy) {
    try {
      await services.copy(siteShareClipboardText(url));
      return "copied";
    } catch {
      return "failed";
    }
  }

  return "failed";
}

function isAbortError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "name" in error
    && error.name === "AbortError";
}

export function describeShareOutcome(outcome: ShareOutcome): string {
  switch (outcome) {
    case "shared":
      return `${SITE_SHARE_TITLE} shared.`;
    case "copied":
      return `${SITE_SHARE_TITLE} link copied.`;
    case "failed":
      return `Could not share ${SITE_SHARE_TITLE}.`;
    case "cancelled":
      return "";
  }
}

function browserShareServices(): ShareServices {
  const services: { share?: ShareServices["share"]; copy?: ShareServices["copy"] } = {};

  if (typeof navigator.share === "function") {
    services.share = navigator.share.bind(navigator);
  }
  try {
    if (typeof navigator.clipboard?.writeText === "function") {
      services.copy = navigator.clipboard.writeText.bind(navigator.clipboard);
    }
  } catch {
    // Clipboard access can be blocked before a write is attempted.
  }

  return services;
}

/** Wires every share control on the page to one shared status message. */
export function connectShareControls(root: ParentNode = document): void {
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-share-site]"));
  const feedback = root.querySelector<HTMLElement>("[data-share-feedback]");
  if (buttons.length === 0) return;

  let inProgress = false;

  const handleShare = async (url: string): Promise<void> => {
    if (inProgress) return;
    inProgress = true;
    buttons.forEach((button) => {
      button.disabled = true;
    });
    try {
      const outcome = await shareSite(url, browserShareServices());
      if (feedback) feedback.textContent = describeShareOutcome(outcome);
    } finally {
      inProgress = false;
      buttons.forEach((button) => {
        button.disabled = false;
      });
    }
  };

  buttons.forEach((button) => {
    const url = button.dataset.shareUrl;
    if (url) button.addEventListener("click", () => void handleShare(url));
  });
}
