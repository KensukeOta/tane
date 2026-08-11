import type { GameState } from './types';

const SAVE_KEY = 'tane-save-v1';

const isGameState = (value: unknown): value is GameState => {
  if (!value || typeof value !== 'object') return false;
  const state = value as Record<string, unknown>;
  return (
    typeof state.chapter === 'number' &&
    typeof state.sceneId === 'string' &&
    typeof state.comparisonStage === 'number' &&
    typeof state.rootStage === 'number' &&
    Array.isArray(state.completedScenes) &&
    state.completedScenes.every((item) => typeof item === 'string')
  );
};

export class SaveManager {
  public hasSave(): boolean {
    return this.load() !== null;
  }

  public load(): GameState | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      return isGameState(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  public save(state: GameState): boolean {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  }
}
