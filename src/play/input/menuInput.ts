export type MenuAction = "previous" | "next" | "select" | "back" | "replay";

type KeyboardInput = Pick<KeyboardEvent, "code" | "repeat">;

export function getMenuAction(input: KeyboardInput): MenuAction | null {
  if (input.repeat) return null;
  switch (input.code) {
    case "ArrowLeft":
    case "ArrowUp":
      return "previous";
    case "ArrowRight":
    case "ArrowDown":
      return "next";
    case "Enter":
    case "Space":
      return "select";
    case "Escape":
      return "back";
    case "KeyR":
      return "replay";
    default:
      return null;
  }
}

export function moveSelection(
  current: number,
  direction: "previous" | "next",
  itemCount: number,
): number {
  if (!Number.isInteger(itemCount) || itemCount < 1) {
    throw new Error("menu must contain at least one item");
  }
  return direction === "next"
    ? (current + 1) % itemCount
    : (current - 1 + itemCount) % itemCount;
}
