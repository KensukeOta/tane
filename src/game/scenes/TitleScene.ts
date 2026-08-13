import type { Scene, SceneContext } from '../types';
import { ChoiceMenu } from '../ui/ChoiceMenu';
import { SettingsMenu } from '../ui/SettingsMenu';
import { createScene } from './sceneUtils';

export class TitleScene implements Scene {
  private choiceMenu: ChoiceMenu | null = null;
  private settingsMenu: SettingsMenu | null = null;

  public constructor(private readonly context: SceneContext) {}

  public enter(): void {
    const scene = createScene('title-scene');
    const content = document.createElement('div');
    content.className = 'title-content';
    const title = document.createElement('h1');
    title.className = 'game-title';
    title.textContent = '種';
    const subtitle = document.createElement('p');
    subtitle.className = 'title-subtitle';
    subtitle.textContent = 'たね';
    content.append(title, subtitle);
    scene.append(content);
    this.context.root.append(scene);

    this.choiceMenu = new ChoiceMenu(content, this.context.input, [
      {
        label: 'はじめから',
        action: () => {
          this.context.resetState();
          void this.context.navigate('content-note');
        },
      },
      {
        label: 'つづきから',
        disabled: !this.context.save.hasSave(),
        action: () => {
          const saved = this.context.save.load();
          if (!saved) return;
          Object.assign(this.context.getState(), saved);
          const resumableScenes = new Set(['chapter1-start', 'chapter2-start', 'chapter3-start']);
          void this.context.navigate(resumableScenes.has(saved.sceneId) ? saved.sceneId : 'title');
        },
      },
      {
        label: '設定',
        action: () => this.openSettings(scene),
      },
    ]);
    this.choiceMenu.focus();
  }

  public exit(): void {
    this.settingsMenu?.destroy();
    this.choiceMenu?.destroy();
    this.settingsMenu = null;
    this.choiceMenu = null;
  }

  private openSettings(scene: HTMLElement): void {
    if (this.settingsMenu) return;
    this.choiceMenu?.setEnabled(false);
    this.settingsMenu = new SettingsMenu(
      scene,
      this.context.input,
      this.context.settings,
      () => {
        this.settingsMenu?.destroy();
        this.settingsMenu = null;
        this.choiceMenu?.setEnabled(true);
        this.choiceMenu?.focus();
      },
    );
  }
}
