import type { Scene, SceneContext } from '../types';
import { ChoiceMenu } from '../ui/ChoiceMenu';
import { createScene } from './sceneUtils';

export class EndingScene implements Scene {
  private menu: ChoiceMenu | null = null;

  public constructor(private readonly context: SceneContext) {}

  public enter(): void {
    const scene = createScene('ending-screen-scene');
    const content = document.createElement('div');
    content.className = 'ending-content';
    const heading = document.createElement('h1');
    heading.textContent = 'END';
    const title = document.createElement('p');
    title.textContent = '『種』';
    content.append(heading, title);
    scene.append(content);
    this.context.root.append(scene);

    this.menu = new ChoiceMenu(content, this.context.input, [
      { label: 'タイトルへ戻る', action: () => void this.context.navigate('title') },
    ]);
    this.menu.focus();
  }

  public exit(): void {
    this.menu?.destroy();
    this.menu = null;
  }
}
