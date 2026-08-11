import type { SettingsManager } from './SettingsManager';

type SoundId = 'seed-drop';

export class AudioManager {
  private readonly sources = new Map<SoundId, string>();

  public constructor(private readonly settings: SettingsManager) {}

  public register(id: SoundId, source: string): void {
    this.sources.set(id, source);
  }

  public playSE(id: SoundId): void {
    const source = this.sources.get(id);
    if (!source) return;

    const audio = new Audio(source);
    audio.volume = this.settings.get().seVolume;
    void audio.play().catch(() => {
      // Browserの自動再生制限や未配置素材は、物語進行を止める理由にしない。
    });
  }
}
