import type { SequenceInterruptionConfig } from "../engine/types";

type KeyboardInput = Pick<KeyboardEvent, "code" | "repeat">;

export function getSequenceChoiceForKey(
  input: KeyboardInput,
  choices: SequenceInterruptionConfig["choices"],
): string | null {
  if (input.repeat) return null;
  return choices.find(({ key }) => key === input.code)?.id ?? null;
}

export function getHoldActionForKey(
  input: KeyboardInput,
  action: "press" | "release",
): "press" | "release" | null {
  if (input.code !== "Space" || (action === "press" && input.repeat)) return null;
  return action;
}
