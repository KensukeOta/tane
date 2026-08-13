import type { AudioManager } from '../../AudioManager';
import type { InputManager } from '../../InputManager';
import { prefersReducedMotion } from '../../scenes/sceneUtils';

type BallDirection = 'incoming' | 'outgoing' | 'resetting';

export type TennisMiniGameOptions = {
  targetReturns?: number;
  assistAfterMs?: number;
  onMilestone?: (rally: number) => void;
  onComplete: () => void;
};

export class TennisMiniGame {
  private readonly element: HTMLElement;
  private readonly player: HTMLElement;
  private readonly opponent: HTMLElement;
  private readonly ball: HTMLElement;
  private readonly rallyDisplay: HTMLElement;
  private readonly feedback: HTMLElement;
  private readonly unsubscribe: Array<() => void> = [];
  private playerPosition = 48;
  private ballX = 60;
  private ballY = 20;
  private targetX = 48;
  private direction: BallDirection = 'incoming';
  private rally = 0;
  private bestRally = 0;
  private elapsedMs = 0;
  private resetTimerMs = 0;
  private completed = false;
  private completionTimer: number | null = null;
  private feedbackTimer: number | null = null;

  public constructor(
    parent: HTMLElement,
    private readonly input: InputManager,
    private readonly audio: AudioManager,
    private readonly options: TennisMiniGameOptions,
  ) {
    this.element = document.createElement('div');
    this.element.className = 'tennis-minigame';
    this.element.setAttribute('role', 'group');
    this.element.setAttribute('aria-label', 'テニスのラリー。左右で移動し、EnterまたはSpaceで返球する');
    this.element.innerHTML =
      '<div class="tennis-court-lines" aria-hidden="true"></div><div class="tennis-net" aria-hidden="true"></div>';

    this.player = this.createPlayer('tennis-player tennis-player--self', 'ラケットを持つ主人公');
    this.opponent = this.createPlayer('tennis-player tennis-player--opponent', 'ボールを返してくれる部員');
    this.ball = document.createElement('div');
    this.ball.className = 'tennis-ball';
    this.ball.setAttribute('role', 'img');
    this.ball.setAttribute('aria-label', 'テニスボール');
    this.rallyDisplay = document.createElement('p');
    this.rallyDisplay.className = 'rally-display';
    this.rallyDisplay.setAttribute('aria-live', 'polite');
    this.rallyDisplay.textContent = 'ラリー　0';
    this.feedback = document.createElement('p');
    this.feedback.className = 'tennis-feedback';
    this.feedback.setAttribute('aria-live', 'polite');
    this.element.append(this.opponent, this.player, this.ball, this.rallyDisplay, this.feedback);
    parent.append(this.element);

    this.unsubscribe.push(
      input.onPress('confirm', this.tryReturn),
      input.onPress('space', this.tryReturn),
    );
    this.render();
  }

  public update(deltaSeconds: number): void {
    if (this.completed) return;
    this.elapsedMs += deltaSeconds * 1000;
    const movement = Number(this.input.isPressed('right')) - Number(this.input.isPressed('left'));
    this.playerPosition = clamp(this.playerPosition + movement * 34 * deltaSeconds, 12, 88);
    this.player.classList.toggle('is-moving', movement !== 0);

    if (this.direction === 'resetting') {
      this.resetTimerMs -= deltaSeconds * 1000;
      if (this.resetTimerMs <= 0) this.serveBall();
      this.render();
      return;
    }

    const speed = this.direction === 'incoming' ? 39 : 54;
    this.ballY += (this.direction === 'incoming' ? 1 : -1) * speed * deltaSeconds;
    if (this.direction === 'incoming') {
      const progress = clamp((this.ballY - 20) / 68, 0, 1);
      this.ballX += (this.targetX - this.ballX) * Math.min(deltaSeconds * (2.2 + progress), 1);
      const assistActive = this.elapsedMs >= (this.options.assistAfterMs ?? 11000);
      if (assistActive && this.ballY >= 80) {
        this.targetX = this.playerPosition;
        this.ballX += (this.playerPosition - this.ballX) * 0.72;
      }
      if (assistActive && this.ballY >= 86) {
        this.performReturn(true);
      } else if (this.ballY >= 94) {
        this.missBall();
      }
    } else if (this.ballY <= 18) {
      this.direction = 'incoming';
      this.ballY = 18;
      const spread = Math.max(4, 14 - this.bestRally * 1.5);
      this.targetX = clamp(this.playerPosition + Math.sin(this.elapsedMs / 470) * spread, 18, 82);
      this.opponent.classList.add('is-hitting');
      window.setTimeout(() => this.opponent.classList.remove('is-hitting'), 180);
    }
    this.render();
  }

  public destroy(): void {
    this.completed = true;
    this.unsubscribe.forEach((unsubscribe) => unsubscribe());
    if (this.completionTimer !== null) window.clearTimeout(this.completionTimer);
    if (this.feedbackTimer !== null) window.clearTimeout(this.feedbackTimer);
    this.element.remove();
  }

  private readonly tryReturn = (): void => {
    if (this.completed || this.direction !== 'incoming') return;
    const inTimingWindow = this.ballY >= 63 && this.ballY <= 94;
    const horizontalDistance = Math.abs(this.ballX - this.playerPosition);
    const assistWidth = this.elapsedMs > (this.options.assistAfterMs ?? 11000) * 0.55 ? 29 : 22;
    if (inTimingWindow && horizontalDistance <= assistWidth) {
      this.performReturn(false);
      return;
    }
    if (this.ballY >= 51) this.showFeedback('もう少し待って');
  };

  private performReturn(assisted: boolean): void {
    if (this.direction !== 'incoming' || this.completed) return;
    this.direction = 'outgoing';
    this.ballY = Math.min(this.ballY, 86);
    this.rally += 1;
    this.bestRally = Math.max(this.bestRally, this.rally);
    this.rallyDisplay.textContent = `ラリー　${this.rally}`;
    this.element.style.setProperty('--rally-warmth', String(Math.min(this.bestRally, 6)));
    this.player.classList.add('is-hitting');
    this.ball.classList.add('is-returned');
    this.audio.playSE('tennis-hit');
    window.setTimeout(() => {
      this.player.classList.remove('is-hitting');
      this.ball.classList.remove('is-returned');
    }, prefersReducedMotion() ? 20 : 190);
    if (!assisted) this.showFeedback('タン');

    if (this.rally === 3 || this.rally === 5) this.options.onMilestone?.(this.rally);
    if (this.rally >= (this.options.targetReturns ?? 6)) {
      this.completed = true;
      this.completionTimer = window.setTimeout(
        () => this.options.onComplete(),
        prefersReducedMotion() ? 160 : 750,
      );
    }
  }

  private missBall(): void {
    this.audio.playSE('tennis-miss');
    this.showFeedback('もう一球');
    this.rally = 0;
    this.rallyDisplay.textContent = 'ラリー　0';
    this.direction = 'resetting';
    this.resetTimerMs = prefersReducedMotion() ? 120 : 520;
    this.ball.classList.add('is-missed');
  }

  private serveBall(): void {
    this.direction = 'incoming';
    this.ballY = 18;
    this.ballX = 62;
    const spread = this.elapsedMs > (this.options.assistAfterMs ?? 11000) * 0.55 ? 8 : 17;
    this.targetX = clamp(this.playerPosition + Math.sin(this.elapsedMs / 610) * spread, 18, 82);
    this.ball.classList.remove('is-missed');
  }

  private showFeedback(text: string): void {
    this.feedback.textContent = text;
    this.feedback.classList.add('is-visible');
    if (this.feedbackTimer !== null) window.clearTimeout(this.feedbackTimer);
    this.feedbackTimer = window.setTimeout(() => this.feedback.classList.remove('is-visible'), 650);
  }

  private createPlayer(className: string, label: string): HTMLElement {
    const player = document.createElement('div');
    player.className = className;
    player.setAttribute('role', 'img');
    player.setAttribute('aria-label', label);
    player.innerHTML =
      '<span class="tennis-head"></span><span class="tennis-body"></span><span class="tennis-racket"></span>';
    return player;
  }

  private render(): void {
    this.player.style.left = `${this.playerPosition}%`;
    this.ball.style.left = `${this.ballX}%`;
    this.ball.style.top = `${this.ballY}%`;
  }
}

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));
