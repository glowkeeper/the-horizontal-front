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
