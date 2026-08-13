import type { ResistanceSide } from "../engine/types";

export type ResistanceControlAction =
  | { readonly kind: "resist"; readonly side: ResistanceSide }
  | { readonly kind: "restart" }
  | { readonly kind: "continue" };

type KeyboardInput = Pick<KeyboardEvent, "code" | "repeat">;

export function getResistanceControlAction(
  input: KeyboardInput,
): ResistanceControlAction | null {
  if (input.repeat) {
    return null;
  }

  switch (input.code) {
    case "KeyA":
    case "ArrowLeft":
      return { kind: "resist", side: "left" };
    case "KeyL":
    case "ArrowRight":
      return { kind: "resist", side: "right" };
    case "KeyR":
      return { kind: "restart" };
    case "Enter":
      return { kind: "continue" };
    default:
      return null;
  }
}
