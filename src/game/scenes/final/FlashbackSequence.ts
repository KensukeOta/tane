import { ComparisonSystem } from '../../systems/ComparisonSystem';
import type { SceneContext } from '../../types';
import { createScene, motionDuration, wait, waitForAdvance } from '../sceneUtils';

type FlashbackFrame = {
  className: string;
  label: string;
  lines?: readonly string[];
  comparison?: 'twins' | 'soccer' | 'tennis' | 'external' | 'internalized';
};

const FRAMES: readonly FlashbackFrame[] = [
  { className: 'childhood', label: '幼い双子', comparison: 'twins' },
  { className: 'soccer', label: '弟のゴール', comparison: 'soccer' },
  { className: 'captain', label: 'キャプテン選出', lines: ['キャプテン　弟', 'パチ、パチ、パチ。'] },
  { className: 'tennis', label: 'テニスのラリー', comparison: 'tennis' },
  { className: 'hallway', label: '中学校の廊下', lines: ['比べられる'] },
  {
    className: 'dinner',
    label: '家族との食卓',
    lines: ['「弟は友達と遊びに行ってるのに、なんでお前は遊ばないんだ。」'],
  },
  { className: 'alone-dinner', label: '一人の夕食', lines: ['楽だ。'] },
  { className: 'high-school', label: '高校の教室', comparison: 'external' },
  { className: 'empty-seat', label: '空いた学校の席' },
  { className: 'dorm', label: '全寮制高校の部屋', lines: ['また、最初から。'] },
  { className: 'internalized', label: '対象のない比較', comparison: 'internalized' },
  { className: 'university', label: '大学の明るい部屋', lines: ['この頃が、一番楽しかった。'] },
  { className: 'present-bed', label: '現在のベッド' },
];

export class FlashbackSequence {
  private readonly comparisonSystem: ComparisonSystem;

  public constructor(private readonly context: SceneContext, private readonly signal: AbortSignal) {
    this.comparisonSystem = new ComparisonSystem(context.getState);
  }

  public async play(): Promise<boolean> {
    for (const [index, frame] of FRAMES.entries()) {
      if (!(await this.showFrame(frame, index + 1))) return false;
    }
    return true;
  }

  public destroy(): void {
    this.comparisonSystem.destroy();
  }

  private async showFrame(frame: FlashbackFrame, index: number): Promise<boolean> {
    this.comparisonSystem.hideComparison();
    const scene = createScene(`flashback-scene flashback-${frame.className}`);
    scene.dataset.flashbackIndex = String(index);
    const visual = document.createElement('div');
    visual.className = 'flashback-visual';
    visual.setAttribute('role', 'img');
    visual.setAttribute('aria-label', frame.label);
    visual.innerHTML = this.visualMarkup(frame.className);
    scene.append(visual);

    if (frame.lines?.length) {
      const text = document.createElement('div');
      text.className = 'flashback-text';
      frame.lines.forEach((line) => {
        const paragraph = document.createElement('p');
        paragraph.textContent = line;
        text.append(paragraph);
      });
      scene.append(text);
    }
    this.context.root.replaceChildren(scene);
    this.showComparison(scene, frame.comparison);
    requestAnimationFrame(() => scene.classList.add('is-visible'));

    const continued = await waitForAdvance({
      input: this.context.input,
      target: scene,
      signal: this.signal,
      milliseconds: motionDuration(index === 6 ? 2300 : 1550, index === 6 ? 520 : 380),
    });
    if (!continued) return false;
    scene.classList.remove('is-visible');
    return wait(motionDuration(280, 40), this.signal);
  }

  private showComparison(parent: HTMLElement, kind: FlashbackFrame['comparison']): void {
    if (kind === 'twins') {
      const text = document.createElement('p');
      text.className = 'flashback-twin-label';
      text.textContent = '弟｜ぼく';
      parent.append(text);
      return;
    }
    if (kind === 'soccer') {
      const display = this.comparisonSystem.showComparison(parent, [
        { label: 'サッカー', relation: '弟 ＞ ぼく' },
      ]);
      display.classList.add('flashback-comparison');
      return;
    }
    if (kind === 'tennis') {
      const display = this.comparisonSystem.showPersonalValue(parent, 'テニス', '楽しい');
      display.classList.add('flashback-comparison');
      return;
    }
    if (kind === 'external') {
      const display = this.comparisonSystem.showTrace(parent, 'あの人 ＞ ぼく');
      display.classList.add('flashback-comparison', 'flashback-external-comparison');
      return;
    }
    if (kind === 'internalized') {
      const display = this.comparisonSystem.showInternalizedComparison(parent);
      display.classList.add('flashback-comparison');
    }
  }

  private visualMarkup(className: string): string {
    if (className === 'childhood') return '<span class="memory-child memory-child--one"></span><span class="memory-child memory-child--two"></span>';
    if (className === 'soccer') return '<span class="memory-goal"></span><span class="memory-ball"></span><span class="memory-child memory-sibling"></span>';
    if (className === 'captain') return '<span class="memory-team"></span><span class="memory-captain"></span>';
    if (className === 'tennis') return '<span class="memory-net"></span><span class="memory-tennis-ball"></span>';
    if (className === 'hallway') return '<span class="memory-hall"></span><span class="memory-crowd"></span>';
    if (className === 'dinner') return '<span class="memory-table"></span><span class="memory-family"></span>';
    if (className === 'alone-dinner') return '<span class="memory-small-desk"></span><span class="memory-plate"></span>';
    if (className === 'high-school') return '<span class="memory-classroom"></span><span class="memory-group"></span>';
    if (className === 'empty-seat') return '<span class="memory-empty-desk"></span>';
    if (className === 'dorm') return '<span class="memory-dorm-bed"></span><span class="memory-boxes"></span>';
    if (className === 'university') return '<span class="memory-bright-window"></span><span class="memory-rug"></span>';
    return '<span class="memory-bed"></span><span class="memory-still-person"></span>';
  }
}
