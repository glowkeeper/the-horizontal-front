import Phaser from "phaser";

import type {
  InterruptionConfig,
  InterruptionPresentationState,
} from "../../engine/types";
import type { InterruptionSkin } from "../../content/schemas/presentationSchema";
import type { ResistanceLayout } from "../layouts/resistanceLayout";
import { formatCopy } from "../../content/formatCopy";
import { createTextStyles, getThemeColour } from "../../theme/theme";
import { toColour } from "../sceneChrome";

export type InterruptionPresentation = {
  render(state: InterruptionPresentationState, elapsedMs: number): void;
};

type Handlers = {
  readonly select: (choiceId: string) => void;
  readonly hold: () => void;
  readonly announce: (id: string, copy: string) => void;
  readonly countInCopy: string;
  readonly copy: {
    readonly sequenceProgress: string;
    readonly holdReady: string;
    readonly holdHolding: string;
    readonly holdRelease: string;
  };
};

export function createInterruptionPresentation(
  scene: Phaser.Scene,
  layout: ResistanceLayout,
  handlers: Handlers,
): InterruptionPresentation {
  const firstSkin = layout.interruptionSkins.values().next().value;
  if (!firstSkin) return { render: () => undefined };

  const controls = layout.content.controls;
  const container = scene.add.container(
    layout.content.anchors.interruption.x,
    layout.content.anchors.interruption.y,
  ).setVisible(false);
  const background = scene.add.rectangle(
    0, 0, controls.interruptionPanelWidth, controls.interruptionPanelHeight,
  );
  const headline = scene.add.text(
    0, controls.interruptionHeadlineOffsetY, "",
    createTextStyles()[firstSkin.typography.headlineRole],
  ).setOrigin(0.5);
  const instruction = scene.add.text(
    0, controls.interruptionInstructionOffsetY, "",
    createTextStyles()[firstSkin.typography.instructionRole],
  ).setOrigin(0.5);
  const holdControl = scene.add.rectangle(
    0, controls.interruptionActionOffsetY,
    controls.interruptionHoldWidth, controls.interruptionHoldHeight,
  ).setVisible(false).setInteractive({ useHandCursor: true });
  const progress = scene.add.rectangle(
    -controls.interruptionHoldWidth / 2,
    controls.interruptionActionOffsetY,
    controls.interruptionHoldWidth,
    controls.interruptionHoldHeight,
  ).setOrigin(0, 0.5).setScale(0, 1).setVisible(false);
  const holdLabel = scene.add.text(
    0, controls.interruptionActionOffsetY, "",
    createTextStyles()[firstSkin.typography.actionRole],
  ).setOrigin(0.5).setVisible(false);
  holdControl.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
    const event = pointer.event;
    if (event instanceof PointerEvent) scene.game.canvas.setPointerCapture(event.pointerId);
    handlers.hold();
  });
  container.add([background, headline, instruction, holdControl, progress, holdLabel]);

  let renderedInterruptionId: string | null = null;
  let renderedSkinId: string | null = null;
  let choices: Array<{
    id: string;
    control: Phaser.GameObjects.Rectangle;
    label: Phaser.GameObjects.Text;
  }> = [];

  function skinFor(interruption: InterruptionConfig): InterruptionSkin {
    const skin = layout.interruptionSkins.get(interruption.id);
    if (!skin) throw new Error(`Missing resolved interruption skin for ${interruption.id}`);
    return skin;
  }

  function applySkin(skin: InterruptionSkin): void {
    if (renderedSkinId === skin.id) return;
    renderedSkinId = skin.id;
    container.setDepth(skin.layerDepth);
    background
      .setFillStyle(toColour(skin.panel.fill), skin.panel.fillAlpha)
      .setStrokeStyle(skin.panel.strokeWidth, toColour(skin.panel.stroke));
    headline.setStyle({
      ...createTextStyles()[skin.typography.headlineRole],
      fontSize: skin.typography.headlineSizePx,
    });
    instruction
      .setStyle({
        ...createTextStyles()[skin.typography.instructionRole],
        fontSize: skin.typography.instructionSizePx,
        color: getThemeColour(skin.typography.instructionColour),
      });
    holdControl
      .setFillStyle(toColour(skin.hold.fill))
      .setStrokeStyle(skin.hold.strokeWidth, toColour(skin.hold.stroke));
    progress.setFillStyle(
      toColour(skin.hold.progressFill), skin.hold.progressAlpha,
    );
    holdLabel.setStyle({
      ...createTextStyles()[skin.typography.actionRole],
      fontSize: skin.typography.actionSizePx,
      color: getThemeColour(skin.typography.actionColour),
    });
    for (const choice of choices) styleChoice(choice, skin);
  }

  function configureChoices(
    interruption: InterruptionConfig,
    skin: InterruptionSkin,
  ): void {
    if (renderedInterruptionId === interruption.id) return;
    for (const choice of choices) {
      choice.control.destroy();
      choice.label.destroy();
    }
    choices = [];
    renderedInterruptionId = interruption.id;
    if (interruption.interaction.kind !== "sequence") return;
    const count = interruption.interaction.choices.length;
    const width = controls.interruptionChoiceWidth;
    const gap = controls.interruptionChoiceGap;
    const totalWidth = count * width + (count - 1) * gap;
    interruption.interaction.choices.forEach((choice, index) => {
      const x = -totalWidth / 2 + width / 2 + index * (width + gap);
      const control = scene.add.rectangle(
        x, controls.interruptionActionOffsetY,
        width, controls.interruptionChoiceHeight,
      ).setInteractive({ useHandCursor: true });
      const label = scene.add.text(
        x, controls.interruptionActionOffsetY, choice.label,
        createTextStyles()[skin.typography.actionRole],
      ).setOrigin(0.5);
      const visual = { id: choice.id, control, label };
      styleChoice(visual, skin);
      control.on("pointerup", () => handlers.select(choice.id));
      container.add([control, label]);
      choices.push(visual);
    });
  }

  function styleChoice(
    choice: { control: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text },
    skin: InterruptionSkin,
  ): void {
    choice.control
      .setFillStyle(toColour(skin.choice.fill))
      .setStrokeStyle(skin.choice.strokeWidth, toColour(skin.choice.stroke));
    choice.label.setStyle({
      ...createTextStyles()[skin.typography.actionRole],
      fontSize: skin.typography.actionSizePx,
      color: getThemeColour(skin.typography.actionColour),
    });
  }

  function hideActions(): void {
    holdControl.setVisible(false);
    holdLabel.setVisible(false);
    progress.setVisible(false);
    choices.forEach(({ control, label }) => {
      control.setVisible(false);
      label.setVisible(false);
    });
  }

  function announceState(id: string, copy: string): void {
    handlers.announce(id, copy);
  }

  function setStateStyle(
    skin: InterruptionSkin,
    state: keyof InterruptionSkin["states"],
  ): void {
    const style = skin.states[state];
    container.setVisible(style.contentVisible);
    background.setVisible(style.panelVisible);
    headline.setColor(getThemeColour(style.headlineColour));
  }

  applySkin(firstSkin);

  return {
    render(state, elapsedMs) {
      if (state.stage === "resistance") {
        container.setVisible(false);
        return;
      }
      const { interruption } = state;
      const skin = skinFor(interruption);
      applySkin(skin);
      configureChoices(interruption, skin);
      container.setVisible(true);
      headline.setVisible(true);

      if (state.stage === "warning") {
        setStateStyle(skin, "warning");
        announceState(`${interruption.id}:warning`, interruption.copy.warning);
        instruction.setVisible(false);
        hideActions();
        headline.setText(interruption.copy.warning);
        return;
      }

      instruction.setVisible(true);
      if (state.stage === "returning") {
        setStateStyle(skin, "returning");
        announceState(`${interruption.id}:returning`, interruption.copy.returning);
        headline.setText(interruption.copy.returning);
        instruction.setText(handlers.countInCopy);
        hideActions();
        return;
      }

      if (state.stage === "resolved") {
        const feedback = state.state.feedback;
        const message = feedback === "success" ? interruption.copy.success
          : feedback === "expired" ? interruption.copy.expired
          : feedback === "cancelled" ? interruption.copy.cancelled
          : interruption.copy.failure;
        setStateStyle(skin, feedback === "success" ? "success"
          : feedback === "cancelled" ? "cancelled" : "failure");
        announceState(`${interruption.id}:resolved:${feedback}`, message);
        headline.setText(message);
        instruction.setText("");
        hideActions();
        return;
      }

      setStateStyle(skin, "active");
      announceState(`${interruption.id}:active`, interruption.copy.status);
      headline.setText(interruption.copy.headline);
      if (interruption.interaction.kind === "sequence") {
        const expected = interruption.interaction.steps[state.state.sequenceStep];
        instruction.setText(formatCopy(handlers.copy.sequenceProgress, {
          instruction: interruption.copy.instruction,
          current: state.state.sequenceStep + 1,
          total: interruption.interaction.steps.length,
        }));
        choices.forEach(({ id, control, label }) => {
          const active = id === expected;
          control.setVisible(true).setFillStyle(toColour(
            active ? skin.choice.activeFill : skin.choice.fill,
          ));
          label.setVisible(true).setAlpha(
            active ? skin.choice.activeLabelAlpha : skin.choice.inactiveLabelAlpha,
          );
        });
        holdControl.setVisible(false);
        holdLabel.setVisible(false);
        progress.setVisible(false);
        return;
      }

      choices.forEach(({ control, label }) => {
        control.setVisible(false);
        label.setVisible(false);
      });
      holdControl.setVisible(true);
      const startedAt = state.state.holdStartedAtMs;
      const amount = startedAt === null ? 0 : Phaser.Math.Clamp(
        (elapsedMs - startedAt) / interruption.interaction.requiredHoldMs,
        0, 1,
      );
      holdLabel.setVisible(true).setText(startedAt === null
        ? handlers.copy.holdReady
        : amount >= 1 ? handlers.copy.holdRelease : handlers.copy.holdHolding);
      progress.setVisible(startedAt !== null).setScale(amount, 1);
      instruction.setText(interruption.copy.instruction);
    },
  };
}
