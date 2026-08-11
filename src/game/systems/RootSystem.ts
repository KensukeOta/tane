import type { GameState } from '../types';

export class RootSystem {
  public constructor(private readonly getState: () => GameState) {}

  public plantFirstSeed(): void {
    this.getState().rootStage = Math.max(1, this.getState().rootStage);
  }
}
