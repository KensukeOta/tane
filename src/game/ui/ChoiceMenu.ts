import type { InputManager } from '../InputManager';

export type ChoiceOption = {
  label: string;
  disabled?: boolean;
  action: () => void;
};

export class ChoiceMenu {
  private readonly element: HTMLElement;
  private readonly buttons: HTMLButtonElement[] = [];
  private readonly unsubscribe: Array<() => void> = [];
  private selectedIndex = 0;
  private enabled = true;

  public constructor(parent: HTMLElement, input: InputManager, options: readonly ChoiceOption[]) {
    this.element = document.createElement('nav');
    this.element.className = 'choice-menu';
    this.element.setAttribute('aria-label', '選択肢');

    options.forEach((option, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'choice-button';
      button.textContent = option.label;
      button.disabled = Boolean(option.disabled);
      button.addEventListener('click', option.action);
      button.addEventListener('focus', () => {
        this.selectedIndex = index;
      });
      this.buttons.push(button);
      this.element.append(button);
    });

    const firstEnabled = this.buttons.findIndex((button) => !button.disabled);
    this.selectedIndex = Math.max(firstEnabled, 0);
    parent.append(this.element);

    unsubscribeIfPresent(this.unsubscribe, input.onPress('up', () => this.move(-1)));
    unsubscribeIfPresent(this.unsubscribe, input.onPress('down', () => this.move(1)));
    unsubscribeIfPresent(this.unsubscribe, input.onPress('confirm', () => this.activate()));
  }

  public focus(): void {
    this.buttons[this.selectedIndex]?.focus({ preventScroll: true });
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public destroy(): void {
    this.unsubscribe.forEach((unsubscribe) => unsubscribe());
    this.element.remove();
  }

  private move(direction: number): void {
    if (!this.enabled || this.buttons.length === 0) return;
    let next = this.selectedIndex;
    do {
      next = (next + direction + this.buttons.length) % this.buttons.length;
    } while (this.buttons[next]?.disabled && next !== this.selectedIndex);
    this.selectedIndex = next;
    this.buttons[next]?.focus({ preventScroll: true });
  }

  private activate(): void {
    if (!this.enabled) return;
    const button = this.buttons[this.selectedIndex];
    if (button && document.activeElement !== button) button.click();
  }
}

const unsubscribeIfPresent = (collection: Array<() => void>, unsubscribe: () => void): void => {
  collection.push(unsubscribe);
};
