import { ComparisonSystem } from '../systems/ComparisonSystem';
import { RootSystem } from '../systems/RootSystem';
import type { Scene, SceneContext } from '../types';
import { DialogueBox, type DialogueLine } from '../ui/DialogueBox';
import { createScene, prefersReducedMotion, wait } from './sceneUtils';

type ProloguePhase = 'cinematic' | 'play' | 'dialogue' | 'comparison' | 'seed' | 'ending';

export class PrologueScene implements Scene {
  private readonly abortController = new AbortController();
  private readonly comparisonSystem: ComparisonSystem;
  private readonly rootSystem: RootSystem;
  private phase: ProloguePhase = 'cinematic';
  private player: HTMLElement | null = null;
  private sibling: HTMLElement | null = null;
  private playerPosition = 37;
  private siblingPosition = 61;
  private siblingDirection = 1;
  private dialogue: DialogueBox | null = null;
  private removeSkipListeners: (() => void) | null = null;

  public constructor(private readonly context: SceneContext) {
    this.comparisonSystem = new ComparisonSystem(context.getState);
    this.rootSystem = new RootSystem(context.getState);
  }

  public enter(): void {
    void this.run();
  }

  public update(deltaSeconds: number): void {
    if (this.phase !== 'play' || !this.player || !this.sibling) return;

    const direction = Number(this.context.input.isPressed('right')) - Number(this.context.input.isPressed('left'));
    this.playerPosition = clamp(this.playerPosition + direction * 22 * deltaSeconds, 12, 88);
    this.player.style.left = `${this.playerPosition}%`;
    this.player.classList.toggle('is-walking', direction !== 0);
    this.player.classList.toggle('faces-left', direction < 0);

    this.siblingPosition += this.siblingDirection * 8 * deltaSeconds;
    if (this.siblingPosition >= 72 || this.siblingPosition <= 48) this.siblingDirection *= -1;
    this.sibling.style.left = `${this.siblingPosition}%`;
    this.sibling.classList.toggle('faces-left', this.siblingDirection < 0);
  }

  public exit(): void {
    this.abortController.abort();
    this.removeSkipListeners?.();
    this.dialogue?.destroy();
    this.dialogue = null;
  }

  private async run(): Promise<void> {
    if (!(await this.showOpening())) return;
    if (!(await this.showChildhoodPlay())) return;
    if (!(await this.showAdultWords())) return;
    if (!(await this.showComparison())) return;
    if (!(await this.showSeed())) return;
    await this.showEnding();
  }

  private async showOpening(): Promise<boolean> {
    this.phase = 'cinematic';
    const scene = createScene('prologue-opening');
    const text = document.createElement('p');
    text.className = 'cinematic-line';
    scene.append(text);
    this.replaceScene(scene);

    for (const line of ['僕には、弟がいる。', '双子だ。']) {
      text.textContent = line;
      text.classList.add('is-visible');
      if (!(await this.waitSkippable(prefersReducedMotion() ? 250 : 2100, scene))) return false;
      text.classList.remove('is-visible');
      if (!(await wait(prefersReducedMotion() ? 80 : 650, this.abortController.signal))) return false;
    }
    return true;
  }

  private async showChildhoodPlay(): Promise<boolean> {
    this.phase = 'play';
    const scene = createScene('childhood-scene');
    scene.setAttribute('aria-label', '幼い双子が庭で遊んでいる');
    const sky = document.createElement('div');
    sky.className = 'childhood-sky';
    const ground = document.createElement('div');
    ground.className = 'childhood-ground';
    this.player = this.createChild('child player-child', 'ぼく');
    this.sibling = this.createChild('child sibling-child', '弟');
    this.player.style.left = `${this.playerPosition}%`;
    this.sibling.style.left = `${this.siblingPosition}%`;
    const hint = document.createElement('p');
    hint.className = 'movement-hint';
    hint.textContent = '← → / A D：移動';
    scene.append(sky, ground, this.player, this.sibling, hint);
    this.replaceScene(scene);

    window.setTimeout(() => hint.classList.add('is-hidden'), prefersReducedMotion() ? 500 : 2600);
    const completed = await wait(prefersReducedMotion() ? 1500 : 5600, this.abortController.signal);
    this.player = null;
    this.sibling = null;
    return completed;
  }

  private async showAdultWords(): Promise<boolean> {
    this.phase = 'dialogue';
    const scene = createScene('childhood-scene adult-words-scene');
    const sky = document.createElement('div');
    sky.className = 'childhood-sky is-dimmed';
    const ground = document.createElement('div');
    ground.className = 'childhood-ground';
    const first = this.createChild('child player-child play-pose', 'ぼく');
    const second = this.createChild('child sibling-child play-pose', '弟');
    first.style.left = '43%';
    second.style.left = '57%';
    scene.append(sky, ground, first, second);
    this.replaceScene(scene);

    this.dialogue = new DialogueBox(scene, this.context.input, this.context.settings);
    this.dialogue.focus();
    const useNoise = this.context.settings.get().noiseEffects;
    const lines: DialogueLine[] = [
      { text: '「二人とも大きくなったね」', muted: true },
      { text: '「双子でも、やっぱり違うんだね」', muted: true },
      { text: '「弟くんは――」', fragmented: useNoise },
      { text: '「お兄ちゃんは――」', fragmented: useNoise },
      { text: '「どっちが――」', fragmented: useNoise },
    ];
    await this.dialogue.showLines(lines);
    this.dialogue.destroy();
    this.dialogue = null;
    return !this.abortController.signal.aborted;
  }

  private async showComparison(): Promise<boolean> {
    this.phase = 'comparison';
    const scene = createScene('comparison-scene');
    const pair = document.createElement('div');
    pair.className = 'comparison-pair';
    const left = this.createComparisonSide('弟', 'sibling-silhouette');
    const divider = document.createElement('div');
    divider.className = 'comparison-divider';
    divider.setAttribute('aria-hidden', 'true');
    const right = this.createComparisonSide('ぼく', 'player-silhouette');
    pair.append(left, divider, right);
    scene.append(pair);
    this.replaceScene(scene);
    requestAnimationFrame(() => pair.classList.add('is-visible'));
    this.comparisonSystem.revealFirstComparison();
    return wait(prefersReducedMotion() ? 700 : 3000, this.abortController.signal);
  }

  private async showSeed(): Promise<boolean> {
    this.phase = 'seed';
    const scene = createScene('seed-scene');
    const soil = document.createElement('div');
    soil.className = 'soil-field';
    const seed = document.createElement('div');
    seed.className = 'falling-seed';
    seed.setAttribute('aria-label', '土の中へ落ちる小さな種');
    soil.append(seed);
    scene.append(soil);
    this.replaceScene(scene);
    requestAnimationFrame(() => seed.classList.add('has-fallen'));
    const reducedMotion = prefersReducedMotion();
    if (!(await wait(reducedMotion ? 180 : 1600, this.abortController.signal))) return false;
    this.context.audio.playSE('seed-drop');
    const completed = await wait(reducedMotion ? 500 : 1100, this.abortController.signal);
    if (completed) this.rootSystem.plantFirstSeed();
    return completed;
  }

  private async showEnding(): Promise<void> {
    this.phase = 'ending';
    const scene = createScene('ending-scene');
    const card = document.createElement('div');
    card.className = 'chapter-card';
    const eyebrow = document.createElement('p');
    eyebrow.className = 'chapter-eyebrow';
    eyebrow.textContent = 'PROLOGUE';
    const title = document.createElement('h1');
    title.textContent = 'ふたり';
    card.append(eyebrow, title);
    scene.append(card);
    this.replaceScene(scene);
    requestAnimationFrame(() => card.classList.add('is-visible'));
    if (!(await wait(prefersReducedMotion() ? 700 : 2600, this.abortController.signal))) return;

    card.classList.remove('is-visible');
    if (!(await wait(prefersReducedMotion() ? 100 : 600, this.abortController.signal))) return;

    eyebrow.textContent = 'CHAPTER 1';
    title.textContent = 'サッカー';
    card.classList.add('is-visible');
    const state = this.context.getState();
    state.chapter = 1;
    state.sceneId = 'chapter1-start';
    state.comparisonStage = 1;
    state.rootStage = 1;
    if (!state.completedScenes.includes('prologue')) state.completedScenes.push('prologue');
    this.context.save.save(state);

    if (!(await wait(prefersReducedMotion() ? 700 : 2500, this.abortController.signal))) return;
    await this.context.navigate('chapter1-start');
  }

  private waitSkippable(milliseconds: number, target: HTMLElement): Promise<boolean> {
    return new Promise((resolve) => {
      let finished = false;
      const complete = (result: boolean): void => {
        if (finished) return;
        finished = true;
        window.clearTimeout(timer);
        offConfirm();
        target.removeEventListener('click', handleClick);
        this.abortController.signal.removeEventListener('abort', handleAbort);
        this.removeSkipListeners = null;
        resolve(result);
      };
      const handleClick = (): void => complete(true);
      const handleAbort = (): void => complete(false);
      const timer = window.setTimeout(() => complete(true), milliseconds);
      const offConfirm = this.context.input.onPress('confirm', () => complete(true));
      target.addEventListener('click', handleClick);
      this.abortController.signal.addEventListener('abort', handleAbort, { once: true });
      this.removeSkipListeners = () => complete(false);
    });
  }

  private createChild(className: string, label: string): HTMLElement {
    const child = document.createElement('div');
    child.className = className;
    child.setAttribute('role', 'img');
    child.setAttribute('aria-label', label);
    child.innerHTML = '<span class="child-head"></span><span class="child-body"></span>';
    return child;
  }

  private createComparisonSide(labelText: string, silhouetteClass: string): HTMLElement {
    const side = document.createElement('div');
    side.className = 'comparison-side';
    const silhouette = document.createElement('div');
    silhouette.className = `comparison-silhouette ${silhouetteClass}`;
    const label = document.createElement('p');
    label.textContent = labelText;
    side.append(silhouette, label);
    return side;
  }

  private replaceScene(scene: HTMLElement): void {
    this.context.root.replaceChildren(scene);
  }
}

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));
