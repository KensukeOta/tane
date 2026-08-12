import type { GameState } from '../types';

export type ComparisonItem = {
  label: string;
  relation: string;
};

type ComparisonDisplayOptions = {
  subtle?: boolean;
  edge?: 'left' | 'right';
};

export class ComparisonSystem {
  private display: HTMLElement | null = null;

  public constructor(private readonly getState: () => GameState) {}

  public revealFirstComparison(): void {
    this.setStage(1);
  }

  public setStage(stage: number): void {
    this.getState().comparisonStage = Math.max(stage, this.getState().comparisonStage);
  }

  public showComparison(
    parent: HTMLElement,
    items: readonly ComparisonItem[],
    options: ComparisonDisplayOptions = {},
  ): HTMLElement {
    this.hideComparison();
    const display = document.createElement('aside');
    display.className = `comparison-hud comparison-hud--${options.edge ?? 'right'}`;
    display.classList.toggle('is-subtle', Boolean(options.subtle));
    display.setAttribute('aria-label', '比較');

    items.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'comparison-hud-row';
      const label = document.createElement('span');
      label.className = 'comparison-hud-label';
      label.textContent = item.label;
      const relation = document.createElement('span');
      relation.className = 'comparison-hud-relation';
      relation.textContent = item.relation;
      row.append(label, relation);
      display.append(row);
    });

    parent.append(display);
    this.display = display;
    requestAnimationFrame(() => display.classList.add('is-visible'));
    return display;
  }

  public hideComparison(): void {
    this.display?.remove();
    this.display = null;
  }

  public destroy(): void {
    this.hideComparison();
  }
}
