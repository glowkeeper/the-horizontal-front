import type Phaser from "phaser";

const cssColourRoles = {
  duvetCream: "--colour-duvet-cream",
  inkCharcoal: "--colour-ink-charcoal",
  resistanceRed: "--colour-resistance-red",
  workLightBlue: "--colour-work-light-blue",
  managementGold: "--colour-management-gold",
  paperWhite: "--colour-paper-white",
} as const;

const cssTypographyRoles = {
  game: "--font-game",
} as const;

export type ColourRole = keyof typeof cssColourRoles;

export function getThemeColour(role: ColourRole): string {
  return getCssToken(cssColourRoles[role]);
}

const cssButtonVariants = {
  primary: {
    fill: "--button-primary-fill",
    label: "--button-primary-label",
  },
  secondary: {
    fill: "--button-secondary-fill",
    label: "--button-secondary-label",
  },
} as const;

export type ButtonVariant = keyof typeof cssButtonVariants;

export type ButtonStyle = {
  readonly fill: string;
  readonly label: string;
  readonly border: string;
  readonly shadow: string;
  readonly borderWidth: number;
  readonly shadowOffset: number;
  readonly hoverShadowOffset: number;
  readonly hoverLift: number;
  readonly activeShadowOffset: number;
  readonly activePress: number;
};

/**
 * Resolves the shared button contract from `src/shared/theme/tokens.css`, the
 * single source of truth that the public site consumes directly in CSS. The
 * canvas cannot use that stylesheet, so it reads the same custom properties
 * here instead of restating the values.
 */
export function getButtonStyle(variant: ButtonVariant): ButtonStyle {
  return {
    fill: getCssToken(cssButtonVariants[variant].fill),
    label: getCssToken(cssButtonVariants[variant].label),
    border: getCssToken("--button-border"),
    shadow: getCssToken("--button-shadow"),
    borderWidth: getCssPixels("--button-border-width"),
    shadowOffset: getCssPixels("--button-shadow-offset"),
    hoverShadowOffset: getCssPixels("--button-hover-shadow-offset"),
    hoverLift: getCssPixels("--button-hover-lift"),
    activeShadowOffset: getCssPixels("--button-active-shadow-offset"),
    activePress: getCssPixels("--button-active-press"),
  };
}

function getCssPixels(token: string): number {
  const value = Number.parseFloat(getCssToken(token));
  if (!Number.isFinite(value)) {
    throw new Error(`Shared theme token must be a length in pixels: ${token}`);
  }
  return value;
}

function getCssToken(token: string): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim();

  if (!value) {
    throw new Error(`Missing shared theme token: ${token}`);
  }

  return value;
}

export function createTextStyles(): Record<
  "notice" | "title" | "body" | "status",
  Phaser.Types.GameObjects.Text.TextStyle
> {
  const shared = {
    align: "center" as const,
    fontFamily: getCssToken(cssTypographyRoles.game),
  };

  return {
    notice: {
      ...shared,
      color: getThemeColour("inkCharcoal"),
      fontSize: "18px",
      fontStyle: "bold",
      letterSpacing: 3,
    },
    title: {
      ...shared,
      color: getThemeColour("resistanceRed"),
      fontSize: "58px",
      fontStyle: "bold",
      lineSpacing: 6,
      wordWrap: { width: 980 },
    },
    body: {
      ...shared,
      color: getThemeColour("inkCharcoal"),
      fontSize: "29px",
    },
    status: {
      ...shared,
      color: getThemeColour("workLightBlue"),
      fontSize: "25px",
      fontStyle: "bold",
    },
  };
}
