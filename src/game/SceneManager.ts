import type { Scene, SceneContext, SceneFactory } from './types';

export class SceneManager {
  private readonly factories = new Map<string, SceneFactory>();
  private current: Scene | null = null;
  private frameId: number | null = null;
  private previousTime = performance.now();

  public constructor(private readonly context: SceneContext) {}

  public register(id: string, factory: SceneFactory): void {
    this.factories.set(id, factory);
  }

  public async change(id: string): Promise<void> {
    const factory = this.factories.get(id);
    if (!factory) throw new Error(`Unknown scene: ${id}`);

    this.current?.exit();
    this.context.root.replaceChildren();
    this.current = factory(this.context);
    await this.current.enter();
  }

  public startLoop(): void {
    if (this.frameId !== null) return;
    this.previousTime = performance.now();
    this.frameId = requestAnimationFrame(this.tick);
  }

  public destroy(): void {
    this.current?.exit();
    if (this.frameId !== null) cancelAnimationFrame(this.frameId);
    this.frameId = null;
  }

  private readonly tick = (time: number): void => {
    const deltaSeconds = Math.min((time - this.previousTime) / 1000, 0.05);
    this.previousTime = time;
    this.current?.update?.(deltaSeconds);
    this.frameId = requestAnimationFrame(this.tick);
  };
}
