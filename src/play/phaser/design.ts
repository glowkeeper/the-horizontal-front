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
 * Canvas-only button geometry. Appearance — fill, label, border, shadow and the
 * hover/active motion — is not restated here: it comes from the shared button
 * contract in `src/shared/theme/tokens.css`, which the public site consumes
 * directly and the canvas reads through `getButtonStyle`. Only values with no
 * CSS equivalent live here, because the canvas has no text-flow layout to
 * derive a height from.
 */
export const CHROME_BUTTON = {
  height: 78,
  labelSizePx: 16,
  backgroundDepth: 30,
  labelDepth: 31,
} as const;

export const CHROME_MENU = {
  headingSizePx: 15,
  cardStrokeWidth: 5,
  cardFill: "paperWhite",
  cardStroke: "inkCharcoal",
  cardSelectedFill: "managementGold",
} as const satisfies {
  readonly headingSizePx: number;
  readonly cardStrokeWidth: number;
  readonly cardFill: ColourRole;
  readonly cardStroke: ColourRole;
  readonly cardSelectedFill: ColourRole;
};

export const CHROME_PANEL = {
  background: "duvetCream",
  accent: "resistanceRed",
} as const satisfies {
  readonly background: ColourRole;
  readonly accent: ColourRole;
};
