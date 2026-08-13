import Phaser from "phaser";

import type { Campaign } from "../../content/loadGame";
import { formatCopy } from "../../content/formatCopy";
import { game } from "../../content/game";
import type { Episode } from "../../content/loadEpisode";
import {
  acceptCampaignOutcome,
  assertCampaignRunMatches,
  getCurrentCampaignEpisodeIndex,
  retryCampaignEpisode,
  type CampaignRun,
} from "../../engine/campaign";
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
import { announce, createButton } from "../sceneChrome";

const MAXIMUM_FRAME_DELTA_MS = 100;

type ResistanceSceneData = {
  readonly campaign: Campaign;
  readonly episode: unknown;
  readonly run: CampaignRun;
};

export class ResistanceScene extends Phaser.Scene {
  private resistance!: Resistance;
  private campaign!: Campaign;
  private episode!: Episode;
  private run!: CampaignRun;
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
  private transitioning = false;
  private outcomeActionsAvailable = false;

  public constructor() {
    super({ key: "ResistanceScene" });
  }

  public init(data: ResistanceSceneData): void {
    this.campaign = data.campaign;
    this.run = data.run;
    assertCampaignRunMatches(this.run, this.campaign.episodes.length);
    const episodeIndex = getCurrentCampaignEpisodeIndex(this.run);
    if (episodeIndex === null) throw new Error("Cannot start resistance for a completed campaign");
    this.episode = this.campaign.episodes[episodeIndex];
    if (!isEpisodeReference(data.episode, this.episode.id)) {
      throw new Error(`Resistance scene episode must be ${this.episode.id}`);
    }
  }

  public create(): void {
    this.resistance = createResistance(
      this.episode.confrontation.resistance,
    );
    this.confrontationTimeMs = 0;
    this.finished = false;
    this.transitioning = false;
    this.outcomeActionsAvailable = false;
    this.lastReportedExpiredStep = -1;
    this.lastAnnouncedNowStep = -1;

    this.createBedroom();
    this.createRhythmInterface();
    this.bindInput();
    announce(this.episode.confrontation.copy.instructionsStatus);
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
      this.episode,
    );
    const { anchors } = this.layout.content;

    this.add
      .text(anchors.title.x, anchors.title.y, this.episode.confrontation.copy.headline, {
        ...createTextStyles().notice,
        fontSize: "25px",
      })
      .setOrigin(0.5);

    this.timeRemaining = this.add
      .text(anchors.time.x, anchors.time.y, formatCopy(
        game.mechanics.resistance.secondsRemaining,
        { seconds: (this.episode.confrontation.resistance.durationMs / 1_000).toFixed(1) },
      ), {
        ...createTextStyles().status,
        color: getThemeColour("inkCharcoal"),
      })
      .setOrigin(0.5);

    this.result = this.add
      .text(anchors.result.x, anchors.result.y, "", createTextStyles().title)
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
      .text(anchors.leftControl.x, anchors.leftControl.y, game.mechanics.resistance.leftControl, {
        ...createTextStyles().notice,
        fontSize: "15px",
      })
      .setOrigin(0.5);
    this.add
      .text(anchors.rightControl.x, anchors.rightControl.y, game.mechanics.resistance.rightControl, {
        ...createTextStyles().notice,
        fontSize: "15px",
      })
      .setOrigin(0.5);

    this.feedback = this.add
      .text(anchors.feedback.x, anchors.feedback.y, game.mechanics.resistance.initialFeedback, {
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
      const action = getResistanceControlAction(event, "press");
      if (action?.kind === "resist") {
        this.handleResistanceInput(action.side, action.action);
      } else if (action?.kind === "restart") {
        this.restartConfrontation();
      } else if (action?.kind === "continue") {
        this.acceptOutcomeAndContinue();
      }
    });
    keyboard?.on("keyup", (event: KeyboardEvent) => {
      const action = getResistanceControlAction(event, "release");
      if (action?.kind === "resist") this.handleResistanceInput(action.side, action.action);
    });

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.finished) {
        return;
      }

      this.handleResistanceInput(pointerSide(pointer, this.cameras.main.centerX), "press");
    });
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (!this.finished) this.handleResistanceInput(pointerSide(pointer, this.cameras.main.centerX), "release");
    });
  }

  private handleResistanceInput(side: ResistanceSide, action: "press" | "release"): void {
    if (this.finished) {
      return;
    }

    this.resistance = applyResistanceInput(this.resistance, {
      side,
      action,
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

    this.layout.render(state.duvetSafety, state.dramaticIntensity);

    const remainingMs = Math.max(
      0,
      this.resistance.config.durationMs - state.elapsedMs,
    );
    this.timeRemaining.setText(formatCopy(
      game.mechanics.resistance.secondsRemaining,
      { seconds: (remainingMs / 1_000).toFixed(1) },
    ));

    this.leftCue.setScale(1);
    this.rightCue.setScale(1);
    this.leftCue.setFillStyle(this.colours().paperWhite);
    this.rightCue.setFillStyle(this.colours().paperWhite);

    if (cue) {
      const cueAtMs = state.activeHold?.step === cue.step
        ? (cue.releaseAtMs ?? cue.atMs)
        : cue.atMs;
      const distanceMs = Math.abs(cueAtMs - state.elapsedMs);
      const isNow = distanceMs
        <= cue.timingWindowMs;
      const pulse = Math.max(
        0,
        1 - distanceMs / Math.max(1, cue.timingWindowMs * 3),
      );
      const expectedCue = cue.side === "left" ? this.leftCue : this.rightCue;
      if (isNow) {
        expectedCue.setFillStyle(this.colours().managementGold);
      }
      expectedCue.setScale(1 + pulse * this.layout.content.controls.pulseScale);
      this.nextCue.setText(
        isNow
          ? formatCopy(
            cue.action === "hold" && state.activeHold
              ? game.mechanics.resistance.release
              : game.mechanics.resistance.now,
            {
              side: cue.side.toUpperCase(),
            },
          )
          : "",
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
            .setText(formatCopy(cue.action === "hold"
              ? game.mechanics.resistance.hold
              : game.mechanics.resistance.tap, {
              side: cue.side.toUpperCase(),
            }));
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
        .setText(formatCopy(game.mechanics.resistance.hit, {
          side: judgement.expectedSide.toUpperCase(),
        }));
      return;
    }

    this.feedback.setColor(getThemeColour("inkCharcoal"));

    if (judgement.reason === "wrong-side") {
      this.feedback.setText(formatCopy(game.mechanics.resistance.wrongSide, {
        side: judgement.expectedSide.toUpperCase(),
      }));
      return;
    }

    if (judgement.reason === "early") {
      this.feedback.setText(formatCopy(game.mechanics.resistance.tooEarly, {
        side: judgement.expectedSide.toUpperCase(),
      }));
      return;
    }

    if (judgement.reason === "released-early") {
      this.feedback.setText(formatCopy(game.mechanics.resistance.releasedEarly, {
        side: judgement.expectedSide.toUpperCase(),
      }));
      return;
    }

    this.feedback.setText(formatCopy(game.mechanics.resistance.missed, {
      side: judgement.expectedSide.toUpperCase(),
    }));
  }

  private finishConfrontation(): void {
    this.finished = true;
    this.nextCue.setText("");
    this.leftCue.setScale(1).setFillStyle(this.colours().paperWhite);
    this.rightCue.setScale(1).setFillStyle(this.colours().paperWhite);
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
    this.feedback.setText(resultContent.feedback);
    if (victory) {
      this.layout.animateVictory();
    } else {
      this.layout.animateForcedVerticalisation();
    }

    announce(formatCopy(game.interface.resolutionStatus, {
      outcome: resultContent.headline,
      feedback: resultContent.feedback,
    }));
    this.time.delayedCall(this.resistance.config.resolutionDurationMs, () => {
      this.createOutcomeActions(resultContent.headline, resultContent.feedback);
    });
  }

  private createOutcomeActions(outcome: string, feedback: string): void {
    if (this.transitioning) return;
    const { restart } = this.layout.content.anchors;
    createButton(this, restart.x - 220, restart.y, 360, game.interface.retryEpisode, () => {
      this.restartConfrontation();
    });
    createButton(this, restart.x + 220, restart.y, 360, game.interface.acceptOutcome, () => {
      this.acceptOutcomeAndContinue();
    });
    this.outcomeActionsAvailable = true;
    announce(formatCopy(game.interface.resultStatus, { outcome, feedback }));
  }

  private restartConfrontation(): void {
    if (this.finished && this.outcomeActionsAvailable && !this.transitioning) {
      this.transitioning = true;
      this.scene.restart({
        campaign: this.campaign,
        episode: this.episode,
        run: retryCampaignEpisode(this.run),
      });
    }
  }

  private acceptOutcomeAndContinue(): void {
    const outcome = this.resistance.state.outcome;
    if (!this.finished || !this.outcomeActionsAvailable || this.transitioning || outcome === "active") return;
    this.transitioning = true;

    const run = acceptCampaignOutcome(this.run, outcome);
    const nextEpisodeIndex = getCurrentCampaignEpisodeIndex(run);
    if (nextEpisodeIndex === null) {
      this.scene.start("CampaignDebriefingScene", {
        campaign: this.campaign,
        run,
      });
      return;
    }

    this.scene.start("ResistanceScene", {
      campaign: this.campaign,
      episode: this.campaign.episodes[nextEpisodeIndex],
      run,
    });
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

}

function pointerSide(pointer: Phaser.Input.Pointer, centreX: number): ResistanceSide {
  return pointer.worldX < centreX ? "left" : "right";
}

function isEpisodeReference(value: unknown, expectedId: string): boolean {
  return typeof value === "object" && value !== null
    && "id" in value && (value as { id?: unknown }).id === expectedId;
}
