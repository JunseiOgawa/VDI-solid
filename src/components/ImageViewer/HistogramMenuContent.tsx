import type { Component } from "solid-js";
import { CONFIG } from "../../config/config";

interface HistogramMenuContentProps {
  /** ヒストグラム表示のON/OFF状態 */
  histogramEnabled: boolean;
  /** ヒストグラム表示のON/OFF状態変更時のコールバック */
  onHistogramEnabledChange: (enabled: boolean) => void;
  /** ヒストグラムの表示タイプ */
  histogramDisplayType: "rgb" | "luminance";
  /** ヒストグラムの表示タイプ変更時のコールバック */
  onHistogramDisplayTypeChange: (type: "rgb" | "luminance") => void;
  /** ヒストグラムの表示位置 */
  histogramPosition: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  /** ヒストグラムの表示位置変更時のコールバック */
  onHistogramPositionChange: (
    position: "top-right" | "top-left" | "bottom-right" | "bottom-left",
  ) => void;
  /** ヒストグラムのサイズ */
  histogramSize: number;
  /** ヒストグラムのサイズ変更時のコールバック */
  onHistogramSizeChange: (size: number) => void;
  /** ヒストグラムの不透明度 (0-1) */
  histogramOpacity: number;
  /** ヒストグラムの不透明度変更時のコールバック */
  onHistogramOpacityChange: (opacity: number) => void;
}

/**
 * HistogramMenuContent コンポーネント
 *
 * ヒストグラム表示設定を行うためのコンテンツ部分。
 * MultiMenuコンポーネント内で使用されます。
 *
 * 設定項目：
 * - ON/OFF切り替え
 * - 表示タイプ選択 (RGB別/輝度のみ)
 * - 表示位置選択 (右上/左上/右下/左下)
 * - サイズ調整
 * - 不透明度調整
 */
const HistogramMenuContent: Component<HistogramMenuContentProps> = (props) => {
  const handleEnabledChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    props.onHistogramEnabledChange(target.checked);
  };

  const handleDisplayTypeChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    props.onHistogramDisplayTypeChange(target.value as "rgb" | "luminance");
  };

  const handlePositionChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    props.onHistogramPositionChange(
      target.value as "top-right" | "top-left" | "bottom-right" | "bottom-left",
    );
  };

  const handleSizeChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    props.onHistogramSizeChange(parseFloat(target.value));
  };

  const handleOpacityChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    props.onHistogramOpacityChange(parseFloat(target.value));
  };

  return (
    <div class="space-y-3 px-4 py-3">
      {/* ON/OFF切り替え */}
      <label class="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={props.histogramEnabled}
          onChange={handleEnabledChange}
          class="h-4 w-4 cursor-pointer accent-white/80"
        />
        <span class="text-label text-[var(--glass-text-primary)]">有効化</span>
      </label>

      {/* ヒストグラム詳細設定（有効時のみ表示） */}
      {props.histogramEnabled && (
        <>
          {/* 表示タイプ選択 */}
          <div class="space-y-1">
            <label class="flex flex-col gap-2">
              <span class="text-label font-medium text-[var(--glass-text-primary)]">
                表示タイプ
              </span>
              <select
                value={props.histogramDisplayType}
                onChange={handleDisplayTypeChange}
                class="cursor-pointer rounded border border-[var(--glass-border-emphasis)] bg-white/[0.1] px-2 py-1 text-label text-[var(--glass-text-primary)] transition-colors hover:bg-white/[0.15]"
              >
                <option value="rgb">RGB別</option>
                <option value="luminance">輝度のみ</option>
              </select>
            </label>
          </div>

          {/* 表示位置選択 */}
          <div class="space-y-1">
            <label class="flex flex-col gap-2">
              <span class="text-label font-medium text-[var(--glass-text-primary)]">
                表示位置
              </span>
              <select
                value={props.histogramPosition}
                onChange={handlePositionChange}
                class="cursor-pointer rounded border border-[var(--glass-border-emphasis)] bg-white/[0.1] px-2 py-1 text-label text-[var(--glass-text-primary)] transition-colors hover:bg-white/[0.15]"
              >
                <option value="top-right">右上</option>
                <option value="top-left">左上</option>
                <option value="bottom-right">右下</option>
                <option value="bottom-left">左下</option>
              </select>
            </label>
          </div>

          {/* サイズスライダー */}
          <div class="space-y-1">
            <label class="flex flex-col gap-2">
              <span class="text-label font-medium text-[var(--glass-text-primary)] text-tabular">
                サイズ: {props.histogramSize.toFixed(1)}x
              </span>
              <input
                type="range"
                min={CONFIG.histogram.minSize}
                max={CONFIG.histogram.maxSize}
                step="0.1"
                value={props.histogramSize}
                onInput={handleSizeChange}
                class="w-full cursor-pointer accent-white/80"
              />
            </label>
          </div>

          {/* 不透明度スライダー */}
          <div class="space-y-1">
            <label class="flex flex-col gap-2">
              <span class="text-label font-medium text-[var(--glass-text-primary)] text-tabular">
                不透明度: {(props.histogramOpacity * 100).toFixed(0)}%
              </span>
              <input
                type="range"
                min={CONFIG.histogram.minOpacity}
                max={CONFIG.histogram.maxOpacity}
                step="0.01"
                value={props.histogramOpacity}
                onInput={handleOpacityChange}
                class="w-full cursor-pointer accent-white/80"
              />
            </label>
          </div>
        </>
      )}
    </div>
  );
};

export default HistogramMenuContent;
