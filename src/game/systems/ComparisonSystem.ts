import type { GameState } from '../types';

export class ComparisonSystem {
  public constructor(private readonly getState: () => GameState) {}

  public revealFirstComparison(): void {
    this.getState().comparisonStage = Math.max(1, this.getState().comparisonStage);
  }
}
