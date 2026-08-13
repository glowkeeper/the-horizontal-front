import catalogContent from "./presentation/asset-catalog.json";
import { assetCatalogSchema } from "./schemas/presentationSchema";

const assetModules = import.meta.glob("./presentation/assets/*", {
  eager: true,
  import: "default",
  query: "?url",
});

const catalog = assetCatalogSchema.parse(catalogContent);
const listedPaths = new Set(
  catalog.assets.map(({ file }) => `./presentation/assets/${file}`),
);
const unlistedPaths = Object.keys(assetModules).filter(
  (path) => !listedPaths.has(path),
);
if (unlistedPaths.length > 0) {
  throw new Error(`Unlisted presentation asset files: ${unlistedPaths.join(", ")}`);
}

export type PresentationAsset = {
  readonly id: string;
  readonly url: string;
};

export const presentationAssets: readonly PresentationAsset[] =
  catalog.assets.map(({ id, file }) => {
    const path = `./presentation/assets/${file}`;
    const url = assetModules[path];
    if (typeof url !== "string") {
      throw new Error(`Missing presentation asset file: ${path}`);
    }
    return { id, url };
  });

export const presentationAssetIds = new Set(
  presentationAssets.map(({ id }) => id),
);
