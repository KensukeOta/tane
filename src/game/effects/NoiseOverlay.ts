import type { SettingsManager } from '../SettingsManager';

const FRAGMENTS = ['見られる', '比べられる', '弟の兄'] as const;

export class NoiseOverlay {
  private readonly element: HTMLElement;
  private readonly fragment: HTMLElement;
  private intensity = 0;

  public constructor(
    private readonly parent: HTMLElement,
    settings: SettingsManager,
  ) {
    this.element = document.createElement('div');
    this.element.className = 'distress-overlay';
    this.element.classList.toggle('noise-enabled', settings.get().noiseEffects);
    this.element.setAttribute('aria-hidden', 'true');
    this.fragment = document.createElement('span');
    this.fragment.className = 'distress-fragment';
    this.element.append(this.fragment);
    parent.append(this.element);
    this.setIntensity(0);
  }

  public setIntensity(value: number): void {
    this.intensity = Math.min(1, Math.max(0, value));
    this.element.style.setProperty('--distress', this.intensity.toFixed(3));
    this.parent.style.setProperty('--distress', this.intensity.toFixed(3));
    this.parent.style.setProperty('--distress-dim', (this.intensity * 0.16).toFixed(3));
    const fragmentIndex = Math.min(
      FRAGMENTS.length - 1,
      Math.max(0, Math.floor(this.intensity * FRAGMENTS.length)),
    );
    this.fragment.textContent = this.intensity >= 0.34 ? FRAGMENTS[fragmentIndex] : '';
    this.element.classList.toggle('is-active', this.intensity >= 0.16);
  }

  public getIntensity(): number {
    return this.intensity;
  }

  public destroy(): void {
    this.parent.style.removeProperty('--distress');
    this.parent.style.removeProperty('--distress-dim');
    this.element.remove();
  }
}
