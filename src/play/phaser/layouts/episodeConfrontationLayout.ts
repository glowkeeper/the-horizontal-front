import Phaser from "phaser";

import type { Episode } from "../../content/loadEpisode";
import { loadPresentation } from "../../content/loadPresentation";
import type { ShapePart } from "../../content/schemas/presentationSchema";
import { createTextStyles, getThemeColour } from "../../theme/theme";
import {
  advanceStrainPhase,
  getActorStrainOffset,
  resolveActorStrain,
} from "../presentation/actorStrain";
import { getResistancePresentation } from "../presentation/resistancePresentation";
import {
  getResistanceAngleDegrees,
  resolveResistanceTransition,
  selectResistanceStateIndex,
  smoothResistanceAngleDegrees,
} from "../presentation/resistanceTransition";
import type { ResistanceLayout, ResistanceStateListener } from "./resistanceLayout";

// A backgrounded tab reports one enormous frame on return. Clamping the delta
// keeps time-stepped motion continuous instead of leaping a whole second.
const MAXIMUM_FRAME_DELTA_MS = 100;

export function createEpisodeConfrontationLayout(
  scene: Phaser.Scene,
  episode: Episode,
  onResistanceStateChange?: ResistanceStateListener,
): ResistanceLayout {
  const { layout, skin, interruptionSkins } = loadPresentation(episode);
  const { backdrop, anchors, motion } = layout;
  const resistanceVisual = skin.confrontation.resistance;

  scene.cameras.main.setBackgroundColor(colour(backdrop.background));
  skin.confrontation.environment.baseParts.forEach((part) => createShape(scene, part));
  if (!skin.confrontation.environment.replacesLayoutBackdrop) {
    createRectangle(scene, backdrop.floor, colour(backdrop.floor.fill))
      .setStrokeStyle(backdrop.floor.strokeWidth, colour(backdrop.floor.stroke));
  }
  const workLight = createRectangle(
    scene,
    backdrop.workLight,
    colour(backdrop.workLight.fill),
  ).setAlpha(motion.rest.workLightAlpha);
  const intensityParts = skin.confrontation.environment.intensityParts.map(({ part }) =>
    createShape(scene, part));

  const resistanceContainer = scene.add.container(resistanceVisual.x, resistanceVisual.y);
  const resistanceImages = [0, 1].map((_, index) =>
    scene.add.image(0, 0, resistanceVisual.states[0].asset.id)
      .setDisplaySize(resistanceVisual.width, resistanceVisual.height)
      .setOrigin(resistanceVisual.originX ?? 0.5, resistanceVisual.originY ?? 0.5)
      .setAlpha(index === 0 ? 1 : 0));
  resistanceContainer.add(resistanceImages);
  let activeResistanceSlot = 0;
  let activeResistanceState = 0;
  const slotDrawnAngle = [
    resistanceVisual.states[0].drawnAngleDegrees,
    resistanceVisual.states[0].drawnAngleDegrees,
  ];
  let smoothedLiftDegrees = 0;
  const reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")
    .matches ?? false;
  const resistanceMotion = resolveResistanceTransition(
    resistanceVisual.transition,
    resistanceVisual.reducedMotion,
    reducedMotion,
  );

  function transitionToResistance(targetState: number): void {
    if (targetState === activeResistanceState) return;
    const direction = Math.sign(targetState - activeResistanceState);
    onResistanceStateChange?.(direction > 0 ? 1 : -1);
    const outgoing = resistanceImages[activeResistanceSlot];
    const incomingSlot = 1 - activeResistanceSlot;
    const incoming = resistanceImages[incomingSlot];

    scene.tweens.killTweensOf(outgoing);
    scene.tweens.killTweensOf(incoming);
    scene.tweens.killTweensOf(resistanceContainer);
    resistanceContainer.setPosition(resistanceVisual.x, resistanceVisual.y);
    slotDrawnAngle[incomingSlot] = resistanceVisual.states[targetState].drawnAngleDegrees;
    incoming
      .setTexture(resistanceVisual.states[targetState].asset.id)
      .setDisplaySize(resistanceVisual.width, resistanceVisual.height)
      .setPosition(resistanceMotion.joltX * direction, resistanceMotion.joltY * direction)
      .setAlpha(Math.max(0, 1 - outgoing.alpha));

    if (resistanceMotion.crossfadeDurationMs === 0) {
      outgoing.setAlpha(0);
      incoming.setAlpha(1).setPosition(0, 0);
    } else {
      addTween(scene, outgoing, {
        alpha: 0,
        duration: resistanceMotion.crossfadeDurationMs,
        ease: resistanceVisual.transition.ease,
      });
      addTween(scene, incoming, {
        alpha: 1,
        x: 0,
        y: 0,
        duration: resistanceMotion.crossfadeDurationMs,
        ease: resistanceVisual.transition.ease,
      });
    }
    if (resistanceMotion.shakeAmplitude > 0 && resistanceMotion.shakeDurationMs > 0) {
      addTween(scene, resistanceContainer, {
        x: resistanceVisual.x + resistanceMotion.shakeAmplitude * direction,
        duration: Math.max(1, Math.floor(resistanceMotion.shakeDurationMs / 4)),
        ease: resistanceVisual.transition.ease,
        yoyo: true,
        repeat: 1,
        onComplete: () => resistanceContainer.setPosition(resistanceVisual.x, resistanceVisual.y),
      });
    }
    activeResistanceSlot = incomingSlot;
    activeResistanceState = targetState;
  }

  const opposingActor = scene.add.container(
    anchors.opposingActor.x,
    anchors.opposingActor.y,
  );
  const actorStrain = resolveActorStrain(
    skin.confrontation.opposingActor.strain,
    skin.confrontation.opposingActor.reducedMotion,
    reducedMotion,
  );
  let actorStrainPhase = 0;
  const opposingActorParts = skin.confrontation.opposingActor.parts.map((part) =>
    createShape(scene, part));
  opposingActor.add(opposingActorParts);
  const typography = skin.confrontation.typography;
  opposingActor.add(
    scene.add.text(
      0,
      typography.opposingActorLabel.offsetY,
      skin.confrontation.copy.opposingActorLabel,
      {
        ...createTextStyles().notice,
        color: getThemeColour(typography.opposingActorLabel.colour),
        fontSize: `${typography.opposingActorLabel.sizePx}px`,
        wordWrap: { width: typography.opposingActorLabel.wrapWidth },
      },
    ).setOrigin(0.5),
  );
  scene.add.text(
    anchors.pressureCaption.x,
    anchors.pressureCaption.y,
    skin.confrontation.copy.pressureCaption,
    {
      ...createTextStyles().notice,
      color: getThemeColour(typography.pressureCaption.colour),
      fontSize: `${typography.pressureCaption.sizePx}px`,
    },
  ).setOrigin(0.5);

  return {
    content: layout,
    interruptionSkins,

    render(resistanceSafety, dramaticIntensity): void {
      const presentation = getResistancePresentation(
        resistanceSafety,
        dramaticIntensity,
        motion,
      );
      const physicalDanger = 1 - clamp01(resistanceSafety);
      const targetAngle = getResistanceAngleDegrees(
        physicalDanger,
        resistanceVisual.dangerAngleDegrees,
      );
      smoothedLiftDegrees = smoothResistanceAngleDegrees(
        smoothedLiftDegrees,
        targetAngle,
        Math.min(scene.game.loop.delta, MAXIMUM_FRAME_DELTA_MS),
        resistanceMotion.rotationResponseMs,
      );
      transitionToResistance(selectResistanceStateIndex(physicalDanger, resistanceVisual.states));
      // Rotate each slot by the part of the lift its own drawing is missing, so
      // the subject holds one continuous angle while the artwork beneath it
      // changes. A state swap becomes a change of drawing rather than a jump.
      resistanceImages.forEach((image, slot) => {
        image.setRotation(Phaser.Math.DegToRad(smoothedLiftDegrees - slotDrawnAngle[slot]));
      });
      workLight.setAlpha(presentation.workLightAlpha);

      skin.confrontation.environment.intensityParts.forEach((layer, index) => {
        intensityParts[index]
          .setAlpha(linear(layer.restAlpha, layer.dangerAlpha, clamp01(dramaticIntensity)))
          .setX(layer.part.x + linear(
            layer.restOffsetX,
            layer.dangerOffsetX,
            clamp01(dramaticIntensity),
          ));
      });
      actorStrainPhase = advanceStrainPhase(
        actorStrainPhase,
        dramaticIntensity,
        Math.min(scene.game.loop.delta, MAXIMUM_FRAME_DELTA_MS),
        actorStrain,
      );
      const strainOffset = getActorStrainOffset(
        actorStrainPhase,
        dramaticIntensity,
        actorStrain,
      );
      opposingActor.setPosition(
        anchors.opposingActor.x + strainOffset.x,
        anchors.opposingActor.y + strainOffset.y,
      );
      const actorState = [...skin.confrontation.opposingActor.states]
        .reverse()
        .find(({ minimumIntensity }) => dramaticIntensity >= minimumIntensity);
      actorState?.assets.forEach(({ partId, asset }) => {
        const partIndex = skin.confrontation.opposingActor.parts.findIndex(({ id }) => id === partId);
        const authoredPart = skin.confrontation.opposingActor.parts[partIndex];
        const renderedPart = opposingActorParts[partIndex];
        if (authoredPart?.shape === "image" && renderedPart instanceof Phaser.GameObjects.Image) {
          renderedPart.setTexture(asset.id)
            .setDisplaySize(authoredPart.width, authoredPart.height);
        }
      });
    },

    animateVictory(): void {
      transitionToResistance(0);
      addTween(scene, resistanceContainer, {
        rotation: 0,
        duration: motion.victory.durationMs,
        ease: motion.victory.ease,
      });
      addTween(scene, workLight, {
        alpha: motion.rest.workLightAlpha,
        duration: motion.victory.durationMs,
      });
    },

    animateForcedVerticalisation(): void {
      transitionToResistance(resistanceVisual.states.length - 1);
      addTween(scene, resistanceContainer, {
        rotation: Phaser.Math.DegToRad(resistanceVisual.dangerAngleDegrees),
        duration: motion.forcedVerticalisation.durationMs,
        ease: motion.forcedVerticalisation.ease,
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

type DesignRectangle = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly originX?: number;
  readonly originY?: number;
};

function createRectangle(
  scene: Phaser.Scene,
  rectangle: DesignRectangle,
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

function colour(role: Parameters<typeof getThemeColour>[0]): number {
  return Phaser.Display.Color.HexStringToColor(getThemeColour(role)).color;
}

function linear(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
