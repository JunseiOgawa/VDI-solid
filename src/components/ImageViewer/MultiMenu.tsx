import type { Component } from "solid-js";
import { createSignal } from "solid-js";
import type { GridPattern } from "../../context/AppStateContext";
import GridMenuContent from "./GridMenuContent";
import PeakingMenuContent from "./PeakingMenuContent";
import HistogramMenuContent from "./HistogramMenuContent";

type SegmentType = "grid" | "peaking" | "histogram";

interface MultiMenuProps {
  /** グリッド設定 */
  gridPattern: GridPattern;
  onGridPatternChange: (pattern: GridPattern) => void;
  gridOpacity: number;
  onGridOpacityChange: (opacity: number) => void;

  /** フォーカスピーキング設定 */
  peakingEnabled: boolean;
  onPeakingEnabledChange: (enabled: boolean) => void;
  peakingIntensity: number;
  onPeakingIntensityChange: (intensity: number) => void;
  peakingColor: string;
  onPeakingColorChange: (color: string) => void;
  peakingOpacity: number;
  onPeakingOpacityChange: (opacity: number) => void;
  peakingBlink: boolean;
  onPeakingBlinkChange: (enabled: boolean) => void;

  /** ヒストグラム設定 */
  histogramEnabled: boolean;
  onHistogramEnabledChange: (enabled: boolean) => void;
  histogramDisplayType: "rgb" | "luminance";
  onHistogramDisplayTypeChange: (type: "rgb" | "luminance") => void;
  histogramPosition: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  onHistogramPositionChange: (
    position: "top-right" | "top-left" | "bottom-right" | "bottom-left",
  ) => void;
  histogramSize: number;
  onHistogramSizeChange: (size: number) => void;
  histogramOpacity: number;
  onHistogramOpacityChange: (opacity: number) => void;

  /** メニューを閉じる時のコールバック */
  onClose?: () => void;
}

/**
 * MultiMenu コンポーネント
 *
 * グリッド、フォーカスピーキング、ヒストグラムの3つの機能を
 * セグメントコントロール（タブ風UI）で切り替えて表示する統合メニュー。
 *
 * 特徴：
 * - iOS風のセグメントコントロールUI
 * - スムーズなトランジション
 * - キーボードナビゲーション対応
 */
const MultiMenu: Component<MultiMenuProps> = (props) => {
  const [activeSegment, setActiveSegment] = createSignal<SegmentType>("grid");

  /**
   * セグメントクリック時の処理
   */
  const handleSegmentClick = (segment: SegmentType) => {
    setActiveSegment(segment);
  };

  /**
   * セグメントボタンの共通クラス
   */
  const segmentButtonClass = (segment: SegmentType) => {
    const isActive = activeSegment() === segment;
    return `relative flex-1 px-4 py-2 text-sm font-medium transition-all duration-200 ease-out ${
      isActive
        ? "text-[var(--accent-primary)]"
        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
    }`;
  };


  return (
    <>
    <div
      class="min-w-[280px] rounded-lg glass-menu shadow-lg"
      data-menu="multi"
    >
      {/* セグメントコントロール */}
      <div class="relative flex border-b border-[var(--border-secondary)]">
        {/* グリッドセグメント */}
        <button
          type="button"
          class={segmentButtonClass("grid")}
          onClick={() => handleSegmentClick("grid")}
          aria-label="グリッド設定"
          aria-selected={activeSegment() === "grid"}
        >
          <span>グリッド</span>
        </button>

        {/* セグメント区切り線 */}
        <div class="w-px bg-[var(--border-secondary)]" />

        {/* ピーキングセグメント */}
        <button
          type="button"
          class={segmentButtonClass("peaking")}
          onClick={() => handleSegmentClick("peaking")}
          aria-label="フォーカスピーキング設定"
          aria-selected={activeSegment() === "peaking"}
        >
          <span>ピーキング</span>
        </button>

        {/* セグメント区切り線 */}
        <div class="w-px bg-[var(--border-secondary)]" />

        {/* ヒストグラムセグメント */}
        <button
          type="button"
          class={segmentButtonClass("histogram")}
          onClick={() => handleSegmentClick("histogram")}
          aria-label="ヒストグラム設定"
          aria-selected={activeSegment() === "histogram"}
        >
          <span>ヒストグラム</span>
        </button>

        {/* アクティブセグメントの下線 */}
        <div
          class="absolute bottom-0 h-0.5 bg-[var(--accent-primary)] transition-all duration-200 ease-out"
          style={{
            width: "33.333%",
            left:
              activeSegment() === "grid"
                ? "0%"
                : activeSegment() === "peaking"
                  ? "33.333%"
                  : "66.666%",
          }}
        />
      </div>

      {/* コンテンツエリア */}
      <div class="overflow-hidden">
        <div
          class="flex transition-transform duration-200 ease-out"
          style={{
            transform:
              activeSegment() === "grid"
                ? "translateX(0%)"
                : activeSegment() === "peaking"
                  ? "translateX(-33.333%)"
                  : "translateX(-66.666%)",
            width: "300%",
          }}
        >
          {/* グリッドコンテンツ */}
          <div class="w-full" style={{ width: "33.333%" }}>
            <GridMenuContent
              currentPattern={props.gridPattern}
              onPatternChange={props.onGridPatternChange}
              currentOpacity={props.gridOpacity}
              onOpacityChange={props.onGridOpacityChange}
            />
          </div>

          {/* ピーキングコンテンツ */}
          <div class="w-full" style={{ width: "33.333%" }}>
            <PeakingMenuContent
              peakingEnabled={props.peakingEnabled}
              onPeakingEnabledChange={props.onPeakingEnabledChange}
              peakingIntensity={props.peakingIntensity}
              onPeakingIntensityChange={props.onPeakingIntensityChange}
              peakingColor={props.peakingColor}
              onPeakingColorChange={props.onPeakingColorChange}
              peakingOpacity={props.peakingOpacity}
              onPeakingOpacityChange={props.onPeakingOpacityChange}
              peakingBlink={props.peakingBlink}
              onPeakingBlinkChange={props.onPeakingBlinkChange}
            />
          </div>

          {/* ヒストグラムコンテンツ */}
          <div class="w-full" style={{ width: "33.333%" }}>
            <HistogramMenuContent
              histogramEnabled={props.histogramEnabled}
              onHistogramEnabledChange={props.onHistogramEnabledChange}
              histogramDisplayType={props.histogramDisplayType}
              onHistogramDisplayTypeChange={props.onHistogramDisplayTypeChange}
              histogramPosition={props.histogramPosition}
              onHistogramPositionChange={props.onHistogramPositionChange}
              histogramSize={props.histogramSize}
              onHistogramSizeChange={props.onHistogramSizeChange}
              histogramOpacity={props.histogramOpacity}
              onHistogramOpacityChange={props.onHistogramOpacityChange}
            />
          </div>
        </div>
      </div>
    </div>

    <style>
      {`
        .glass-menu {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow:
            0 8px 32px 0 rgba(0, 0, 0, 0.37),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
            0 0 0 1px rgba(0, 0, 0, 0.1);
        }
      `}
    </style>
  </>
  );
};

export default MultiMenu;
