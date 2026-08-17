import Phaser from "phaser";

import { illustratedPanelLayout as layout } from "../../content/loadPresentation";
import { createTextStyles, getThemeColour } from "../../theme/theme";
import { toColour } from "../sceneChrome";

type IllustratedSemanticPanelContent = {
  readonly assetId: string;
  readonly kicker?: string;
  readonly headline: string;
  readonly body: string;
  readonly detail?: string;
  readonly instruction?: string;
};

export function createIllustratedSemanticPanel(
  scene: Phaser.Scene,
  content: IllustratedSemanticPanelContent,
) {
  const palette = layout.palette;
  scene.cameras.main.setBackgroundColor(getThemeColour(palette.background));
  const illustration = layout.illustration;
  const semantic = layout.semanticContent;

  scene.add.rectangle(
    illustration.x,
    illustration.y,
    illustration.width,
    illustration.height,
    toColour(palette.illustrationFill),
  ).setOrigin(illustration.originX, illustration.originY)
    .setStrokeStyle(layout.appearance.illustrationStrokeWidth, toColour(palette.illustrationStroke));
  const image = scene.add.image(
    illustration.x + illustration.width / 2,
    illustration.y + illustration.height / 2,
    content.assetId,
  );
  const targetRatio = illustration.width / illustration.height;
  const sourceRatio = image.width / image.height;
  const cropWidth = sourceRatio > targetRatio
    ? image.height * targetRatio
    : image.width;
  const cropHeight = sourceRatio > targetRatio
    ? image.height
    : image.width / targetRatio;
  const cropX = (image.width - cropWidth) / 2;
  const cropY = (image.height - cropHeight) / 2;
  image
    .setCrop(cropX, cropY, cropWidth, cropHeight)
    .setOrigin(
      (cropX + cropWidth / 2) / image.width,
      (cropY + cropHeight / 2) / image.height,
    )
    .setScale(illustration.width / cropWidth);

  scene.add.rectangle(
    semantic.x,
    semantic.y,
    semantic.width,
    semantic.height,
    toColour(palette.semanticFill),
    layout.appearance.semanticFillAlpha,
  ).setOrigin(semantic.originX, semantic.originY)
    .setStrokeStyle(layout.appearance.semanticStrokeWidth, toColour(palette.semanticStroke));

  if (content.kicker) {
    scene.add.text(layout.anchors.kicker.x, layout.anchors.kicker.y, content.kicker, {
      ...createTextStyles().notice,
      fontSize: layout.typography.kickerSizePx,
    }).setOrigin(0.5);
  }
  scene.add.text(layout.anchors.headline.x, layout.anchors.headline.y, content.headline, {
    ...createTextStyles().title,
    fontSize: layout.typography.headlineSizePx,
    align: "center",
    wordWrap: { width: semantic.width - layout.typography.horizontalInset },
  }).setOrigin(0.5);
  scene.add.text(layout.anchors.body.x, layout.anchors.body.y, content.body, {
    ...createTextStyles().body,
    fontSize: layout.typography.bodySizePx,
    align: "center",
    wordWrap: { width: semantic.width - layout.typography.horizontalInset },
    lineSpacing: layout.typography.bodyLineSpacingPx,
  }).setOrigin(0.5);
  if (content.detail) {
    scene.add.text(layout.anchors.detail.x, layout.anchors.detail.y, content.detail, {
      ...createTextStyles().notice,
      color: getThemeColour(palette.detail),
      align: "center",
      wordWrap: { width: semantic.width - layout.typography.horizontalInset },
    }).setOrigin(0.5);
  }
  if (content.instruction) {
    scene.add.text(
      layout.anchors.instruction.x,
      layout.anchors.instruction.y,
      content.instruction,
      {
        ...createTextStyles().notice,
        color: getThemeColour(palette.instruction),
        fontSize: layout.typography.instructionSizePx,
        align: "center",
        wordWrap: { width: semantic.width - layout.typography.horizontalInset },
      },
    ).setOrigin(0.5);
  }
  return layout;
}
