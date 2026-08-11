import type { InputManager } from '../InputManager';
import type { SettingsManager } from '../SettingsManager';

export type DialogueLine = {
  text: string;
  muted?: boolean;
  fragmented?: boolean;
};

export class DialogueBox {
  private readonly element: HTMLElement;
  private readonly textElement: HTMLParagraphElement;
  private readonly promptElement: HTMLSpanElement;
  private readonly unsubscribe: Array<() => void> = [];
  private timer: number | null = null;
  private fullText = '';
  private isTyping = false;
  private finishCurrent: (() => void) | null = null;
  private destroyed = false;

  public constructor(
    parent: HTMLElement,
    private readonly input: InputManager,
    private readonly settings: SettingsManager,
  ) {
    this.element = document.createElement('section');
    this.element.className = 'dialogue-box';
    this.element.setAttribute('aria-live', 'polite');
    this.element.tabIndex = 0;

    this.textElement = document.createElement('p');
    this.textElement.className = 'dialogue-text';
    this.promptElement = document.createElement('span');
    this.promptElement.className = 'dialogue-prompt';
    this.promptElement.textContent = 'Enter / Space / クリック';
    this.element.append(this.textElement, this.promptElement);
    parent.append(this.element);

    this.unsubscribe.push(
      this.input.onPress('confirm', this.advance),
      this.input.onPress('space', this.advance),
    );
    this.element.addEventListener('click', this.advance);
  }

  public async showLines(lines: readonly DialogueLine[]): Promise<void> {
    for (const line of lines) {
      if (this.destroyed) return;
      await this.showLine(line);
    }
  }

  public focus(): void {
    this.element.focus({ preventScroll: true });
  }

  public destroy(): void {
    this.destroyed = true;
    this.clearTimer();
    this.finishCurrent?.();
    this.finishCurrent = null;
    this.unsubscribe.forEach((unsubscribe) => unsubscribe());
    this.element.removeEventListener('click', this.advance);
    this.element.remove();
  }

  private showLine(line: DialogueLine): Promise<void> {
    this.fullText = line.text;
    this.textElement.textContent = '';
    this.textElement.classList.toggle('is-muted', Boolean(line.muted));
    this.textElement.classList.toggle('is-fragmented', Boolean(line.fragmented));
    this.promptElement.classList.remove('is-visible');
    this.isTyping = true;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      this.completeTyping();
    } else {
      let index = 0;
      this.timer = window.setInterval(() => {
        index += 1;
        this.textElement.textContent = this.fullText.slice(0, index);
        if (index >= this.fullText.length) this.completeTyping();
      }, this.settings.get().textSpeed);
    }

    return new Promise((resolve) => {
      this.finishCurrent = resolve;
    });
  }

  private readonly advance = (): void => {
    if (this.destroyed || !this.finishCurrent) return;
    if (this.isTyping) {
      this.completeTyping();
      return;
    }

    const finish = this.finishCurrent;
    this.finishCurrent = null;
    finish();
  };

  private completeTyping(): void {
    this.clearTimer();
    this.textElement.textContent = this.fullText;
    this.isTyping = false;
    this.promptElement.classList.add('is-visible');
  }

  private clearTimer(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }
}
