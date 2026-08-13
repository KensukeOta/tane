import { ClubExploration } from '../minigames/club/ClubExploration';
import { TennisMiniGame, type TennisMiniGameOptions } from '../minigames/tennis/TennisMiniGame';
import { ComparisonSystem } from '../systems/ComparisonSystem';
import { RootSystem } from '../systems/RootSystem';
import type { Scene, SceneContext } from '../types';
import {
  createChapterCard,
  createScene,
  motionDuration,
  showCinematicLines,
  wait,
  waitForAdvance,
} from './sceneUtils';

export class Chapter2Scene implements Scene {
  private readonly abortController = new AbortController();
  private readonly comparisonSystem: ComparisonSystem;
  private readonly rootSystem: RootSystem;
  private exploration: ClubExploration | null = null;
  private tennisGame: TennisMiniGame | null = null;
  private readonly timers = new Set<number>();

  public constructor(private readonly context: SceneContext) {
    this.comparisonSystem = new ComparisonSystem(context.getState);
    this.rootSystem = new RootSystem(context.getState);
  }

  public enter(): void {
    void this.run();
  }

  public update(deltaSeconds: number): void {
    this.exploration?.update(deltaSeconds);
    this.tennisGame?.update(deltaSeconds);
  }

  public exit(): void {
    this.abortController.abort();
    this.exploration?.destroy();
    this.tennisGame?.destroy();
    this.comparisonSystem.destroy();
    this.clearTimers();
    this.exploration = null;
    this.tennisGame = null;
  }

  private async run(): Promise<void> {
    // CHAPTER 2タイトルはCHAPTER 1末尾で表示済みなので、再開時も導入から始める。
    if (!(await this.showMiddleSchoolSpring())) return;
    if (!(await this.showClubExploration())) return;
    if (!(await this.showTennisClubEncounter())) return;
    if (!(await this.showFirstRally())) return;
    if (!(await this.showFunAtDusk())) return;
    if (!(await this.showAbsorptionMontage())) return;
    if (!(await this.showRestingRoot())) return;
    await this.showNextChapterConnection();
  }

  private async showMiddleSchoolSpring(): Promise<boolean> {
    const scene = createScene('middle-school-spring-scene');
    const school = document.createElement('div');
    school.className = 'spring-school';
    school.innerHTML =
      '<span class="school-building"></span><span class="school-tree"></span><span class="spring-path"></span>';
    const protagonist = this.createFigure('spring-protagonist', '新しい中学校に立つ主人公');
    const text = document.createElement('p');
    text.className = 'spring-intro-text';
    scene.append(school, protagonist, text);
    this.replaceScene(scene);

    const lines = [
      '中学校。',
      '弟は、サッカーを続けた。',
      '僕は、やめた。',
      'もう、サッカーをしなくていい。',
    ];
    for (const line of lines) {
      text.textContent = line;
      text.classList.add('is-visible');
      if (
        !(await waitForAdvance({
          input: this.context.input,
          target: scene,
          signal: this.abortController.signal,
          milliseconds: this.duration(2200, 480),
        }))
      ) {
        return false;
      }
      text.classList.remove('is-visible');
      if (!(await wait(this.duration(450, 60), this.abortController.signal))) return false;
    }
    return true;
  }

  private showClubExploration(): Promise<boolean> {
    const scene = createScene('club-exploration-scene');
    const heading = document.createElement('p');
    heading.className = 'scene-heading club-heading';
    heading.textContent = '放課後。部活を見る。';
    const hint = document.createElement('p');
    hint.className = 'movement-hint club-movement-hint';
    hint.textContent = '← → / A D：移動';
    const monologue = document.createElement('p');
    monologue.className = 'club-monologue';
    monologue.setAttribute('aria-live', 'polite');
    scene.append(heading, hint, monologue);
    this.replaceScene(scene);
    this.schedule(() => hint.classList.add('is-hidden'), this.duration(3300, 900));

    return new Promise((resolve) => {
      let settled = false;
      const finish = (result: boolean): void => {
        if (settled) return;
        settled = true;
        this.abortController.signal.removeEventListener('abort', handleAbort);
        this.exploration?.destroy();
        this.exploration = null;
        resolve(result);
      };
      const handleAbort = (): void => finish(false);
      this.abortController.signal.addEventListener('abort', handleAbort, { once: true });
      this.exploration = new ClubExploration(scene, this.context.input, {
        durationMs: this.duration(18000, 4800),
        onCulturalClub: () => {
          monologue.textContent = '文化部でもいいかな。';
          monologue.classList.add('is-visible');
          this.schedule(() => monologue.classList.remove('is-visible'), this.duration(1800, 600));
        },
        onSoccerClub: () => {
          this.comparisonSystem.showTrace(scene, '弟');
          this.schedule(() => this.comparisonSystem.hideComparison(), this.duration(1300, 450));
        },
        onComplete: () => finish(true),
      });
    });
  }

  private async showTennisClubEncounter(): Promise<boolean> {
    const scene = this.createTennisCourt('tennis-encounter-scene', 'テニス部');
    const protagonist = this.createTennisFigure('tennis-encounter-player', 'ラケットを持った主人公');
    const line = document.createElement('p');
    line.className = 'tennis-scene-line';
    line.textContent = '……ここでいいか。';
    scene.append(protagonist, line);
    this.replaceScene(scene);
    requestAnimationFrame(() => line.classList.add('is-visible'));
    return waitForAdvance({
      input: this.context.input,
      target: scene,
      signal: this.abortController.signal,
      milliseconds: this.duration(3000, 650),
    });
  }

  private async showFirstRally(): Promise<boolean> {
    const scene = this.createTennisCourt('first-rally-scene', '最初のラリー');
    const hint = document.createElement('p');
    hint.className = 'tennis-controls';
    hint.textContent = '← → / A D：移動　Enter / Space：返球';
    const thought = document.createElement('p');
    thought.className = 'rally-thought';
    thought.setAttribute('aria-live', 'polite');
    scene.append(hint, thought);
    this.replaceScene(scene);
    this.schedule(() => hint.classList.add('is-hidden'), this.duration(4200, 1200));

    const completed = await this.playTennis(scene, {
      targetReturns: 6,
      assistAfterMs: this.duration(11000, 2500),
      onMilestone: (rally) => {
        thought.textContent = rally === 3 ? '……。' : 'もう一回。';
        thought.classList.add('is-visible');
        this.schedule(() => thought.classList.remove('is-visible'), this.duration(1600, 500));
      },
      onComplete: () => undefined,
    });
    if (!completed) return false;
    return wait(this.duration(850, 180), this.abortController.signal);
  }

  private async showFunAtDusk(): Promise<boolean> {
    const scene = this.createTennisCourt('dusk-tennis-scene', '練習のあと');
    const protagonist = this.createTennisFigure('dusk-protagonist', '夕方のコートでボールを拾う主人公');
    const scatteredBalls = document.createElement('div');
    scatteredBalls.className = 'scattered-tennis-balls';
    scatteredBalls.innerHTML = '<span></span><span></span><span></span>';
    const line = document.createElement('p');
    line.className = 'dusk-line';
    scene.append(protagonist, scatteredBalls, line);
    this.replaceScene(scene);

    for (const text of ['……。', '楽しかった。']) {
      line.textContent = text;
      line.classList.add('is-visible');
      if (
        !(await waitForAdvance({
          input: this.context.input,
          target: scene,
          signal: this.abortController.signal,
          milliseconds: this.duration(2400, 520),
        }))
      ) {
        return false;
      }
      line.classList.remove('is-visible');
      if (!(await wait(this.duration(400, 60), this.abortController.signal))) return false;
    }

    const value = this.comparisonSystem.showPersonalValue(scene, 'テニス', '楽しい');
    if (!(await wait(this.duration(3200, 800), this.abortController.signal))) return false;
    value.classList.add('is-leaving');
    if (!(await wait(this.duration(900, 100), this.abortController.signal))) return false;
    this.comparisonSystem.hideComparison();
    return true;
  }

  private async showAbsorptionMontage(): Promise<boolean> {
    const moments = [
      { label: '放課後。', action: 'ラリー', line: 'もう一本。' },
      { label: '別の日。', action: 'ラリー', line: 'もう一回。' },
      { label: '休日。', action: '壁打ち', line: '' },
      { label: '夕方。', action: 'サーブ練習', line: '' },
    ];

    for (const [index, moment] of moments.entries()) {
      const scene = this.createTennisCourt(`tennis-montage-scene montage-stage-${index}`, moment.label);
      const protagonist = this.createTennisFigure('montage-tennis-player', moment.action);
      const ball = document.createElement('span');
      ball.className = 'montage-tennis-ball';
      const action = document.createElement('p');
      action.className = 'montage-action';
      action.textContent = moment.action;
      scene.append(protagonist, ball, action);
      if (moment.line) {
        const line = document.createElement('p');
        line.className = 'montage-line';
        line.textContent = moment.line;
        scene.append(line);
      }
      this.replaceScene(scene);
      requestAnimationFrame(() => scene.classList.add('is-playing'));
      if (!(await wait(this.duration(1800, 460), this.abortController.signal))) return false;
      if (!(await wait(this.duration(300, 50), this.abortController.signal))) return false;
    }

    this.comparisonSystem.hideComparison();
    return showCinematicLines({
      root: this.context.root,
      input: this.context.input,
      signal: this.abortController.signal,
      lines: ['気づけば、夢中になっていた。', '初めてだった。', 'スポーツが、楽しいと思えた。'],
      className: 'absorption-text-scene',
      textClassName: 'chapter2-cinematic-line',
      displayDuration: this.duration(2300, 500),
      gapDuration: this.duration(480, 60),
    });
  }

  private async showRestingRoot(): Promise<boolean> {
    const scene = createScene('resting-root-scene');
    const soil = document.createElement('div');
    soil.className = 'soil-field chapter-soil-field resting-soil-field';
    const light = document.createElement('div');
    light.className = 'root-soft-light';
    soil.append(light);
    scene.append(soil);
    this.replaceScene(scene);
    this.rootSystem.renderRestingRoot(soil);
    return wait(this.duration(3800, 850), this.abortController.signal);
  }

  private async showNextChapterConnection(): Promise<void> {
    if (
      !(await showCinematicLines({
        root: this.context.root,
        input: this.context.input,
        signal: this.abortController.signal,
        lines: ['中学校。', 'テニスは、楽しかった。', 'でも――'],
        className: 'chapter3-connection-scene connection-first-half',
        textClassName: 'chapter2-cinematic-line',
        displayDuration: this.duration(2100, 450),
      }))
    ) {
      return;
    }
    if (
      !(await showCinematicLines({
        root: this.context.root,
        input: this.context.input,
        signal: this.abortController.signal,
        lines: ['学校でも。', '家でも。', '僕は、また比べられた。'],
        className: 'chapter3-connection-scene connection-second-half',
        textClassName: 'chapter2-cinematic-line',
        displayDuration: this.duration(2200, 480),
      }))
    ) {
      return;
    }
    await this.finishChapter();
  }

  private async finishChapter(): Promise<void> {
    const scene = createScene('chapter3-title-scene');
    const card = createChapterCard('CHAPTER 3', '目立たない');
    scene.append(card);
    this.replaceScene(scene);
    requestAnimationFrame(() => card.classList.add('is-visible'));

    const state = this.context.getState();
    state.chapter = 3;
    state.sceneId = 'chapter3-start';
    state.comparisonStage = 3;
    state.rootStage = 2;
    if (!state.completedScenes.includes('chapter2')) state.completedScenes.push('chapter2');
    this.context.save.save(state);

    if (!(await wait(this.duration(3000, 750), this.abortController.signal))) return;
    await this.context.navigate('chapter3-start');
  }

  private playTennis(parent: HTMLElement, options: TennisMiniGameOptions): Promise<boolean> {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (result: boolean): void => {
        if (settled) return;
        settled = true;
        this.abortController.signal.removeEventListener('abort', handleAbort);
        this.tennisGame?.destroy();
        this.tennisGame = null;
        resolve(result);
      };
      const handleAbort = (): void => finish(false);
      this.abortController.signal.addEventListener('abort', handleAbort, { once: true });
      this.tennisGame = new TennisMiniGame(parent, this.context.input, this.context.audio, {
        ...options,
        onComplete: () => {
          options.onComplete();
          finish(true);
        },
      });
    });
  }

  private createTennisCourt(className: string, headingText: string): HTMLElement {
    const scene = createScene(`tennis-scene ${className}`);
    scene.innerHTML =
      '<div class="chapter2-court-lines" aria-hidden="true"></div><div class="chapter2-tennis-net" aria-hidden="true"></div>';
    const heading = document.createElement('p');
    heading.className = 'scene-heading tennis-heading';
    heading.textContent = headingText;
    scene.append(heading);
    return scene;
  }

  private createFigure(className: string, label: string): HTMLElement {
    const figure = document.createElement('div');
    figure.className = `chapter2-figure ${className}`;
    figure.setAttribute('role', 'img');
    figure.setAttribute('aria-label', label);
    figure.innerHTML = '<span class="chapter2-head"></span><span class="chapter2-body"></span>';
    return figure;
  }

  private createTennisFigure(className: string, label: string): HTMLElement {
    const figure = this.createFigure(className, label);
    const racket = document.createElement('span');
    racket.className = 'chapter2-racket';
    figure.append(racket);
    return figure;
  }

  private replaceScene(scene: HTMLElement): void {
    this.comparisonSystem.hideComparison();
    this.clearTimers();
    this.context.root.replaceChildren(scene);
  }

  private schedule(callback: () => void, milliseconds: number): void {
    const timer = window.setTimeout(() => {
      this.timers.delete(timer);
      if (!this.abortController.signal.aborted) callback();
    }, milliseconds);
    this.timers.add(timer);
  }

  private clearTimers(): void {
    this.timers.forEach((timer) => window.clearTimeout(timer));
    this.timers.clear();
  }

  private duration(standard: number, reduced: number): number {
    return motionDuration(standard, reduced);
  }
}
