export function formatCopy(
  template: string,
  values: Readonly<Record<string, string | number>>,
): string {
  const supplied = new Set(Object.keys(values));
  const used = new Set<string>();
  if (hasStrayCopyBraces(template)) throw new Error("copy template contains stray braces");
  const result = template.replace(copyPlaceholderPattern, (_, key) => {
    if (!supplied.has(key)) throw new Error(`missing copy value: ${key}`);
    used.add(key);
    return String(values[key]);
  });
  const unused = [...supplied].filter((key) => !used.has(key));
  if (unused.length > 0) throw new Error(`unused copy values: ${unused.join(", ")}`);
  return result;
}
import {
  copyPlaceholderPattern,
  hasStrayCopyBraces,
} from "./contentRules.mjs";
