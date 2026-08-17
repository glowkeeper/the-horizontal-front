import catalogContent from "./presentation/asset-catalog.json";
import { loadPresentationAssetCatalog } from "./loadPresentationAssetCatalog";

const assetModules = import.meta.glob(
  "./presentation/assets/**/*.{png,webp}",
  {
    eager: true,
    import: "default",
    query: "?url",
  },
);

export const presentationAssets = loadPresentationAssetCatalog(
  catalogContent,
  assetModules,
);

export const presentationAssetIds = new Set(
  presentationAssets.map(({ id }) => id),
);

type IllustrationReference = {
  readonly source: "shared" | "campaign" | "episode";
  readonly id: string;
};

export function resolveIllustrationAsset(
  reference: IllustrationReference,
  ownerId: string,
) {
  const asset = presentationAssets.find(({ id }) => id === reference.id);
  if (asset === undefined) {
    throw new Error(`Unknown presentation asset: ${reference.id}`);
  }
  const expectedPrefix = reference.source === "shared"
    ? "shared/"
    : `${reference.source}s/${ownerId}/`;
  if (!asset.file.startsWith(expectedPrefix)) {
    throw new Error(
      `${reference.source} illustration ${reference.id} must resolve under ${expectedPrefix}`,
    );
  }
  return asset;
}
