import type { Scene, SceneContext } from '../types';
import { ChoiceMenu } from '../ui/ChoiceMenu';
import { createChapterCard, createScene } from './sceneUtils';

export class FinalChapterPlaceholderScene implements Scene {
  private menu: ChoiceMenu | null = null;

  public constructor(private readonly context: SceneContext) {}

  public enter(): void {
    const scene = createScene('chapter-placeholder-scene final-chapter-placeholder-scene');
    const content = createChapterCard('FINAL CHAPTER', '秋');
    content.classList.add('is-visible');
    const note = document.createElement('p');
    note.className = 'development-note';
    note.textContent = 'FINAL CHAPTERは次の実装フェーズで追加されます。';
    content.append(note);
    scene.append(content);
    this.context.root.append(scene);

    this.menu = new ChoiceMenu(content, this.context.input, [
      { label: 'タイトルへ', action: () => void this.context.navigate('title') },
    ]);
    this.menu.focus();
  }

  public exit(): void {
    this.menu?.destroy();
    this.menu = null;
  }
}
