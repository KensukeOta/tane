import type { GameSettings } from './types';

const SETTINGS_KEY = 'tane-settings-v1';

export const DEFAULT_SETTINGS: GameSettings = {
  bgmVolume: 0.6,
  seVolume: 0.7,
  textSpeed: 42,
  screenShake: true,
  noiseEffects: true,
};

const asUnitNumber = (value: unknown, fallback: number): number =>
  typeof value === 'number' && value >= 0 && value <= 1 ? value : fallback;

export class SettingsManager {
  private current: GameSettings;

  public constructor() {
    this.current = this.load();
  }

  public get(): Readonly<GameSettings> {
    return this.current;
  }

  public update(patch: Partial<GameSettings>): void {
    this.current = { ...this.current, ...patch };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.current));
    } catch {
      // 保存領域が利用できない環境でも、現在のセッション内では設定を反映する。
    }
  }

  private load(): GameSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS };
      const value = JSON.parse(raw) as Partial<GameSettings>;
      return {
        bgmVolume: asUnitNumber(value.bgmVolume, DEFAULT_SETTINGS.bgmVolume),
        seVolume: asUnitNumber(value.seVolume, DEFAULT_SETTINGS.seVolume),
        textSpeed:
          typeof value.textSpeed === 'number' && value.textSpeed >= 10 && value.textSpeed <= 100
            ? value.textSpeed
            : DEFAULT_SETTINGS.textSpeed,
        screenShake:
          typeof value.screenShake === 'boolean' ? value.screenShake : DEFAULT_SETTINGS.screenShake,
        noiseEffects:
          typeof value.noiseEffects === 'boolean' ? value.noiseEffects : DEFAULT_SETTINGS.noiseEffects,
      };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }
}
