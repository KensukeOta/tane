import type { AudioManager } from '../../AudioManager';
import type { InputManager } from '../../InputManager';
import { prefersReducedMotion } from '../../scenes/sceneUtils';

type SoccerMode = 'shoot' | 'chase';

export type SoccerMiniGameOptions = {
  mode?: SoccerMode;
  durationMs?: number;
  className?: string;
  ariaLabel?: string;
  onProgress?: (progress: number) => void;
  onComplete: () => void;
};

export class SoccerMiniGame {
  private readonly element: HTMLElement;
  private readonly player: HTMLElement;
  private readonly ball: HTMLElement;
  private readonly message: HTMLElement;
  private readonly unsubscribe: Array<() => void> = [];
  private playerPosition = 21;
  private ballPosition = 45;
  private elapsedMs = 0;
  private attempts = 0;
  private complete = false;
  private completionTimer: number | null = null;
  private messageTimer: number | null = null;

  public constructor(
    parent: HTMLElement,
    private readonly input: InputManager,
    private readonly audio: AudioManager,
    private readonly options: SoccerMiniGameOptions,
  ) {
    this.element = document.createElement('div');
    this.element.className = `soccer-minigame ${options.className ?? ''}`.trim();
    this.element.setAttribute('role', 'group');
    this.element.setAttribute('aria-label', options.ariaLabel ?? 'サッカー操作');
    this.element.innerHTML =
      '<div class="field-line field-line--center"></div>' +
      '<div class="soccer-goal" aria-label="ゴール"><span></span></div>';

    this.player = document.createElement('div');
    this.player.className = 'soccer-player soccer-player--protagonist';
    this.player.setAttribute('role', 'img');
    this.player.setAttribute('aria-label', 'ぼく');
    this.player.innerHTML = '<span class="soccer-head"></span><span class="soccer-body"></span>';
    this.ball = document.createElement('div');
    this.ball.className = 'soccer-ball';
    this.ball.setAttribute('role', 'img');
    this.ball.setAttribute('aria-label', 'ボール');
    this.message = document.createElement('p');
    this.message.className = 'soccer-message';
    this.message.setAttribute('aria-live', 'polite');
    this.element.append(this.player, this.ball, this.message);
    parent.append(this.element);
    this.renderPositions();

    if ((options.mode ?? 'shoot') === 'shoot') {
      this.unsubscribe.push(
        input.onPress('confirm', this.shoot),
        input.onPress('space', this.shoot),
      );
    }
  }

  public update(deltaSeconds: number): void {
    if (this.complete) return;
    const mode = this.options.mode ?? 'shoot';
    this.elapsedMs += deltaSeconds * 1000;
    const direction = Number(this.input.isPressed('right')) - Number(this.input.isPressed('left'));
    this.playerPosition = clamp(this.playerPosition + direction * 30 * deltaSeconds, 7, 91);
    this.player.classList.toggle('is-running', direction !== 0);

    if (mode === 'chase') {
      const target = clamp(this.playerPosition + 11, 20, 82);
      this.ballPosition += (target - this.ballPosition) * Math.min(deltaSeconds * 3.2, 1);
      const duration = this.options.durationMs ?? 3500;
      const progress = clamp(this.elapsedMs / duration, 0, 1);
      this.options.onProgress?.(progress);
      if (progress >= 1) this.finish();
    } else if (this.elapsedMs >= (this.options.durationMs ?? 8500)) {
      // 操作に慣れなくても物語は止めず、最後は足元へボールが来る。
      this.playerPosition = this.ballPosition - 4;
      this.renderPositions();
      this.scoreGoal();
      return;
    }
    this.renderPositions();
  }

  public destroy(): void {
    this.complete = true;
    this.unsubscribe.forEach((unsubscribe) => unsubscribe());
    if (this.completionTimer !== null) window.clearTimeout(this.completionTimer);
    if (this.messageTimer !== null) window.clearTimeout(this.messageTimer);
    this.element.remove();
  }

  private readonly shoot = (): void => {
    if (this.complete) return;
    this.attempts += 1;
    const nearBall = Math.abs(this.playerPosition - this.ballPosition) <= 11;
    if (nearBall || this.attempts >= 3) {
      if (!nearBall) this.playerPosition = this.ballPosition - 5;
      this.scoreGoal();
      return;
    }

    this.showMessage('もう少し近くへ');
    this.ball.classList.remove('is-nudged');
    requestAnimationFrame(() => this.ball.classList.add('is-nudged'));
  };

  private scoreGoal(): void {
    if (this.complete) return;
    this.complete = true;
    this.audio.playSE('soccer-kick');
    this.player.classList.add('is-kicking');
    this.ball.classList.add('is-shot');
    this.showMessage('できた！');
    const delay = prefersReducedMotion() ? 180 : 900;
    this.completionTimer = window.setTimeout(() => {
      this.audio.playSE('soccer-goal');
      this.options.onComplete();
    }, delay);
  }

  private showMessage(text: string): void {
    this.message.textContent = text;
    this.message.style.left = `${clamp(this.playerPosition, 15, 78)}%`;
    this.message.classList.add('is-visible');
    if (this.messageTimer !== null) window.clearTimeout(this.messageTimer);
    this.messageTimer = window.setTimeout(() => this.message.classList.remove('is-visible'), 1400);
  }

  private finish(): void {
    if (this.complete) return;
    this.complete = true;
    this.options.onComplete();
  }

  private renderPositions(): void {
    this.player.style.left = `${this.playerPosition}%`;
    this.ball.style.left = `${this.ballPosition}%`;
  }
}

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));
