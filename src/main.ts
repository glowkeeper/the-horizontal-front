import "./styles/global.css";
import "./registerServiceWorker";

import { createGame } from "./phaser/createGame";

const gameContainer = document.querySelector<HTMLElement>("#game");

if (!gameContainer) {
  throw new Error('Could not find the game container with the id "game".');
}

createGame(gameContainer);
