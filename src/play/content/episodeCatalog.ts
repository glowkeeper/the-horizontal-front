import catalogContent from "./episode-catalog.json";
import { loadEpisodeCatalog } from "./loadEpisodeCatalog";

const episodeModules = import.meta.glob("./episodes/*.json", {
  eager: true,
  import: "default",
});

export const episodeCatalog = loadEpisodeCatalog(
  catalogContent,
  episodeModules,
);
