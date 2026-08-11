import type { AudioManager } from './AudioManager';
import type { InputManager } from './InputManager';
import type { SaveManager } from './SaveManager';
import type { SettingsManager } from './SettingsManager';

export type GameState = {
  chapter: number;
  sceneId: string;
  comparisonStage: number;
  rootStage: number;
  completedScenes: string[];
};

export type GameSettings = {
  bgmVolume: number;
  seVolume: number;
  textSpeed: number;
  screenShake: boolean;
  noiseEffects: boolean;
};

export const createInitialState = (): GameState => ({
  chapter: 0,
  sceneId: 'title',
  comparisonStage: 0,
  rootStage: 0,
  completedScenes: [],
});

export interface Scene {
  enter(): void | Promise<void>;
  update?(deltaSeconds: number): void;
  exit(): void;
}

export type SceneContext = {
  root: HTMLElement;
  input: InputManager;
  save: SaveManager;
  settings: SettingsManager;
  audio: AudioManager;
  getState: () => GameState;
  resetState: () => void;
  navigate: (sceneId: string) => Promise<void>;
};

export type SceneFactory = (context: SceneContext) => Scene;
