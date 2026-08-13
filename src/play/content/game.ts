import gameContent from "./game.json";
import mechanicCatalogueContent from "./mechanics/catalog.json";
import { loadGame } from "./loadGame";
import { loadMechanicLibrary } from "./loadMechanics";

const campaignModules = import.meta.glob("./campaigns/*.json", {
  eager: true,
  import: "default",
});
const episodeModules = import.meta.glob("./episodes/*.json", {
  eager: true,
  import: "default",
});

const rhythmModules = import.meta.glob("./mechanics/rhythms/*.json", {
  eager: true,
  import: "default",
});
const curveModules = import.meta.glob("./mechanics/dramatic-curves/*.json", {
  eager: true,
  import: "default",
});

export const mechanics = loadMechanicLibrary(
  mechanicCatalogueContent,
  rhythmModules,
  curveModules,
);

export const game = loadGame(gameContent, campaignModules, episodeModules, mechanics);
