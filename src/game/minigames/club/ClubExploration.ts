import type { InputManager } from '../../InputManager';

export type ClubExplorationOptions = {
  durationMs: number;
  onCulturalClub: () => void;
  onSoccerClub: () => void;
  onComplete: () => void;
};

export class ClubExploration {
  private readonly element: HTMLElement;
  private readonly player: HTMLElement;
  private position = 8;
  private elapsedMs = 0;
  private culturalSeen = false;
  private soccerSeen = false;
  private completed = false;

  public constructor(
    parent: HTMLElement,
    private readonly input: InputManager,
    private readonly options: ClubExplorationOptions,
  ) {
    this.element = document.createElement('div');
    this.element.className = 'club-exploration';
    this.element.setAttribute('role', 'group');
    this.element.setAttribute('aria-label', '放課後の校内で部活動を見て回る');

    const zones = [
      { label: '文化部', className: 'club-zone--culture' },
      { label: 'サッカー部', className: 'club-zone--soccer' },
      { label: 'テニス部', className: 'club-zone--tennis' },
    ];
    zones.forEach(({ label, className }) => {
      const zone = document.createElement('div');
      zone.className = `club-zone ${className}`;
      const sign = document.createElement('span');
      sign.textContent = label;
      zone.append(sign);
      this.element.append(zone);
    });

    this.player = document.createElement('div');
    this.player.className = 'club-player';
    this.player.setAttribute('role', 'img');
    this.player.setAttribute('aria-label', '部活動を見て歩く主人公');
    this.player.innerHTML = '<span class="club-player-head"></span><span class="club-player-body"></span>';
    this.element.append(this.player);
    parent.append(this.element);
    this.render();
  }

  public update(deltaSeconds: number): void {
    if (this.completed) return;
    this.elapsedMs += deltaSeconds * 1000;
    const direction = Number(this.input.isPressed('right')) - Number(this.input.isPressed('left'));
    const shouldAssist = this.elapsedMs > this.options.durationMs * 0.72;
    const assistedDirection = shouldAssist && this.position < 78 ? 1 : 0;
    const movement = direction || assistedDirection;
    this.position = clamp(this.position + movement * 25 * deltaSeconds, 6, 91);
    this.player.classList.toggle('is-walking', movement !== 0);
    this.player.classList.toggle('faces-left', movement < 0);

    if (!this.culturalSeen && this.position >= 15 && this.position <= 34) {
      this.culturalSeen = true;
      this.options.onCulturalClub();
    }
    if (!this.soccerSeen && this.position >= 40 && this.position <= 61) {
      this.soccerSeen = true;
      this.options.onSoccerClub();
    }
    if (this.position >= 78 || this.elapsedMs >= this.options.durationMs) {
      this.completed = true;
      this.options.onComplete();
    }
    this.render();
  }

  public destroy(): void {
    this.completed = true;
    this.element.remove();
  }

  private render(): void {
    this.player.style.left = `${this.position}%`;
  }
}

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));
