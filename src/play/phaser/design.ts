import type { ColourRole } from "../content/schemas/presentationSchema";

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const GAME_CENTRE_X = GAME_WIDTH / 2;

/**
 * Interface chrome is code-owned by deliberate policy: buttons, menus and the
 * canvas ground are engine furniture rather than authored world composition, so
 * no episode ever needs to restyle them. They are named here, once, so the
 * repository can enforce a single rule — authored world composition lives in
 * validated content, and every remaining presentation value is a named constant
 * in this file. See docs/technical-architecture.md.
 */
export const CHROME_BACKGROUND: ColourRole = "duvetCream";

/**
 * Default height for an interface-chrome control, in design pixels.
 *
 * Chrome is rendered as DOM buttons layered over the canvas, so its appearance
 * lives in `src/play/styles/game.css`. Only this default remains here, because
 * a control positioned in design space needs a height before CSS sees it.
 */
export const CHROME_BUTTON = {
  height: 78,
} as const;

export const CHROME_MENU = {
  headingSizePx: 15,
} as const;

export const CHROME_PANEL = {
  background: "duvetCream",
  accent: "resistanceRed",
} as const satisfies {
  readonly background: ColourRole;
  readonly accent: ColourRole;
};
