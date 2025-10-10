import type { Component } from 'solid-js';
import { createSignal, For } from 'solid-js';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { AVAILABLE_THEMES, type ThemeKey } from '../../lib/theme';
import { CONFIG } from '../../config/config';

interface SettingsMenuProps {
  theme: ThemeKey;
  onThemeChange: (theme: ThemeKey) => void;
  currentImagePath?: string;
  wheelSensitivity: number;
  onWheelSensitivityChange: (sensitivity: number) => void;
  histogramEnabled: boolean;
  onHistogramEnabledChange: (enabled: boolean) => void;
  histogramDisplayType: 'rgb' | 'luminance';
  onHistogramDisplayTypeChange: (type: 'rgb' | 'luminance') => void;
  histogramPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  onHistogramPositionChange: (position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left') => void;
  histogramSize: number;
  onHistogramSizeChange: (size: number) => void;
  histogramOpacity: number;
  onHistogramOpacityChange: (opacity: number) => void;
}

const SettingsMenu: Component<SettingsMenuProps> = (props) => {
  const [showThemeSubmenu, setShowThemeSubmenu] = createSignal(false);

  const handleRevealInExplorer = async () => {
    if (props.currentImagePath) {
      try {
        await revealItemInDir(props.currentImagePath);
      } catch (error) {
        console.error('Failed to open in explorer:', error);
      }
    }
  };

  const toggleThemeSubmenu = () => {
    setShowThemeSubmenu(!showThemeSubmenu());
  };

  const handleWheelSensitivityChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    props.onWheelSensitivityChange(parseFloat(target.value));
  };

  const handleHistogramEnabledChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    props.onHistogramEnabledChange(target.checked);
  };

  const handleHistogramDisplayTypeChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    props.onHistogramDisplayTypeChange(target.value as 'rgb' | 'luminance');
  };

  const handleHistogramPositionChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    props.onHistogramPositionChange(target.value as 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left');
  };

  const handleHistogramSizeChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    props.onHistogramSizeChange(parseFloat(target.value));
  };

  const handleHistogramOpacityChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    props.onHistogramOpacityChange(parseFloat(target.value));
  };

  return (
    <div class="min-w-[160px] rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-1 text-sm text-[var(--text-secondary)] shadow-[0_4px_12px_var(--shadow)] transition-colors duration-150">
      <div class="py-1">
        {/* テーマ設定 */}
        <button
          class="flex w-full items-center justify-between px-3 py-2 text-left transition-colors duration-150 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
          onClick={toggleThemeSubmenu}
        >
          <span>テーマ設定</span>
          <span class="text-xs text-[var(--text-muted)]">{showThemeSubmenu() ? '▾' : '▸'}</span>
        </button>

        {/* サブメニュー: テーマ選択 */}
        {showThemeSubmenu() && (
          <div class="ml-3 mt-1">
            <For each={AVAILABLE_THEMES}>
              {(themeDef) => (
                <button
                  type="button"
                  class="aria-[checked=true]:bg-[var(--bg-tertiary)] aria-[checked=true]:text-[var(--text-primary)] w-full px-3 py-2 text-left transition-colors duration-150 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                  role="menuitemradio"
                  aria-checked={props.theme === themeDef.key}
                  onClick={() => props.onThemeChange(themeDef.key)}
                >
                  <div class="flex flex-col gap-0.5">
                    <span class="font-medium">
                      {themeDef.label} {props.theme === themeDef.key ? '✓' : ''}
                    </span>
                    <span class="text-xs text-[var(--text-muted)]">
                      {themeDef.description}
                    </span>
                  </div>
                </button>
              )}
            </For>
          </div>
        )}

        <hr class="my-1 border-t border-[var(--border-primary)]" />

        {/* ホイール感度設定 */}
        <div class="px-3 py-2">
          <label class="flex flex-col gap-2">
            <span class="text-xs font-medium text-[var(--text-primary)]">
              ホイール感度: {props.wheelSensitivity.toFixed(1)}x
            </span>
            <input
              type="range"
              min={CONFIG.zoom.minWheelSensitivity}
              max={CONFIG.zoom.maxWheelSensitivity}
              step="0.01"
              value={props.wheelSensitivity}
              onInput={handleWheelSensitivityChange}
              class="w-full cursor-pointer accent-[var(--accent-primary)]"
            />
            <span class="text-xs text-[var(--text-muted)]">
              VRコントローラー使用時は低めに設定推奨
            </span>
          </label>
        </div>

        <hr class="my-1 border-t border-[var(--border-primary)]" />

        {/* ヒストグラム設定 */}
        <div class="px-3 py-2">
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.histogramEnabled}
              onChange={handleHistogramEnabledChange}
              class="cursor-pointer accent-[var(--accent-primary)]"
            />
            <span class="text-xs font-medium text-[var(--text-primary)]">
              ヒストグラム表示
            </span>
          </label>
        </div>

        {/* ヒストグラム詳細設定（有効時のみ表示） */}
        {props.histogramEnabled && (
          <>
            <div class="px-3 py-2">
              <label class="flex flex-col gap-2">
                <span class="text-xs font-medium text-[var(--text-primary)]">
                  表示タイプ
                </span>
                <select
                  value={props.histogramDisplayType}
                  onChange={handleHistogramDisplayTypeChange}
                  class="cursor-pointer rounded border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-2 py-1 text-xs text-[var(--text-primary)]"
                >
                  <option value="rgb">RGB別</option>
                  <option value="luminance">輝度のみ</option>
                </select>
              </label>
            </div>

            <div class="px-3 py-2">
              <label class="flex flex-col gap-2">
                <span class="text-xs font-medium text-[var(--text-primary)]">
                  表示位置
                </span>
                <select
                  value={props.histogramPosition}
                  onChange={handleHistogramPositionChange}
                  class="cursor-pointer rounded border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-2 py-1 text-xs text-[var(--text-primary)]"
                >
                  <option value="top-right">右上</option>
                  <option value="top-left">左上</option>
                  <option value="bottom-right">右下</option>
                  <option value="bottom-left">左下</option>
                </select>
              </label>
            </div>

            <div class="px-3 py-2">
              <label class="flex flex-col gap-2">
                <span class="text-xs font-medium text-[var(--text-primary)]">
                  サイズ: {props.histogramSize.toFixed(1)}x
                </span>
                <input
                  type="range"
                  min={CONFIG.histogram.minSize}
                  max={CONFIG.histogram.maxSize}
                  step="0.1"
                  value={props.histogramSize}
                  onInput={handleHistogramSizeChange}
                  class="w-full cursor-pointer accent-[var(--accent-primary)]"
                />
              </label>
            </div>

            <div class="px-3 py-2">
              <label class="flex flex-col gap-2">
                <span class="text-xs font-medium text-[var(--text-primary)]">
                  不透明度: {(props.histogramOpacity * 100).toFixed(0)}%
                </span>
                <input
                  type="range"
                  min={CONFIG.histogram.minOpacity}
                  max={CONFIG.histogram.maxOpacity}
                  step="0.01"
                  value={props.histogramOpacity}
                  onInput={handleHistogramOpacityChange}
                  class="w-full cursor-pointer accent-[var(--accent-primary)]"
                />
              </label>
            </div>
          </>
        )}

        <hr class="my-1 border-t border-[var(--border-primary)]" />

        {/* エクスプローラで開く */}
        <button
          class="w-full px-3 py-2 text-left transition-colors duration-150 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
          onClick={handleRevealInExplorer}
        >
          エクスプローラで開く
        </button>
      </div>
    </div>
  );
};

export default SettingsMenu;
