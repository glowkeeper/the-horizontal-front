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
    if (name === "bedFromFoot") {
      continue;
    }
    assertWithinCanvas(`anchor ${name}`, point.x, point.y, width, height);
  }

  const { leftControl, feedback, rightControl, bedFootPivot, bedFromFoot } =
    layout.anchors;
  if (!(leftControl.x < feedback.x && feedback.x < rightControl.x)) {
    throw new Error("control anchors must read left, feedback, right");
  }
  for (const [name, control] of [
    ["leftControl", leftControl],
    ["rightControl", rightControl],
  ] as const) {
    const radius = layout.controls.radius + layout.controls.strokeWidth;
    if (
      control.x - radius < 0 || control.x + radius > width
      || control.y - radius < 0 || control.y + radius > height
    ) {
      throw new Error(`${name} must fit within the design canvas`);
    }
    const approachRadius = layout.controls.timingApproachRadius
      + layout.controls.timingRingStrokeWidth;
    if (
      control.x - approachRadius < 0
      || control.x + approachRadius > width
      || control.y - approachRadius < 0
      || control.y + approachRadius > height
    ) {
      throw new Error(`${name} timing approach must fit within the design canvas`);
    }
  }
  const markerHalfWidth = layout.controls.cueLabelWidth / 2;
  const markerTop = feedback.y - layout.controls.cueOffsetY
    - layout.controls.timingApproachRadius;
  if (
    feedback.x - markerHalfWidth < 0
    || feedback.x + markerHalfWidth > width
    || markerTop < 0
  ) {
    throw new Error("central rhythm cue must fit within the design canvas");
  }
  if (
    layout.controls.activeStrokeWidth < layout.controls.strokeWidth
    || layout.controls.timingTargetRadius
      <= layout.controls.radius + layout.controls.activeStrokeWidth
    || layout.controls.timingApproachRadius <= layout.controls.timingTargetRadius
  ) {
    throw new Error("rhythm cue sizes must surround the control and express an approach");
  }

  if (bedFromFoot.x <= 0) {
    throw new Error("bedFromFoot must place the head to the right of the foot");
  }
  if (layout.anchors.management.x <= bedFootPivot.x) {
    throw new Error("management must stand at the head side of the bed");
  }
  if (
    layout.motion.danger.bedAngleDegrees >= 0
    || layout.motion.forcedVerticalisation.bedAngleDegrees
      > layout.motion.danger.bedAngleDegrees
  ) {
    throw new Error("lift-head motion must raise the right-hand head");
  }
  if (
    layout.motion.danger.duvetX > 0
    || layout.motion.danger.sleeperX > 0
  ) {
    throw new Error("duvet and sleeper must slide downhill toward the left foot");
  }
  if (
    layout.motion.danger.workLightAlpha
    < layout.motion.rest.workLightAlpha
  ) {
    throw new Error("work light must not weaken as danger increases");
  }

  assertUniquePartIds("bed static parts", skin.bed.staticParts);
  assertUniquePartIds("sleeper parts", skin.bed.sleeperParts);
  assertUniquePartIds("management parts", skin.managementParts);
  assertRequiredParts(skin.bed.staticParts, ["frame", "mattress", "pillow"]);
  assertRequiredParts(skin.bed.sleeperParts, ["body", "head"]);
  assertRequiredParts(skin.managementParts, ["body", "head", "lifting-arm"]);

  if (skin.bed.duvet.id !== "duvet") {
    throw new Error('bed duvet part must have the semantic ID "duvet"');
  }
  if (skin.bed.duvet.x !== skin.bed.duvetRestingX) {
    throw new Error("duvetRestingX must match the duvet composition position");
  }

  for (const part of [
    ...skin.bed.staticParts,
    ...skin.bed.sleeperParts,
    skin.bed.duvet,
    ...skin.managementParts,
  ]) {
    if (part.shape === "image" && !assetIds.has(part.asset.id)) {
      throw new Error(`unknown presentation asset: ${part.asset.id}`);
    }
  }

  const initialParts = [
    ...skin.bed.staticParts,
    ...skin.bed.sleeperParts,
    skin.bed.duvet,
  ];
  for (const part of initialParts) {
    const bounds = getPartBounds(part);
    const left = bedFootPivot.x + bedFromFoot.x + bounds.left;
    const right = bedFootPivot.x + bedFromFoot.x + bounds.right;
    const top = bedFootPivot.y + bedFromFoot.y + bounds.top;
    const bottom = bedFootPivot.y + bedFromFoot.y + bounds.bottom;
    if (left < 0 || right > width || top < 0 || bottom > height) {
      throw new Error(`bed part ${part.id} starts outside the design canvas`);
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

function assertRequiredParts(
  parts: readonly ShapePart[],
  requiredIds: readonly string[],
): void {
  const ids = new Set(parts.map(({ id }) => id));
  for (const id of requiredIds) {
    if (!ids.has(id)) {
      throw new Error(`composition is missing required part: ${id}`);
    }
  }
}

function getPartBounds(part: ShapePart) {
  if (part.shape === "circle") {
    return {
      left: part.x - part.radius,
      right: part.x + part.radius,
      top: part.y - part.radius,
      bottom: part.y + part.radius,
    };
  }
  if (part.shape === "triangle") {
    const xs = [part.points[0], part.points[2], part.points[4]];
    const ys = [part.points[1], part.points[3], part.points[5]];
    return {
      left: part.x + Math.min(...xs),
      right: part.x + Math.max(...xs),
      top: part.y + Math.min(...ys),
      bottom: part.y + Math.max(...ys),
    };
  }
  return {
    left: part.x - part.width / 2,
    right: part.x + part.width / 2,
    top: part.y - part.height / 2,
    bottom: part.y + part.height / 2,
  };
}
