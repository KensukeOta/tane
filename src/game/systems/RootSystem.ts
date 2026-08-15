import type { GameState } from '../types';

export class RootSystem {
  public constructor(private readonly getState: () => GameState) {}

  public plantFirstSeed(): void {
    this.setStage(1);
  }

  public growFirstRoot(): void {
    this.setStage(2);
  }

  public growRootBranch(): void {
    this.setStage(3);
  }

  public growMultipleBranches(): void {
    this.setStage(4);
  }

  public setStage(stage: number): void {
    this.getState().rootStage = Math.max(stage, this.getState().rootStage);
  }

  public render(parent: HTMLElement, stage = this.getState().rootStage): HTMLElement {
    const seed = document.createElement('div');
    seed.className = 'root-seed';
    seed.classList.add(`root-stage-${stage}`);
    seed.setAttribute('role', 'img');
    seed.setAttribute('aria-label', stage >= 2 ? '一本の細い根を伸ばす種' : '土の中の種');
    if (stage >= 2) {
      const root = document.createElement('span');
      root.className = 'first-root';
      seed.append(root);
      if (stage >= 3) {
        const branch = document.createElement('span');
        branch.className = 'root-branch';
        root.append(branch);
      }
      if (stage >= 4) {
        for (let index = 0; index < 3; index += 1) {
          const branch = document.createElement('span');
          branch.className = `root-branch root-branch--${index + 2}`;
          root.append(branch);
        }
      }
      requestAnimationFrame(() => root.classList.add('is-growing'));
    }
    parent.append(seed);
    return seed;
  }

  public renderRestingRoot(parent: HTMLElement): HTMLElement {
    const seed = this.render(parent, 2);
    seed.classList.add('is-resting');
    seed.querySelector('.first-root')?.classList.add('is-grown');
    return seed;
  }
}
