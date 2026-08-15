import type { SettingsManager } from './SettingsManager';

export type SoundId =
  | 'seed-drop'
  | 'soccer-kick'
  | 'soccer-goal'
  | 'comparison-add'
  | 'choice-click'
  | 'applause'
  | 'tennis-hit'
  | 'tennis-miss'
  | 'school-murmur'
  | 'dish'
  | 'family-table'
  | 'room-tone'
  | 'school-morning'
  | 'alarm'
  | 'hallway'
  | 'empty-room'
  | 'city-ambience'
  | 'apartment-tone'
  | 'campus-ambience'
  | 'distant-campus';

export class AudioManager {
  private readonly sources = new Map<SoundId, string>();
  private readonly loops = new Map<SoundId, HTMLAudioElement>();

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

  public setLoopLevel(id: SoundId, level: number): void {
    const source = this.sources.get(id);
    if (!source) return;
    const normalized = Math.min(1, Math.max(0, level));
    let audio = this.loops.get(id);
    if (!audio) {
      audio = new Audio(source);
      audio.loop = true;
      this.loops.set(id, audio);
    }
    audio.volume = normalized * this.settings.get().seVolume;
    if (normalized === 0) {
      audio.pause();
      return;
    }
    if (audio.paused) {
      void audio.play().catch(() => {
        // 音源や再生許可がなくても、視覚表現だけで場面は成立する。
      });
    }
  }

  public stopLoop(id: SoundId): void {
    const audio = this.loops.get(id);
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    this.loops.delete(id);
  }
}
