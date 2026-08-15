import { NoiseOverlay } from '../effects/NoiseOverlay';
import { ComparisonSystem } from '../systems/ComparisonSystem';
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

const EXTERNAL_LABELS = ['友達', '楽しそう', '話せる'] as const;

type MorningChoice = 'school' | 'rest';

export class Chapter5Scene implements Scene {
  private readonly abortController = new AbortController();
  private readonly comparisonSystem: ComparisonSystem;
  private readonly rootSystem: RootSystem;
  private choiceMenu: ChoiceMenu | null = null;
  private noiseOverlay: NoiseOverlay | null = null;
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
    this.choiceMenu?.destroy();
    this.noiseOverlay?.destroy();
    this.comparisonSystem.destroy();
    this.stopChapterSounds();
    this.clearTimers();
    this.choiceMenu = null;
    this.noiseOverlay = null;
  }

  private async run(): Promise<void> {
    // CHAPTER 5タイトルはCHAPTER 4末尾で表示済み。
    if (!(await this.showNewHighSchool())) return;
    if (!(await this.showNewStart())) return;
    if (!(await this.showGroupsForming())) return;
    if (!(await this.showFirstExternalComparison())) return;
    if (!(await this.showGrowingComparisons())) return;
    if (!(await this.showWithdrawalReturning())) return;
    if (!(await this.showMornings())) return;
    if (!(await this.showAttendanceBecomingDifficult())) return;
    if (!(await this.showSchoolRefusal())) return;
    if (!(await this.showTransfer())) return;
    if (!(await this.showDormRoom())) return;
    if (!(await this.showComparisonCollapse())) return;
    if (!(await this.showSelfGrowingRoot())) return;
    await this.showChapter6Connection();
  }

  private async showNewHighSchool(): Promise<boolean> {
    const scene = createScene('chapter5-school-scene new-high-school-scene');
    scene.append(this.createSchool('春。新しい高校。'));
    const protagonist = this.createPerson('new-school-protagonist', '新しい高校に立つ主人公');
    const line = this.createLine();
    scene.append(protagonist, line);
    this.replaceScene(scene);

    for (const text of ['ここには、弟はいない。', '誰も、僕らを並べない。']) {
      line.textContent = text;
      line.classList.add('is-visible');
      if (!(await this.advance(scene, 2700, 560))) return false;
      line.classList.remove('is-visible');
      if (!(await wait(this.duration(500, 60), this.abortController.signal))) return false;
    }
    return true;
  }

  private async showNewStart(): Promise<boolean> {
    const scene = createScene('chapter5-classroom-scene new-start-scene');
    scene.append(this.createClassroom());
    const protagonist = this.createPerson('classroom-protagonist', '新しい教室にいる主人公');
    const classmates = this.createStudentGroup('new-classmates', 4, '新しいクラスの生徒たち');
    const prompt = document.createElement('p');
    prompt.className = 'chapter5-prompt';
    prompt.textContent = '新しいクラス。';
    const choiceHost = document.createElement('div');
    choiceHost.className = 'chapter5-choice-host';
    scene.append(protagonist, classmates, prompt, choiceHost);
    this.replaceScene(scene);
    if (!(await wait(this.duration(1500, 330), this.abortController.signal))) return false;

    const choice = await this.choose(choiceHost, [
      { value: 'speak', label: '話しかける' },
      { value: 'greet', label: '挨拶する' },
      { value: 'watch', label: '少し様子を見る' },
    ]);
    if (!choice || this.abortController.signal.aborted) return false;
    const responses: Record<string, string> = {
      speak: '短い会話が、普通に続いた。',
      greet: '「おはよう。」　相手も挨拶を返した。',
      watch: '教室の声を聞きながら、席についた。',
    };
    prompt.textContent = responses[choice] ?? '';
    prompt.classList.add('is-response');
    return this.advance(scene, 2500, 520);
  }

  private async showGroupsForming(): Promise<boolean> {
    const moments = [
      { time: '初日。', activity: '教室には、まだ同じ距離があった。', groups: 1 },
      { time: '数日後。', activity: '昼休みを一緒に過ごす人たちが増えた。', groups: 2 },
      { time: 'さらに数日後。', activity: '放課後、連れ立って帰る声がした。', groups: 3 },
    ];
    for (const moment of moments) {
      const scene = createScene(`chapter5-classroom-scene groups-forming-scene groups-${moment.groups}`);
      scene.append(this.createClassroom());
      const protagonist = this.createPerson('groups-protagonist', '教室にいる主人公');
      scene.append(protagonist);
      for (let index = 0; index < moment.groups; index += 1) {
        const group = this.createStudentGroup(
          `forming-group forming-group--${index + 1}`,
          index === 2 ? 2 : 3,
          '自然に会話する生徒たち',
        );
        scene.append(group);
      }
      const time = document.createElement('p');
      time.className = 'montage-time';
      time.textContent = moment.time;
      const line = this.createLine('groups-montage-line');
      line.textContent = moment.activity;
      line.classList.add('is-visible');
      scene.append(time, line);
      this.replaceScene(scene);
      if (!(await this.advance(scene, 2600, 560))) return false;
    }
    return true;
  }

  private async showFirstExternalComparison(): Promise<boolean> {
    const scene = createScene('chapter5-classroom-scene first-external-comparison-scene');
    scene.append(this.createClassroom());
    const protagonist = this.createPerson('watching-protagonist', '周囲を見る主人公');
    const group = this.createStudentGroup('break-group', 4, '休み時間を一緒に過ごす生徒たち');
    const line = this.createLine();
    scene.append(protagonist, group, line);
    this.replaceScene(scene);

    for (const text of ['友達がいる', '僕は？']) {
      line.textContent = text;
      line.classList.add('is-visible');
      if (!(await this.advance(scene, 2300, 500))) return false;
      line.classList.remove('is-visible');
      if (!(await wait(this.duration(430, 55), this.abortController.signal))) return false;
    }

    const display = this.comparisonSystem.showExternalComparison(scene, ['友達']);
    display.classList.add('chapter5-comparison', 'first-external-comparison');
    return this.advance(scene, 3200, 680);
  }

  private async showGrowingComparisons(): Promise<boolean> {
    const moments = [
      { place: '昼休み。', detail: '周囲が友達と話している。', intensity: 0.16 },
      { place: '別の日。', detail: '笑っている生徒がいる。', intensity: 0.22 },
      { place: 'また、別の日。', detail: '会話が自然に続いている。', intensity: 0.28 },
    ];
    for (let index = 0; index < moments.length; index += 1) {
      const moment = moments[index];
      if (!moment) continue;
      const scene = createScene(`chapter5-classroom-scene comparison-growth-scene comparison-growth-${index + 1}`);
      scene.append(this.createClassroom());
      const group = this.createStudentGroup('comparison-group', 3 + index, '会話する周囲の生徒たち');
      const protagonist = this.createPerson('comparison-protagonist', '少し離れた主人公');
      const time = document.createElement('p');
      time.className = 'montage-time';
      time.textContent = moment.place;
      const line = this.createLine();
      line.textContent = moment.detail;
      line.classList.add('is-visible');
      scene.append(group, protagonist, time, line);
      this.replaceScene(scene);
      this.noiseOverlay = new NoiseOverlay(scene, this.context.settings);
      this.noiseOverlay.setIntensity(moment.intensity);
      const display = this.comparisonSystem.showExternalComparison(
        scene,
        EXTERNAL_LABELS.slice(0, index + 1),
      );
      display.classList.add('chapter5-comparison', 'comparison-is-growing');
      if (!(await this.advance(scene, 2800 + index * 350, 580 + index * 80))) return false;
    }
    return true;
  }

  private async showWithdrawalReturning(): Promise<boolean> {
    const scene = createScene('chapter5-classroom-scene withdrawal-return-scene');
    scene.append(this.createClassroom());
    const protagonist = this.createPerson('withdrawal-protagonist', '席にいる主人公');
    const visitor = this.createPerson('approaching-student', '主人公に近づく生徒');
    const prompt = document.createElement('p');
    prompt.className = 'chapter5-prompt withdrawal-prompt';
    prompt.textContent = '「次の授業、移動だよ。」';
    const choiceHost = document.createElement('div');
    choiceHost.className = 'chapter5-choice-host withdrawal-choice-host';
    scene.append(protagonist, visitor, prompt, choiceHost);
    this.replaceScene(scene);
    this.noiseOverlay = new NoiseOverlay(scene, this.context.settings);
    this.noiseOverlay.setIntensity(0.2);
    if (!(await wait(this.duration(1300, 300), this.abortController.signal))) return false;

    const choice = await this.choose(choiceHost, [
      { value: 'speak', label: '話す' },
      { value: 'brief', label: '短く返す' },
      { value: 'ignore', label: '気づかないふりをする' },
    ]);
    if (!choice || this.abortController.signal.aborted) return false;
    prompt.textContent = choice === 'speak' ? '二、三言だけ話した。' : choice === 'brief' ? '「うん。」' : '声は、そのまま通り過ぎた。';
    if (!(await this.advance(scene, 1800, 400))) return false;

    for (const text of ['……。', 'また、比べられるかもしれない。', '目立たない方がいい。']) {
      prompt.textContent = text;
      if (!(await this.advance(scene, 2500, 520))) return false;
    }
    return true;
  }

  private async showMornings(): Promise<boolean> {
    if (!(await this.playMorning(1, 0, false))) return false;
    if (!(await this.playMorning(2, 160, false))) return false;
    return this.playMorning(3, 280, true);
  }

  private async playMorning(day: number, reactionDelay: number, stopAtEntrance: boolean): Promise<boolean> {
    const scene = createScene(`morning-scene morning-day-${day}`);
    const room = this.createBedroom();
    const clock = document.createElement('div');
    clock.className = 'morning-clock';
    clock.textContent = '6:40';
    const alarm = document.createElement('p');
    alarm.className = 'alarm-text';
    alarm.textContent = 'ピピピ…';
    const protagonist = this.createPerson('morning-protagonist', 'ベッドにいる主人公');
    const status = document.createElement('p');
    status.className = 'morning-status';
    const actionHost = document.createElement('div');
    actionHost.className = 'morning-action-host';
    scene.append(room, clock, alarm, protagonist, status, actionHost);
    this.replaceScene(scene);
    this.context.audio.playSE('alarm');
    this.context.audio.setLoopLevel('school-morning', 0.12);

    if (!(await this.waitForAction(actionHost, '起きる', reactionDelay))) return false;
    protagonist.classList.add('is-up');
    status.textContent = day === 1 ? '起きる。着替える。' : day === 2 ? '少し遅れて、身体を起こす。' : 'ゆっくり、玄関まで行く。';
    status.classList.add('is-visible');
    if (!(await wait(this.duration(1900, 430), this.abortController.signal))) return false;
    if (!stopAtEntrance) {
      status.textContent = '学校へ行く。';
      return this.advance(scene, 1700, 380);
    }

    scene.classList.add('at-entrance');
    status.textContent = '玄関で、一度止まる。';
    if (!(await wait(this.duration(1400, 320), this.abortController.signal))) return false;
    const choice = await this.chooseMorning(actionHost);
    if (!choice || this.abortController.signal.aborted) return false;
    status.textContent = choice === 'school' ? '少し立ち止まって、その日は学校へ向かった。' : 'その日は、部屋へ戻った。';
    return this.advance(scene, 2300, 500);
  }

  private async showAttendanceBecomingDifficult(): Promise<boolean> {
    const moments = [
      { className: 'uniform-morning', text: '朝。制服。玄関。' },
      { className: 'bed-clock', text: '別の日。ベッド。時計。' },
      { className: 'empty-school-seat', text: '学校。主人公の席は空いている。' },
    ];
    for (const moment of moments) {
      const scene = createScene(`attendance-montage-scene ${moment.className}`);
      const image = document.createElement('div');
      image.className = 'attendance-image';
      image.setAttribute('role', 'img');
      image.setAttribute('aria-label', moment.text);
      const line = this.createLine();
      line.textContent = moment.text;
      line.classList.add('is-visible');
      scene.append(image, line);
      this.replaceScene(scene);
      if (!(await wait(this.duration(1800, 430), this.abortController.signal))) return false;
    }
    return showCinematicLines({
      root: this.context.root,
      input: this.context.input,
      signal: this.abortController.signal,
      lines: ['少しずつ。', '学校へ行けない日が増えた。'],
      className: 'attendance-lines-scene',
      textClassName: 'chapter5-cinematic-line',
      displayDuration: this.duration(2600, 540),
    });
  }

  private async showSchoolRefusal(): Promise<boolean> {
    const scene = createScene('school-refusal-scene');
    const room = this.createBedroom();
    const protagonist = this.createPerson('daytime-room-protagonist', '学校の時間に自室にいる主人公');
    const clock = document.createElement('div');
    clock.className = 'daytime-clock';
    const light = document.createElement('div');
    light.className = 'passing-daylight';
    const line = this.createLine();
    scene.append(room, protagonist, clock, light, line);
    this.replaceScene(scene);
    this.context.audio.setLoopLevel('empty-room', 0.1);

    for (const text of ['やがて。', '学校へ行けなくなった。']) {
      line.textContent = text;
      line.classList.add('is-visible');
      if (!(await this.advance(scene, 3000, 620))) return false;
      line.classList.remove('is-visible');
      if (!(await wait(this.duration(500, 60), this.abortController.signal))) return false;
    }
    return true;
  }

  private showTransfer(): Promise<boolean> {
    return showCinematicLines({
      root: this.context.root,
      input: this.context.input,
      signal: this.abortController.signal,
      lines: ['高校2年。', '11月。', '全寮制の高校へ転校した。'],
      className: 'transfer-date-scene',
      textClassName: 'chapter5-cinematic-line',
      displayDuration: this.duration(2700, 560),
      gapDuration: this.duration(600, 70),
    });
  }

  private async showDormRoom(): Promise<boolean> {
    const scene = createScene('dorm-room-scene');
    const room = document.createElement('div');
    room.className = 'dorm-room';
    room.innerHTML = '<span class="dorm-bed"></span><span class="dorm-desk"></span><span class="dorm-box dorm-box--one"></span><span class="dorm-box dorm-box--two"></span>';
    room.setAttribute('role', 'img');
    room.setAttribute('aria-label', '荷物が置かれた新しい寮の部屋');
    const protagonist = this.createPerson('dorm-protagonist', '寮の部屋に立つ主人公');
    const line = this.createLine();
    line.textContent = 'また、最初から。';
    line.classList.add('is-visible');
    scene.append(room, protagonist, line);
    this.replaceScene(scene);
    return this.advance(scene, 3000, 620);
  }

  private async showComparisonCollapse(): Promise<boolean> {
    const scene = createScene('comparison-collapse-scene');
    const room = document.createElement('div');
    room.className = 'collapse-room-shadow';
    scene.append(room);
    this.replaceScene(scene);
    const display = this.comparisonSystem.showExternalComparison(scene, ['友達']);
    display.classList.add('chapter5-comparison', 'collapsing-comparison');
    if (!(await wait(this.duration(2400, 520), this.abortController.signal))) return false;

    const target = display.querySelector<HTMLElement>('.external-comparison-target');
    target?.classList.add('is-fading');
    if (!(await wait(this.duration(1500, 340), this.abortController.signal))) return false;
    target?.remove();
    display.classList.add('has-no-target');
    if (!(await wait(this.duration(1900, 420), this.abortController.signal))) return false;

    const label = display.querySelector<HTMLElement>('.comparison-hud-label');
    label?.classList.add('is-fading');
    if (!(await wait(this.duration(1400, 320), this.abortController.signal))) return false;
    label?.remove();
    display.classList.add('has-no-label');
    if (!(await wait(this.duration(1900, 420), this.abortController.signal))) return false;

    display.classList.add('is-collapsed-away');
    if (!(await wait(this.duration(950, 200), this.abortController.signal))) return false;
    const internalized = this.comparisonSystem.showInternalizedComparison(scene);
    internalized.classList.add('chapter5-comparison');
    return this.advance(scene, 3300, 700);
  }

  private async showSelfGrowingRoot(): Promise<boolean> {
    const scene = createScene('chapter5-root-scene');
    const soil = document.createElement('div');
    soil.className = 'soil-field chapter-soil-field chapter5-soil-field';
    const rootHost = document.createElement('div');
    rootHost.className = 'self-growing-root-host';
    soil.append(rootHost);
    scene.append(soil);
    this.replaceScene(scene);
    if (!(await wait(this.duration(2300, 520), this.abortController.signal))) return false;
    this.rootSystem.growWithoutExternalStimulus();
    this.rootSystem.render(rootHost, 5);
    rootHost.classList.add('has-awakened');
    return wait(this.duration(4300, 900), this.abortController.signal);
  }

  private async showChapter6Connection(): Promise<void> {
    if (
      !(await showCinematicLines({
        root: this.context.root,
        input: this.context.input,
        signal: this.abortController.signal,
        lines: ['それでも。', '時間は、進んだ。', '大学。', '一人暮らしを始めた。'],
        className: 'chapter6-connection-scene',
        textClassName: 'chapter5-cinematic-line',
        displayDuration: this.duration(2500, 520),
        gapDuration: this.duration(550, 65),
      }))
    ) {
      return;
    }

    const scene = createScene('chapter6-title-scene');
    const card = createChapterCard('CHAPTER 6', '自由');
    scene.append(card);
    this.replaceScene(scene);
    requestAnimationFrame(() => card.classList.add('is-visible'));

    const state = this.context.getState();
    state.chapter = 6;
    state.sceneId = 'chapter6-start';
    state.comparisonStage = 7;
    state.rootStage = 5;
    if (!state.completedScenes.includes('chapter5')) state.completedScenes.push('chapter5');
    this.context.save.save(state);

    if (!(await wait(this.duration(3300, 800), this.abortController.signal))) return;
    await this.context.navigate('chapter6-start');
  }

  private createSchool(label: string): HTMLElement {
    const school = document.createElement('div');
    school.className = 'chapter5-school-background';
    school.setAttribute('role', 'img');
    school.setAttribute('aria-label', label);
    school.innerHTML = '<span class="school-building"></span><span class="school-window-row"></span><span class="spring-tree"></span>';
    return school;
  }

  private createClassroom(): HTMLElement {
    const classroom = document.createElement('div');
    classroom.className = 'chapter5-classroom';
    classroom.setAttribute('aria-hidden', 'true');
    classroom.innerHTML = '<span class="classroom-board"></span><span class="classroom-window"></span><span class="desk desk--one"></span><span class="desk desk--two"></span><span class="desk desk--three"></span>';
    return classroom;
  }

  private createBedroom(): HTMLElement {
    const room = document.createElement('div');
    room.className = 'chapter5-bedroom';
    room.setAttribute('aria-hidden', 'true');
    room.innerHTML = '<span class="chapter5-bed"></span><span class="chapter5-room-window"></span><span class="school-uniform"></span><span class="bedroom-door-shape"></span>';
    return room;
  }

  private createPerson(className: string, label: string): HTMLElement {
    const person = document.createElement('div');
    person.className = `chapter5-person ${className}`;
    person.setAttribute('role', 'img');
    person.setAttribute('aria-label', label);
    person.innerHTML = '<span class="chapter5-head"></span><span class="chapter5-body"></span>';
    return person;
  }

  private createStudentGroup(className: string, count: number, label: string): HTMLElement {
    const group = document.createElement('div');
    group.className = `chapter5-student-group ${className}`;
    group.setAttribute('role', 'img');
    group.setAttribute('aria-label', label);
    for (let index = 0; index < count; index += 1) {
      group.append(this.createPerson('group-student', '生徒'));
    }
    return group;
  }

  private createLine(extraClass = ''): HTMLParagraphElement {
    const line = document.createElement('p');
    line.className = `chapter5-scene-line ${extraClass}`.trim();
    line.setAttribute('aria-live', 'polite');
    return line;
  }

  private choose(
    parent: HTMLElement,
    options: readonly { value: string; label: string }[],
  ): Promise<string | null> {
    this.choiceMenu?.destroy();
    return new Promise((resolve) => {
      const finish = (value: string): void => {
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

  private async chooseMorning(parent: HTMLElement): Promise<MorningChoice | null> {
    const result = await this.choose(parent, [
      { value: 'school', label: '学校へ行く' },
      { value: 'rest', label: '今日は休む' },
    ]);
    return result === 'school' || result === 'rest' ? result : null;
  }

  private waitForAction(parent: HTMLElement, label: string, delay: number): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.abortController.signal.aborted) {
        resolve(false);
        return;
      }
      let settled = false;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chapter5-action-button';
      button.textContent = label;
      button.setAttribute('aria-label', label);
      parent.replaceChildren(button);

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
        if (settled || button.disabled) return;
        button.disabled = true;
        button.textContent = delay > 0 ? '……' : label;
        const adjustedDelay = this.duration(delay, Math.min(delay, 60));
        if (adjustedDelay === 0) {
          finish(true);
          return;
        }
        this.schedule(() => finish(true), adjustedDelay);
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
    this.comparisonSystem.hideComparison();
    this.noiseOverlay?.destroy();
    this.noiseOverlay = null;
    this.stopChapterSounds();
    this.clearTimers();
    this.context.root.replaceChildren(scene);
  }

  private stopChapterSounds(): void {
    this.context.audio.stopLoop('school-morning');
    this.context.audio.stopLoop('hallway');
    this.context.audio.stopLoop('empty-room');
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
