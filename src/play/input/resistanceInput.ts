import type { ResistanceSide } from "../engine/types";

export type ResistanceControlAction =
  | { readonly kind: "resist"; readonly side: ResistanceSide; readonly action: "press" | "release" }
  | { readonly kind: "restart" }
  | { readonly kind: "continue" };

type KeyboardInput = Pick<KeyboardEvent, "code" | "repeat">;

export function getResistanceControlAction(
  input: KeyboardInput,
  action: "press" | "release" = "press",
): ResistanceControlAction | null {
  if (action === "press" && input.repeat) {
    return null;
  }

  switch (input.code) {
    case "KeyA":
    case "ArrowLeft":
      return { kind: "resist", side: "left", action };
    case "KeyL":
    case "ArrowRight":
      return { kind: "resist", side: "right", action };
    case "KeyR":
      return action === "press" ? { kind: "restart" } : null;
    case "Enter":
      return action === "press" ? { kind: "continue" } : null;
    default:
      return null;
  }
}
