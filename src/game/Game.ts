import { AudioManager } from './AudioManager';
import { InputManager } from './InputManager';
import { SaveManager } from './SaveManager';
import { SceneManager } from './SceneManager';
import { SettingsManager } from './SettingsManager';
import { Chapter1Scene } from './scenes/Chapter1Scene';
import { Chapter2PlaceholderScene } from './scenes/Chapter2PlaceholderScene';
import { ContentNoteScene } from './scenes/ContentNoteScene';
import { PrologueScene } from './scenes/PrologueScene';
import { TitleScene } from './scenes/TitleScene';
import { createInitialState, type GameState, type SceneContext } from './types';

export class Game {
  private state: GameState = createInitialState();
  private readonly input = new InputManager();
  private readonly save = new SaveManager();
  private readonly settings = new SettingsManager();
  private readonly audio = new AudioManager(this.settings);
  private readonly sceneManager: SceneManager;

  public constructor(root: HTMLElement) {
    const context: SceneContext = {
      root,
      input: this.input,
      save: this.save,
      settings: this.settings,
      audio: this.audio,
      getState: () => this.state,
      resetState: () => {
        this.state = createInitialState();
      },
      navigate: (sceneId) => this.navigate(sceneId),
    };

    this.sceneManager = new SceneManager(context);
    this.sceneManager.register('title', (sceneContext) => new TitleScene(sceneContext));
    this.sceneManager.register('content-note', (sceneContext) => new ContentNoteScene(sceneContext));
    this.sceneManager.register('prologue', (sceneContext) => new PrologueScene(sceneContext));
    this.sceneManager.register(
      'chapter1-start',
      (sceneContext) => new Chapter1Scene(sceneContext),
    );
    this.sceneManager.register(
      'chapter2-start',
      (sceneContext) => new Chapter2PlaceholderScene(sceneContext),
    );
  }

  public start(): void {
    this.sceneManager.startLoop();
    void this.navigate('title');
  }

  private async navigate(sceneId: string): Promise<void> {
    this.state.sceneId = sceneId;
    await this.sceneManager.change(sceneId);
  }
}
