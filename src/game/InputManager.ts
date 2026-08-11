export type GameKey =
  | 'left'
  | 'right'
  | 'up'
  | 'down'
  | 'confirm'
  | 'space'
  | 'escape';

type KeyListener = (event: KeyboardEvent) => void;

const KEY_MAP: Readonly<Record<string, GameKey | undefined>> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  a: 'left',
  A: 'left',
  d: 'right',
  D: 'right',
  Enter: 'confirm',
  ' ': 'space',
  Escape: 'escape',
};

export class InputManager {
  private readonly pressed = new Set<GameKey>();
  private readonly listeners = new Map<GameKey, Set<KeyListener>>();

  public constructor() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  public isPressed(key: GameKey): boolean {
    return this.pressed.has(key);
  }

  public onPress(key: GameKey, listener: KeyListener): () => void {
    const listeners = this.listeners.get(key) ?? new Set<KeyListener>();
    listeners.add(listener);
    this.listeners.set(key, listeners);

    return () => listeners.delete(listener);
  }

  public destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.pressed.clear();
    this.listeners.clear();
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (this.isNativeFormInteraction(event)) return;

    const key = KEY_MAP[event.key];
    if (!key) return;

    if (['left', 'right', 'up', 'down', 'space'].includes(key)) {
      event.preventDefault();
    }

    this.pressed.add(key);
    if (!event.repeat) {
      this.listeners.get(key)?.forEach((listener) => listener(event));
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    const key = KEY_MAP[event.key];
    if (key) this.pressed.delete(key);
  };

  private readonly handleBlur = (): void => {
    this.pressed.clear();
  };

  private isNativeFormInteraction(event: KeyboardEvent): boolean {
    const target = event.target;
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement
    ) {
      return true;
    }
    return target instanceof HTMLButtonElement && event.key === ' ';
  }
}
