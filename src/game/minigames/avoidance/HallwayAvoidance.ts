import type { InputManager } from '../../InputManager';

export type HallwayLayout = {
  label: string;
  groupX: number;
  groupY: number;
  quietY: number;
  people: number;
};

export type HallwayAvoidanceOptions = {
  layout: HallwayLayout;
  durationMs: number;
  onProximityChange: (intensity: number) => void;
  onComplete: () => void;
};

export class HallwayAvoidance {
  private readonly element: HTMLElement;
  private readonly player: HTMLElement;
  private readonly group: HTMLElement;
  private x = 7;
  private y = 52;
  private elapsedMs = 0;
  private completed = false;

  public constructor(
    parent: HTMLElement,
    private readonly input: InputManager,
    private readonly options: HallwayAvoidanceOptions,
  ) {
    this.element = document.createElement('div');
    this.element.className = 'hallway-avoidance';
    this.element.setAttribute('role', 'group');
    this.element.setAttribute(
      'aria-label',
      `${options.layout.label}。上下左右で移動。中央は近道、下側は静かな遠回り`,
    );

    const shortRoute = document.createElement('div');
    shortRoute.className = 'hallway-route hallway-route--short';
    shortRoute.setAttribute('aria-hidden', 'true');
    const quietRoute = document.createElement('div');
    quietRoute.className = 'hallway-route hallway-route--quiet';
    quietRoute.setAttribute('aria-hidden', 'true');
    quietRoute.style.top = `${options.layout.quietY}%`;
    const exit = document.createElement('div');
    exit.className = 'hallway-exit';
    exit.textContent = '→';
    exit.setAttribute('aria-label', '目的地');

    this.group = document.createElement('div');
    this.group.className = 'hallway-group';
    this.group.style.left = `${options.layout.groupX}%`;
    this.group.style.top = `${options.layout.groupY}%`;
    this.group.setAttribute('role', 'img');
    this.group.setAttribute('aria-label', '会話している生徒の集団');
    for (let index = 0; index < options.layout.people; index += 1) {
      const person = document.createElement('span');
      person.style.setProperty('--person-index', String(index));
      this.group.append(person);
    }

    this.player = document.createElement('div');
    this.player.className = 'hallway-player';
    this.player.setAttribute('role', 'img');
    this.player.setAttribute('aria-label', '廊下を歩く主人公');
    this.player.innerHTML = '<span class="hallway-head"></span><span class="hallway-body"></span>';
    this.element.append(shortRoute, quietRoute, exit, this.group, this.player);
    parent.append(this.element);
    this.render();
  }

  public update(deltaSeconds: number): void {
    if (this.completed) return;
    this.elapsedMs += deltaSeconds * 1000;
    const horizontal = Number(this.input.isPressed('right')) - Number(this.input.isPressed('left'));
    const vertical = Number(this.input.isPressed('down')) - Number(this.input.isPressed('up'));
    const assist = this.elapsedMs > this.options.durationMs * 0.72 && this.x < 88 ? 0.42 : 0;
    this.x = clamp(this.x + (horizontal + assist) * 27 * deltaSeconds, 5, 94);
    this.y = clamp(this.y + vertical * 31 * deltaSeconds, 25, 83);
    this.player.classList.toggle('is-walking', horizontal !== 0 || vertical !== 0 || assist > 0);

    const dx = (this.x - this.options.layout.groupX) / 27;
    const dy = (this.y - this.options.layout.groupY) / 24;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const intensity = clamp(1 - distance, 0, 1);
    this.options.onProximityChange(intensity);

    if (this.x >= 92 || this.elapsedMs >= this.options.durationMs) {
      this.completed = true;
      this.options.onProximityChange(0);
      this.options.onComplete();
    }
    this.render();
  }

  public destroy(): void {
    this.completed = true;
    this.options.onProximityChange(0);
    this.element.remove();
  }

  private render(): void {
    this.player.style.left = `${this.x}%`;
    this.player.style.top = `${this.y}%`;
  }
}

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));
