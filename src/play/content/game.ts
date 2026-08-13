import gameContent from "./game.json";
import { loadGame } from "./loadGame";

const campaignModules = import.meta.glob("./campaigns/*.json", {
  eager: true,
  import: "default",
});
const episodeModules = import.meta.glob("./episodes/*.json", {
  eager: true,
  import: "default",
});

export const game = loadGame(gameContent, campaignModules, episodeModules);
