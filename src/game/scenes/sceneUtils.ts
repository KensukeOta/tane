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
