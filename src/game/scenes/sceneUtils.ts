import type { InputManager } from '../InputManager';

export const createScene = (className: string): HTMLElement => {
  const scene = document.createElement('section');
  scene.className = `scene ${className}`;
  return scene;
};

export const wait = (milliseconds: number, signal: AbortSignal): Promise<boolean> =>
  new Promise((resolve) => {
    if (signal.aborted) {
      resolve(false);
      return;
    }

    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', handleAbort);
      resolve(true);
    }, milliseconds);
    const handleAbort = (): void => {
      window.clearTimeout(timer);
      resolve(false);
    };
    signal.addEventListener('abort', handleAbort, { once: true });
  });

export const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const motionDuration = (standard: number, reduced: number): number =>
  prefersReducedMotion() ? reduced : standard;

export const createChapterCard = (eyebrowText: string, titleText: string): HTMLElement => {
  const card = document.createElement('div');
  card.className = 'chapter-card';
  const eyebrow = document.createElement('p');
  eyebrow.className = 'chapter-eyebrow';
  eyebrow.textContent = eyebrowText;
  const title = document.createElement('h1');
  title.textContent = titleText;
  card.append(eyebrow, title);
  return card;
};

type AdvanceWaitOptions = {
  input: InputManager;
  target: HTMLElement;
  signal: AbortSignal;
  milliseconds: number;
};

export const waitForAdvance = ({
  input,
  target,
  signal,
  milliseconds,
}: AdvanceWaitOptions): Promise<boolean> =>
  new Promise((resolve) => {
    if (signal.aborted) {
      resolve(false);
      return;
    }

    let finished = false;
    const complete = (result: boolean): void => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timer);
      offConfirm();
      offSpace();
      target.removeEventListener('click', handleClick);
      signal.removeEventListener('abort', handleAbort);
      resolve(result);
    };
    const handleClick = (): void => complete(true);
    const handleAbort = (): void => complete(false);
    const timer = window.setTimeout(() => complete(true), milliseconds);
    const offConfirm = input.onPress('confirm', () => complete(true));
    const offSpace = input.onPress('space', () => complete(true));
    target.addEventListener('click', handleClick);
    signal.addEventListener('abort', handleAbort, { once: true });
  });

type CinematicLinesOptions = {
  root: HTMLElement;
  input: InputManager;
  signal: AbortSignal;
  lines: readonly string[];
  className: string;
  displayDuration?: number;
  gapDuration?: number;
  textClassName?: string;
};

export const showCinematicLines = async ({
  root,
  input,
  signal,
  lines,
  className,
  displayDuration = motionDuration(2100, 450),
  gapDuration = motionDuration(500, 70),
  textClassName = '',
}: CinematicLinesOptions): Promise<boolean> => {
  const scene = createScene(`chapter-cinematic-scene ${className}`);
  const text = document.createElement('p');
  text.className = `cinematic-line chapter-cinematic-line ${textClassName}`.trim();
  scene.append(text);
  root.replaceChildren(scene);

  for (const line of lines) {
    text.textContent = line;
    text.classList.add('is-visible');
    if (!(await waitForAdvance({ input, target: scene, signal, milliseconds: displayDuration }))) {
      return false;
    }
    text.classList.remove('is-visible');
    if (!(await wait(gapDuration, signal))) return false;
  }
  return true;
};
