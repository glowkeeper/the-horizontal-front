import { resolve } from "node:path";

import { defineConfig } from "vite";

const page = (path: string): string => resolve(import.meta.dirname, path);

export default defineConfig({
  build: {
    rolldownOptions: {
      input: {
        home: page("index.html"),
        play: page("play/index.html"),
        commons: page("commons/index.html"),
        charter: page("charter/index.html"),
        governance: page("governance/index.html"),
        identity: page("identity/index.html"),
        contribute: page("contribute/index.html"),
        licences: page("licences/index.html"),
        "licences/agpl": page("licences/agpl/index.html"),
        "licences/cc-by-sa": page("licences/cc-by-sa/index.html"),
      },
    },
  },
});
