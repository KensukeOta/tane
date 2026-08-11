import type { Scene, SceneContext } from '../types';
import { ChoiceMenu } from '../ui/ChoiceMenu';
import { createScene } from './sceneUtils';

export class Chapter1PlaceholderScene implements Scene {
  private menu: ChoiceMenu | null = null;

  public constructor(private readonly context: SceneContext) {}

  public enter(): void {
    const scene = createScene('chapter-placeholder-scene');
    const content = document.createElement('div');
    content.className = 'chapter-card is-visible';
    const eyebrow = document.createElement('p');
    eyebrow.className = 'chapter-eyebrow';
    eyebrow.textContent = 'CHAPTER 1';
    const title = document.createElement('h1');
    title.textContent = 'サッカー';
    const note = document.createElement('p');
    note.className = 'development-note';
    note.textContent = 'この先は次の実装フェーズで追加されます。';
    content.append(eyebrow, title, note);
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
