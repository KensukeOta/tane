import type { AudioManager } from '../../AudioManager';
import type { InputManager } from '../../InputManager';
import { prefersReducedMotion } from '../../scenes/sceneUtils';

export type DinnerInteractionOptions = {
  totalBites: number;
  mode: 'family' | 'alone';
  onBite: (bite: number) => void;
  onComplete: () => void;
};

export class DinnerInteraction {
  private readonly element: HTMLElement;
  private readonly button: HTMLButtonElement;
  private readonly plate: HTMLElement;
  private readonly status: HTMLElement;
  private readonly unsubscribe: Array<() => void> = [];
  private bite = 0;
  private locked = false;
  private completed = false;
  private unlockTimer: number | null = null;
  private completionTimer: number | null = null;

  public constructor(
    parent: HTMLElement,
    input: InputManager,
    private readonly audio: AudioManager,
    private readonly options: DinnerInteractionOptions,
  ) {
    this.element = document.createElement('div');
    this.element.className = `dinner-interaction dinner-interaction--${options.mode}`;
    this.element.setAttribute('role', 'group');
    this.element.setAttribute('aria-label', `${options.mode === 'family' ? '家族との' : '一人での'}夕食`);
    this.plate = document.createElement('div');
    this.plate.className = 'dinner-plate';
    this.plate.setAttribute('role', 'img');
    this.plate.setAttribute('aria-label', '一人分の食事');
    this.status = document.createElement('span');
    this.status.className = 'dinner-status';
    this.status.setAttribute('aria-live', 'polite');
    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.className = 'eat-button';
    this.button.textContent = '食べる';
    this.button.addEventListener('click', this.takeBite);
    this.element.append(this.plate, this.status, this.button);
    parent.append(this.element);

    this.unsubscribe.push(
      input.onPress('confirm', this.handleKeyboardBite),
      input.onPress('space', this.handleKeyboardBite),
    );
    this.button.focus({ preventScroll: true });
  }

  public destroy(): void {
    this.completed = true;
    this.unsubscribe.forEach((unsubscribe) => unsubscribe());
    if (this.unlockTimer !== null) window.clearTimeout(this.unlockTimer);
    if (this.completionTimer !== null) window.clearTimeout(this.completionTimer);
    this.button.removeEventListener('click', this.takeBite);
    this.element.remove();
  }

  private readonly handleKeyboardBite = (): void => {
    // フォーカス中のbuttonではブラウザの標準クリックに任せ、二重入力を防ぐ。
    if (document.activeElement === this.button) return;
    this.takeBite();
  };

  private readonly takeBite = (): void => {
    if (this.locked || this.completed) return;
    this.locked = true;
    this.bite += 1;
    this.audio.playSE('dish');
    this.plate.style.setProperty('--meal-left', String(1 - this.bite / this.options.totalBites));
    this.plate.classList.remove('is-eating');
    requestAnimationFrame(() => this.plate.classList.add('is-eating'));
    this.status.textContent = this.options.mode === 'alone' ? 'カチャ。' : `${this.bite}口目`;
    this.options.onBite(this.bite);

    if (this.bite >= this.options.totalBites) {
      this.completed = true;
      this.button.disabled = true;
      this.button.textContent = '食べ終える';
      this.completionTimer = window.setTimeout(
        () => this.options.onComplete(),
        prefersReducedMotion() ? 100 : 450,
      );
      return;
    }

    this.unlockTimer = window.setTimeout(() => {
      this.locked = false;
      this.unlockTimer = null;
    }, prefersReducedMotion() ? 60 : 380);
  };
}
