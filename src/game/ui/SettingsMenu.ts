import type { InputManager } from '../InputManager';
import type { SettingsManager } from '../SettingsManager';

export class SettingsMenu {
  private readonly overlay: HTMLElement;
  private readonly unsubscribeEscape: () => void;

  public constructor(
    parent: HTMLElement,
    input: InputManager,
    private readonly settings: SettingsManager,
    private readonly onClose: () => void,
  ) {
    this.overlay = document.createElement('div');
    this.overlay.className = 'settings-overlay';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.overlay.setAttribute('aria-labelledby', 'settings-title');

    const panel = document.createElement('section');
    panel.className = 'settings-panel';
    const title = document.createElement('h2');
    title.id = 'settings-title';
    title.textContent = '設定';
    panel.append(title);

    panel.append(
      this.createRange('BGM音量', 'bgm-volume', this.settings.get().bgmVolume, (value) => {
        this.settings.update({ bgmVolume: value });
      }),
      this.createRange('SE音量', 'se-volume', this.settings.get().seVolume, (value) => {
        this.settings.update({ seVolume: value });
      }),
      this.createSpeedSelect(),
      this.createToggle('画面揺れ', 'screen-shake', this.settings.get().screenShake, (checked) => {
        this.settings.update({ screenShake: checked });
      }),
      this.createToggle('ノイズ演出', 'noise-effects', this.settings.get().noiseEffects, (checked) => {
        this.settings.update({ noiseEffects: checked });
      }),
    );

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'choice-button settings-close';
    closeButton.textContent = '閉じる';
    closeButton.addEventListener('click', this.close);
    panel.append(closeButton);
    this.overlay.append(panel);
    parent.append(this.overlay);
    this.unsubscribeEscape = input.onPress('escape', this.close);
    closeButton.focus({ preventScroll: true });
  }

  public destroy(): void {
    this.unsubscribeEscape();
    this.overlay.remove();
  }

  private readonly close = (): void => {
    this.onClose();
  };

  private createRange(
    labelText: string,
    id: string,
    value: number,
    onInput: (value: number) => void,
  ): HTMLElement {
    const row = this.createRow(labelText, id);
    const input = document.createElement('input');
    input.id = id;
    input.type = 'range';
    input.min = '0';
    input.max = '1';
    input.step = '0.05';
    input.value = String(value);
    input.addEventListener('input', () => onInput(Number(input.value)));
    row.append(input);
    return row;
  }

  private createSpeedSelect(): HTMLElement {
    const row = this.createRow('文字送り速度', 'text-speed');
    const select = document.createElement('select');
    select.id = 'text-speed';
    const speeds = [
      { label: '速い', value: 22 },
      { label: '標準', value: 42 },
      { label: 'ゆっくり', value: 70 },
    ];
    speeds.forEach(({ label, value }) => {
      const option = document.createElement('option');
      option.value = String(value);
      option.textContent = label;
      option.selected = Math.abs(this.settings.get().textSpeed - value) < 12;
      select.append(option);
    });
    select.addEventListener('change', () => this.settings.update({ textSpeed: Number(select.value) }));
    row.append(select);
    return row;
  }

  private createToggle(
    labelText: string,
    id: string,
    checked: boolean,
    onChange: (checked: boolean) => void,
  ): HTMLElement {
    const row = this.createRow(labelText, id);
    const input = document.createElement('input');
    input.id = id;
    input.type = 'checkbox';
    input.checked = checked;
    input.addEventListener('change', () => onChange(input.checked));
    row.append(input);
    return row;
  }

  private createRow(labelText: string, id: string): HTMLElement {
    const row = document.createElement('div');
    row.className = 'settings-row';
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = labelText;
    row.append(label);
    return row;
  }
}
