import { Game } from './game/Game';
import './styles/global.css';
import './styles/game.css';
import './styles/dialogue.css';
import './styles/chapter1.css';
import './styles/chapter2.css';
import './styles/chapter3.css';
import './styles/chapter4.css';
import './styles/chapter5.css';
import './styles/chapter6.css';
import './styles/final-chapter.css';

const app = document.querySelector<HTMLElement>('#app');

if (!app) {
  throw new Error('Game root was not found.');
}

const game = new Game(app);
game.start();
