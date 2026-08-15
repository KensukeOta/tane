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

  public growWithoutExternalStimulus(): void {
    this.setStage(5);
  }

  public revealFullRootSystem(parent: HTMLElement): HTMLElement {
    this.setStage(6);
    const figure = document.createElement('figure');
    figure.className = 'final-root-system';
    figure.setAttribute('role', 'img');
    figure.setAttribute(
      'aria-label',
      '一つの種から、長い時間をかけて広い範囲へ枝分かれした植物の根',
    );

    const seed = document.createElement('span');
    seed.className = 'final-root-seed';
    const network = document.createElement('span');
    network.className = 'final-root-network';
    for (let index = 1; index <= 26; index += 1) {
      const root = document.createElement('span');
      root.className = `final-root-line final-root-line--${index}`;
      network.append(root);
    }

    const words = document.createElement('span');
    words.className = 'final-root-words';
    for (const [index, text] of [
      'スポーツ',
      '勉強',
      '友達',
      '弟 ＞ ぼく',
      'あの人 ＞ ぼく',
      'ぼく ＜',
    ].entries()) {
      const word = document.createElement('span');
      word.className = `final-root-word final-root-word--${index + 1}`;
      word.textContent = text;
      words.append(word);
    }

    figure.append(seed, network, words);
    parent.append(figure);
    requestAnimationFrame(() => figure.classList.add('is-revealed'));
    return figure;
  }

  public setStage(stage: number): void {
    this.getState().rootStage = Math.max(stage, this.getState().rootStage);
  }

  public render(parent: HTMLElement, stage = this.getState().rootStage): HTMLElement {
    const seed = document.createElement('div');
    seed.className = 'root-seed';
    seed.classList.add(`root-stage-${stage}`);
    seed.setAttribute('role', 'img');
    seed.setAttribute(
      'aria-label',
      stage >= 5
        ? '外から何も落ちてこない中で、自ら枝を伸ばす根'
        : stage >= 4
          ? '複数の細い枝を伸ばす根'
          : stage >= 2
            ? '一本の細い根を伸ばす種'
            : '土の中の種',
    );
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
      if (stage >= 5) {
        for (let index = 0; index < 3; index += 1) {
          const branch = document.createElement('span');
          branch.className = `root-branch root-branch--${index + 5}`;
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
