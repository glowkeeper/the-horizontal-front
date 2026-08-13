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
