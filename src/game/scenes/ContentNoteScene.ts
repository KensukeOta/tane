import type { Scene, SceneContext } from '../types';
import { ChoiceMenu } from '../ui/ChoiceMenu';
import { createScene } from './sceneUtils';

export class ContentNoteScene implements Scene {
  private menu: ChoiceMenu | null = null;

  public constructor(private readonly context: SceneContext) {}

  public enter(): void {
    const scene = createScene('content-note-scene');
    const panel = document.createElement('article');
    panel.className = 'content-note-panel';
    const title = document.createElement('h1');
    title.textContent = 'コンテンツノート';
    const body = document.createElement('p');
    body.innerHTML =
      'この作品には、<br>家族からの比較、<br>学校へ行けなくなる描写、<br>精神的な苦痛、<br>うつ病に関する描写が含まれます。';
    panel.append(title, body);
    scene.append(panel);
    this.context.root.append(scene);

    this.menu = new ChoiceMenu(panel, this.context.input, [
      { label: '続ける', action: () => void this.context.navigate('prologue') },
      { label: '戻る', action: () => void this.context.navigate('title') },
    ]);
    this.menu.focus();
  }

  public exit(): void {
    this.menu?.destroy();
    this.menu = null;
  }
}
