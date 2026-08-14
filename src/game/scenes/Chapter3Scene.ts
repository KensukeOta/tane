import { NoiseOverlay } from '../effects/NoiseOverlay';
import {
  HallwayAvoidance,
  type HallwayLayout,
} from '../minigames/avoidance/HallwayAvoidance';
import { TennisMiniGame, type TennisMiniGameOptions } from '../minigames/tennis/TennisMiniGame';
import { ComparisonSystem, type ComparisonItem } from '../systems/ComparisonSystem';
import { RootSystem } from '../systems/RootSystem';
import type { Scene, SceneContext } from '../types';
import { ChoiceMenu } from '../ui/ChoiceMenu';
import {
  createChapterCard,
  createScene,
  motionDuration,
  showCinematicLines,
  wait,
  waitForAdvance,
} from './sceneUtils';

const SPORT_COMPARISON: ComparisonItem = { label: 'スポーツ', relation: '弟 ＞ ぼく' };
const STUDY_COMPARISON: ComparisonItem = { label: '勉強', relation: '弟 ＞ ぼく' };
const FRIEND_COMPARISON: ComparisonItem = { label: '友達', relation: '弟 ＞ ぼく' };
const ALL_COMPARISONS = [SPORT_COMPARISON, STUDY_COMPARISON, FRIEND_COMPARISON] as const;

export class Chapter3Scene implements Scene {
  private readonly abortController = new AbortController();
  private readonly comparisonSystem: ComparisonSystem;
  private readonly rootSystem: RootSystem;
  private avoidance: HallwayAvoidance | null = null;
  private noiseOverlay: NoiseOverlay | null = null;
  private tennisGame: TennisMiniGame | null = null;
  private choiceMenu: ChoiceMenu | null = null;
  private readonly timers = new Set<number>();

  public constructor(private readonly context: SceneContext) {
    this.comparisonSystem = new ComparisonSystem(context.getState);
    this.rootSystem = new RootSystem(context.getState);
  }

  public enter(): void {
    void this.run();
  }

  public update(deltaSeconds: number): void {
    this.avoidance?.update(deltaSeconds);
    this.tennisGame?.update(deltaSeconds);
  }

  public exit(): void {
    this.abortController.abort();
    this.avoidance?.destroy();
    this.noiseOverlay?.destroy();
    this.tennisGame?.destroy();
    this.choiceMenu?.destroy();
    this.comparisonSystem.destroy();
    this.context.audio.stopLoop('school-murmur');
    this.clearTimers();
    this.avoidance = null;
    this.noiseOverlay = null;
    this.tennisGame = null;
    this.choiceMenu = null;
  }

  private async run(): Promise<void> {
    // CHAPTER 3タイトルはCHAPTER 2末尾で表示済み。
    if (!(await this.showAdolescenceIntroduction())) return;
    if (!(await this.showSiblingAmongStudents())) return;
    if (!(await this.showAvoidanceExperiences())) return;
    if (!(await this.showClassroomConversation())) return;
    if (!(await this.showBeingUnnoticedChoice())) return;
    if (!(await this.showAvoidanceBecomingHabit())) return;
    if (!(await this.showTennisRelief())) return;
    if (!(await this.showComparisonsReturn())) return;
    if (!(await this.showGrowingRoot())) return;
    await this.showChapter4Connection();
  }

  private async showAdolescenceIntroduction(): Promise<boolean> {
    const scene = this.createSchoolScene('adolescence-intro-scene', '中学校');
    const line = document.createElement('p');
    line.className = 'chapter3-scene-line';
    scene.append(line);
    this.replaceScene(scene);

    for (const text of ['中学生になって。', '比べられるものが、増えていった。']) {
      line.textContent = text;
      line.classList.add('is-visible');
      if (!(await this.advance(scene, 2200, 480))) return false;
      line.classList.remove('is-visible');
      if (!(await wait(this.duration(420, 60), this.abortController.signal))) return false;
    }

    this.comparisonSystem.showComparison(scene, [SPORT_COMPARISON], { subtle: true });
    if (!(await wait(this.duration(1300, 320), this.abortController.signal))) return false;
    this.comparisonSystem.showComparison(scene, [SPORT_COMPARISON, STUDY_COMPARISON], {
      subtle: true,
    });
    this.context.audio.playSE('comparison-add');
    if (!(await wait(this.duration(1500, 350), this.abortController.signal))) return false;
    const display = this.comparisonSystem.showComparison(scene, ALL_COMPARISONS, { edge: 'right' });
    display.classList.add('comparison-hud--stage4');
    this.comparisonSystem.setStage(4);
    this.context.audio.playSE('comparison-add');
    if (!(await wait(this.duration(3200, 750), this.abortController.signal))) return false;
    this.comparisonSystem.hideComparison();
    return true;
  }

  private async showSiblingAmongStudents(): Promise<boolean> {
    const scene = this.createSchoolScene('sibling-school-scene', '休み時間');
    const group = document.createElement('div');
    group.className = 'sibling-friend-group';
    group.setAttribute('role', 'img');
    group.setAttribute('aria-label', '弟を含む複数の生徒が自然に会話している');
    for (let index = 0; index < 6; index += 1) {
      const person = this.createSchoolFigure(index === 2 ? 'sibling-student' : 'friend-student', index === 2 ? '弟' : '生徒');
      group.append(person);
    }
    const conversation = document.createElement('p');
    conversation.className = 'ordinary-conversation';
    conversation.textContent = '楽しそうな話し声。';
    const protagonist = this.createSchoolFigure('passing-protagonist', '少し離れて通り過ぎる主人公');
    scene.append(group, protagonist, conversation);
    this.replaceScene(scene);
    requestAnimationFrame(() => protagonist.classList.add('is-passing'));
    return wait(this.duration(4200, 950), this.abortController.signal);
  }

  private async showAvoidanceExperiences(): Promise<boolean> {
    const layouts: HallwayLayout[] = [
      { label: '廊下', groupX: 52, groupY: 50, quietY: 76, people: 4 },
      { label: '昇降口', groupX: 62, groupY: 45, quietY: 77, people: 5 },
      { label: '休み時間の教室前', groupX: 46, groupY: 53, quietY: 79, people: 6 },
    ];

    for (const [index, layout] of layouts.entries()) {
      if (!(await this.playAvoidance(layout, index))) return false;
      if (!(await wait(this.duration(420, 60), this.abortController.signal))) return false;
    }
    return true;
  }

  private playAvoidance(layout: HallwayLayout, index: number): Promise<boolean> {
    const scene = createScene(`avoidance-scene avoidance-scene-${index}`);
    const heading = document.createElement('p');
    heading.className = 'scene-heading avoidance-heading';
    heading.textContent = layout.label;
    const hint = document.createElement('p');
    hint.className = 'avoidance-hint';
    hint.textContent = '← → ↑ ↓ / A D：移動　下側は静かな遠回り';
    const calmLabel = document.createElement('p');
    calmLabel.className = 'quiet-route-label';
    calmLabel.textContent = '少し遠い道';
    calmLabel.style.top = `${layout.quietY + 5}%`;
    scene.append(heading, hint, calmLabel);
    this.replaceScene(scene);
    this.noiseOverlay = new NoiseOverlay(scene, this.context.settings);
    this.schedule(() => hint.classList.add('is-hidden'), this.duration(4200, 1200));

    return new Promise((resolve) => {
      let settled = false;
      const finish = (result: boolean): void => {
        if (settled) return;
        settled = true;
        this.abortController.signal.removeEventListener('abort', handleAbort);
        this.avoidance?.destroy();
        this.avoidance = null;
        this.noiseOverlay?.destroy();
        this.noiseOverlay = null;
        this.context.audio.stopLoop('school-murmur');
        resolve(result);
      };
      const handleAbort = (): void => finish(false);
      this.abortController.signal.addEventListener('abort', handleAbort, { once: true });
      this.avoidance = new HallwayAvoidance(scene, this.context.input, {
        layout,
        durationMs: this.duration(15000 - index * 900, 4300 - index * 350),
        onProximityChange: (intensity) => {
          this.noiseOverlay?.setIntensity(intensity);
          this.context.audio.setLoopLevel('school-murmur', intensity * 0.7);
          scene.classList.toggle('is-calm', intensity < 0.16);
        },
        onComplete: () => finish(true),
      });
    });
  }

  private async showClassroomConversation(): Promise<boolean> {
    const scene = this.createSchoolScene('classroom-conversation-scene', '休み時間');
    const desk = document.createElement('div');
    desk.className = 'chapter3-desk protagonist-desk';
    const protagonist = this.createSchoolFigure('seated-protagonist', '自分の席にいる主人公');
    const classmates = document.createElement('div');
    classmates.className = 'talking-classmates';
    classmates.append(
      this.createSchoolFigure('classmate', '会話する生徒'),
      this.createSchoolFigure('classmate', '会話する生徒'),
    );
    const caption = document.createElement('p');
    caption.className = 'classroom-caption';
    scene.append(desk, protagonist, classmates, caption);
    this.replaceScene(scene);

    for (const text of ['「弟くんって、サッカー上手いよな。」', '「勉強もできるらしいよ。」']) {
      caption.textContent = text;
      caption.classList.add('is-visible');
      if (!(await this.advance(scene, 2500, 550))) return false;
      caption.classList.remove('is-visible');
      if (!(await wait(this.duration(350, 50), this.abortController.signal))) return false;
    }

    const display = this.comparisonSystem.showComparison(scene, ALL_COMPARISONS, { edge: 'right' });
    display.classList.add('comparison-hud--expanded');
    if (!(await wait(this.duration(4600, 950), this.abortController.signal))) return false;
    this.comparisonSystem.hideComparison();
    return true;
  }

  private async showBeingUnnoticedChoice(): Promise<boolean> {
    const scene = this.createSchoolScene('unnoticed-choice-scene', '廊下');
    const protagonist = this.createSchoolFigure('choice-protagonist', '廊下に立つ主人公');
    const approaching = this.createSchoolFigure('approaching-student', '主人公へ近づく生徒');
    const prompt = document.createElement('p');
    prompt.className = 'approach-prompt';
    prompt.textContent = '「ねえ。」';
    const choiceHost = document.createElement('div');
    choiceHost.className = 'unnoticed-choice-host';
    scene.append(protagonist, approaching, prompt, choiceHost);
    this.replaceScene(scene);

    const response = await this.chooseResponse(choiceHost);
    if (this.abortController.signal.aborted) return false;
    prompt.textContent = response;
    if (!(await wait(this.duration(1400, 350), this.abortController.signal))) return false;
    approaching.classList.add('is-leaving');
    if (!(await wait(this.duration(900, 200), this.abortController.signal))) return false;

    return showCinematicLines({
      root: this.context.root,
      input: this.context.input,
      signal: this.abortController.signal,
      lines: ['比べられるくらいなら。', '目立たない方がいい。'],
      className: 'unnoticed-thought-scene',
      textClassName: 'chapter3-cinematic-line',
      displayDuration: this.duration(2600, 560),
      gapDuration: this.duration(600, 80),
    });
  }

  private async showAvoidanceBecomingHabit(): Promise<boolean> {
    const moments = [
      { label: '学校。人がいる。', position: 'far-path', line: '少し離れる。' },
      { label: '別の日。休み時間。', position: 'room-edge', line: '目立たない。' },
      { label: 'また、別の日。', position: 'empty-route', line: 'その方が、楽だった。' },
    ];

    for (const [index, moment] of moments.entries()) {
      const scene = this.createSchoolScene(`avoidance-montage-scene ${moment.position}`, moment.label);
      const crowd = document.createElement('div');
      crowd.className = 'montage-crowd';
      for (let count = 0; count < 4 + index; count += 1) {
        crowd.append(this.createSchoolFigure('montage-student', '生徒'));
      }
      const protagonist = this.createSchoolFigure('montage-protagonist', '人から少し離れた主人公');
      const line = document.createElement('p');
      line.className = 'avoidance-montage-line';
      line.textContent = moment.line;
      scene.append(crowd, protagonist, line);
      this.replaceScene(scene);
      requestAnimationFrame(() => protagonist.classList.add('is-moving-away'));
      if (!(await wait(this.duration(2500, 580), this.abortController.signal))) return false;
    }
    return true;
  }

  private async showTennisRelief(): Promise<boolean> {
    const scene = this.createTennisCourt('chapter3-tennis-scene', '放課後。');
    const thought = document.createElement('p');
    thought.className = 'chapter3-tennis-thought';
    thought.textContent = 'もう一本。';
    thought.setAttribute('aria-live', 'polite');
    scene.append(thought);
    this.replaceScene(scene);

    const completed = await this.playTennis(scene, {
      targetReturns: 4,
      assistAfterMs: this.duration(7000, 1800),
      onMilestone: (rally) => {
        if (rally === 3) thought.classList.add('is-visible');
      },
      onComplete: () => undefined,
    });
    if (!completed) return false;
    return wait(this.duration(1200, 250), this.abortController.signal);
  }

  private async showComparisonsReturn(): Promise<boolean> {
    const scene = createScene('school-gate-scene');
    const gate = document.createElement('div');
    gate.className = 'evening-school-gate';
    const protagonist = this.createSchoolFigure('leaving-school-protagonist', '校門から帰宅方向へ歩く主人公');
    const line = document.createElement('p');
    line.className = 'leaving-school-line';
    line.textContent = '帰る。';
    scene.append(gate, protagonist, line);
    this.replaceScene(scene);
    requestAnimationFrame(() => protagonist.classList.add('is-walking-home'));
    if (!(await wait(this.duration(1400, 330), this.abortController.signal))) return false;
    const display = this.comparisonSystem.showComparison(scene, ALL_COMPARISONS, { edge: 'right' });
    display.classList.add('comparison-hud--returned');
    if (!(await wait(this.duration(4200, 900), this.abortController.signal))) return false;
    this.comparisonSystem.hideComparison();
    return true;
  }

  private async showGrowingRoot(): Promise<boolean> {
    const scene = createScene('chapter3-root-scene');
    const soil = document.createElement('div');
    soil.className = 'soil-field chapter-soil-field chapter3-soil-field';
    scene.append(soil);
    this.replaceScene(scene);
    this.rootSystem.growRootBranch();
    this.rootSystem.render(soil, 3);
    return wait(this.duration(4200, 900), this.abortController.signal);
  }

  private async showChapter4Connection(): Promise<void> {
    if (
      !(await showCinematicLines({
        root: this.context.root,
        input: this.context.input,
        signal: this.abortController.signal,
        lines: [
          '家に帰っても。',
          '比べられることは、終わらなかった。',
          '夕食の時間。',
          'それが、だんだん苦しくなっていった。',
        ],
        className: 'chapter4-connection-scene',
        textClassName: 'chapter3-cinematic-line',
        displayDuration: this.duration(2600, 560),
        gapDuration: this.duration(650, 80),
      }))
    ) {
      return;
    }
    await this.finishChapter();
  }

  private async finishChapter(): Promise<void> {
    const scene = createScene('chapter4-title-scene');
    const card = createChapterCard('CHAPTER 4', '食卓');
    scene.append(card);
    this.replaceScene(scene);
    requestAnimationFrame(() => card.classList.add('is-visible'));

    const state = this.context.getState();
    state.chapter = 4;
    state.sceneId = 'chapter4-start';
    state.comparisonStage = 4;
    state.rootStage = 3;
    if (!state.completedScenes.includes('chapter3')) state.completedScenes.push('chapter3');
    this.context.save.save(state);

    if (!(await wait(this.duration(3200, 800), this.abortController.signal))) return;
    await this.context.navigate('chapter4-start');
  }

  private chooseResponse(parent: HTMLElement): Promise<string> {
    return new Promise((resolve) => {
      const finish = (response: string): void => {
        this.choiceMenu?.destroy();
        this.choiceMenu = null;
        resolve(response);
      };
      this.choiceMenu = new ChoiceMenu(parent, this.context.input, [
        { label: '話す', action: () => finish('「うん。」') },
        { label: '短く返す', action: () => finish('「……うん。」') },
        { label: '気づかないふりをする', action: () => finish('足音が、離れていく。') },
      ]);
      this.choiceMenu.focus();
    });
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

  private createSchoolScene(className: string, headingText: string): HTMLElement {
    const scene = createScene(`chapter3-school-scene ${className}`);
    scene.innerHTML = '<div class="chapter3-school-background" aria-hidden="true"></div>';
    const heading = document.createElement('p');
    heading.className = 'scene-heading chapter3-heading';
    heading.textContent = headingText;
    scene.append(heading);
    return scene;
  }

  private createSchoolFigure(className: string, label: string): HTMLElement {
    const figure = document.createElement('div');
    figure.className = `chapter3-figure ${className}`;
    figure.setAttribute('role', 'img');
    figure.setAttribute('aria-label', label);
    figure.innerHTML = '<span class="chapter3-head"></span><span class="chapter3-body"></span>';
    return figure;
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

  private replaceScene(scene: HTMLElement): void {
    this.comparisonSystem.hideComparison();
    this.noiseOverlay?.destroy();
    this.noiseOverlay = null;
    this.context.audio.stopLoop('school-murmur');
    this.clearTimers();
    this.context.root.replaceChildren(scene);
  }

  private advance(target: HTMLElement, standard: number, reduced: number): Promise<boolean> {
    return waitForAdvance({
      input: this.context.input,
      target,
      signal: this.abortController.signal,
      milliseconds: this.duration(standard, reduced),
    });
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
