import gameContent from "./game.json";
import audioCatalogueContent from "./audio/catalog.json";
import mechanicCatalogueContent from "./mechanics/catalog.json";
import { loadGame } from "./loadGame";
import { loadAudioLibrary } from "./loadAudio";
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
const interruptionModules = import.meta.glob("./mechanics/interruptions/*.json", {
  eager: true,
  import: "default",
});

const audioCueModules = import.meta.glob("./audio/cues/*.json", {
  eager: true,
  import: "default",
});
const audioSoundscapeModules = import.meta.glob("./audio/soundscapes/*.json", {
  eager: true,
  import: "default",
});

export const audio = loadAudioLibrary(
  audioCatalogueContent,
  audioCueModules,
  audioSoundscapeModules,
);

export const mechanics = loadMechanicLibrary(
  mechanicCatalogueContent,
  rhythmModules,
  curveModules,
  interruptionModules,
);

export const game = loadGame(
  gameContent,
  campaignModules,
  episodeModules,
  mechanics,
  audio,
);
