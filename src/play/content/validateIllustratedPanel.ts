import type { IllustratedPanelLayoutContent } from "./schemas/presentationSchema";

export function assertSensibleIllustratedPanel(
  layout: IllustratedPanelLayoutContent,
): void {
  const { designSize, illustration, semanticContent, anchors } = layout;
  for (const [name, rectangle] of Object.entries({ illustration, semanticContent })) {
    if (rectangle.x < 0 || rectangle.y < 0
      || rectangle.x + rectangle.width > designSize.width
      || rectangle.y + rectangle.height > designSize.height) {
      throw new Error(`${name} must fit within the illustrated-panel design canvas`);
    }
  }
  if (illustration.x + illustration.width >= semanticContent.x) {
    throw new Error("illustration and semantic content must remain separate");
  }
  const ratio = illustration.width / semanticContent.width;
  if (ratio < 1.8 || ratio > 2.2) {
    throw new Error("illustration and semantic content must preserve an approximately 2:1 width ratio");
  }
  for (const [name, point] of Object.entries(anchors)) {
    if (point.x < semanticContent.x
      || point.x > semanticContent.x + semanticContent.width
      || point.y < semanticContent.y
      || point.y > semanticContent.y + semanticContent.height) {
      throw new Error(`${name} anchor must remain inside semantic content`);
    }
  }
  if (anchors.primaryAction.y >= anchors.secondaryAction.y) {
    throw new Error("primary action must precede secondary action");
  }
}
