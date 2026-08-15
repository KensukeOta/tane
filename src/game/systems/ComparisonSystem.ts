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

  public showPersonalValue(parent: HTMLElement, labelText: string, valueText: string): HTMLElement {
    this.hideComparison();
    const display = document.createElement('aside');
    display.className = 'comparison-hud personal-value-display';
    display.setAttribute('aria-label', '自分自身の感覚');
    const label = document.createElement('span');
    label.className = 'comparison-hud-label';
    label.textContent = labelText;
    const value = document.createElement('span');
    value.className = 'personal-value-text';
    value.textContent = valueText;
    display.append(label, value);
    parent.append(display);
    this.display = display;
    requestAnimationFrame(() => display.classList.add('is-visible'));
    return display;
  }

  public showTrace(parent: HTMLElement, text: string): HTMLElement {
    this.hideComparison();
    const trace = document.createElement('aside');
    trace.className = 'comparison-trace';
    trace.setAttribute('aria-label', text);
    trace.textContent = text;
    parent.append(trace);
    this.display = trace;
    requestAnimationFrame(() => trace.classList.add('is-visible'));
    return trace;
  }

  public showExternalComparison(
    parent: HTMLElement,
    labels: readonly string[],
    options: ComparisonDisplayOptions = {},
  ): HTMLElement {
    this.setStage(6);
    this.hideComparison();
    const display = document.createElement('aside');
    display.className = `comparison-hud comparison-hud--${options.edge ?? 'right'} external-comparison`;
    display.classList.toggle('is-subtle', Boolean(options.subtle));
    display.setAttribute('aria-label', '周囲との比較');

    labels.forEach((labelText) => {
      const row = document.createElement('div');
      row.className = 'comparison-hud-row';
      const label = document.createElement('span');
      label.className = 'comparison-hud-label';
      label.textContent = labelText;
      const relation = document.createElement('span');
      relation.className = 'comparison-hud-relation external-comparison-relation';
      const target = document.createElement('span');
      target.className = 'external-comparison-target';
      target.textContent = 'あの人';
      const mark = document.createElement('span');
      mark.className = 'external-comparison-mark';
      mark.textContent = ' ＞ ';
      const self = document.createElement('span');
      self.className = 'external-comparison-self';
      self.textContent = 'ぼく';
      relation.append(target, mark, self);
      row.append(label, relation);
      display.append(row);
    });

    parent.append(display);
    this.display = display;
    requestAnimationFrame(() => display.classList.add('is-visible'));
    return display;
  }

  public showInternalizedComparison(parent: HTMLElement): HTMLElement {
    this.setStage(7);
    this.hideComparison();
    const display = document.createElement('aside');
    display.className = 'comparison-hud comparison-hud--right internalized-comparison';
    display.setAttribute('aria-label', 'ぼく、より小さい');
    const text = document.createElement('span');
    text.className = 'internalized-comparison-text';
    text.textContent = 'ぼく ＜';
    display.append(text);
    parent.append(display);
    this.display = display;
    requestAnimationFrame(() => display.classList.add('is-visible'));
    return display;
  }

  public hideComparison(): void {
    this.display?.remove();
    this.display = null;
  }

  public clearComparison(): void {
    this.setStage(5);
    this.hideComparison();
  }

  public destroy(): void {
    this.hideComparison();
  }
}
