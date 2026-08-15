import { NoiseOverlay } from '../effects/NoiseOverlay';
import { RootSystem } from '../systems/RootSystem';
import type { Scene, SceneContext } from '../types';
import { ChoiceMenu } from '../ui/ChoiceMenu';
import { FlashbackSequence } from './final/FlashbackSequence';
import { FinalRootReveal } from './final/FinalRootReveal';
import { createScene, motionDuration, wait, waitForAdvance } from './sceneUtils';

type DailyAction = 'university' | 'shopping' | 'home';

export class FinalChapterScene implements Scene {
  private readonly abortController = new AbortController();
  private readonly rootSystem: RootSystem;
  private choiceMenu: ChoiceMenu | null = null;
  private noiseOverlay: NoiseOverlay | null = null;
  private flashback: FlashbackSequence | null = null;

  public constructor(private readonly context: SceneContext) {
    this.rootSystem = new RootSystem(context.getState);
  }

  public enter(): void {
    void this.run();
  }

  public exit(): void {
    this.abortController.abort();
    this.choiceMenu?.destroy();
    this.noiseOverlay?.destroy();
    this.flashback?.destroy();
    this.stopChapterSounds();
    this.choiceMenu = null;
    this.noiseOverlay = null;
    this.flashback = null;
  }

  private async run(): Promise<void> {
    // FINAL CHAPTERタイトルはCHAPTER 6末尾で表示済み。
    if (!(await this.showOrdinaryMorning())) return;
    if (!(await this.showOrdinaryDay())) return;
    if (!(await this.showNextMorning())) return;
    if (!(await this.showSmallUnease())) return;
    if (!(await this.showNightFragments())) return;
    if (!(await this.showNarrowingChoices())) return;
    if (!(await this.showHeavyMornings())) return;
    if (!(await this.showHeavyDailyMovement())) return;
    if (!(await this.showQuietDarkening())) return;
    if (!(await this.showFlashbacks())) return;
    if (!(await this.showFinalRoots())) return;
    if (!(await this.showTitleReturn())) return;
    if (!(await this.showFinalWords())) return;
    await this.completeGame();
  }

  private async showOrdinaryMorning(): Promise<boolean> {
    const scene = this.createMorningScene('ordinary-final-morning', '普通の秋の朝');
    const protagonist = scene.querySelector<HTMLElement>('.final-morning-protagonist');
    const status = scene.querySelector<HTMLElement>('.final-morning-status');
    const actionHost = scene.querySelector<HTMLElement>('.final-wake-host');
    if (!protagonist || !status || !actionHost) return false;
    this.replaceScene(scene);
    this.context.audio.playSE('alarm');
    this.context.audio.setLoopLevel('apartment-tone', 0.11);
    if (!(await this.waitForAcceptedAction(actionHost, '起きる'))) return false;
    protagonist.classList.add('is-up');
    status.textContent = '起きる。着替える。大学へ行く。';
    status.classList.add('is-visible');
    return this.advance(scene, 2400, 500);
  }

  private async showOrdinaryDay(): Promise<boolean> {
    const campus = createScene('final-campus-scene ordinary-final-day');
    campus.append(this.createCampus());
    const protagonist = this.createPerson('ordinary-campus-protagonist', '大学を歩く主人公');
    const students = this.createStudents(4);
    const line = this.createLine();
    line.textContent = '講義へ行く。帰りに、買い物をする。';
    line.classList.add('is-visible');
    campus.append(protagonist, students, line);
    this.replaceScene(campus);
    this.context.audio.setLoopLevel('campus-ambience', 0.16);
    requestAnimationFrame(() => protagonist.classList.add('is-walking'));
    if (!(await this.advance(campus, 2800, 580))) return false;

    const home = createScene('final-apartment-scene ordinary-return-home');
    home.append(this.createApartment('evening'));
    const atHome = this.createPerson('ordinary-home-protagonist', '買い物から帰宅した主人公');
    const homeLine = this.createLine();
    homeLine.textContent = 'いつもの部屋へ帰る。';
    homeLine.classList.add('is-visible');
    home.append(atHome, homeLine);
    this.replaceScene(home);
    return this.advance(home, 2400, 500);
  }

  private async showNextMorning(): Promise<boolean> {
    const scene = this.createMorningScene('second-final-morning', '次の秋の朝');
    const protagonist = scene.querySelector<HTMLElement>('.final-morning-protagonist');
    const status = scene.querySelector<HTMLElement>('.final-morning-status');
    const actionHost = scene.querySelector<HTMLElement>('.final-wake-host');
    if (!protagonist || !status || !actionHost) return false;
    this.replaceScene(scene);
    this.context.audio.playSE('alarm');
    if (!(await this.waitForAcceptedAction(actionHost, '起きる'))) return false;
    if (!(await wait(this.duration(130, 30), this.abortController.signal))) return false;
    protagonist.classList.add('is-up');
    status.textContent = '起きる。いつもどおり、大学へ行く。';
    status.classList.add('is-visible');
    return this.advance(scene, 2200, 470);
  }

  private async showSmallUnease(): Promise<boolean> {
    const scene = createScene('final-campus-scene subtle-unease-scene');
    scene.append(this.createCampus());
    const protagonist = this.createPerson('slightly-slow-protagonist', 'いつもより少しゆっくり歩く主人公');
    const students = this.createStudents(3);
    scene.append(protagonist, students);
    this.replaceScene(scene);
    this.context.audio.setLoopLevel('distant-campus', 0.11);
    requestAnimationFrame(() => protagonist.classList.add('is-walking'));
    return this.advance(scene, 3600, 700);
  }

  private async showNightFragments(): Promise<boolean> {
    const scene = createScene('final-apartment-scene final-night-fragments-scene');
    const apartment = this.createApartment('night');
    const protagonist = this.createPerson('night-fragment-protagonist', '夜、一人で部屋にいる主人公');
    const fragment = document.createElement('p');
    fragment.className = 'final-inner-fragment';
    scene.append(apartment, protagonist, fragment);
    this.replaceScene(scene);
    this.context.audio.setLoopLevel('apartment-tone', 0.06);
    if (!(await wait(this.duration(2100, 480), this.abortController.signal))) return false;

    for (const text of ['足りない', 'まだ', 'もっと', '自分は']) {
      fragment.textContent = text;
      fragment.classList.add('is-visible');
      if (!(await wait(this.duration(1450, 340), this.abortController.signal))) return false;
      fragment.classList.remove('is-visible');
      if (!(await wait(this.duration(520, 70), this.abortController.signal))) return false;
    }
    return true;
  }

  private async showNarrowingChoices(): Promise<boolean> {
    const first = await this.playNarrowedDay(1, [
      { value: 'university', label: '大学へ行く' },
      { value: 'shopping', label: '買い物へ行く' },
      { value: 'home', label: '家にいる' },
    ]);
    if (!first) return false;
    return this.playNarrowedDay(2, [
      { value: 'university', label: '大学へ行く' },
      { value: 'home', label: '家にいる' },
    ]);
  }

  private async playNarrowedDay(
    day: number,
    options: readonly { value: DailyAction; label: string }[],
  ): Promise<boolean> {
    const scene = createScene(`final-apartment-scene narrowed-choice-scene narrowed-choice-day-${day}`);
    scene.append(this.createApartment('day'));
    const protagonist = this.createPerson('narrowed-choice-protagonist', '朝の部屋にいる主人公');
    const prompt = document.createElement('p');
    prompt.className = 'narrowed-choice-prompt';
    prompt.textContent = day === 1 ? '今日は、どうしよう。' : '次の日。';
    const host = document.createElement('div');
    host.className = 'narrowed-choice-host';
    scene.append(protagonist, prompt, host);
    this.replaceScene(scene);
    const choice = await this.choose(host, options);
    if (!choice || this.abortController.signal.aborted) return false;
    prompt.textContent =
      choice === 'university'
        ? '支度をして、大学へ向かう。'
        : choice === 'shopping'
          ? '必要なものだけ、買いに出る。'
          : '今日は、部屋で過ごす。';
    prompt.classList.add('is-result');
    return this.advance(scene, 2400, 500);
  }

  private async showHeavyMornings(): Promise<boolean> {
    if (!(await this.playHeavyMorning(1, 450))) return false;
    if (!(await this.playHeavyMorning(2, 760))) return false;
    return this.playHeavyMorning(3, 2500);
  }

  private async playHeavyMorning(day: number, responseDelay: number): Promise<boolean> {
    const scene = this.createMorningScene(`heavy-final-morning heavy-morning-${day}`, `重さが増した朝 ${day}`);
    const protagonist = scene.querySelector<HTMLElement>('.final-morning-protagonist');
    const status = scene.querySelector<HTMLElement>('.final-morning-status');
    const actionHost = scene.querySelector<HTMLElement>('.final-wake-host');
    if (!protagonist || !status || !actionHost) return false;
    this.replaceScene(scene);
    this.context.audio.playSE('alarm');
    if (!(await this.waitForAcceptedAction(actionHost, '起きる'))) return false;
    const reducedDelay = day === 1 ? 180 : day === 2 ? 300 : 750;
    if (!(await wait(this.duration(responseDelay, reducedDelay), this.abortController.signal))) return false;

    if (day === 1) {
      protagonist.classList.add('is-up', 'is-slow-response');
      status.textContent = '……。';
      status.classList.add('is-visible');
      return this.advance(scene, 1900, 420);
    }

    protagonist.classList.add('is-half-risen');
    status.textContent = '……。';
    status.classList.add('is-visible');
    if (!(await wait(this.duration(day === 2 ? 650 : 1100, day === 2 ? 220 : 320), this.abortController.signal))) return false;
    if (day === 2) {
      protagonist.classList.add('is-up');
    } else {
      protagonist.classList.add('is-returned');
    }
    return this.advance(scene, 2100, 450);
  }

  private async showHeavyDailyMovement(): Promise<boolean> {
    const scene = createScene('final-apartment-scene heavy-daily-movement-scene');
    scene.append(this.createApartment('muted-day'));
    const protagonist = this.createPerson('heavy-movement-protagonist', '部屋の中で動こうとする主人公');
    const line = this.createLine();
    const host = document.createElement('div');
    host.className = 'heavy-action-host';
    scene.append(protagonist, line, host);
    this.replaceScene(scene);
    if (this.context.settings.get().noiseEffects) {
      this.noiseOverlay = new NoiseOverlay(scene, this.context.settings);
      this.noiseOverlay.setIntensity(0.14);
    }

    const actions = [
      { label: '机へ行く', className: 'at-desk', delay: 520 },
      { label: '冷蔵庫へ行く', className: 'at-fridge', delay: 720 },
      { label: '外へ出る', className: 'at-door', delay: 960 },
    ];
    for (const action of actions) {
      if (!(await this.waitForAcceptedAction(host, action.label))) return false;
      if (!(await wait(this.duration(action.delay, 180), this.abortController.signal))) return false;
      protagonist.className = `final-person heavy-movement-protagonist ${action.className}`;
      line.textContent = '……。';
      line.classList.add('is-visible');
      if (!(await wait(this.duration(1200, 280), this.abortController.signal))) return false;
      line.classList.remove('is-visible');
    }
    return true;
  }

  private async showQuietDarkening(): Promise<boolean> {
    const scene = createScene('final-apartment-scene quiet-darkening-scene');
    scene.append(this.createApartment('night'));
    const protagonist = this.createPerson('darkening-bed-protagonist', 'ベッドに横になる主人公');
    scene.append(protagonist);
    this.replaceScene(scene);
    if (!(await wait(this.duration(2300, 520), this.abortController.signal))) return false;
    scene.classList.add('is-darkening');
    return wait(this.duration(3400, 720), this.abortController.signal);
  }

  private async showFlashbacks(): Promise<boolean> {
    this.flashback = new FlashbackSequence(this.context, this.abortController.signal);
    const completed = await this.flashback.play();
    this.flashback.destroy();
    this.flashback = null;
    return completed;
  }

  private async showFinalRoots(): Promise<boolean> {
    const reveal = new FinalRootReveal({
      root: this.context.root,
      input: this.context.input,
      rootSystem: this.rootSystem,
      signal: this.abortController.signal,
    });
    return reveal.play();
  }

  private async showTitleReturn(): Promise<boolean> {
    const scene = createScene('final-title-return-scene');
    this.replaceScene(scene);
    if (!(await wait(this.duration(2400, 520), this.abortController.signal))) return false;
    const title = document.createElement('h1');
    title.className = 'final-returned-title';
    title.textContent = '『種』';
    scene.append(title);
    requestAnimationFrame(() => title.classList.add('is-visible'));
    return this.advance(scene, 4300, 850);
  }

  private async showFinalWords(): Promise<boolean> {
    const lines = [
      '突然、始まったわけではなかった。',
      '振り返れば、ずっと前からそこにあった。',
      '表では、普通にしていた。',
      '一人になると、いつも何かしらの劣等感を感じていた。',
      'それが積み重なって、',
      'いつか、心と身体に支障が出るようになった。',
      '物心がつくよりも前に、',
      '種は植えられていた。',
    ] as const;
    const scene = createScene('final-words-scene');
    const text = document.createElement('p');
    text.className = 'final-words-text';
    scene.append(text);
    this.replaceScene(scene);

    for (const [index, line] of lines.entries()) {
      text.textContent = line;
      text.classList.add('is-visible');
      if (!(await this.advance(scene, index === 7 ? 3900 : 3200, index === 7 ? 820 : 680))) {
        return false;
      }
      text.classList.remove('is-visible');
      const gap = index === 6 ? this.duration(1900, 320) : this.duration(650, 75);
      if (!(await wait(gap, this.abortController.signal))) return false;
    }
    return true;
  }

  private async completeGame(): Promise<void> {
    const state = this.context.getState();
    state.chapter = 7;
    state.sceneId = 'ending';
    state.comparisonStage = 7;
    state.rootStage = 6;
    if (!state.completedScenes.includes('final')) state.completedScenes.push('final');
    this.context.save.save(state);
    if (!(await wait(this.duration(2000, 450), this.abortController.signal))) return;
    await this.context.navigate('ending');
  }

  private createMorningScene(className: string, label: string): HTMLElement {
    const scene = createScene(`final-apartment-scene final-morning-scene ${className}`);
    scene.append(this.createApartment('autumn-morning'));
    const protagonist = this.createPerson('final-morning-protagonist', label);
    const alarm = document.createElement('p');
    alarm.className = 'final-alarm-text';
    alarm.textContent = 'ピピピ…';
    const status = document.createElement('p');
    status.className = 'final-morning-status';
    const host = document.createElement('div');
    host.className = 'final-wake-host';
    scene.append(protagonist, alarm, status, host);
    return scene;
  }

  private createApartment(time: string): HTMLElement {
    const apartment = document.createElement('div');
    apartment.className = `chapter6-apartment final-apartment final-apartment--${time}`;
    apartment.setAttribute('role', 'img');
    apartment.setAttribute('aria-label', '大学生活で使っていた一人暮らしの部屋');
    apartment.innerHTML = [
      '<span class="apartment-window"></span>',
      '<span class="apartment-curtain"></span>',
      '<span class="apartment-bed"></span>',
      '<span class="apartment-desk"></span>',
      '<span class="apartment-fridge"></span>',
      '<span class="apartment-door"></span>',
      '<span class="apartment-rug"></span>',
    ].join('');
    return apartment;
  }

  private createCampus(): HTMLElement {
    const campus = document.createElement('div');
    campus.className = 'final-campus';
    campus.setAttribute('role', 'img');
    campus.setAttribute('aria-label', '秋の大学キャンパス');
    campus.innerHTML = '<span class="final-campus-building"></span><span class="final-campus-windows"></span><span class="final-campus-lawn"></span><span class="final-campus-path"></span>';
    return campus;
  }

  private createPerson(className: string, label: string): HTMLElement {
    const person = document.createElement('div');
    person.className = `final-person ${className}`;
    person.setAttribute('role', 'img');
    person.setAttribute('aria-label', label);
    person.innerHTML = '<span class="final-person-head"></span><span class="final-person-body"></span>';
    return person;
  }

  private createStudents(count: number): HTMLElement {
    const group = document.createElement('div');
    group.className = 'final-student-group';
    group.setAttribute('role', 'img');
    group.setAttribute('aria-label', '大学を行き交う学生');
    for (let index = 0; index < count; index += 1) {
      group.append(this.createPerson('final-student', '学生'));
    }
    return group;
  }

  private createLine(): HTMLParagraphElement {
    const line = document.createElement('p');
    line.className = 'final-scene-line';
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

  private waitForAcceptedAction(parent: HTMLElement, label: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.abortController.signal.aborted) {
        resolve(false);
        return;
      }
      let settled = false;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'final-action-button';
      button.textContent = label;
      button.setAttribute('aria-label', label);
      button.setAttribute('aria-pressed', 'false');
      const feedback = document.createElement('span');
      feedback.className = 'final-action-feedback';
      feedback.setAttribute('aria-hidden', 'true');
      parent.replaceChildren(button, feedback);

      const finish = (result: boolean): void => {
        if (settled) return;
        settled = true;
        offConfirm();
        offSpace();
        button.removeEventListener('click', activate);
        this.abortController.signal.removeEventListener('abort', handleAbort);
        resolve(result);
      };
      const activate = (): void => {
        if (settled) return;
        button.disabled = true;
        button.setAttribute('aria-pressed', 'true');
        button.classList.add('is-accepted');
        feedback.classList.add('is-visible');
        finish(true);
      };
      const handleAbort = (): void => finish(false);
      const offConfirm = this.context.input.onPress('confirm', activate);
      const offSpace = this.context.input.onPress('space', activate);
      button.addEventListener('click', activate);
      this.abortController.signal.addEventListener('abort', handleAbort, { once: true });
      button.focus({ preventScroll: true });
    });
  }

  private replaceScene(scene: HTMLElement): void {
    this.choiceMenu?.destroy();
    this.choiceMenu = null;
    this.noiseOverlay?.destroy();
    this.noiseOverlay = null;
    this.stopChapterSounds();
    this.context.root.replaceChildren(scene);
  }

  private stopChapterSounds(): void {
    this.context.audio.stopLoop('apartment-tone');
    this.context.audio.stopLoop('campus-ambience');
    this.context.audio.stopLoop('distant-campus');
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
