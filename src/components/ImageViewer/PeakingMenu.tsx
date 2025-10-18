import type { Component } from 'solid-js';
import { createSignal, For, onCleanup } from 'solid-js';

interface PeakingMenuProps {
  /** フォーカスピーキングのON/OFF状態 */
  peakingEnabled: boolean;
  /** フォーカスピーキングのON/OFF状態変更時のコールバック */
  onPeakingEnabledChange: (enabled: boolean) => void;
  /** フォーカスピーキングの強度 (0-255) */
  peakingIntensity: number;
  /** フォーカスピーキングの強度変更時のコールバック */
  onPeakingIntensityChange: (intensity: number) => void;
  /** フォーカスピーキングの色 */
  peakingColor: string;
  /** フォーカスピーキングの色変更時のコールバック */
  onPeakingColorChange: (color: string) => void;
  /** フォーカスピーキングの不透明度 (0-1) */
  peakingOpacity: number;
  /** フォーカスピーキングの不透明度変更時のコールバック */
  onPeakingOpacityChange: (opacity: number) => void;
  /** フォーカスピーキングの点滅ON/OFF */
  peakingBlink: boolean;
  /** フォーカスピーキングの点滅ON/OFF変更時のコールバック */
  onPeakingBlinkChange: (enabled: boolean) => void;
}

/** 色プリセット定義 */
const COLOR_PRESETS: Array<{ name: string; value: string }> = [
  { name: 'ライム', value: 'lime' },
  { name: 'レッド', value: 'red' },
  { name: 'シアン', value: 'cyan' },
  { name: 'イエロー', value: 'yellow' },
  { name: 'マゼンタ', value: 'magenta' },
];

/**
 * PeakingMenu コンポーネント
 *
 * フォーカスピーキング設定を行うためのドロップダウンメニュー。
 * Titlebar の peakingBtn から呼び出され、GridMenu と同様の UI スタイルで表示されます。
 *
 * 設定項目：
 * - ON/OFF切り替え
 * - 強度調整 (0-255、ステップ5)
 * - 色選択 (5色のプリセット)
 * - 不透明度調整 (0-1、ステップ0.05)
 * - 点滅ON/OFF
 */
const PeakingMenu: Component<PeakingMenuProps> = (props) => {
  // 一時表示用のSignal（リアルタイム表示用）
  const [tempIntensity, setTempIntensity] = createSignal(props.peakingIntensity);
  const [tempOpacity, setTempOpacity] = createSignal(props.peakingOpacity);

  // デバウンスユーティリティ関数
  function createDebounce<T extends (...args: any[]) => void>(
    fn: T,
    delay: number
  ): [(...args: Parameters<T>) => void, () => void] {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const debouncedFn = (...args: Parameters<T>) => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        fn(...args);
        timeoutId = undefined;
      }, delay);
    };

    const cleanup = () => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    };

    return [debouncedFn, cleanup];
  }

  // デバウンス処理の作成
  const [debouncedIntensityChange, cleanupIntensity] = createDebounce(
    (value: number) => {
      console.log(`[PeakingMenu Debounce] Intensity changed to ${value}`);
      props.onPeakingIntensityChange(value);
    },
    500
  );

  const [debouncedOpacityChange, cleanupOpacity] = createDebounce(
    (value: number) => {
      console.log(`[PeakingMenu Debounce] Opacity changed to ${value}`);
      props.onPeakingOpacityChange(value);
    },
    500
  );

  // クリーンアップ
  onCleanup(() => {
    cleanupIntensity();
    cleanupOpacity();
  });

  const handleEnabledToggle = (event: Event) => {
    const target = event.target as HTMLInputElement;
    props.onPeakingEnabledChange(target.checked);
  };

  const handleIntensityChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const value = Number(target.value);
    setTempIntensity(value);
    debouncedIntensityChange(value);
  };

  const handleColorSelect = (color: string) => {
    props.onPeakingColorChange(color);
  };

  const handleOpacityChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const value = Number(target.value);
    setTempOpacity(value);
    debouncedOpacityChange(value);
  };

  const handleBlinkToggle = (event: Event) => {
    const target = event.target as HTMLInputElement;
    props.onPeakingBlinkChange(target.checked);
  };

  return (
    <div
      class="min-w-[220px] rounded-lg bg-[var(--glass-bg-primary)] backdrop-blur-xl border border-[var(--glass-border-subtle)]"
      data-menu="peaking"
    >
      <div class="border-b border-[var(--glass-border-emphasis)] px-4 py-2">
        <h3 class="text-label font-semibold text-[var(--glass-text-primary)]">フォーカスピーキング</h3>
      </div>
      <div class="space-y-3 px-4 py-3">
        {/* ON/OFF切り替え */}
        <label class="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={props.peakingEnabled}
            onChange={handleEnabledToggle}
            class="h-4 w-4 cursor-pointer accent-white/80"
          />
          <span class="text-label text-[var(--glass-text-primary)]">有効化</span>
        </label>

        {/* 強度スライダー */}
        <div class="space-y-1">
          <div class="flex justify-between text-label">
            <span class="text-[var(--glass-text-primary)]">強度</span>
            <span class="text-[var(--glass-text-secondary)] text-tabular">{tempIntensity()}</span>
          </div>
          <input
            type="range"
            min="0"
            max="255"
            step="5"
            value={tempIntensity()}
            onInput={handleIntensityChange}
            class="w-full cursor-pointer accent-white/80"
            disabled={!props.peakingEnabled}
          />
        </div>

        {/* 色選択 */}
        <div class="space-y-1">
          <span class="text-label text-[var(--glass-text-primary)]">色</span>
          <div class="flex gap-2">
            <For each={COLOR_PRESETS}>
              {(preset) => (
                <button
                  type="button"
                  class="h-6 w-6 rounded border-2 transition-all duration-200"
                  style={{
                    'background-color': preset.value,
                    'border-color':
                      props.peakingColor === preset.value
                        ? 'rgba(255, 255, 255, 0.9)'
                        : 'transparent',
                  }}
                  title={preset.name}
                  onClick={() => handleColorSelect(preset.value)}
                  disabled={!props.peakingEnabled}
                  aria-label={preset.name}
                />
              )}
            </For>
          </div>
        </div>

        {/* 不透明度スライダー */}
        <div class="space-y-1">
          <div class="flex justify-between text-label">
            <span class="text-[var(--glass-text-primary)]">不透明度</span>
            <span class="text-[var(--glass-text-secondary)] text-tabular">{Math.round(tempOpacity() * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={tempOpacity()}
            onInput={handleOpacityChange}
            class="w-full cursor-pointer accent-white/80"
            disabled={!props.peakingEnabled}
          />
        </div>

        {/* 点滅ON/OFF */}
        <label class="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={props.peakingBlink}
            onChange={handleBlinkToggle}
            class="h-4 w-4 cursor-pointer accent-white/80"
            disabled={!props.peakingEnabled}
          />
          <span class="text-label text-[var(--glass-text-primary)]">ピーキング点滅</span>
        </label>
      </div>
    </div>
  );
};

export default PeakingMenu;
