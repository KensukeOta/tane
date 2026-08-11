import { Game } from './game/Game';
import './styles/global.css';
import './styles/game.css';
import './styles/dialogue.css';

const app = document.querySelector<HTMLElement>('#app');

if (!app) {
  throw new Error('Game root was not found.');
}

const game = new Game(app);
game.start();
