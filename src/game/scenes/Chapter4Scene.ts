import { NoiseOverlay } from '../effects/NoiseOverlay';
import {
  DinnerInteraction,
  type DinnerInteractionOptions,
} from '../minigames/dinner/DinnerInteraction';
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

type DinnerChoice = 'family' | 'alone';

export class Chapter4Scene implements Scene {
  private readonly abortController = new AbortController();
  private readonly comparisonSystem: ComparisonSystem;
  private readonly rootSystem: RootSystem;
  private dinnerInteraction: DinnerInteraction | null = null;
  private noiseOverlay: NoiseOverlay | null = null;
  private choiceMenu: ChoiceMenu | null = null;
  private readonly timers = new Set<number>();

  public constructor(private readonly context: SceneContext) {
    this.comparisonSystem = new ComparisonSystem(context.getState);
    this.rootSystem = new RootSystem(context.getState);
  }

  public enter(): void {
    void this.run();
  }

  public exit(): void {
    this.abortController.abort();
    this.dinnerInteraction?.destroy();
    this.noiseOverlay?.destroy();
    this.choiceMenu?.destroy();
    this.comparisonSystem.destroy();
    this.stopHomeSounds();
    this.clearTimers();
    this.dinnerInteraction = null;
    this.noiseOverlay = null;
    this.choiceMenu = null;
  }

  private async run(): Promise<void> {
    // CHAPTER 4タイトルはCHAPTER 3末尾で表示済み。
    if (!(await this.showComingHome())) return;
    if (!(await this.showRepeatedFamilyDinners())) return;
    if (!(await this.showSecondYearTransition())) return;
    if (!(await this.showDinnerChoice())) return;
    if (!(await this.showDinnerAlone())) return;
    if (!(await this.showEatingAloneMontage())) return;
    if (!(await this.showGrowingRoots())) return;
    await this.showHighSchoolConnection();
  }

  private async showComingHome(): Promise<boolean> {
    const scene = createScene('coming-home-scene');
    const entrance = document.createElement('div');
    entrance.className = 'home-entrance';
    entrance.innerHTML =
      '<span class="entrance-door"></span><span class="entrance-light"></span><span class="family-presence">カチャ…</span>';
    const protagonist = this.createPerson('homecoming-protagonist', '家へ帰った主人公');
    const line = document.createElement('p');
    line.className = 'homecoming-line';
    line.textContent = '夕方。家に帰る。';
    scene.append(entrance, protagonist, line);
    this.replaceScene(scene);
    this.context.audio.setLoopLevel('room-tone', 0.18);
    requestAnimationFrame(() => protagonist.classList.add('is-entering'));
    if (!(await wait(this.duration(2500, 580), this.abortController.signal))) return false;
    line.textContent = '家の奥から、食器の音がする。';
    return this.advance(scene, 2400, 520);
  }

  private async showRepeatedFamilyDinners(): Promise<boolean> {
    if (!(await this.playFamilyDinner(1))) return false;
    if (!(await this.showDayCard('次の日。'))) return false;
    if (!(await this.playFamilyDinner(2))) return false;
    if (!(await this.showDayCard('また、別の日。'))) return false;
    return this.playFamilyDinner(3);
  }

  private async playFamilyDinner(day: number): Promise<boolean> {
    const scene = this.createFamilyTable(day);
    const caption = document.createElement('p');
    caption.className = 'family-dinner-caption';
    caption.setAttribute('aria-live', 'polite');
    scene.append(caption);
    this.replaceScene(scene);
    this.context.audio.setLoopLevel('family-table', 0.28);
    this.noiseOverlay = new NoiseOverlay(scene, this.context.settings);
    this.noiseOverlay.setIntensity(day === 3 ? 0.2 : 0.1);

    if (day === 3) {
      const earlyComparison = this.comparisonSystem.showComparison(scene, ALL_COMPARISONS, {
        subtle: true,
        edge: 'right',
      });
      earlyComparison.classList.add('family-comparison', 'is-anticipated');
      caption.textContent = 'また、この時間。';
    }

    const lines = this.dinnerLines(day);
    const completed = await this.playDinner(scene, {
      totalBites: 4,
      mode: 'family',
      onBite: (bite) => {
        caption.textContent = lines[bite - 1] ?? '……。';
        caption.classList.add('is-visible');
        if (bite === 3) {
          const display = this.comparisonSystem.showComparison(scene, ALL_COMPARISONS, {
            edge: 'right',
          });
          display.classList.add('family-comparison');
          this.noiseOverlay?.setIntensity(0.38 + day * 0.06);
        }
      },
      onComplete: () => undefined,
    });
    if (!completed) return false;
    if (!(await wait(this.duration(1800, 420), this.abortController.signal))) return false;
    this.comparisonSystem.hideComparison();
    return true;
  }

  private dinnerLines(day: number): readonly string[] {
    if (day === 1) {
      return [
        '「今日は部活だったの？」',
        '食器の音に、弟の話が混じる。',
        '「弟は友達と遊びに行ってるのに、なんでお前は遊ばないんだ。」',
        '……。',
      ];
    }
    if (day === 2) {
      return ['いつもの食卓。', 'また、弟の話になる。', '比べる言葉が続く。', '……。'];
    }
    return ['箸を持つ。', '話を聞く。', 'また、比べられる。', '……。'];
  }

  private showDayCard(text: string): Promise<boolean> {
    return showCinematicLines({
      root: this.context.root,
      input: this.context.input,
      signal: this.abortController.signal,
      lines: [text],
      className: 'dinner-day-card-scene',
      textClassName: 'chapter4-cinematic-line',
      displayDuration: this.duration(1900, 420),
      gapDuration: this.duration(350, 50),
    });
  }

  private showSecondYearTransition(): Promise<boolean> {
    return showCinematicLines({
      root: this.context.root,
      input: this.context.input,
      signal: this.abortController.signal,
      lines: ['中学2年。', '食卓に座る時間が、苦しくなっていった。'],
      className: 'second-year-scene',
      textClassName: 'chapter4-cinematic-line',
      displayDuration: this.duration(2800, 580),
      gapDuration: this.duration(650, 80),
    });
  }

  private async showDinnerChoice(): Promise<boolean> {
    const scene = createScene('bedroom-choice-scene');
    const room = this.createBedroom();
    const protagonist = this.createPerson('bedroom-protagonist', '自室にいる主人公');
    const door = document.createElement('div');
    door.className = 'bedroom-door';
    const voice = document.createElement('p');
    voice.className = 'dinner-call';
    voice.textContent = '「ご飯できたよ。」';
    const choiceHost = document.createElement('div');
    choiceHost.className = 'dinner-choice-host';
    scene.append(room, door, protagonist, voice, choiceHost);
    this.replaceScene(scene);
    if (!(await wait(this.duration(1800, 420), this.abortController.signal))) return false;

    let choice = await this.chooseDinner(choiceHost, true);
    if (this.abortController.signal.aborted) return false;
    if (choice === 'family') {
      protagonist.classList.add('is-heading-to-door');
      if (!(await wait(this.duration(1500, 350), this.abortController.signal))) return false;
      const display = this.comparisonSystem.showComparison(scene, ALL_COMPARISONS, {
        subtle: true,
        edge: 'right',
      });
      display.classList.add('bedroom-comparison');
      voice.textContent = '……。';
      if (!(await wait(this.duration(1900, 450), this.abortController.signal))) return false;
      choice = await this.chooseDinner(choiceHost, false);
    }
    this.comparisonSystem.hideComparison();
    return choice === 'alone';
  }

  private async showDinnerAlone(): Promise<boolean> {
    const scene = createScene('dinner-alone-scene');
    const room = this.createBedroom();
    const protagonist = this.createPerson('alone-protagonist', '一人で食事をする主人公');
    const desk = document.createElement('div');
    desk.className = 'small-dinner-desk';
    const silence = document.createElement('p');
    silence.className = 'alone-dinner-line';
    scene.append(room, desk, protagonist, silence);
    this.replaceScene(scene);
    this.stopHomeSounds();

    const completed = await this.playDinner(scene, {
      totalBites: 4,
      mode: 'alone',
      onBite: () => {
        silence.textContent = 'カチャ。';
        silence.classList.add('is-visible');
        this.schedule(() => silence.classList.remove('is-visible'), this.duration(700, 180));
      },
      onComplete: () => undefined,
    });
    if (!completed) return false;

    silence.textContent = '';
    if (!(await wait(this.duration(2300, 520), this.abortController.signal))) return false;
    for (const line of ['……。', '楽だ。']) {
      silence.textContent = line;
      silence.classList.add('is-visible');
      if (!(await this.advance(scene, 2300, 520))) return false;
      silence.classList.remove('is-visible');
      if (!(await wait(this.duration(450, 60), this.abortController.signal))) return false;
    }
    return true;
  }

  private async showEatingAloneMontage(): Promise<boolean> {
    const moments = [
      { type: 'empty-seat', line: 'それから。' },
      { type: 'alone-room', line: '' },
      { type: 'alone-room another-day', line: '' },
      { type: 'alone-room later-day', line: '僕は、一人で食べるようになった。' },
    ];
    for (const moment of moments) {
      const scene = createScene(`alone-montage-scene ${moment.type}`);
      if (moment.type.includes('empty-seat')) {
        scene.append(this.createEmptyFamilyTable());
      } else {
        const room = this.createBedroom();
        const person = this.createPerson('montage-alone-protagonist', '一人で食べる主人公');
        const desk = document.createElement('div');
        desk.className = 'montage-small-desk';
        scene.append(room, person, desk);
      }
      if (moment.line) {
        const line = document.createElement('p');
        line.className = 'alone-montage-line';
        line.textContent = moment.line;
        scene.append(line);
      }
      this.replaceScene(scene);
      if (!(await wait(this.duration(1900, 470), this.abortController.signal))) return false;
    }
    return true;
  }

  private async showGrowingRoots(): Promise<boolean> {
    const scene = createScene('chapter4-root-scene');
    const soil = document.createElement('div');
    soil.className = 'soil-field chapter-soil-field chapter4-soil-field';
    const words = document.createElement('div');
    words.className = 'sinking-comparison-words';
    for (const text of ['スポーツ', '勉強', '友達']) {
      const word = document.createElement('span');
      word.textContent = text;
      words.append(word);
    }
    soil.append(words);
    scene.append(soil);
    this.replaceScene(scene);
    this.rootSystem.growMultipleBranches();
    this.rootSystem.render(soil, 4);
    requestAnimationFrame(() => words.classList.add('is-sinking'));
    return wait(this.duration(5000, 1000), this.abortController.signal);
  }

  private async showHighSchoolConnection(): Promise<void> {
    if (
      !(await showCinematicLines({
        root: this.context.root,
        input: this.context.input,
        signal: this.abortController.signal,
        lines: ['高校。', '弟とは、違う高校に進んだ。'],
        className: 'high-school-intro-scene',
        textClassName: 'chapter4-cinematic-line',
        displayDuration: this.duration(2600, 560),
      }))
    ) {
      return;
    }

    const scene = createScene('high-school-release-scene');
    const school = document.createElement('div');
    school.className = 'high-school-background';
    const line = document.createElement('p');
    line.className = 'high-school-line';
    scene.append(school, line);
    this.replaceScene(scene);
    const display = this.comparisonSystem.showComparison(scene, ALL_COMPARISONS, { edge: 'right' });
    display.classList.add('high-school-comparison');
    const rows = Array.from(display.querySelectorAll<HTMLElement>('.comparison-hud-row'));
    if (!(await wait(this.duration(1600, 350), this.abortController.signal))) return;
    for (const row of rows) {
      row.classList.add('is-clearing');
      if (!(await wait(this.duration(1300, 300), this.abortController.signal))) return;
      row.remove();
    }
    this.comparisonSystem.clearComparison();
    scene.classList.add('is-released');

    for (const text of ['やっと。', 'やっと、離れられた。']) {
      line.textContent = text;
      line.classList.add('is-visible');
      if (!(await this.advance(scene, 2600, 560))) return;
      line.classList.remove('is-visible');
      if (!(await wait(this.duration(500, 60), this.abortController.signal))) return;
    }
    await this.finishChapter();
  }

  private async finishChapter(): Promise<void> {
    const scene = createScene('chapter5-title-scene');
    const card = createChapterCard('CHAPTER 5', '逃げたはずなのに');
    scene.append(card);
    this.replaceScene(scene);
    requestAnimationFrame(() => card.classList.add('is-visible'));

    const state = this.context.getState();
    state.chapter = 5;
    state.sceneId = 'chapter5-start';
    state.comparisonStage = 5;
    state.rootStage = 4;
    if (!state.completedScenes.includes('chapter4')) state.completedScenes.push('chapter4');
    this.context.save.save(state);

    if (!(await wait(this.duration(3300, 800), this.abortController.signal))) return;
    await this.context.navigate('chapter5-start');
  }

  private playDinner(parent: HTMLElement, options: DinnerInteractionOptions): Promise<boolean> {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (result: boolean): void => {
        if (settled) return;
        settled = true;
        this.abortController.signal.removeEventListener('abort', handleAbort);
        this.dinnerInteraction?.destroy();
        this.dinnerInteraction = null;
        resolve(result);
      };
      const handleAbort = (): void => finish(false);
      this.abortController.signal.addEventListener('abort', handleAbort, { once: true });
      this.dinnerInteraction = new DinnerInteraction(parent, this.context.input, this.context.audio, {
        ...options,
        onComplete: () => {
          options.onComplete();
          finish(true);
        },
      });
    });
  }

  private chooseDinner(parent: HTMLElement, allowFamily: boolean): Promise<DinnerChoice> {
    this.choiceMenu?.destroy();
    return new Promise((resolve) => {
      const finish = (choice: DinnerChoice): void => {
        this.choiceMenu?.destroy();
        this.choiceMenu = null;
        resolve(choice);
      };
      const options = allowFamily
        ? [
            { label: 'みんなと食べる', action: () => finish('family') },
            { label: '一人で食べる', action: () => finish('alone') },
          ]
        : [{ label: '一人で食べる', action: () => finish('alone') }];
      this.choiceMenu = new ChoiceMenu(parent, this.context.input, options);
      this.choiceMenu.focus();
    });
  }

  private createFamilyTable(day: number): HTMLElement {
    const scene = createScene(`family-dinner-scene family-dinner-day-${day}`);
    const windowView = document.createElement('div');
    windowView.className = 'dinner-window';
    const clock = document.createElement('div');
    clock.className = 'dinner-clock';
    const table = document.createElement('div');
    table.className = 'family-table';
    table.innerHTML = '<span class="family-dish dish-a"></span><span class="family-dish dish-b"></span><span class="family-dish dish-c"></span>';
    const protagonist = this.createPerson('family-seat family-seat--self', '食卓に座る主人公');
    const sibling = this.createPerson('family-seat family-seat--sibling', '食卓に座る弟');
    const familyA = this.createPerson('family-seat family-seat--adult-a', '家族');
    const familyB = this.createPerson('family-seat family-seat--adult-b', '家族');
    scene.append(windowView, clock, table, protagonist, sibling, familyA, familyB);
    return scene;
  }

  private createEmptyFamilyTable(): HTMLElement {
    const table = document.createElement('div');
    table.className = 'empty-family-table';
    table.innerHTML =
      '<span class="empty-chair empty-chair--self"></span><span class="empty-chair"></span><span class="empty-chair"></span><span class="empty-table-surface"></span>';
    table.setAttribute('role', 'img');
    table.setAttribute('aria-label', '主人公の席だけが空いた家族の食卓');
    return table;
  }

  private createBedroom(): HTMLElement {
    const room = document.createElement('div');
    room.className = 'chapter4-bedroom';
    room.innerHTML = '<span class="bedroom-window"></span><span class="bedroom-bed"></span><span class="bedroom-shelf"></span>';
    return room;
  }

  private createPerson(className: string, label: string): HTMLElement {
    const person = document.createElement('div');
    person.className = `chapter4-person ${className}`;
    person.setAttribute('role', 'img');
    person.setAttribute('aria-label', label);
    person.innerHTML = '<span class="chapter4-head"></span><span class="chapter4-body"></span>';
    return person;
  }

  private replaceScene(scene: HTMLElement): void {
    this.comparisonSystem.hideComparison();
    this.noiseOverlay?.destroy();
    this.noiseOverlay = null;
    this.dinnerInteraction?.destroy();
    this.dinnerInteraction = null;
    this.context.audio.stopLoop('family-table');
    this.clearTimers();
    this.context.root.replaceChildren(scene);
  }

  private stopHomeSounds(): void {
    this.context.audio.stopLoop('family-table');
    this.context.audio.stopLoop('room-tone');
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
