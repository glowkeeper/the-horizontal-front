import { createServer } from "vite";
import { z } from "zod";

const server = await createServer({
  appType: "custom",
  logLevel: "silent",
  server: { middlewareMode: true },
});

try {
  const { game } = await server.ssrLoadModule("/src/play/content/game.ts");
  const { loadPresentation } = await server.ssrLoadModule(
    "/src/play/content/loadPresentation.ts",
  );
  for (const episode of game.episodes) loadPresentation(episode);
  console.log(
    `Validated ${game.campaigns.length} campaign(s) and ${game.episodes.length} episode(s), including mechanics, presentation and audio.`,
  );
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error(z.prettifyError(error));
  } else {
    console.error(error instanceof Error ? error.message : error);
  }
  process.exitCode = 1;
} finally {
  await server.close();
}
