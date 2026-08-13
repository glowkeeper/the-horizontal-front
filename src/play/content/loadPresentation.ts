import type { Episode } from "./schemas/episodeSchema";
import {
  resistanceLayoutSchema,
  resistanceSkinSchema,
  type ResistanceLayoutContent,
  type ResistanceSkin,
} from "./schemas/presentationSchema";
import { assertSensiblePresentation } from "./validatePresentation";
import { presentationAssetIds } from "./presentationAssets";

const layoutModules = import.meta.glob("./presentation/layouts/*.json", {
  eager: true,
  import: "default",
});
const skinModules = import.meta.glob("./presentation/skins/*.json", {
  eager: true,
  import: "default",
});

type PresentationSelection = Episode["confrontation"]["presentation"];

export type LoadedPresentation = {
  readonly layout: ResistanceLayoutContent;
  readonly skin: ResistanceSkin;
};

function loadById<T>(
  modules: Readonly<Record<string, unknown>>,
  directory: string,
  id: string,
  parse: (content: unknown) => T,
): T {
  const path = `./presentation/${directory}/${id}.json`;
  const content = modules[path];
  if (content === undefined) {
    throw new Error(`Missing presentation ${directory.slice(0, -1)}: ${id}`);
  }
  return parse(content);
}

export function loadPresentation(
  selection: PresentationSelection,
): LoadedPresentation {
  const layout = loadById(
    layoutModules,
    "layouts",
    selection.layout,
    (content) => resistanceLayoutSchema.parse(content),
  );
  const skin = loadById(
    skinModules,
    "skins",
    selection.skin,
    (content) => resistanceSkinSchema.parse(content),
  );

  if (layout.id !== selection.layout) {
    throw new Error(`Layout ID mismatch: expected ${selection.layout}`);
  }
  if (skin.id !== selection.skin) {
    throw new Error(`Skin ID mismatch: expected ${selection.skin}`);
  }
  if (skin.layout !== layout.id) {
    throw new Error(`Skin ${skin.id} is incompatible with layout ${layout.id}`);
  }

  assertSensiblePresentation(layout, skin, presentationAssetIds);

  return { layout, skin };
}
