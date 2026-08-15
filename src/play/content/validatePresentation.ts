import type {
  ResistanceLayoutContent,
  ResistanceSkin,
  ShapePart,
} from "./schemas/presentationSchema";

export function assertSensiblePresentation(
  layout: ResistanceLayoutContent,
  skin: ResistanceSkin,
  assetIds: ReadonlySet<string>,
): void {
  const { width, height } = layout.designSize;

  for (const [name, point] of Object.entries(layout.anchors)) {
    assertWithinCanvas(`anchor ${name}`, point.x, point.y, width, height);
  }

  const { leftControl, feedback, rightControl } = layout.anchors;
  const statusPanel = layout.statusPanel.frame;
  const statusLeft = statusPanel.x
    - statusPanel.width * (statusPanel.originX ?? 0.5);
  const statusTop = statusPanel.y
    - statusPanel.height * (statusPanel.originY ?? 0.5);
  if (
    statusLeft < 0
    || statusTop < 0
    || statusLeft + statusPanel.width > width
    || statusTop + statusPanel.height > height
  ) {
    throw new Error("status panel must fit within the design canvas");
  }
  if (!(leftControl.x < feedback.x && feedback.x < rightControl.x)) {
    throw new Error("control anchors must read left, feedback, right");
  }
  if (leftControl.y !== rightControl.y) {
    throw new Error("control anchors must share a horizontal rhythm lane");
  }
  for (const [name, control] of [
    ["leftControl", leftControl],
    ["rightControl", rightControl],
  ] as const) {
    const halfGateWidth = layout.controls.maximumTimingWindowMs
      * layout.controls.noteTravelPixelsPerMs
      + layout.controls.gateStrokeWidth;
    const halfGateHeight = layout.controls.gateHeight / 2
      + layout.controls.gateStrokeWidth;
    if (
      control.x - halfGateWidth < 0 || control.x + halfGateWidth > width
      || control.y - halfGateHeight < 0
      || control.y + layout.controls.controlLabelOffsetY > height
    ) {
      throw new Error(`${name} must fit within the design canvas`);
    }
  }
  const markerHalfWidth = Math.max(
    layout.controls.cueLabelWidth,
    layout.controls.pauseBandWidth,
  ) / 2;
  const markerTop = feedback.y - layout.controls.pauseBandHeight / 2;
  if (
    feedback.x - markerHalfWidth < 0
    || feedback.x + markerHalfWidth > width
    || markerTop < 0
  ) {
    throw new Error("central pause band must fit within the design canvas");
  }
  if (
    layout.controls.activeGateStrokeWidth < layout.controls.gateStrokeWidth
    || layout.controls.noteRadius * 2 >= layout.controls.gateHeight
  ) {
    throw new Error("rhythm gate must contain distinct travelling notes");
  }
  if (
    layout.controls.emitterWidth >= layout.controls.pauseBandWidth
    || layout.controls.emitterHeight > layout.controls.gateHeight
  ) {
    throw new Error("centre emitter must remain subordinate to rhythm controls");
  }
  const interruption = layout.anchors.interruption;
  const panelHalfWidth = layout.controls.interruptionPanelWidth / 2;
  const panelHalfHeight = layout.controls.interruptionPanelHeight / 2;
  if (
    interruption.x - panelHalfWidth < 0
    || interruption.x + panelHalfWidth > width
    || interruption.y - panelHalfHeight < 0
    || interruption.y + panelHalfHeight > height
  ) {
    throw new Error("interruption panel must fit within the design canvas");
  }
  const maximumChoiceRowWidth = layout.controls.interruptionChoiceWidth * 3
    + layout.controls.interruptionChoiceGap * 2;
  if (maximumChoiceRowWidth > layout.controls.interruptionPanelWidth) {
    throw new Error("interruption choices must fit within the panel");
  }
  if (
    layout.controls.interruptionChoiceWidth < 44
    || layout.controls.interruptionChoiceHeight < 44
    || layout.controls.interruptionHoldWidth < 44
    || layout.controls.interruptionHoldHeight < 44
  ) {
    throw new Error("interruption controls must provide enhanced pointer targets");
  }

  if (
    layout.motion.danger.workLightAlpha
    < layout.motion.rest.workLightAlpha
  ) {
    throw new Error("work light must not weaken as danger increases");
  }

  assertUniquePartIds("opposing actor parts", skin.confrontation.opposingActor.parts);
  assertUniquePartIds("environment base parts", skin.confrontation.environment.baseParts);
  assertUniquePartIds(
    "environment intensity parts",
    skin.confrontation.environment.intensityParts.map(({ part }) => part),
  );
  for (const part of [
    ...skin.confrontation.environment.baseParts,
    ...skin.confrontation.environment.intensityParts.map(({ part }) => part),
    ...skin.confrontation.opposingActor.parts,
  ]) {
    if (part.shape === "image" && !assetIds.has(part.asset.id)) {
      throw new Error(`unknown presentation asset: ${part.asset.id}`);
    }
  }
  assertWithinCanvas(
    "confrontation resistance anchor",
    skin.confrontation.resistance.x,
    skin.confrontation.resistance.y,
    width,
    height,
  );
  for (const state of skin.confrontation.resistance.states) {
    if (!assetIds.has(state.asset.id)) {
      throw new Error(`unknown presentation asset: ${state.asset.id}`);
    }
  }
  const actorPartsById = new Map(skin.confrontation.opposingActor.parts.map((part) => [part.id, part]));
  for (const state of skin.confrontation.opposingActor.states) {
    for (const reference of state.assets) {
      const part = actorPartsById.get(reference.partId);
      if (part === undefined) {
        throw new Error(`opposing-actor state references unknown part: ${reference.partId}`);
      }
      if (part.shape !== "image") {
        throw new Error(`opposing-actor state part must be an image: ${reference.partId}`);
      }
      if (!assetIds.has(reference.asset.id)) {
        throw new Error(`unknown presentation asset: ${reference.asset.id}`);
      }
    }
  }

}

function assertWithinCanvas(
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  if (x < 0 || x > width || y < 0 || y > height) {
    throw new Error(`${name} must be within the design canvas`);
  }
}

function assertUniquePartIds(name: string, parts: readonly ShapePart[]): void {
  const ids = parts.map(({ id }) => id);
  if (new Set(ids).size !== ids.length) {
    throw new Error(`${name} must have unique semantic IDs`);
  }
}
