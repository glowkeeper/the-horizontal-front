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
