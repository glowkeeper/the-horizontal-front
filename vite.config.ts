import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfig } from "vite";

import { sitePages } from "./scripts/site-pages.mjs";

const page = (path: string): string => resolve(import.meta.dirname, path);
const game = JSON.parse(readFileSync(page("src/play/content/game.json"), "utf8"));

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const shellCopy = new Map([
  ["{{GAME_PAGE_DESCRIPTION}}", game.interface.pageDescription],
  ["{{GAME_PAGE_TITLE}}", game.interface.pageTitle],
  ["{{GAME_EXIT_LABEL}}", game.interface.exitLabel],
  ["{{GAME_MUTE_LABEL}}", game.interface.muteAudio],
  ["{{GAME_UNMUTE_LABEL}}", game.interface.unmuteAudio],
  ["{{GAME_AUDIO_MUTED_STATUS}}", game.interface.audioMutedStatus],
  ["{{GAME_AUDIO_AUDIBLE_STATUS}}", game.interface.audioAudibleStatus],
  ["{{GAME_LOADING_STATUS}}", game.interface.loadingStatus],
  ["{{GAME_ARIA_LABEL}}", game.interface.gameAriaLabel],
]);

export default defineConfig({
  plugins: [{
    name: "game-shell-copy",
    transformIndexHtml(html) {
      let transformed = html;
      for (const [placeholder, value] of shellCopy) {
        transformed = transformed.replaceAll(placeholder, escapeHtml(value));
      }
      return transformed;
    },
  }],
  build: {
    rolldownOptions: {
      // Derived from scripts/site-pages.mjs. A page missing from this map is
      // simply not built, and nothing else notices, so it must not be a second
      // hand-maintained list.
      input: Object.fromEntries(
        sitePages.map(({ entry, output }) => [entry, page(output)]),
      ),
    },
  },
});
