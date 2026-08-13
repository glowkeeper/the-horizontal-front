import Phaser from "phaser";

import { loadEpisode } from "../../content/loadEpisode";
import type { Episode } from "../../content/schemas/episodeSchema";
import {
  advanceResistance,
  applyResistanceInput,
  createResistance,
  getNextRhythmCue,
} from "../../engine/resistance";
import type {
  Resistance,
  ResistanceSide,
  RhythmJudgement,
} from "../../engine/types";
import { getResistanceControlAction } from "../../input/resistanceInput";
import { createTextStyles, getThemeColour } from "../../theme/theme";
import {
  createResistanceLayout,
  type ResistanceLayout,
} from "../layouts/resistanceLayout";

const MAXIMUM_FRAME_DELTA_MS = 100;

type ResistanceSceneData = {
  readonly episode: unknown;
};

export class ResistanceScene extends Phaser.Scene {
  private resistance!: Resistance;
  private episode!: Episode;
  private layout!: ResistanceLayout;
  private confrontationTimeMs = 0;
  private finished = false;
  private lastReportedExpiredStep = -1;
  private lastAnnouncedNowStep = -1;

  private leftCue!: Phaser.GameObjects.Arc;
  private rightCue!: Phaser.GameObjects.Arc;
  private feedback!: Phaser.GameObjects.Text;
  private nextCue!: Phaser.GameObjects.Text;
  private timeRemaining!: Phaser.GameObjects.Text;
  private result!: Phaser.GameObjects.Text;
  private restart!: Phaser.GameObjects.Text;

  public constructor() {
    super({ key: "ResistanceScene" });
  }

  public init(data: ResistanceSceneData): void {
    this.episode = loadEpisode(data.episode);
  }

  public create(): void {
    this.resistance = createResistance(
      this.episode.confrontation.resistance,
    );
    this.confrontationTimeMs = 0;
    this.finished = false;
    this.lastReportedExpiredStep = -1;
    this.lastAnnouncedNowStep = -1;

    this.createBedroom();
    this.createRhythmInterface();
    this.bindInput();
    this.updateAccessibleStatus(
      "Hold the line. Follow the alternating left and right rhythm.",
    );
  }

  public update(_time: number, deltaMs: number): void {
    if (this.finished) {
      return;
    }

    this.confrontationTimeMs += Math.min(
      deltaMs,
      MAXIMUM_FRAME_DELTA_MS,
    );
    this.resistance = advanceResistance(
      this.resistance,
      this.confrontationTimeMs,
    );

    this.renderResistance();

    if (this.resistance.state.outcome !== "active") {
      this.finishConfrontation();
    }
  }

  private createBedroom(): void {
    this.layout = createResistanceLayout(
      this,
      this.episode.confrontation.presentation,
    );
    const { anchors } = this.layout.content;

    this.add
      .text(anchors.title.x, anchors.title.y, "HOLD THE LINE", {
        ...createTextStyles().notice,
        fontSize: "25px",
      })
      .setOrigin(0.5);

    this.timeRemaining = this.add
      .text(anchors.time.x, anchors.time.y, "25.0", {
        ...createTextStyles().status,
        color: getThemeColour("inkCharcoal"),
      })
      .setOrigin(0.5);

    this.result = this.add
      .text(anchors.result.x, anchors.result.y, "", createTextStyles().title)
      .setOrigin(0.5)
      .setDepth(20)
      .setVisible(false);

    this.restart = this.add
      .text(anchors.restart.x, anchors.restart.y, "PRESS R OR TAP TO RESIST AGAIN", {
        ...createTextStyles().body,
        fontSize: "22px",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setVisible(false);
  }

  private createRhythmInterface(): void {
    const colours = this.colours();
    const { anchors, controls } = this.layout.content;

    this.leftCue = this.add
      .circle(
        anchors.leftControl.x,
        anchors.leftControl.y,
        controls.radius,
        colours.paperWhite,
      )
      .setStrokeStyle(controls.strokeWidth, colours.resistanceRed);
    this.rightCue = this.add
      .circle(
        anchors.rightControl.x,
        anchors.rightControl.y,
        controls.radius,
        colours.paperWhite,
      )
      .setStrokeStyle(controls.strokeWidth, colours.resistanceRed);

    this.add
      .text(anchors.leftControl.x, anchors.leftControl.y, "LEFT\nA / ←", {
        ...createTextStyles().notice,
        fontSize: "15px",
      })
      .setOrigin(0.5);
    this.add
      .text(anchors.rightControl.x, anchors.rightControl.y, "RIGHT\nL / →", {
        ...createTextStyles().notice,
        fontSize: "15px",
      })
      .setOrigin(0.5);

    this.feedback = this.add
      .text(anchors.feedback.x, anchors.feedback.y, "FOLLOW THE PULSE", {
        ...createTextStyles().status,
        fontSize: "19px",
      })
      .setOrigin(0.5);

    this.nextCue = this.add
      .text(anchors.nextCue.x, anchors.nextCue.y, "", {
        ...createTextStyles().notice,
        color: getThemeColour("resistanceRed"),
        fontSize: "20px",
      })
      .setOrigin(0.5);
  }

  private bindInput(): void {
    const keyboard = this.input.keyboard;

    keyboard?.addCapture([
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
    ]);
    keyboard?.on("keydown", (event: KeyboardEvent) => {
      const action = getResistanceControlAction(event);
      if (action?.kind === "resist") {
        this.handleResistanceInput(action.side);
      } else if (action?.kind === "restart") {
        this.restartConfrontation();
      }
    });

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.finished) {
        this.restartConfrontation();
        return;
      }

      this.handleResistanceInput(
        pointer.worldX < this.cameras.main.centerX ? "left" : "right",
      );
    });
  }

  private handleResistanceInput(side: ResistanceSide): void {
    if (this.finished) {
      return;
    }

    this.resistance = applyResistanceInput(this.resistance, {
      side,
      atMs: this.confrontationTimeMs,
    });
    this.renderJudgement(
      this.resistance.state.lastRhythmJudgement,
    );
  }

  private renderResistance(): void {
    const state = this.resistance.state;
    const cue = getNextRhythmCue(this.resistance);

    if (
      state.lastRhythmJudgement?.kind === "miss"
      && state.lastRhythmJudgement.reason === "expired"
      && state.lastRhythmJudgement.step !== this.lastReportedExpiredStep
    ) {
      this.lastReportedExpiredStep = state.lastRhythmJudgement.step;
      this.renderJudgement(state.lastRhythmJudgement);
    }

    this.layout.render(state.duvetSafety);

    const remainingMs = Math.max(
      0,
      this.resistance.config.durationMs - state.elapsedMs,
    );
    this.timeRemaining.setText(`${(remainingMs / 1_000).toFixed(1)} SECONDS`);

    this.leftCue.setScale(1);
    this.rightCue.setScale(1);
    this.leftCue.setFillStyle(this.colours().paperWhite);
    this.rightCue.setFillStyle(this.colours().paperWhite);

    if (cue) {
      const distanceMs = Math.abs(cue.atMs - state.elapsedMs);
      const isNow = distanceMs
        <= this.resistance.config.rhythm.timingWindowMs;
      const pulse = Math.max(
        0,
        1 - distanceMs / this.resistance.config.rhythm.beatIntervalMs,
      );
      const expectedCue = cue.side === "left" ? this.leftCue : this.rightCue;
      if (isNow) {
        expectedCue.setFillStyle(this.colours().managementGold);
      }
      expectedCue.setScale(1 + pulse * this.layout.content.controls.pulseScale);
      this.nextCue.setText(
        isNow ? `NOW: ${cue.side.toUpperCase()}` : "",
      );

      if (isNow && cue.step !== this.lastAnnouncedNowStep) {
        this.lastAnnouncedNowStep = cue.step;

        if (
          state.lastRhythmJudgement?.kind === "miss"
          && state.lastRhythmJudgement.reason === "early"
          && state.lastRhythmJudgement.step === cue.step
        ) {
          this.feedback
            .setColor(getThemeColour("inkCharcoal"))
            .setText(`TAP — ${cue.side.toUpperCase()}`);
        }
      }
    }
  }

  private renderJudgement(
    judgement: RhythmJudgement | null,
  ): void {
    if (!judgement) {
      return;
    }

    const feedbackSide = judgement.actualSide ?? judgement.expectedSide;
    const cue = feedbackSide === "left" ? this.leftCue : this.rightCue;
    this.tweens.add({
      targets: cue,
      scaleX: 1.35,
      scaleY: 1.35,
      alpha: 0.35,
      duration: 90,
      yoyo: true,
    });
    this.feedback.setScale(1.12);
    this.tweens.add({
      targets: this.feedback,
      scaleX: 1,
      scaleY: 1,
      duration: 140,
      ease: "Back.Out",
    });

    if (judgement.kind === "hit") {
      this.feedback
        .setColor(getThemeColour("resistanceRed"))
        .setText(
          `✓ HIT — ${judgement.expectedSide.toUpperCase()}\nSOLIDARITY! ✊ 🛏️`,
        );
      return;
    }

    this.feedback.setColor(getThemeColour("inkCharcoal"));

    if (judgement.reason === "wrong-side") {
      this.feedback.setText(
        `✕ WRONG KEY — ${judgement.expectedSide.toUpperCase()} NEEDED`,
      );
      return;
    }

    if (judgement.reason === "early") {
      this.feedback.setText(
        `✕ TOO EARLY — ${judgement.expectedSide.toUpperCase()} ON NOW`,
      );
      return;
    }

    this.feedback.setText(
      `✕ MISSED — ${judgement.expectedSide.toUpperCase()}`,
    );
  }

  private finishConfrontation(): void {
    this.finished = true;
    const victory = this.resistance.state.outcome === "victory";
    const resultContent = victory
      ? this.episode.results.victory
      : this.episode.results.forcedVerticalisation;

    this.result
      .setText(resultContent.headline)
      .setColor(
        victory
          ? getThemeColour("resistanceRed")
          : getThemeColour("workLightBlue"),
      )
      .setVisible(true);
    this.restart.setVisible(true);
    this.feedback.setText(victory ? "REST, BRIEFLY" : "MANAGEMENT PREVAILS");

    if (victory) {
      this.layout.animateVictory();
    } else {
      this.layout.animateForcedVerticalisation();
    }

    this.updateAccessibleStatus(
      victory
        ? "Victory. The line holds. Press R or tap to resist again."
        : "Forced verticalisation. Press R or tap to resist again.",
    );
  }

  private restartConfrontation(): void {
    if (this.finished) {
      this.scene.restart({ episode: this.episode });
    }
  }

  private colours() {
    return {
      duvetCream: this.colour("duvetCream"),
      inkCharcoal: this.colour("inkCharcoal"),
      resistanceRed: this.colour("resistanceRed"),
      workLightBlue: this.colour("workLightBlue"),
      managementGold: this.colour("managementGold"),
      paperWhite: this.colour("paperWhite"),
    };
  }

  private colour(role: Parameters<typeof getThemeColour>[0]): number {
    return Phaser.Display.Color.HexStringToColor(getThemeColour(role)).color;
  }

  private updateAccessibleStatus(message: string): void {
    const status = document.querySelector<HTMLElement>("#game-status");

    if (status) {
      status.textContent = message;
    }
  }
}
