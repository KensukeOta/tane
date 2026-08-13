import { SoccerMiniGame, type SoccerMiniGameOptions } from '../minigames/soccer/SoccerMiniGame';
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
} from './sceneUtils';

type MiddleSchoolChoice = 'continue' | 'quit';

const SOCCER_COMPARISON: ComparisonItem = { label: 'サッカー', relation: '弟 ＞ ぼく' };
const STUDY_COMPARISON: ComparisonItem = { label: '勉強', relation: '弟 ＞ ぼく' };

export class Chapter1Scene implements Scene {
  private readonly abortController = new AbortController();
  private readonly comparisonSystem: ComparisonSystem;
  private readonly rootSystem: RootSystem;
  private soccerGame: SoccerMiniGame | null = null;
  private choiceMenu: ChoiceMenu | null = null;

  public constructor(private readonly context: SceneContext) {
    this.comparisonSystem = new ComparisonSystem(context.getState);
    this.rootSystem = new RootSystem(context.getState);
  }

  public enter(): void {
    void this.run();
  }

  public update(deltaSeconds: number): void {
    this.soccerGame?.update(deltaSeconds);
  }

  public exit(): void {
    this.abortController.abort();
    this.soccerGame?.destroy();
    this.choiceMenu?.destroy();
    this.comparisonSystem.destroy();
    this.soccerGame = null;
    this.choiceMenu = null;
  }

  private async run(): Promise<void> {
    if (!(await this.showKindergartenIntro())) return;
    if (!(await this.showFirstSoccer())) return;
    if (!(await this.showSiblingPlay())) return;
    if (!(await this.showFirstExplicitComparison())) return;
    if (!(await this.showSchoolYearsMontage())) return;
    if (!(await this.showStudyComparison())) return;
    if (!(await this.showCaptainSelection())) return;
    if (!(await this.showNightAtHome())) return;
    if (!(await this.showNineYears())) return;
    if (!(await this.showFirstRoot())) return;
    await this.showMiddleSchoolConnection();
  }

  private async showKindergartenIntro(): Promise<boolean> {
    return this.showCinematicLines(
      ['幼稚園。', '地元のサッカークラブに入った。', '弟も一緒だった。'],
      'kindergarten-intro-scene',
    );
  }

  private async showFirstSoccer(): Promise<boolean> {
    const scene = this.createSoccerScene('first-soccer-scene', 'はじめての練習');
    const hint = document.createElement('p');
    hint.className = 'soccer-controls';
    hint.textContent = '← → / A D：移動　Enter / Space：シュート';
    scene.append(hint);
    this.replaceScene(scene);
    window.setTimeout(() => hint.classList.add('is-hidden'), this.duration(3600, 900));
    return this.playSoccer(scene, {
      mode: 'shoot',
      durationMs: this.duration(8500, 2400),
      ariaLabel: '幼稚園で初めてボールを蹴る主人公',
      onComplete: () => undefined,
    });
  }

  private async showSiblingPlay(): Promise<boolean> {
    const scene = this.createSoccerScene('sibling-play-scene', '弟の番');
    const sibling = this.createSoccerPerson('soccer-player sibling-soccer-player', '楽しそうに走る弟');
    const ball = document.createElement('div');
    ball.className = 'soccer-ball sibling-ball';
    const caption = document.createElement('p');
    caption.className = 'field-caption';
    caption.setAttribute('aria-live', 'polite');
    scene.append(sibling, ball, caption);
    this.replaceScene(scene);
    requestAnimationFrame(() => {
      sibling.classList.add('is-playing');
      ball.classList.add('is-dribbled');
    });

    if (!(await wait(this.duration(1500, 350), this.abortController.signal))) return false;
    sibling.classList.add('is-shooting');
    ball.classList.add('is-sibling-shot');
    this.context.audio.playSE('soccer-kick');
    if (!(await wait(this.duration(900, 180), this.abortController.signal))) return false;
    this.context.audio.playSE('soccer-goal');
    for (const line of ['「すげー！」', '「ナイス！」']) {
      caption.textContent = line;
      caption.classList.add('is-visible');
      if (!(await wait(this.duration(1200, 300), this.abortController.signal))) return false;
      caption.classList.remove('is-visible');
      if (!(await wait(this.duration(300, 50), this.abortController.signal))) return false;
    }
    return true;
  }

  private async showFirstExplicitComparison(): Promise<boolean> {
    const scene = this.createSoccerScene('first-comparison-scene', '');
    scene.classList.add('is-dimmed');
    this.replaceScene(scene);
    this.comparisonSystem.setStage(2);
    this.comparisonSystem.showComparison(scene, [SOCCER_COMPARISON], { subtle: true, edge: 'right' });
    const completed = await wait(this.duration(3200, 700), this.abortController.signal);
    this.comparisonSystem.hideComparison();
    return completed;
  }

  private async showSchoolYearsMontage(): Promise<boolean> {
    const years = [
      { label: '小学2年', className: 'school-year--early' },
      { label: '小学4年', className: 'school-year--middle' },
      { label: '小学6年', className: 'school-year--late' },
    ];

    for (const year of years) {
      const scene = this.createSoccerScene(`school-year-scene ${year.className}`, year.label);
      this.replaceScene(scene);
      if (
        !(await this.playSoccer(scene, {
          mode: 'chase',
          durationMs: this.duration(1900, 650),
          ariaLabel: `${year.label}のサッカー練習`,
          onComplete: () => undefined,
        }))
      ) {
        return false;
      }
      if (!(await wait(this.duration(350, 60), this.abortController.signal))) return false;
    }
    return true;
  }

  private async showStudyComparison(): Promise<boolean> {
    const scene = createScene('study-scene');
    const desk = document.createElement('div');
    desk.className = 'study-desk';
    desk.innerHTML =
      '<span class="desk-lamp"></span><span class="study-notebook"></span><span class="study-pencil"></span>';
    const heading = document.createElement('p');
    heading.className = 'scene-heading';
    heading.textContent = '家で。';
    scene.append(heading, desk);
    this.replaceScene(scene);
    this.comparisonSystem.showComparison(scene, [SOCCER_COMPARISON], { subtle: true });
    if (!(await wait(this.duration(1400, 350), this.abortController.signal))) return false;
    this.comparisonSystem.showComparison(scene, [SOCCER_COMPARISON, STUDY_COMPARISON], {
      subtle: true,
    });
    this.comparisonSystem.setStage(3);
    this.context.audio.playSE('comparison-add');
    const completed = await wait(this.duration(3000, 750), this.abortController.signal);
    this.comparisonSystem.hideComparison();
    return completed;
  }

  private async showCaptainSelection(): Promise<boolean> {
    const scene = this.createSoccerScene('captain-scene', '小学6年');
    const team = document.createElement('div');
    team.className = 'soccer-team';
    for (let index = 0; index < 7; index += 1) {
      const label = index === 0 ? '拍手するぼく' : index === 3 ? '弟' : 'チームメイト';
      const child = this.createSoccerPerson('team-child', label);
      if (index === 0) child.classList.add('is-protagonist');
      if (index === 3) child.classList.add('is-sibling');
      team.append(child);
    }
    const caption = document.createElement('p');
    caption.className = 'captain-caption';
    caption.textContent = '「キャプテンを決めよう。」';
    const votes = document.createElement('div');
    votes.className = 'vote-marks';
    votes.setAttribute('aria-label', '弟へ集まる票');
    for (let index = 0; index < 5; index += 1) {
      const vote = document.createElement('span');
      vote.textContent = '一票';
      vote.style.setProperty('--vote-index', String(index));
      votes.append(vote);
    }
    scene.append(team, caption, votes);
    this.replaceScene(scene);
    requestAnimationFrame(() => votes.classList.add('is-counting'));
    if (!(await wait(this.duration(3300, 750), this.abortController.signal))) return false;

    caption.textContent = 'キャプテン　弟';
    caption.classList.add('is-result');
    team.querySelector('.is-sibling')?.classList.add('is-happy');
    team.querySelectorAll('.team-child').forEach((child) => child.classList.add('is-clapping'));
    this.context.audio.playSE('applause');
    return wait(this.duration(3000, 750), this.abortController.signal);
  }

  private async showNightAtHome(): Promise<boolean> {
    const scene = createScene('night-room-scene');
    const room = document.createElement('div');
    room.className = 'night-room';
    room.innerHTML =
      '<div class="night-window"></div><div class="soccer-shirt">11</div><div class="room-bed"></div>';
    const protagonist = this.createSoccerPerson('room-protagonist', '部屋にいる主人公');
    const echo = document.createElement('div');
    echo.className = 'echo-words';
    echo.setAttribute('aria-live', 'polite');
    const silence = document.createElement('p');
    silence.className = 'silent-line';
    silence.textContent = '……。';
    scene.append(room, protagonist, echo, silence);
    this.replaceScene(scene);
    this.comparisonSystem.showComparison(scene, [SOCCER_COMPARISON, STUDY_COMPARISON], {
      subtle: true,
      edge: 'right',
    });

    for (const word of ['キャプテン', 'すげー', 'ナイス']) {
      const fragment = document.createElement('span');
      fragment.textContent = word;
      echo.append(fragment);
      requestAnimationFrame(() => fragment.classList.add('is-echoing'));
      if (!(await wait(this.duration(900, 220), this.abortController.signal))) return false;
    }
    silence.classList.add('is-visible');
    const completed = await wait(this.duration(2800, 700), this.abortController.signal);
    this.comparisonSystem.hideComparison();
    return completed;
  }

  private async showNineYears(): Promise<boolean> {
    const scene = this.createSoccerScene('nine-years-scene', '');
    const ages = ['幼稚園', '小学校低学年', '小学校高学年'];
    const ageLayers = document.createElement('div');
    ageLayers.className = 'age-layers';
    ages.forEach((age, index) => {
      const layer = document.createElement('div');
      layer.className = `age-layer age-layer--${index}`;
      layer.dataset.label = age;
      if (index === 0) layer.classList.add('is-current');
      ageLayers.append(layer);
    });
    scene.prepend(ageLayers);
    this.replaceScene(scene);
    let currentAge = 0;
    const completed = await this.playSoccer(scene, {
      mode: 'chase',
      durationMs: this.duration(6000, 1500),
      className: 'nine-years-minigame',
      ariaLabel: '9年間、背景が変わる中でボールを追い続ける主人公',
      onProgress: (progress) => {
        const nextAge = Math.min(2, Math.floor(progress * 3));
        if (nextAge === currentAge) return;
        currentAge = nextAge;
        ageLayers.querySelectorAll('.age-layer').forEach((layer, index) => {
          layer.classList.toggle('is-current', index === currentAge);
        });
      },
      onComplete: () => undefined,
    });
    if (!completed) return false;

    return this.showCinematicLines(
      ['9年間。', 'サッカーを続けた。', '僕にとって、サッカーは楽しいものではなかった。'],
      'nine-years-text-scene',
      this.duration(2400, 500),
    );
  }

  private async showFirstRoot(): Promise<boolean> {
    const scene = createScene('chapter-root-scene');
    const soil = document.createElement('div');
    soil.className = 'soil-field chapter-soil-field';
    const ghost = document.createElement('p');
    ghost.className = 'root-comparison-ghost';
    ghost.textContent = '弟 ＞ ぼく';
    soil.append(ghost);
    scene.append(soil);
    this.replaceScene(scene);
    this.rootSystem.growFirstRoot();
    this.rootSystem.render(soil, 2);
    return wait(this.duration(3800, 850), this.abortController.signal);
  }

  private async showMiddleSchoolConnection(): Promise<void> {
    if (
      !(await this.showCinematicLines(
        ['中学校。', '弟は、サッカーを続けた。', '僕は――'],
        'middle-school-intro-scene',
      ))
    ) {
      return;
    }

    const scene = createScene('middle-school-choice-scene');
    const prompt = document.createElement('p');
    prompt.className = 'middle-school-prompt';
    prompt.textContent = '僕は――';
    const choiceHost = document.createElement('div');
    choiceHost.className = 'middle-school-choices';
    scene.append(prompt, choiceHost);
    this.replaceScene(scene);
    this.comparisonSystem.showComparison(scene, [SOCCER_COMPARISON, STUDY_COMPARISON], {
      subtle: true,
      edge: 'right',
    });

    let choice = await this.chooseMiddleSchool(choiceHost, true);
    if (this.abortController.signal.aborted) return;
    if (choice === 'continue') {
      prompt.textContent = '…………。';
      if (!(await wait(this.duration(1800, 450), this.abortController.signal))) return;
      prompt.textContent = '僕は――';
      choice = await this.chooseMiddleSchool(choiceHost, false);
    }
    if (choice !== 'quit' || this.abortController.signal.aborted) return;

    this.context.audio.playSE('choice-click');
    this.comparisonSystem.hideComparison();
    prompt.textContent = 'やっと、やめられた。';
    if (!(await wait(this.duration(2600, 600), this.abortController.signal))) return;
    await this.finishChapter();
  }

  private async finishChapter(): Promise<void> {
    const scene = createScene('chapter2-title-scene');
    const card = this.createChapterCard('CHAPTER 2', 'はじめて楽しかった');
    scene.append(card);
    this.replaceScene(scene);
    requestAnimationFrame(() => card.classList.add('is-visible'));

    const state = this.context.getState();
    state.chapter = 2;
    state.sceneId = 'chapter2-start';
    state.comparisonStage = 3;
    state.rootStage = 2;
    if (!state.completedScenes.includes('chapter1')) state.completedScenes.push('chapter1');
    this.context.save.save(state);

    if (!(await wait(this.duration(3000, 750), this.abortController.signal))) return;
    await this.context.navigate('chapter2-start');
  }

  private chooseMiddleSchool(parent: HTMLElement, allowContinue: boolean): Promise<MiddleSchoolChoice> {
    this.choiceMenu?.destroy();
    return new Promise((resolve) => {
      const finish = (choice: MiddleSchoolChoice): void => {
        this.choiceMenu?.destroy();
        this.choiceMenu = null;
        resolve(choice);
      };
      const options = allowContinue
        ? [
            { label: 'サッカーを続ける', action: () => finish('continue') },
            { label: 'サッカーをやめる', action: () => finish('quit') },
          ]
        : [{ label: 'サッカーをやめる', action: () => finish('quit') }];
      this.choiceMenu = new ChoiceMenu(parent, this.context.input, options);
      this.choiceMenu.focus();
    });
  }

  private playSoccer(parent: HTMLElement, options: SoccerMiniGameOptions): Promise<boolean> {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (result: boolean): void => {
        if (settled) return;
        settled = true;
        this.abortController.signal.removeEventListener('abort', handleAbort);
        this.soccerGame?.destroy();
        this.soccerGame = null;
        resolve(result);
      };
      const handleAbort = (): void => finish(false);
      this.abortController.signal.addEventListener('abort', handleAbort, { once: true });
      this.soccerGame = new SoccerMiniGame(parent, this.context.input, this.context.audio, {
        ...options,
        onComplete: () => {
          options.onComplete();
          finish(true);
        },
      });
    });
  }

  private showCinematicLines(
    lines: readonly string[],
    className: string,
    displayDuration = this.duration(2100, 450),
  ): Promise<boolean> {
    this.comparisonSystem.hideComparison();
    return showCinematicLines({
      root: this.context.root,
      input: this.context.input,
      signal: this.abortController.signal,
      lines,
      className,
      displayDuration,
      gapDuration: this.duration(500, 70),
      textClassName: 'chapter1-cinematic-line',
    });
  }

  private createSoccerScene(className: string, headingText: string): HTMLElement {
    const scene = createScene(`soccer-scene ${className}`);
    scene.innerHTML =
      '<div class="soccer-field-markings" aria-hidden="true"><span class="field-circle"></span><span class="penalty-box"></span><span class="field-goal"></span></div>';
    if (headingText) {
      const heading = document.createElement('p');
      heading.className = 'scene-heading field-heading';
      heading.textContent = headingText;
      scene.append(heading);
    }
    return scene;
  }

  private createSoccerPerson(className: string, label: string): HTMLElement {
    const person = document.createElement('div');
    person.className = className;
    person.setAttribute('role', 'img');
    person.setAttribute('aria-label', label);
    person.innerHTML = '<span class="soccer-head"></span><span class="soccer-body"></span>';
    return person;
  }

  private createChapterCard(eyebrowText: string, titleText: string): HTMLElement {
    return createChapterCard(eyebrowText, titleText);
  }

  private replaceScene(scene: HTMLElement): void {
    this.comparisonSystem.hideComparison();
    this.context.root.replaceChildren(scene);
  }

  private duration(standard: number, reduced: number): number {
    return motionDuration(standard, reduced);
  }
}
