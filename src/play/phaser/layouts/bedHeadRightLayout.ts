import Phaser from "phaser";

import { loadPresentation } from "../../content/loadPresentation";
import type { Episode } from "../../content/loadEpisode";
import type {
  ResistanceLayoutContent,
  ShapePart,
} from "../../content/schemas/presentationSchema";
import { createTextStyles, getThemeColour } from "../../theme/theme";
import { getResistancePresentation } from "../presentation/resistancePresentation";
import type { ResistanceLayout } from "./resistanceLayout";

export function createBedHeadRightLayout(
  scene: Phaser.Scene,
  episode: Episode,
): ResistanceLayout {
  const { layout, skin, interruptionSkins } = loadPresentation(episode);
  const colours = getColours();
  const { backdrop, anchors, motion } = layout;

  scene.cameras.main.setBackgroundColor(colours.duvetCream);
  skin.environment.baseParts.forEach((part) => createShape(scene, part));
  if (!skin.environment.replacesLayoutBackdrop) {
    createRectangle(scene, backdrop.floor, colours.paperWhite)
      .setStrokeStyle(5, colours.inkCharcoal);
  }
  const workLight = createRectangle(
    scene,
    backdrop.workLight,
    colours.workLightBlue,
  ).setAlpha(motion.rest.workLightAlpha);
  const intensityParts = skin.environment.intensityParts.map(({ part }) =>
    createShape(scene, part));

  const bedContainer = scene.add.container(
    anchors.bedFootPivot.x,
    anchors.bedFootPivot.y,
  );
  const bedContents = scene.add.container(
    anchors.bedFromFoot.x,
    anchors.bedFromFoot.y,
  );
  const sleeper = scene.add.container(skin.bed.sleeperRestingX, 0);
  const staticParts = skin.bed.staticParts.map((part) =>
    createShape(scene, part));
  const sleeperParts = skin.bed.sleeperParts.map((part) =>
    createShape(scene, part));
  const duvet = createShape(scene, skin.bed.duvet);
  const duvetOverlayParts = skin.bed.duvetOverlayParts.map((part) =>
    createShape(scene, part));

  sleeper.add(sleeperParts);
  bedContents.add([...staticParts, duvet, sleeper, ...duvetOverlayParts]);
  bedContainer.add(bedContents);

  const management = scene.add.container(
    anchors.management.x,
    anchors.management.y,
  );
  const managementParts = skin.managementParts.map((part) => createShape(scene, part));
  management.add(managementParts);
  management.add(
    scene.add.text(0, 45, skin.copy.managementLabel, {
      ...createTextStyles().notice,
      fontSize: "16px",
      wordWrap: { width: 125 },
    }).setOrigin(0.5),
  );
  scene.add.text(
    anchors.managementCaption.x,
    anchors.managementCaption.y,
    layout.copy.managementCaption,
    {
      ...createTextStyles().notice,
      color: getThemeColour("managementGold"),
      fontSize: "14px",
    },
  ).setOrigin(0.5);

  return {
    content: layout,
    interruptionSkins,

    render(duvetSafety, dramaticIntensity): void {
      const state = getResistancePresentation(duvetSafety, dramaticIntensity, motion);
      const physicalDanger = 1 - clamp01(duvetSafety);
      bedContainer.setRotation(Phaser.Math.DegToRad(state.bedAngleDegrees));
      const duvetState = [...skin.bed.duvetStates]
        .reverse()
        .find(({ minimumDanger }) => physicalDanger >= minimumDanger);
      if (duvetState && duvet instanceof Phaser.GameObjects.Image) {
        duvet.setTexture(duvetState.asset.id)
          .setDisplaySize(skin.bed.duvet.shape === "image" ? skin.bed.duvet.width : duvet.displayWidth, skin.bed.duvet.shape === "image" ? skin.bed.duvet.height : duvet.displayHeight);
      }
      duvet.setX(skin.bed.duvetRestingX + state.duvetPullX);
      skin.bed.duvetOverlayParts.forEach((part, index) => {
        duvetOverlayParts[index].setX(part.x + state.duvetPullX);
      });
      sleeper.setX(skin.bed.sleeperRestingX + state.sleeperSlideX);
      workLight.setAlpha(state.workLightAlpha);
      skin.environment.intensityParts.forEach((layer, index) => {
        intensityParts[index]
          .setAlpha(linear(layer.restAlpha, layer.dangerAlpha, clamp01(dramaticIntensity)))
          .setX(layer.part.x + linear(
            layer.restOffsetX,
            layer.dangerOffsetX,
            clamp01(dramaticIntensity),
          ));
      });
      const managementState = [...skin.managementStates]
        .reverse()
        .find(({ minimumIntensity }) => dramaticIntensity >= minimumIntensity);
      managementState?.assets.forEach(({ partId, asset }) => {
        const partIndex = skin.managementParts.findIndex((part) => part.id === partId);
        const authoredPart = skin.managementParts[partIndex];
        const renderedPart = managementParts[partIndex];
        if (authoredPart?.shape === "image" && renderedPart instanceof Phaser.GameObjects.Image) {
          renderedPart.setTexture(asset.id)
            .setDisplaySize(authoredPart.width, authoredPart.height);
        }
      });
    },

    animateVictory(): void {
      addTween(scene, bedContainer, {
        rotation: 0,
        duration: motion.victory.durationMs,
        ease: motion.victory.ease,
      });
      addTween(scene, duvet, {
        x: skin.bed.duvetRestingX,
        duration: motion.victory.durationMs,
        ease: motion.victory.ease,
      });
      skin.bed.duvetOverlayParts.forEach((part, index) => {
        addTween(scene, duvetOverlayParts[index], {
          x: part.x,
          duration: motion.victory.durationMs,
          ease: motion.victory.ease,
        });
      });
      addTween(scene, sleeper, {
        x: skin.bed.sleeperRestingX,
        duration: motion.victory.durationMs,
        ease: motion.victory.ease,
      });
      addTween(scene, workLight, {
        alpha: motion.rest.workLightAlpha,
        duration: motion.victory.durationMs,
      });
    },

    animateForcedVerticalisation(): void {
      const forced = motion.forcedVerticalisation;
      addTween(scene, bedContainer, {
        rotation: Phaser.Math.DegToRad(forced.bedAngleDegrees),
        duration: forced.bedDurationMs,
        ease: forced.bedEase,
      });
      addTween(scene, sleeper, {
        x: forced.sleeperX,
        y: forced.sleeperY,
        rotation: Phaser.Math.DegToRad(forced.sleeperAngleDegrees),
        duration: forced.sleeperDurationMs,
        ease: forced.sleeperEase,
      });
      addTween(scene, duvet, {
        x: forced.duvetX,
        alpha: forced.duvetAlpha,
        duration: forced.duvetDurationMs,
        ease: forced.duvetEase,
      });
      skin.bed.duvetOverlayParts.forEach((part, index) => {
        addTween(scene, duvetOverlayParts[index], {
          x: part.x + forced.duvetX - skin.bed.duvetRestingX,
          alpha: forced.duvetAlpha,
          duration: forced.duvetDurationMs,
          ease: forced.duvetEase,
        });
      });
    },
  };
}

function createShape(scene: Phaser.Scene, part: ShapePart) {
  if (part.shape === "image") {
    return scene.add.image(part.x, part.y, part.asset.id)
      .setDisplaySize(part.width, part.height)
      .setOrigin(part.originX ?? 0.5, part.originY ?? 0.5)
      .setFlipX(part.flipX ?? false)
      .setRotation(Phaser.Math.DegToRad(part.angleDegrees ?? 0));
  }

  const fill = colour(part.fill);
  let object: Phaser.GameObjects.Shape;

  switch (part.shape) {
    case "rectangle":
      object = scene.add.rectangle(part.x, part.y, part.width, part.height, fill);
      break;
    case "ellipse":
      object = scene.add.ellipse(part.x, part.y, part.width, part.height, fill);
      break;
    case "circle":
      object = scene.add.circle(part.x, part.y, part.radius, fill);
      break;
    case "triangle": {
      const [x1, y1, x2, y2, x3, y3] = part.points;
      object = scene.add.triangle(part.x, part.y, x1, y1, x2, y2, x3, y3, fill);
      break;
    }
  }

  object.setOrigin(part.originX ?? 0.5, part.originY ?? 0.5);
  object.setRotation(Phaser.Math.DegToRad(part.angleDegrees ?? 0));
  if (part.stroke && part.strokeWidth !== undefined) {
    object.setStrokeStyle(part.strokeWidth, colour(part.stroke));
  }
  return object;
}

function createRectangle(
  scene: Phaser.Scene,
  rectangle: ResistanceLayoutContent["backdrop"]["floor"],
  fill: number,
) {
  return scene.add.rectangle(
    rectangle.x,
    rectangle.y,
    rectangle.width,
    rectangle.height,
    fill,
  ).setOrigin(rectangle.originX ?? 0.5, rectangle.originY ?? 0.5);
}

function addTween(
  scene: Phaser.Scene,
  targets: Phaser.GameObjects.GameObject,
  config: Omit<Phaser.Types.Tweens.TweenBuilderConfig, "targets">,
): void {
  scene.tweens.add({ targets, ...config });
}

function getColours() {
  return {
    duvetCream: colour("duvetCream"),
    inkCharcoal: colour("inkCharcoal"),
    workLightBlue: colour("workLightBlue"),
    paperWhite: colour("paperWhite"),
  };
}

function colour(role: Parameters<typeof getThemeColour>[0]): number {
  return Phaser.Display.Color.HexStringToColor(getThemeColour(role)).color;
}

function linear(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
