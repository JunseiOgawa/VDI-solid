import type { Component } from "solid-js";
import { createSignal, For, onCleanup } from "solid-js";
import { useAppState } from "../../context/AppStateContext";

interface PeakingMenuContentProps {
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
const COLOR_PRESETS: Array<{ nameKey: string; value: string }> = [
  { nameKey: "colorLime", value: "lime" },
  { nameKey: "colorRed", value: "red" },
  { nameKey: "colorCyan", value: "cyan" },
  { nameKey: "colorYellow", value: "yellow" },
  { nameKey: "colorMagenta", value: "magenta" },
];

/**
 * PeakingMenuContent コンポーネント
 *
 * フォーカスピーキング設定を行うためのコンテンツ部分。
 * MultiMenuコンポーネント内で使用されます。
 *
 * 設定項目：
 * - ON/OFF切り替え
 * - 強度調整 (0-255、ステップ5)
 * - 色選択 (5色のプリセット)
 * - 不透明度調整 (0-1、ステップ0.05)
 * - 点滅ON/OFF
 */
const PeakingMenuContent: Component<PeakingMenuContentProps> = (props) => {
  const { t } = useAppState();
  // 一時表示用のSignal（リアルタイム表示用）
  const [tempIntensity, setTempIntensity] = createSignal(
    props.peakingIntensity,
  );
  const [tempOpacity, setTempOpacity] = createSignal(props.peakingOpacity);

  // デバウンスユーティリティ関数
  function createDebounce<T extends (...args: any[]) => void>(
    fn: T,
    delay: number,
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
      console.log(
        `[PeakingMenuContent Debounce] Intensity changed to ${value}`,
      );
      props.onPeakingIntensityChange(value);
    },
    500,
  );

  const [debouncedOpacityChange, cleanupOpacity] = createDebounce(
    (value: number) => {
      console.log(`[PeakingMenuContent Debounce] Opacity changed to ${value}`);
      props.onPeakingOpacityChange(value);
    },
    500,
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
    <div class="space-y-3 px-4 py-3">
      {/* ON/OFF切り替え */}
      <label class="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={props.peakingEnabled}
          onChange={handleEnabledToggle}
          class="h-4 w-4 cursor-pointer accent-white/80"
        />
        <span class="text-label text-[var(--glass-text-primary)]">
          {t("peaking.enable")}
        </span>
      </label>

      {/* 強度スライダー */}
      <div class="space-y-1">
        <div class="flex justify-between text-label">
          <span class="text-[var(--glass-text-primary)]">
            {t("peaking.intensity")}
          </span>
          <span class="text-[var(--glass-text-secondary)] text-tabular">
            {tempIntensity()}
          </span>
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
        <span class="text-label text-[var(--glass-text-primary)]">
          {t("peaking.color")}
        </span>
        <div class="flex gap-2">
          <For each={COLOR_PRESETS}>
            {(preset) => (
              <button
                type="button"
                class="h-6 w-6 rounded border-2 transition-all duration-200"
                style={{
                  "background-color": preset.value,
                  "border-color":
                    props.peakingColor === preset.value
                      ? "rgba(255, 255, 255, 0.9)"
                      : "transparent",
                }}
                title={t(`peaking.${preset.nameKey}`)}
                onClick={() => handleColorSelect(preset.value)}
                disabled={!props.peakingEnabled}
                aria-label={t(`peaking.${preset.nameKey}`)}
              />
            )}
          </For>
        </div>
      </div>

      {/* 不透明度スライダー */}
      <div class="space-y-1">
        <div class="flex justify-between text-label">
          <span class="text-[var(--glass-text-primary)]">
            {t("peaking.opacity")}
          </span>
          <span class="text-[var(--glass-text-secondary)] text-tabular">
            {Math.round(tempOpacity() * 100)}%
          </span>
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
        <span class="text-label text-[var(--glass-text-primary)]">
          {t("peaking.blink")}
        </span>
      </label>
    </div>
  );
};

export default PeakingMenuContent;
