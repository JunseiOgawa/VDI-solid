import type { Component } from 'solid-js';
import { createSignal, For } from 'solid-js';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { AVAILABLE_THEMES, type ThemeKey } from '../../lib/theme';

interface SettingsMenuProps {
  theme: ThemeKey;
  onThemeChange: (theme: ThemeKey) => void;
  currentImagePath?: string;
  // ピーキング設定
  peakingEnabled: boolean;
  onPeakingEnabledChange: (enabled: boolean) => void;
  peakingIntensity: number;
  onPeakingIntensityChange: (intensity: number) => void;
  peakingColor: string;
  onPeakingColorChange: (color: string) => void;
  peakingOpacity: number;
  onPeakingOpacityChange: (opacity: number) => void;
}

const SettingsMenu: Component<SettingsMenuProps> = (props) => {
  const [showThemeSubmenu, setShowThemeSubmenu] = createSignal(false);
  const [showPeakingSubmenu, setShowPeakingSubmenu] = createSignal(false);

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

  const togglePeakingSubmenu = () => {
    setShowPeakingSubmenu(!showPeakingSubmenu());
  };

  // 色プリセット
  const colorPresets = [
    { name: 'ライム', value: 'lime' },
    { name: 'レッド', value: 'red' },
    { name: 'シアン', value: 'cyan' },
    { name: 'イエロー', value: 'yellow' },
    { name: 'マゼンタ', value: 'magenta' },
  ];

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

        {/* フォーカスピーキング設定 */}
        <button
          class="flex w-full items-center justify-between px-3 py-2 text-left transition-colors duration-150 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
          onClick={togglePeakingSubmenu}
        >
          <span>フォーカスピーキング</span>
          <span class="text-xs text-[var(--text-muted)]">{showPeakingSubmenu() ? '▾' : '▸'}</span>
        </button>

        {/* サブメニュー: ピーキング設定 */}
        {showPeakingSubmenu() && (
          <div class="ml-3 mt-1 space-y-3 px-3 py-2">
            {/* ON/OFF */}
            <label class="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={props.peakingEnabled}
                onChange={(e) => props.onPeakingEnabledChange(e.currentTarget.checked)}
                class="h-4 w-4 cursor-pointer"
              />
              <span>有効化</span>
            </label>

            {/* 強度スライダー */}
            <div class="space-y-1">
              <div class="flex justify-between text-xs">
                <span>強度</span>
                <span class="text-[var(--text-muted)]">{props.peakingIntensity}</span>
              </div>
              <input
                type="range"
                min="0"
                max="255"
                step="5"
                value={props.peakingIntensity}
                onInput={(e) => props.onPeakingIntensityChange(Number(e.currentTarget.value))}
                class="w-full"
                disabled={!props.peakingEnabled}
              />
            </div>

            {/* 色選択 */}
            <div class="space-y-1">
              <span class="text-xs">色</span>
              <div class="flex gap-2">
                <For each={colorPresets}>
                  {(preset) => (
                    <button
                      type="button"
                      class="h-6 w-6 rounded border-2 transition-all"
                      style={{
                        'background-color': preset.value,
                        'border-color': props.peakingColor === preset.value ? 'var(--text-primary)' : 'transparent',
                      }}
                      title={preset.name}
                      onClick={() => props.onPeakingColorChange(preset.value)}
                      disabled={!props.peakingEnabled}
                    />
                  )}
                </For>
              </div>
            </div>

            {/* 不透明度スライダー */}
            <div class="space-y-1">
              <div class="flex justify-between text-xs">
                <span>不透明度</span>
                <span class="text-[var(--text-muted)]">{(props.peakingOpacity * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={props.peakingOpacity}
                onInput={(e) => props.onPeakingOpacityChange(Number(e.currentTarget.value))}
                class="w-full"
                disabled={!props.peakingEnabled}
              />
            </div>
          </div>
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
