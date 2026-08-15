import { RootSystem } from '../../systems/RootSystem';
import type { InputManager } from '../../InputManager';
import { createScene, motionDuration, wait, waitForAdvance } from '../sceneUtils';

type FinalRootRevealOptions = {
  root: HTMLElement;
  input: InputManager;
  rootSystem: RootSystem;
  signal: AbortSignal;
};

export class FinalRootReveal {
  public constructor(private readonly options: FinalRootRevealOptions) {}

  public async play(): Promise<boolean> {
    const { root, input, rootSystem, signal } = this.options;
    const darkness = createScene('final-underground-transition-scene');
    root.replaceChildren(darkness);
    if (!(await wait(motionDuration(2400, 520), signal))) return false;

    const scene = createScene('final-root-reveal-scene');
    const soil = document.createElement('div');
    soil.className = 'final-root-soil';
    const camera = document.createElement('div');
    camera.className = 'final-root-camera';
    soil.append(camera);
    scene.append(soil);
    root.replaceChildren(scene);
    rootSystem.revealFullRootSystem(camera);
    requestAnimationFrame(() => scene.classList.add('is-pulling-back'));

    if (!(await wait(motionDuration(1500, 340), signal))) return false;
    return waitForAdvance({
      input,
      target: scene,
      signal,
      milliseconds: motionDuration(6800, 1200),
    });
  }
}
