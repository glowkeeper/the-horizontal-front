export const contentIdPattern = /^(?!\d+$)(?!.*(?:^|-)\d+(?:-|$))[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const assetFilePattern = /^(?:shared|campaigns\/[a-z0-9]+(?:-[a-z0-9]+)*|episodes\/[a-z0-9]+(?:-[a-z0-9]+)*)\/[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\/[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)*\.(?:png|webp)$/;

export const copyPlaceholderPattern = /\{([a-zA-Z][a-zA-Z0-9]*)\}/g;
export const maximumCampaignsWithoutPaging = 5;

export function getCopyPlaceholders(template) {
  return [...template.matchAll(copyPlaceholderPattern)].map((match) => match[1]);
}

export function hasStrayCopyBraces(template) {
  return template.replace(copyPlaceholderPattern, "").includes("{")
    || template.replace(copyPlaceholderPattern, "").includes("}");
}

export const placeholderIdSegments = new Set([
  "prototype",
  "placeholder",
  "draft",
  "wip",
  "temp",
  "tmp",
  "untitled",
  "todo",
  "foo",
  "bar",
  "baz",
  "lorem",
  "mock",
  "stub",
]);

export function findPlaceholderIdSegment(id) {
  return id.split("-").find((segment) => placeholderIdSegments.has(segment));
}

/**
 * Prototype vocabulary that is unambiguous in player-facing prose.
 *
 * This is deliberately narrower than `placeholderIdSegments`. An ID segment is
 * a chosen name, so "draft" or "temp" there is a tell; in a sentence they are
 * ordinary English — a draft from the window, the office temperature — and
 * matching them would flag real writing. Only terms with no innocent reading in
 * player copy belong here.
 */
export const placeholderCopyTerms = [
  "placeholder",
  "lorem ipsum",
  "todo",
  "tbd",
  "fixme",
  "wip",
  "untitled",
];

export function findPlaceholderCopyTerm(copy) {
  const haystack = copy.toLowerCase();
  return placeholderCopyTerms.find((term) =>
    new RegExp(`\\b${term.replace(/ /g, "\\s+")}\\b`).test(haystack));
}

/**
 * Prototype vocabulary in a shipped file path, checked per path segment so a
 * word only matches when it was chosen as a name rather than embedded in one.
 */
export function findPlaceholderPathSegment(file) {
  return file
    .replace(/\.(?:png|webp)$/, "")
    .split(/[/-]/)
    .find((segment) => placeholderIdSegments.has(segment));
}
