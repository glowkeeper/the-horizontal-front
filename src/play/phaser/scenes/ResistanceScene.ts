import Phaser from "phaser";

import {
  collectDueCreaks,
  createCreakState,
  type CreakState,
} from "../../audio/creakScheduler";
import {
  collectDueCues,
  createCueScheduler,
  type CueSchedulerState,
} from "../../audio/cueScheduler";
import {
  createSoundscapePlayer,
  type SoundscapePlayer,
} from "../../audio/soundscapePlayer";
import type { Campaign } from "../../content/loadGame";
import type { AudioCueRole } from "../../content/schemas/audioSchema";
import { formatCopy } from "../../content/formatCopy";
import { game } from "../../content/game";
import { resolveIllustrationAsset } from "../../content/presentationAssets";
import type { Episode } from "../../content/loadEpisode";
import {
  acceptCampaignOutcome,
  assertCampaignRunMatches,
  getCurrentCampaignEpisodeIndex,
  retryCampaignEpisode,
  type CampaignRun,
} from "../../engine/campaign";
import {
  getNextRhythmCue,
  getRhythmGuide,
} from "../../engine/resistance";
import {
  advanceConfrontation,
  applyConfrontationInput,
  createConfrontation,
  getConfrontationControlOwner,
  getInterruptionPresentationState,
} from "../../engine/confrontation";
import type {
  Confrontation,
  Resistance,
  ResistanceSide,
  RhythmJudgement,
  RhythmGuideItem,
} from "../../engine/types";
import { getResistanceControlAction } from "../../input/resistanceInput";
import {
  getHoldActionForKey,
  getSequenceChoiceForKey,
} from "../../input/interruptionInput";
import { createTextStyles, getThemeColour } from "../../theme/theme";
import {
  createResistanceLayout,
  type ResistanceLayout,
} from "../layouts/resistanceLayout";
import { announce, createButton } from "../sceneChrome";
import {
  getRhythmGateWidth,
  getRhythmNotePosition,
  getVisibleLaneSegment,
} from "../presentation/rhythmGuidePresentation";
import {
  createInterruptionPresentation,
  type InterruptionPresentation,
} from "../presentation/interruptionPresentation";
import { createIllustratedSemanticPanel } from "../presentation/illustratedSemanticPanel";
import type {
  ColourRole,
  IllustratedPanelLayoutContent,
  ResistanceLayoutContent,
} from "../../content/schemas/presentationSchema";

const MAXIMUM_FRAME_DELTA_MS = 100;

type ResistanceSceneData = {
  readonly campaign: Campaign;
  readonly episode: unknown;
  readonly run: CampaignRun;
};

type ResolvedColourGroup<T> = { readonly [K in keyof T]: number };

type AuthoredPalette =
  ResistanceLayoutContent["rhythmPresentation"]["palette"];

type ResolvedRhythmPalette = {
  readonly gate: ResolvedColourGroup<AuthoredPalette["gate"]>;
  readonly note: ResolvedColourGroup<AuthoredPalette["note"]>;
  readonly emitter: ResolvedColourGroup<AuthoredPalette["emitter"]>;
  readonly pauseBand: ResolvedColourGroup<AuthoredPalette["pauseBand"]>;
  readonly successfulNote: ResolvedColourGroup<AuthoredPalette["successfulNote"]>;
  readonly expiredNote: ResolvedColourGroup<AuthoredPalette["expiredNote"]>;
  readonly brokenHold: ResolvedColourGroup<AuthoredPalette["brokenHold"]>;
  readonly label: AuthoredPalette["label"];
  readonly status: AuthoredPalette["status"];
  readonly feedback: AuthoredPalette["feedback"];
  readonly result: AuthoredPalette["result"];
};

type RhythmGuideVisual = {
  readonly note: Phaser.GameObjects.Arc;
  readonly tail: Phaser.GameObjects.Arc;
  readonly holdBar: Phaser.GameObjects.Rectangle;
  readonly heldBar: Phaser.GameObjects.Rectangle;
};

export class ResistanceScene extends Phaser.Scene {
  private resistance!: Resistance;
  private confrontation!: Confrontation;
  private campaign!: Campaign;
  private episode!: Episode;
  private run!: CampaignRun;
  private layout!: ResistanceLayout;
  private confrontationTimeMs = 0;
  private finished = false;
  private lastReportedExpiredStep = -1;
  private lastAnnouncedNowStep = -1;
  private audio!: SoundscapePlayer;
  private cueScheduler: CueSchedulerState = createCueScheduler();
  private countInScheduler: CueSchedulerState = createCueScheduler();
  private beatScheduler: CueSchedulerState = createCueScheduler();
  private creakState: CreakState = createCreakState();
  private downbeatScheduler: CueSchedulerState = createCueScheduler();
  private approachScheduler: CueSchedulerState = createCueScheduler();
  private scoredCueTimesMs: readonly number[] = [];
  private scoredCueSides: readonly ResistanceSide[] = [];
  private approachTimesMs: readonly number[] = [];
  private approachSides: readonly ResistanceSide[] = [];
  private countInTimesMs: readonly number[] = [];
  private unaccentedBeatTimesMs: readonly number[] = [];
  private downbeatTimesMs: readonly number[] = [];
  private holdSounding = false;

  private leftCue!: Phaser.GameObjects.Rectangle;
  private rightCue!: Phaser.GameObjects.Rectangle;
  private leftBeatLine!: Phaser.GameObjects.Rectangle;
  private rightBeatLine!: Phaser.GameObjects.Rectangle;
  private rhythmEmitter!: Phaser.GameObjects.Rectangle;
  private leftCueLabel!: Phaser.GameObjects.Text;
  private rightCueLabel!: Phaser.GameObjects.Text;
  private feedback!: Phaser.GameObjects.Text;
  private cueLabel!: Phaser.GameObjects.Text;
  private pauseBand!: Phaser.GameObjects.Rectangle;
  private guideVisuals: RhythmGuideVisual[] = [];
  private timeRemaining!: Phaser.GameObjects.Text;
  private result!: Phaser.GameObjects.Text;
  private transitioning = false;
  private outcomeActionsAvailable = false;
  private illustratedOutcomeLayout: IllustratedPanelLayoutContent | null = null;
  private resolvedPalette!: ResolvedRhythmPalette;
  private interruptionPresentation!: InterruptionPresentation;
  private announcedInterruptionState: string | null = null;

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
    this.confrontation = createConfrontation({
      resistance: this.episode.confrontation.resistance,
      interruptions: this.episode.confrontation.interruptions,
    });
    this.resistance = this.confrontation.resistance;
    this.confrontationTimeMs = 0;
    this.finished = false;
    this.transitioning = false;
    this.outcomeActionsAvailable = false;
    this.illustratedOutcomeLayout = null;
    this.lastReportedExpiredStep = -1;
    this.lastAnnouncedNowStep = -1;
    this.announcedInterruptionState = null;

    this.audio = createSoundscapePlayer(this.episode.audio);
    this.cueScheduler = createCueScheduler();
    this.countInScheduler = createCueScheduler();
    this.beatScheduler = createCueScheduler();
    this.creakState = createCreakState();
    this.downbeatScheduler = createCueScheduler();
    this.approachScheduler = createCueScheduler();
    this.holdSounding = false;
    // The apparatus strikes on every scored cue: that beat is what the player
    // is answering, so it comes from the compiled score rather than a metronome
    // running alongside it.
    const resistanceConfig = this.episode.confrontation.resistance;
    this.scoredCueTimesMs = resistanceConfig.cues.map(({ atMs }) => atMs);
    this.scoredCueSides = resistanceConfig.cues.map(({ side }) => side);
    this.countInTimesMs = resistanceConfig.guideEvents
      .filter((event) => event.action === "count-in")
      .map(({ atMs }) => atMs);
    // Each demand is announced before it lands, so the player can hear which
    // side is coming while there is still time to answer it. An approach that
    // would fall on a strike is dropped rather than doubled, for the same
    // reason the pulse yields to a demand: the louder event owns the moment.
    const accented = new Set(this.scoredCueTimesMs);
    const approaches = resistanceConfig.cues
      .map((cue) => ({ atMs: cue.approachAtMs, side: cue.side }))
      .filter(({ atMs }) => !accented.has(atMs))
      .sort((left, right) => left.atMs - right.atMs);
    this.approachTimesMs = approaches.map(({ atMs }) => atMs);
    this.approachSides = approaches.map(({ side }) => side);
    // The apparatus keeps time underneath, but a beat that already carries a
    // sided demand is not doubled: the demand is the accent on that beat.
    //
    // The cycle marker is the exception, and sounds even under a demand. Most
    // rhythms begin their cycle by asking for something, so a marker that
    // yielded would fall silent precisely when the bar turns over — which is
    // the one moment it exists to mark. It is centred and low against the sided
    // strikes, so the two read as one event rather than a flam.
    const downbeats = new Set(resistanceConfig.downbeatTimesMs);
    this.downbeatTimesMs = resistanceConfig.downbeatTimesMs;
    this.unaccentedBeatTimesMs = resistanceConfig.beatTimesMs
      .filter((atMs) => !accented.has(atMs) && !downbeats.has(atMs));
    // Browsers keep audio suspended until a gesture. Arriving here always
    // followed one, but the resume is asynchronous, so ask on entry.
    void this.audio.unlock();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.audio.stop());

    this.createBedroom();
    this.createRhythmInterface();
    this.interruptionPresentation = createInterruptionPresentation(
      this,
      this.layout,
      {
        select: (choiceId) => this.applyInterruptionInput({
          kind: "sequence", choiceId,
        }),
        hold: () => this.applyInterruptionInput({ kind: "hold", action: "press" }),
        announce: (id, copy) => this.announceInterruptionState(id, copy),
        countInCopy: game.mechanics.resistance.cueCountIn,
        copy: game.mechanics.interruptions,
      },
    );
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
    this.confrontation = advanceConfrontation(
      this.confrontation,
      this.confrontationTimeMs,
    );
    this.resistance = this.confrontation.resistance;

    this.scheduleAudioCues();
    this.renderResistance();

    if (this.resistance.state.outcome !== "active") {
      this.finishConfrontation();
    }
  }

  /**
   * Commit the next moments of the score to the audio device.
   *
   * The window is one frame of lookahead, which is all it takes to remove
   * render-loop jitter from the rhythm: the device places each sound on its own
   * clock instead of whenever a frame happens to land.
   */
  private scheduleAudioCues(): void {
    const elapsedMs = this.resistance.state.elapsedMs;
    const countIn = collectDueCues(
      this.countInScheduler,
      this.countInTimesMs,
      elapsedMs,
      MAXIMUM_FRAME_DELTA_MS,
    );
    this.countInScheduler = countIn.next;
    for (const cue of countIn.due) this.audio.schedule("count-in", cue.inMs);

    const scored = collectDueCues(
      this.cueScheduler,
      this.scoredCueTimesMs,
      elapsedMs,
      MAXIMUM_FRAME_DELTA_MS,
    );
    this.cueScheduler = scored.next;
    for (const cue of scored.due) {
      this.audio.schedule(
        this.scoredCueSides[cue.index] === "left" ? "cue-due-left" : "cue-due-right",
        cue.inMs,
      );
    }

    const approaching = collectDueCues(
      this.approachScheduler,
      this.approachTimesMs,
      elapsedMs,
      MAXIMUM_FRAME_DELTA_MS,
    );
    this.approachScheduler = approaching.next;
    for (const cue of approaching.due) {
      this.audio.schedule(
        this.approachSides[cue.index] === "left"
          ? "cue-approach-left"
          : "cue-approach-right",
        cue.inMs,
      );
    }

    const cycle = collectDueCues(
      this.downbeatScheduler,
      this.downbeatTimesMs,
      elapsedMs,
      MAXIMUM_FRAME_DELTA_MS,
    );
    this.downbeatScheduler = cycle.next;
    for (const beat of cycle.due) this.audio.schedule("downbeat", beat.inMs);

    const pulse = collectDueCues(
      this.beatScheduler,
      this.unaccentedBeatTimesMs,
      elapsedMs,
      MAXIMUM_FRAME_DELTA_MS,
    );
    this.beatScheduler = pulse.next;
    for (const beat of pulse.due) this.audio.schedule("beat", beat.inMs);

    this.audio.setIntensity(this.resistance.state.dramaticIntensity);
    // The structure complains under load: discrete creaks whose rate and
    // amplitude both climb with the same physical danger the bed is drawn from,
    // so what the player sees lifting and what they hear working are one
    // signal rather than two presentations that can disagree.
    const danger = 1 - this.resistance.state.duvetSafety;
    this.audio.setDanger(danger);
    const creak = collectDueCreaks(
      this.creakState,
      danger,
      elapsedMs,
      this.episode.audio.resistanceCreak,
    );
    this.creakState = creak.next;
    for (const burst of creak.due) {
      this.audio.playScaled(
        this.episode.audio.resistanceCreak.cue,
        burst.inMs,
        burst.gainScale,
      );
    }

    // A hold begins on the press, which produces no judgement of its own.
    const holding = this.resistance.state.activeHold !== null;
    if (holding && !this.holdSounding) this.audio.play("hold-start");
    this.holdSounding = holding;
  }

  private createBedroom(): void {
    this.layout = createResistanceLayout(
      this,
      this.episode,
      // The bed itself, hauled up a notch or settling back. Judgement cues
      // answer the player; this answers Management.
      (direction) => this.audio.play(
        direction > 0 ? "resistance-strain" : "resistance-ease",
      ),
    );
    this.resolvedPalette = this.resolvePalette();
    const palette = this.resolvedPalette;
    const { anchors } = this.layout.content;
    const presentation = this.layout.content.rhythmPresentation;
    const statusPanel = this.layout.content.statusPanel;

    this.add.rectangle(
      statusPanel.frame.x,
      statusPanel.frame.y,
      statusPanel.frame.width,
      statusPanel.frame.height,
      this.colour(statusPanel.fill),
      statusPanel.fillAlpha,
    )
      .setOrigin(
        statusPanel.frame.originX ?? 0.5,
        statusPanel.frame.originY ?? 0.5,
      )
      .setStrokeStyle(
        statusPanel.strokeWidth,
        this.colour(statusPanel.stroke),
      );

    this.add
      .text(anchors.title.x, anchors.title.y, this.episode.confrontation.copy.headline, {
        ...createTextStyles().notice,
        fontSize: presentation.typography.titleSizePx,
      })
      .setOrigin(0.5);

    this.timeRemaining = this.add
      .text(anchors.time.x, anchors.time.y, formatCopy(
        game.mechanics.resistance.secondsRemaining,
        { seconds: (this.episode.confrontation.resistance.durationMs / 1_000).toFixed(1) },
      ), {
        ...createTextStyles().status,
        color: getThemeColour(palette.status.timeRemaining),
      })
      .setOrigin(0.5);

    this.result = this.add
      .text(anchors.result.x, anchors.result.y, "", createTextStyles().title)
      .setOrigin(0.5)
      .setDepth(presentation.layers.result)
      .setVisible(false);

  }

  private createRhythmInterface(): void {
    const palette = this.resolvedPalette;
    const { anchors, controls } = this.layout.content;
    const presentation = this.layout.content.rhythmPresentation;
    const maximumGateWidth = this.gateWidth(controls.maximumTimingWindowMs);
    const maximumLaneWidth = Math.max(
      anchors.feedback.x,
      this.layout.content.designSize.width - anchors.feedback.x,
    );

    this.leftCue = this.add.rectangle(
      anchors.leftControl.x,
      anchors.leftControl.y,
      maximumGateWidth,
      controls.gateHeight,
      palette.gate.fill,
    ).setStrokeStyle(controls.gateStrokeWidth, palette.gate.stroke);
    this.rightCue = this.add.rectangle(
      anchors.rightControl.x,
      anchors.rightControl.y,
      maximumGateWidth,
      controls.gateHeight,
      palette.gate.fill,
    ).setStrokeStyle(controls.gateStrokeWidth, palette.gate.stroke);

    this.leftBeatLine = this.add.rectangle(
      anchors.leftControl.x,
      anchors.leftControl.y,
      controls.gateBeatLineWidth,
      controls.gateHeight,
      palette.gate.beatLine,
    );
    this.rightBeatLine = this.add.rectangle(
      anchors.rightControl.x,
      anchors.rightControl.y,
      controls.gateBeatLineWidth,
      controls.gateHeight,
      palette.gate.beatLine,
    );

    this.leftCueLabel = this.add
      .text(anchors.leftControl.x, anchors.leftControl.y + controls.controlLabelOffsetY, game.mechanics.resistance.leftControl, {
        ...createTextStyles().notice,
        fontSize: presentation.typography.controlSizePx,
      })
      .setOrigin(0.5);
    this.rightCueLabel = this.add
      .text(anchors.rightControl.x, anchors.rightControl.y + controls.controlLabelOffsetY, game.mechanics.resistance.rightControl, {
        ...createTextStyles().notice,
        fontSize: presentation.typography.controlSizePx,
      })
      .setOrigin(0.5);

    this.guideVisuals = Array.from(
      { length: controls.visibleGuideEvents },
      () => ({
        holdBar: this.add.rectangle(
          0, 0, maximumLaneWidth, controls.noteRadius, palette.note.holdBar,
        )
          .setOrigin(0.5)
          .setStrokeStyle(presentation.strokes.guide, palette.note.stroke)
          .setVisible(false),
        heldBar: this.add.rectangle(
          0, 0, maximumLaneWidth, controls.noteRadius, palette.note.heldBar,
        )
          .setOrigin(0.5)
          .setStrokeStyle(presentation.strokes.guide, palette.note.stroke)
          .setVisible(false),
        note: this.add.circle(0, 0, controls.noteRadius, palette.note.fill)
          .setStrokeStyle(presentation.strokes.guide, palette.note.stroke)
          .setVisible(false),
        tail: this.add.circle(
          0, 0,
          controls.noteRadius * presentation.guide.tailRadiusMultiplier,
          palette.note.fill,
        )
          .setStrokeStyle(presentation.strokes.guide, palette.note.stroke)
          .setVisible(false),
      }),
    );

    this.rhythmEmitter = this.add.rectangle(
      anchors.feedback.x,
      anchors.leftControl.y,
      controls.emitterWidth,
      controls.emitterHeight,
      palette.emitter.fill,
    ).setStrokeStyle(controls.gateStrokeWidth, palette.emitter.stroke);

    this.pauseBand = this.add.rectangle(
      anchors.feedback.x,
      anchors.leftControl.y,
      controls.pauseBandWidth,
      controls.pauseBandHeight,
      palette.pauseBand.fill,
    )
      .setStrokeStyle(controls.gateStrokeWidth, palette.pauseBand.stroke)
      .setVisible(false);

    this.feedback = this.add
      .text(anchors.feedback.x, anchors.feedback.y, "", {
        ...createTextStyles().status,
        fontSize: presentation.typography.feedbackSizePx,
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.cueLabel = this.add.text(anchors.feedback.x, anchors.leftControl.y, "", {
      ...createTextStyles().notice,
      align: "center",
      fixedWidth: controls.cueLabelWidth,
      fontSize: presentation.typography.cueSizePx,
    }).setOrigin(0.5);
  }

  private handleInterruptionKey(
    event: KeyboardEvent,
    action: "press" | "release",
  ): boolean {
    if (getConfrontationControlOwner(this.confrontation) !== "interruption") return false;
    const active = this.confrontation.activeInterruption;
    if (!active) return true;
    const interruption = this.confrontation.config.interruptions[active.index];
    if (interruption.interaction.kind === "sequence" && action === "press") {
      const choiceId = getSequenceChoiceForKey(event, interruption.interaction.choices);
      if (choiceId) this.applyInterruptionInput({ kind: "sequence", choiceId });
      return true;
    }
    if (interruption.interaction.kind === "hold") {
      const holdAction = getHoldActionForKey(event, action);
      if (holdAction) this.applyInterruptionInput({ kind: "hold", action: holdAction });
      return true;
    }
    return true;
  }

  private releaseInterruptionHold(): void {
    if (getConfrontationControlOwner(this.confrontation) !== "interruption") return;
    const active = this.confrontation.activeInterruption;
    if (!active || active.holdStartedAtMs === null) return;
    this.applyInterruptionInput({ kind: "hold", action: "release" });
  }

  private cancelInterruptionHold(): void {
    if (getConfrontationControlOwner(this.confrontation) !== "interruption") return;
    const active = this.confrontation.activeInterruption;
    if (!active || active.holdStartedAtMs === null) return;
    this.applyInterruptionInput({ kind: "hold", action: "cancel" });
  }

  private applyInterruptionInput(
    input: { kind: "sequence"; choiceId: string }
      | { kind: "hold"; action: "press" | "release" | "cancel" },
  ): void {
    this.audio.play("interruption-input");
    this.confrontation = applyConfrontationInput(this.confrontation, {
      ...input,
      atMs: this.confrontationTimeMs,
    });
    this.resistance = this.confrontation.resistance;
  }

  private renderInterruption(): void {
    const state = getInterruptionPresentationState(this.confrontation);
    const resistanceVisible = state.stage === "resistance"
      || state.stage === "warning"
      || state.stage === "returning";
    for (const control of [
      this.leftCue, this.rightCue, this.leftBeatLine, this.rightBeatLine,
      this.leftCueLabel, this.rightCueLabel,
    ]) control.setVisible(resistanceVisible);
    if (!resistanceVisible) {
      this.rhythmEmitter.setVisible(false);
      this.pauseBand.setVisible(false);
      this.cueLabel.setVisible(false);
      this.guideVisuals.forEach(({ note, tail, holdBar, heldBar }) => {
        note.setVisible(false); tail.setVisible(false);
        holdBar.setVisible(false); heldBar.setVisible(false);
      });
    }
    if (state.stage === "resistance") this.announcedInterruptionState = null;
    this.interruptionPresentation.render(state, this.confrontationTimeMs);
  }

  private announceInterruptionState(id: string, copy: string): void {
    if (this.announcedInterruptionState === id) return;
    this.announcedInterruptionState = id;
    const role = soundForInterruptionState(id);
    if (role) this.audio.play(role);
    announce(copy);
  }

  private bindInput(): void {
    const keyboard = this.input.keyboard;

    keyboard?.addCapture([
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.ONE,
      Phaser.Input.Keyboard.KeyCodes.TWO,
      Phaser.Input.Keyboard.KeyCodes.THREE,
    ]);
    keyboard?.on("keydown", (event: KeyboardEvent) => {
      if (this.handleInterruptionKey(event, "press")) return;
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
      if (this.handleInterruptionKey(event, "release")) return;
      const action = getResistanceControlAction(event, "release");
      if (action?.kind === "resist") this.handleResistanceInput(action.side, action.action);
    });

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.finished) {
        return;
      }

      if (getConfrontationControlOwner(this.confrontation) === "resistance") {
        this.handleResistanceInput(pointerSide(pointer, this.cameras.main.centerX), "press");
      }
    });
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (!this.finished && getConfrontationControlOwner(this.confrontation) === "resistance") {
        this.handleResistanceInput(pointerSide(pointer, this.cameras.main.centerX), "release");
      }
    });
    this.input.on("pointerup", () => this.releaseInterruptionHold());
    this.input.on("pointerupoutside", () => this.releaseInterruptionHold());
    const cancel = () => this.cancelInterruptionHold();
    const cancelPointer = () => this.cancelInterruptionHold();
    const canvas = this.game.canvas;
    window.addEventListener("blur", cancel);
    const cancelWhenHidden = () => {
      if (document.hidden) cancel();
    };
    document.addEventListener("visibilitychange", cancelWhenHidden);
    canvas.addEventListener("pointercancel", cancelPointer);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener("blur", cancel);
      document.removeEventListener("visibilitychange", cancelWhenHidden);
      canvas.removeEventListener("pointercancel", cancelPointer);
    });
  }

  private handleResistanceInput(side: ResistanceSide, action: "press" | "release"): void {
    if (this.finished) {
      return;
    }

    this.confrontation = applyConfrontationInput(this.confrontation, {
      kind: "resistance", side, action, atMs: this.confrontationTimeMs,
    });
    this.resistance = this.confrontation.resistance;
    this.renderJudgement(
      this.resistance.state.lastRhythmJudgement,
    );
  }

  private renderResistance(): void {
    const palette = this.resolvedPalette;
    const state = this.resistance.state;
    const cue = getNextRhythmCue(this.resistance);
    const guide = getRhythmGuide(
      this.resistance,
      this.layout.content.controls.visibleGuideEvents,
    );

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

    this.leftCue.setFillStyle(palette.gate.fill);
    this.rightCue.setFillStyle(palette.gate.fill);
    const gateWidth = cue
      ? this.gateWidth(cue.timingWindowMs)
      : this.layout.content.controls.gateBeatLineWidth;
    const maximumGateWidth = this.gateWidth(
      this.layout.content.controls.maximumTimingWindowMs,
    );
    const gateScale = gateWidth / maximumGateWidth;
    this.leftCue.setScale(gateScale, 1);
    this.rightCue.setScale(gateScale, 1);
    const presentation = this.layout.content.rhythmPresentation;
    this.leftCue.setAlpha(presentation.opacity.inactiveGate);
    this.rightCue.setAlpha(presentation.opacity.inactiveGate);
    this.leftCueLabel
      .setAlpha(presentation.opacity.inactiveLabel)
      .setColor(getThemeColour(palette.label.rest))
      .setText(game.mechanics.resistance.leftControl);
    this.rightCueLabel
      .setAlpha(presentation.opacity.inactiveLabel)
      .setColor(getThemeColour(palette.label.rest))
      .setText(game.mechanics.resistance.rightControl);
    this.leftCue.setStrokeStyle(
      this.layout.content.controls.gateStrokeWidth,
      palette.gate.stroke,
    );
    this.rightCue.setStrokeStyle(
      this.layout.content.controls.gateStrokeWidth,
      palette.gate.stroke,
    );
    this.renderRhythmGuide(guide);

    const currentActionGuide = guide.find((item) =>
      item.action === "tap" || item.action === "hold");

    if (
      cue
      && currentActionGuide
      && currentActionGuide.side === cue.side
    ) {
      const cueAtMs = state.activeHold?.step === cue.step
        ? (cue.releaseAtMs ?? cue.atMs)
        : cue.atMs;
      const holding = state.activeHold?.step === cue.step;
      const isNow = Math.abs(cueAtMs - state.elapsedMs) <= cue.timingWindowMs;
      const expectedCue = cue.side === "left" ? this.leftCue : this.rightCue;
      const expectedLabel = cue.side === "left"
        ? this.leftCueLabel
        : this.rightCueLabel;
      expectedCue
        .setAlpha(1)
        .setFillStyle(
          isNow
            ? palette.gate.now
            : holding
              ? palette.gate.holding
              : palette.gate.upcoming,
        )
        .setStrokeStyle(
          this.layout.content.controls.activeGateStrokeWidth,
          palette.gate.activeStroke,
        );
      expectedLabel
        .setAlpha(1)
        .setColor(getThemeColour(isNow ? palette.label.now : palette.label.rest))
        .setText(isNow
          ? holding
            ? game.mechanics.resistance.cueReleaseNow
            : game.mechanics.resistance.cueHitNow
          : holding
            ? game.mechanics.resistance.cueHolding
            : cue.side === "left"
            ? game.mechanics.resistance.leftControl
            : game.mechanics.resistance.rightControl);
      if (isNow && cue.step !== this.lastAnnouncedNowStep) {
        this.lastAnnouncedNowStep = cue.step;

        if (
          state.lastRhythmJudgement?.kind === "miss"
          && state.lastRhythmJudgement.reason === "early"
          && state.lastRhythmJudgement.step === cue.step
        ) {
          this.feedback
            .setVisible(true)
            .setColor(getThemeColour(palette.label.rest))
            .setText(formatCopy(cue.action === "hold"
              ? game.mechanics.resistance.hold
              : game.mechanics.resistance.tap, {
              side: cue.side.toUpperCase(),
            }));
        }
      }
    }
    this.renderInterruption();
  }

  private renderRhythmGuide(guide: readonly RhythmGuideItem[]): void {
    const palette = this.resolvedPalette;
    const controls = this.layout.content.controls;
    const controlsPresentation = this.layout.content.rhythmPresentation;
    const { anchors } = this.layout.content;
    const elapsedMs = this.resistance.state.elapsedMs;
    const actions = guide.filter((item): item is RhythmGuideItem & {
      readonly action: "tap" | "hold";
      readonly side: ResistanceSide;
    } => item.action === "tap" || item.action === "hold");

    this.guideVisuals.forEach((visual, index) => {
      const item = actions[index];
      visual.note.setVisible(false);
      visual.tail.setVisible(false);
      visual.holdBar.setVisible(false);
      visual.heldBar.setVisible(false);
      if (!item) return;

      const target = item.side === "left" ? anchors.leftControl : anchors.rightControl;
      const notePosition = this.rhythmNotePosition(
        item.atMs, item.timingWindowMs, item.side, elapsedMs,
      );
      if (!notePosition.emerged) return;
      const alpha = Phaser.Math.Linear(
        controls.noteMinimumAlpha,
        1,
        notePosition.approach,
      );
      visual.note
        .setPosition(Phaser.Math.Clamp(
          notePosition.x,
          0,
          this.layout.content.designSize.width,
        ), target.y)
        .setAlpha(alpha)
        .setFillStyle(palette.note.fill)
        .setVisible(
          notePosition.x >= 0
          && notePosition.x <= this.layout.content.designSize.width,
        );

      if (item.action !== "hold") return;
      const tailPosition = this.rhythmNotePosition(
        item.releaseAtMs,
        item.timingWindowMs,
        item.side,
        elapsedMs,
      );
      const lane = getVisibleLaneSegment(
        item.side,
        anchors.feedback.x,
        this.layout.content.designSize.width,
        notePosition.x,
        tailPosition.x,
      );
      const visibleHeadX = lane.fromX;
      const visibleTailX = lane.toX;
      const maximumLaneWidth = Math.max(
        anchors.feedback.x,
        this.layout.content.designSize.width - anchors.feedback.x,
      );
      visual.holdBar
        .setPosition((visibleTailX + visibleHeadX) / 2, target.y)
        .setScale(
          Math.max(1, Math.abs(visibleHeadX - visibleTailX))
            / maximumLaneWidth,
          1,
        )
        .setAlpha(alpha * controlsPresentation.opacity.holdBarMultiplier)
        .setVisible(true);
      const cue = getNextRhythmCue(this.resistance);
      const holding = cue !== null
        && this.resistance.state.activeHold?.step === cue.step
        && cue.atMs === item.atMs;
      if (holding) {
        const heldEndX = Phaser.Math.Clamp(
          target.x,
          Math.min(visibleHeadX, target.x),
          Math.max(visibleHeadX, target.x),
        );
        visual.heldBar
          .setPosition((visibleHeadX + heldEndX) / 2, target.y)
          .setScale(
            Math.max(1, Math.abs(visibleHeadX - heldEndX))
              / maximumLaneWidth,
            1,
          )
          .setVisible(true);
      }
      const releaseIsNow = holding
        && Math.abs(item.releaseAtMs - elapsedMs) <= item.timingWindowMs;
      visual.tail
        .setPosition(tailPosition.x, target.y)
        .setScale(releaseIsNow ? controlsPresentation.guide.releaseTailScale : 1)
        .setAlpha(Phaser.Math.Linear(
          controls.noteMinimumAlpha,
          1,
          tailPosition.approach,
        ))
        .setVisible(
          tailPosition.emerged
          && tailPosition.x === visibleTailX,
        );
    });

    const firstGuide = guide[0];
    const pause = firstGuide?.action === "rest" || firstGuide?.action === "count-in"
      ? firstGuide
      : undefined;
    const pauseVisible = pause !== undefined;
    this.rhythmEmitter.setVisible(!pauseVisible);
    this.pauseBand.setVisible(pauseVisible);
    this.cueLabel.setVisible(pauseVisible);
    if (!pause || !pauseVisible) return;
    const pauseApproach = pause.atMs <= elapsedMs ? 1 : 0;
    const pauseAlpha = Phaser.Math.Linear(
      controls.noteMinimumAlpha,
      1,
      pauseApproach,
    );
    this.pauseBand.setAlpha(pauseAlpha);
    this.cueLabel
      .setAlpha(pauseAlpha)
      .setText(formatCueItem(pause));
  }

  private rhythmNotePosition(
    atMs: number,
    timingWindowMs: number,
    side: ResistanceSide,
    elapsedMs: number,
  ): { readonly x: number; readonly approach: number; readonly emerged: boolean } {
    const { anchors } = this.layout.content;
    const target = side === "left" ? anchors.leftControl : anchors.rightControl;
    return getRhythmNotePosition({
      originX: anchors.feedback.x,
      targetX: target.x,
      side,
      atMs,
      timingWindowMs,
      elapsedMs,
      noteTravelPixelsPerMs:
        this.layout.content.controls.noteTravelPixelsPerMs,
    });
  }

  private gateWidth(timingWindowMs: number): number {
    return getRhythmGateWidth(
      timingWindowMs,
      this.layout.content.controls.noteTravelPixelsPerMs,
    );
  }

  private renderJudgement(
    judgement: RhythmJudgement | null,
  ): void {
    const palette = this.resolvedPalette;
    if (!judgement) {
      return;
    }

    this.audio.play(soundForJudgement(judgement));

    const feedbackSide = judgement.actualSide ?? judgement.expectedSide;
    const control = feedbackSide === "left" ? this.leftCue : this.rightCue;
    control.setAlpha(1);
    const presentation = this.layout.content.rhythmPresentation;
    this.feedback.setScale(presentation.feedback.initialScale);
    this.feedback.setVisible(true);
    this.tweens.add({
      targets: this.feedback,
      scaleX: 1,
      scaleY: 1,
      duration: presentation.feedback.durationMs,
      ease: presentation.feedback.ease,
    });

    if (judgement.kind === "hit") {
      this.animateSuccessfulNote(judgement.expectedSide);
      this.feedback
        .setColor(getThemeColour(palette.feedback.hit))
        .setText(formatCopy(game.mechanics.resistance.hit, {
          side: judgement.expectedSide.toUpperCase(),
        }));
      return;
    }

    this.feedback.setColor(getThemeColour(palette.feedback.miss));

    if (judgement.reason === "expired") {
      this.animateExpiredNote(judgement.step, judgement.expectedSide);
    }

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
      this.animateBrokenHold(judgement.step, judgement.expectedSide);
      this.feedback.setText(formatCopy(game.mechanics.resistance.releasedEarly, {
        side: judgement.expectedSide.toUpperCase(),
      }));
      return;
    }

    this.feedback.setText(formatCopy(game.mechanics.resistance.missed, {
      side: judgement.expectedSide.toUpperCase(),
    }));
  }

  private animateSuccessfulNote(side: ResistanceSide): void {
    const palette = this.resolvedPalette;
    const presentation = this.layout.content.rhythmPresentation;
    const target = side === "left"
      ? this.layout.content.anchors.leftControl
      : this.layout.content.anchors.rightControl;
    const burst = this.add.circle(
      target.x,
      target.y,
      this.layout.content.controls.noteRadius,
    )
      .setFillStyle(palette.successfulNote.fill, 0)
      .setStrokeStyle(presentation.strokes.successfulNote, palette.successfulNote.stroke)
      .setDepth(presentation.layers.successfulNote);
    this.tweens.add({
      targets: burst,
      scale: presentation.successfulNote.finalScale,
      alpha: 0,
      duration: presentation.successfulNote.durationMs,
      ease: presentation.successfulNote.ease,
      onComplete: () => burst.destroy(),
    });
  }

  private animateExpiredNote(step: number, side: ResistanceSide): void {
    const palette = this.resolvedPalette;
    const cue = this.resistance.config.cues[step];
    if (!cue) return;
    const target = side === "left"
      ? this.layout.content.anchors.leftControl
      : this.layout.content.anchors.rightControl;
    const direction = side === "left" ? -1 : 1;
    const radius = this.layout.content.controls.noteRadius;
    const presentation = this.layout.content.rhythmPresentation;
    const expired = presentation.expiredNote;
    const startX = target.x + direction
      * cue.timingWindowMs
      * this.layout.content.controls.noteTravelPixelsPerMs;
    const note = this.add.circle(0, 0, radius, palette.expiredNote.fill)
      .setStrokeStyle(presentation.strokes.missedNote, palette.expiredNote.stroke);
    const crossOne = this.add.rectangle(
      0, 0, radius * expired.crossWidthMultiplier,
      expired.crossThickness, palette.expiredNote.cross,
    ).setAngle(expired.crossAngleDegrees);
    const crossTwo = this.add.rectangle(
      0, 0, radius * expired.crossWidthMultiplier,
      expired.crossThickness, palette.expiredNote.cross,
    ).setAngle(-expired.crossAngleDegrees);
    const escaped = this.add.container(startX, target.y, [note, crossOne, crossTwo])
      .setDepth(presentation.layers.missedNote);
    this.tweens.add({
      targets: escaped,
      x: startX + direction * radius * expired.escapeDistanceMultiplier,
      alpha: 0,
      duration: expired.durationMs,
      ease: expired.ease,
      onComplete: () => escaped.destroy(true),
    });
  }

  private animateBrokenHold(step: number, side: ResistanceSide): void {
    const palette = this.resolvedPalette;
    const cue = this.resistance.config.cues[step];
    if (!cue || cue.action !== "hold") return;
    const target = side === "left"
      ? this.layout.content.anchors.leftControl
      : this.layout.content.anchors.rightControl;
    const direction = side === "left" ? -1 : 1;
    const presentation = this.layout.content.rhythmPresentation;
    const brokenStyle = presentation.brokenHold;
    const fragmentWidth = Math.max(
      this.layout.content.controls.noteRadius * brokenStyle.minimumWidthMultiplier,
      this.gateWidth(cue.timingWindowMs) * brokenStyle.gateWidthMultiplier,
    );
    const leftFragment = this.add.rectangle(
      -fragmentWidth * brokenStyle.fragmentOffsetMultiplier,
      -brokenStyle.fragmentYOffset,
      fragmentWidth,
      this.layout.content.controls.noteRadius,
      palette.brokenHold.fill,
    ).setStrokeStyle(presentation.strokes.missedNote, palette.brokenHold.stroke)
      .setAngle(-brokenStyle.fragmentAngleDegrees);
    const rightFragment = this.add.rectangle(
      fragmentWidth * brokenStyle.fragmentOffsetMultiplier,
      brokenStyle.fragmentYOffset,
      fragmentWidth,
      this.layout.content.controls.noteRadius,
      palette.brokenHold.fill,
    ).setStrokeStyle(presentation.strokes.missedNote, palette.brokenHold.stroke)
      .setAngle(brokenStyle.fragmentAngleDegrees);
    const broken = this.add.container(
      target.x,
      target.y,
      [leftFragment, rightFragment],
    ).setDepth(presentation.layers.missedNote);
    this.tweens.add({
      targets: broken,
      x: target.x + direction * this.layout.content.controls.noteRadius
        * brokenStyle.escapeXMultiplier,
      y: target.y + this.layout.content.controls.noteRadius
        * brokenStyle.escapeYMultiplier,
      alpha: 0,
      duration: brokenStyle.durationMs,
      ease: brokenStyle.ease,
      onComplete: () => broken.destroy(true),
    });
  }

  private finishConfrontation(): void {
    const palette = this.resolvedPalette;
    this.finished = true;
    this.audio.play(
      this.resistance.state.outcome === "victory" ? "victory" : "forced-verticalisation",
    );
    // The confrontation is over but the scene lives on through the outcome and
    // the debrief, so the room has to be told to go quiet. The sting is already
    // scheduled and survives, sounding over the silence rather than under the
    // hum that was pressing on the player a moment ago.
    this.audio.stopAmbience();
    this.cueLabel.setVisible(false);
    this.pauseBand.setVisible(false);
    this.rhythmEmitter.setVisible(false);
    this.guideVisuals.forEach(({ note, tail, holdBar, heldBar }) => {
      note.setVisible(false);
      tail.setVisible(false);
      holdBar.setVisible(false);
      heldBar.setVisible(false);
    });
    this.leftCue.setFillStyle(palette.gate.fill);
    this.rightCue.setFillStyle(palette.gate.fill);
    this.leftCue.setAlpha(1);
    this.rightCue.setAlpha(1);
    this.leftCueLabel
      .setAlpha(1)
      .setColor(getThemeColour(palette.label.rest));
    this.rightCueLabel
      .setAlpha(1)
      .setColor(getThemeColour(palette.label.rest));
    const victory = this.resistance.state.outcome === "victory";
    const resultContent = victory
      ? this.episode.results.victory
      : this.episode.results.forcedVerticalisation;

    if (resultContent.illustration) {
      this.children.removeAll(true);
      const asset = resolveIllustrationAsset(resultContent.illustration, this.episode.id);
      this.illustratedOutcomeLayout = createIllustratedSemanticPanel(this, {
        assetId: asset.id,
        kicker: this.episode.title.toUpperCase(),
        headline: resultContent.headline,
        body: resultContent.feedback,
      });
    } else {

      this.result
        .setText(resultContent.headline)
        .setColor(getThemeColour(
        victory ? palette.result.victory : palette.result.forcedVerticalisation,
      ))
        .setVisible(true);
      this.feedback.setText(resultContent.feedback).setVisible(true);
      if (victory) this.layout.animateVictory();
      else this.layout.animateForcedVerticalisation();
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
    const actions = this.layout.content.rhythmPresentation.outcomeActions;
    const retryPosition = this.illustratedOutcomeLayout?.anchors.primaryAction ?? {
      x: restart.x - actions.horizontalOffset, y: restart.y,
    };
    const acceptPosition = this.illustratedOutcomeLayout?.anchors.secondaryAction ?? {
      x: restart.x + actions.horizontalOffset, y: restart.y,
    };
    const width = this.illustratedOutcomeLayout?.actions.width ?? actions.width;
    const height = this.illustratedOutcomeLayout?.actions.height;
    createButton(this, retryPosition.x, retryPosition.y, width, game.interface.retryEpisode, () => {
      this.restartConfrontation();
    }, height);
    createButton(this, acceptPosition.x, acceptPosition.y, width, game.interface.acceptOutcome, () => {
      this.acceptOutcomeAndContinue();
    }, height, "secondary");
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

  /**
   * Resolves the authored rhythm palette into Phaser colour values. Every role
   * is selected by validated layout data; this adapter chooses none of them.
   */
  private resolvePalette(): ResolvedRhythmPalette {
    const authored = this.layout.content.rhythmPresentation.palette;
    const resolve = <T extends Record<string, ColourRole>>(group: T) =>
      Object.fromEntries(
        Object.entries(group).map(([key, role]) => [key, this.colour(role)]),
      ) as { readonly [K in keyof T]: number };
    return {
      gate: resolve(authored.gate),
      note: resolve(authored.note),
      emitter: resolve(authored.emitter),
      pauseBand: resolve(authored.pauseBand),
      successfulNote: resolve(authored.successfulNote),
      expiredNote: resolve(authored.expiredNote),
      brokenHold: resolve(authored.brokenHold),
      label: authored.label,
      status: authored.status,
      feedback: authored.feedback,
      result: authored.result,
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

function formatCueItem(item: RhythmGuideItem): string {
  switch (item.action) {
    case "rest":
      return game.mechanics.resistance.cueRest;
    case "count-in":
      return game.mechanics.resistance.cueCountIn;
    case "interruption":
      return game.mechanics.resistance.cueCountIn;
    case "hold":
      return formatCopy(game.mechanics.resistance.cueHold, {
        side: item.side.toUpperCase(),
      });
    case "tap":
      return formatCopy(game.mechanics.resistance.cueTap, {
        side: item.side.toUpperCase(),
      });
  }
}

function soundForJudgement(judgement: RhythmJudgement): AudioCueRole {
  if (judgement.kind === "hit") {
    // A hold is judged when it is released, so a successful one sounds as the
    // apparatus letting go rather than as another strike.
    return judgement.action === "hold" ? "hold-release" : "tap-hit";
  }
  return judgement.reason === "released-early" ? "hold-broken" : "tap-miss";
}

/**
 * Interruption stages are announced with composite identifiers, and the same
 * identifiers decide what the moment sounds like. Cancellation stays silent
 * because it is deliberately neutral: the interaction was taken away from the
 * player rather than failed by them, and a failure sound would say otherwise.
 */
function soundForInterruptionState(id: string): AudioCueRole | null {
  if (id.endsWith(":warning")) return "interruption-warning";
  if (id.endsWith(":active")) return "management-bluster";
  if (id.endsWith(":returning")) return "interruption-return";
  if (id.endsWith(":resolved:success")) return "interruption-success";
  if (id.endsWith(":resolved:failure") || id.endsWith(":resolved:expired")) {
    return "interruption-failure";
  }
  return null;
}
