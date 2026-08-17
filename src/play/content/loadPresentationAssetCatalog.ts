import {
  assetCatalogSchema,
  type AssetCatalog,
} from "./schemas/presentationSchema";

export type AssetModules = Readonly<Record<string, unknown>>;

export type LoadedPresentationAsset = AssetCatalog["assets"][number] & {
  readonly url: string;
};

function assetPath(file: string): string {
  return `./presentation/assets/${file}`;
}

export function loadPresentationAssetCatalog(
  catalogContent: unknown,
  assetModules: AssetModules,
): readonly LoadedPresentationAsset[] {
  const catalog = assetCatalogSchema.parse(catalogContent);
  const listedPaths = new Set(
    catalog.assets.map(({ file }) => assetPath(file)),
  );
  const unlistedPaths = Object.keys(assetModules).filter(
    (path) => !listedPaths.has(path),
  );

  if (unlistedPaths.length > 0) {
    throw new Error(
      `Unlisted presentation asset files: ${unlistedPaths.join(", ")}`,
    );
  }

  return catalog.assets.map((asset) => {
    const path = assetPath(asset.file);
    const url = assetModules[path];
    if (typeof url !== "string") {
      throw new Error(`Missing presentation asset file: ${path}`);
    }
    return { ...asset, url };
  });
}
