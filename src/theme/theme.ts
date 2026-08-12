import type Phaser from "phaser";

export const colours = {
  canvasBackground: "#000000",
  primaryText: "#ffffff",
  secondaryText: "#cccccc",
} as const;

export const textStyles = {
  title: {
    color: colours.primaryText,
    fontFamily: "sans-serif",
    fontSize: "48px",
    fontStyle: "bold",
  },

  subtitle: {
    color: colours.secondaryText,
    fontFamily: "sans-serif",
    fontSize: "24px",
  },

  body: {
    color: colours.primaryText,
    fontFamily: "sans-serif",
    fontSize: "20px",
  },
} satisfies Record<string, Phaser.Types.GameObjects.Text.TextStyle>;