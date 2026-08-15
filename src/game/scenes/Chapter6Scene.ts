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

type FreeAction = 'university' | 'shopping' | 'room' | 'outside';

const FREE_ACTIONS: readonly { value: FreeAction; label: string }[] = [
  { value: 'university', label: '大学へ行く' },
  { value: 'shopping', label: '買い物へ行く' },
  { value: 'room', label: '部屋で過ごす' },
  { value: 'outside', label: '外へ出る' },
];

export class Chapter6Scene implements Scene {
  private readonly abortController = new AbortController();
  private choiceMenu: ChoiceMenu | null = null;

  public constructor(private readonly context: SceneContext) {}

  public enter(): void {
    void this.run();
  }

  public exit(): void {
    this.abortController.abort();
    this.choiceMenu?.destroy();
    this.stopChapterSounds();
    this.choiceMenu = null;
  }

  private async run(): Promise<void> {
    // CHAPTER 6タイトルはCHAPTER 5末尾で表示済み。
    if (!(await this.showUniversityBeginning())) return;
    if (!(await this.showApartment())) return;
    if (!(await this.showFreeTime())) return;
    if (!(await this.showNightAlone())) return;
    if (!(await this.showDailyMontage())) return;
    if (!(await this.showHappiestTime())) return;
    if (!(await this.showPassingYears())) return;
    if (!(await this.showAutumn())) return;
    await this.finishChapter();
  }

  private async showUniversityBeginning(): Promise<boolean> {
    const scene = createScene('chapter6-city-scene university-beginning-scene');
    scene.append(this.createCityBackground('春の新しい街'));
    const protagonist = this.createPerson('city-protagonist', '新しい街を一人で歩く主人公');
    const line = this.createLine();
    scene.append(protagonist, line);
    this.replaceScene(scene);
    this.context.audio.setLoopLevel('city-ambience', 0.18);
    requestAnimationFrame(() => protagonist.classList.add('is-walking'));

    for (const text of ['大学に入った。', '一人暮らしも始まった。']) {
      line.textContent = text;
      line.classList.add('is-visible');
      if (!(await this.advance(scene, 2700, 560))) return false;
      line.classList.remove('is-visible');
      if (!(await wait(this.duration(450, 55), this.abortController.signal))) return false;
    }
    return true;
  }

  private async showApartment(): Promise<boolean> {
    const scene = createScene('chapter6-apartment-scene apartment-intro-scene');
    scene.append(this.createApartment());
    const protagonist = this.createPerson('apartment-protagonist', '一人暮らしの部屋に立つ主人公');
    const line = this.createLine();
    line.textContent = 'ここからは、自分の生活。';
    line.classList.add('is-visible');
    scene.append(protagonist, line);
    this.replaceScene(scene);
    this.context.audio.setLoopLevel('apartment-tone', 0.12);
    return this.advance(scene, 2800, 580);
  }

  private async showFreeTime(): Promise<boolean> {
    const visited = new Set<FreeAction>();
    while (visited.size < 3) {
      const scene = createScene('chapter6-apartment-scene free-time-choice-scene');
      scene.append(this.createApartment());
      const protagonist = this.createPerson('free-time-protagonist', '自分の部屋にいる主人公');
      const prompt = document.createElement('p');
      prompt.className = 'free-time-prompt';
      prompt.textContent = visited.size === 0 ? '今日は、どう過ごそう。' : '次は、どうしよう。';
      const progress = document.createElement('p');
      progress.className = 'free-time-progress';
      progress.textContent = `${visited.size + 1}日目`;
      const choiceHost = document.createElement('div');
      choiceHost.className = 'free-time-choice-host';
      scene.append(protagonist, prompt, progress, choiceHost);
      this.replaceScene(scene);
      this.context.audio.setLoopLevel('apartment-tone', 0.12);

      const available = FREE_ACTIONS.filter((action) => !visited.has(action.value));
      const action = await this.choose<FreeAction>(choiceHost, available);
      if (!action || this.abortController.signal.aborted) return false;
      visited.add(action);
      if (!(await this.playFreeAction(action))) return false;
    }
    return true;
  }

  private playFreeAction(action: FreeAction): Promise<boolean> {
    if (action === 'university') return this.showCampusAction();
    if (action === 'shopping') return this.showShoppingAction();
    if (action === 'room') return this.showRoomAction();
    return this.showOutsideAction();
  }

  private async showCampusAction(): Promise<boolean> {
    const scene = createScene('chapter6-campus-scene free-action-scene action-university');
    scene.append(this.createCampus());
    const protagonist = this.createPerson('campus-protagonist', 'キャンパスを歩く主人公');
    const students = this.createStudentGroup(4);
    const line = this.createLine();
    line.textContent = '講義へ向かう。すれ違った人と、短く挨拶をした。';
    line.classList.add('is-visible');
    scene.append(protagonist, students, line);
    this.replaceScene(scene);
    this.context.audio.setLoopLevel('campus-ambience', 0.18);
    requestAnimationFrame(() => protagonist.classList.add('is-walking'));
    return this.advance(scene, 3000, 620);
  }

  private async showShoppingAction(): Promise<boolean> {
    const scene = createScene('chapter6-shop-scene free-action-scene action-shopping');
    scene.append(this.createShop());
    const protagonist = this.createPerson('shop-protagonist', '店で買い物をする主人公');
    const prompt = document.createElement('p');
    prompt.className = 'free-action-prompt';
    prompt.textContent = '何を買おう。';
    const choiceHost = document.createElement('div');
    choiceHost.className = 'free-action-choice-host';
    scene.append(protagonist, prompt, choiceHost);
    this.replaceScene(scene);
    this.context.audio.setLoopLevel('city-ambience', 0.12);

    const item = await this.choose(choiceHost, [
      { value: '飲み物', label: '飲み物' },
      { value: '食べ物', label: '食べ物' },
      { value: '日用品', label: '日用品' },
    ]);
    if (!item || this.abortController.signal.aborted) return false;
    prompt.textContent = `${item}を選んだ。自分で決めたものを持って帰る。`;
    prompt.classList.add('is-result');
    return this.advance(scene, 2500, 520);
  }

  private async showRoomAction(): Promise<boolean> {
    const scene = createScene('chapter6-apartment-scene free-action-scene action-room');
    scene.append(this.createApartment());
    const protagonist = this.createPerson('room-action-protagonist', '部屋で自分の時間を過ごす主人公');
    const prompt = document.createElement('p');
    prompt.className = 'free-action-prompt';
    prompt.textContent = '何をして過ごそう。';
    const choiceHost = document.createElement('div');
    choiceHost.className = 'free-action-choice-host';
    scene.append(protagonist, prompt, choiceHost);
    this.replaceScene(scene);
    this.context.audio.setLoopLevel('apartment-tone', 0.12);

    const action = await this.choose(choiceHost, [
      { value: 'ベッドに腰かける', label: 'ベッドに座る' },
      { value: '机に向かう', label: '机に向かう' },
      { value: '窓の外を見る', label: '何かを見る' },
    ]);
    if (!action || this.abortController.signal.aborted) return false;
    prompt.textContent = `${action}。誰にも急かされない時間。`;
    prompt.classList.add('is-result');
    return this.advance(scene, 2600, 540);
  }

  private async showOutsideAction(): Promise<boolean> {
    const scene = createScene('chapter6-city-scene free-action-scene action-outside');
    scene.append(this.createCityBackground('目的を決めずに歩ける街'));
    const protagonist = this.createPerson('outside-protagonist', '街を歩く主人公');
    const line = this.createLine();
    line.textContent = 'どこへ行ってもいい。';
    line.classList.add('is-visible');
    scene.append(protagonist, line);
    this.replaceScene(scene);
    this.context.audio.setLoopLevel('city-ambience', 0.17);
    requestAnimationFrame(() => protagonist.classList.add('is-walking'));
    return this.advance(scene, 3000, 620);
  }

  private async showNightAlone(): Promise<boolean> {
    const scene = createScene('chapter6-apartment-scene apartment-night-scene');
    const apartment = this.createApartment();
    apartment.classList.add('is-night');
    const protagonist = this.createPerson('night-protagonist', '夜、自分の部屋で過ごす主人公');
    const lamp = document.createElement('span');
    lamp.className = 'room-lamp-glow';
    const line = this.createLine();
    scene.append(apartment, lamp, protagonist, line);
    this.replaceScene(scene);
    this.context.audio.setLoopLevel('apartment-tone', 0.09);

    for (const text of ['静かだ。', 'でも、嫌じゃない。']) {
      line.textContent = text;
      line.classList.add('is-visible');
      if (!(await this.advance(scene, 2800, 580))) return false;
      line.classList.remove('is-visible');
      if (!(await wait(this.duration(500, 60), this.abortController.signal))) return false;
    }
    return true;
  }

  private async showDailyMontage(): Promise<boolean> {
    const moments = [
      { className: 'morning', label: '朝。', text: '自分の時間。' },
      { className: 'campus', label: '大学。', text: '' },
      { className: 'city', label: '街。', text: '自分の部屋。' },
      { className: 'room', label: '部屋。', text: '' },
      { className: 'night', label: '夜。', text: '自分で決める。' },
      { className: 'shopping', label: '別の日。買い物。', text: '' },
      { className: 'campus-later', label: '大学。', text: '' },
      { className: 'night-later', label: '夜。', text: '自由だった。' },
    ];
    for (const moment of moments) {
      const scene = createScene(`chapter6-montage-scene montage-${moment.className}`);
      const image = document.createElement('div');
      image.className = 'chapter6-montage-image';
      image.setAttribute('role', 'img');
      image.setAttribute('aria-label', moment.label);
      const label = document.createElement('p');
      label.className = 'chapter6-montage-label';
      label.textContent = moment.label;
      scene.append(image, label);
      if (moment.text) {
        const text = document.createElement('p');
        text.className = 'chapter6-montage-text';
        text.textContent = moment.text;
        scene.append(text);
      }
      this.replaceScene(scene);
      if (!(await wait(this.duration(1450, 340), this.abortController.signal))) return false;
    }
    return true;
  }

  private async showHappiestTime(): Promise<boolean> {
    const scene = createScene('chapter6-apartment-scene happiest-time-scene');
    const apartment = this.createApartment();
    apartment.classList.add('is-evening');
    const protagonist = this.createPerson('happiest-time-protagonist', '夕方の部屋にいる主人公');
    const line = this.createLine('happiest-time-line');
    scene.append(apartment, protagonist, line);
    this.replaceScene(scene);
    if (!(await wait(this.duration(1800, 420), this.abortController.signal))) return false;

    for (const text of ['この頃が、', '一番楽しかった。']) {
      line.textContent = text;
      line.classList.add('is-visible');
      if (!(await this.advance(scene, 3100, 650))) return false;
      line.classList.remove('is-visible');
      if (!(await wait(this.duration(550, 65), this.abortController.signal))) return false;
    }
    return true;
  }

  private async showPassingYears(): Promise<boolean> {
    const years = [
      { label: '大学1年', season: 'spring' },
      { label: '大学2年', season: 'summer' },
      { label: '大学3年', season: 'early-autumn' },
    ];
    for (const year of years) {
      const scene = createScene(`university-year-scene year-${year.season}`);
      const city = this.createCityBackground(`${year.label}の街`);
      const label = document.createElement('p');
      label.className = 'university-year-label';
      label.textContent = year.label;
      const protagonist = this.createPerson('year-protagonist', `${year.label}の主人公`);
      scene.append(city, protagonist, label);
      this.replaceScene(scene);
      if (!(await this.advance(scene, 2500, 520))) return false;
    }
    return true;
  }

  private async showAutumn(): Promise<boolean> {
    const scene = createScene('chapter6-autumn-scene');
    const city = this.createCityBackground('普通の秋の日');
    const protagonist = this.createPerson('autumn-protagonist', '秋の街を歩く主人公');
    const line = this.createLine();
    scene.append(city, protagonist, line);
    this.replaceScene(scene);
    this.context.audio.setLoopLevel('city-ambience', 0.12);

    for (const text of ['大学3年。', '秋。']) {
      line.textContent = text;
      line.classList.add('is-visible');
      if (!(await this.advance(scene, 2800, 580))) return false;
      line.classList.remove('is-visible');
      if (!(await wait(this.duration(500, 60), this.abortController.signal))) return false;
    }
    return true;
  }

  private async finishChapter(): Promise<void> {
    if (
      !(await showCinematicLines({
        root: this.context.root,
        input: this.context.input,
        signal: this.abortController.signal,
        lines: ['大学3年。', '秋。'],
        className: 'final-chapter-connection-scene',
        textClassName: 'chapter6-cinematic-line',
        displayDuration: this.duration(2600, 540),
        gapDuration: this.duration(600, 70),
      }))
    ) {
      return;
    }

    const scene = createScene('final-chapter-title-scene');
    const card = createChapterCard('FINAL CHAPTER', '秋');
    scene.append(card);
    this.replaceScene(scene);
    requestAnimationFrame(() => card.classList.add('is-visible'));

    const state = this.context.getState();
    state.chapter = 7;
    state.sceneId = 'final-chapter-start';
    state.comparisonStage = 7;
    state.rootStage = 5;
    if (!state.completedScenes.includes('chapter6')) state.completedScenes.push('chapter6');
    this.context.save.save(state);

    if (!(await wait(this.duration(3400, 820), this.abortController.signal))) return;
    await this.context.navigate('final-chapter-start');
  }

  private createApartment(): HTMLElement {
    const room = document.createElement('div');
    room.className = 'chapter6-apartment';
    room.setAttribute('role', 'img');
    room.setAttribute('aria-label', '窓から暖かな光が入る一人暮らしの部屋');
    room.innerHTML = [
      '<span class="apartment-window"></span>',
      '<span class="apartment-curtain"></span>',
      '<span class="apartment-bed"></span>',
      '<span class="apartment-desk"></span>',
      '<span class="apartment-fridge"></span>',
      '<span class="apartment-door"></span>',
      '<span class="apartment-rug"></span>',
    ].join('');
    return room;
  }

  private createCityBackground(label: string): HTMLElement {
    const city = document.createElement('div');
    city.className = 'chapter6-city-background';
    city.setAttribute('role', 'img');
    city.setAttribute('aria-label', label);
    city.innerHTML = '<span class="city-building city-building--one"></span><span class="city-building city-building--two"></span><span class="city-shopfront"></span><span class="city-tree"></span><span class="city-road"></span>';
    return city;
  }

  private createCampus(): HTMLElement {
    const campus = document.createElement('div');
    campus.className = 'chapter6-campus';
    campus.setAttribute('role', 'img');
    campus.setAttribute('aria-label', '春の大学キャンパス');
    campus.innerHTML = '<span class="campus-building"></span><span class="campus-windows"></span><span class="campus-lawn"></span><span class="campus-path"></span>';
    return campus;
  }

  private createShop(): HTMLElement {
    const shop = document.createElement('div');
    shop.className = 'chapter6-shop';
    shop.setAttribute('role', 'img');
    shop.setAttribute('aria-label', '自分で買うものを選べる店');
    shop.innerHTML = '<span class="shop-shelf shop-shelf--one"></span><span class="shop-shelf shop-shelf--two"></span><span class="shop-basket"></span><span class="shop-window"></span>';
    return shop;
  }

  private createPerson(className: string, label: string): HTMLElement {
    const person = document.createElement('div');
    person.className = `chapter6-person ${className}`;
    person.setAttribute('role', 'img');
    person.setAttribute('aria-label', label);
    person.innerHTML = '<span class="chapter6-head"></span><span class="chapter6-body"></span>';
    return person;
  }

  private createStudentGroup(count: number): HTMLElement {
    const group = document.createElement('div');
    group.className = 'chapter6-student-group';
    group.setAttribute('role', 'img');
    group.setAttribute('aria-label', 'キャンパスを行き交う学生たち');
    for (let index = 0; index < count; index += 1) {
      group.append(this.createPerson('campus-student', '学生'));
    }
    return group;
  }

  private createLine(extraClass = ''): HTMLParagraphElement {
    const line = document.createElement('p');
    line.className = `chapter6-scene-line ${extraClass}`.trim();
    line.setAttribute('aria-live', 'polite');
    return line;
  }

  private choose<T extends string>(
    parent: HTMLElement,
    options: readonly { value: T; label: string }[],
  ): Promise<T | null> {
    this.choiceMenu?.destroy();
    return new Promise((resolve) => {
      const finish = (value: T): void => {
        this.choiceMenu?.destroy();
        this.choiceMenu = null;
        resolve(value);
      };
      this.choiceMenu = new ChoiceMenu(
        parent,
        this.context.input,
        options.map((option) => ({ label: option.label, action: () => finish(option.value) })),
      );
      this.choiceMenu.focus();
    });
  }

  private replaceScene(scene: HTMLElement): void {
    this.choiceMenu?.destroy();
    this.choiceMenu = null;
    this.stopChapterSounds();
    this.context.root.replaceChildren(scene);
  }

  private stopChapterSounds(): void {
    this.context.audio.stopLoop('city-ambience');
    this.context.audio.stopLoop('apartment-tone');
    this.context.audio.stopLoop('campus-ambience');
  }

  private advance(target: HTMLElement, standard: number, reduced: number): Promise<boolean> {
    return waitForAdvance({
      input: this.context.input,
      target,
      signal: this.abortController.signal,
      milliseconds: this.duration(standard, reduced),
    });
  }

  private duration(standard: number, reduced: number): number {
    return motionDuration(standard, reduced);
  }
}
