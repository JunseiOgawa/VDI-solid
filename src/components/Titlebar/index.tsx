import type { Component } from "solid-js";
import { createSignal, onMount, onCleanup, Show } from "solid-js";
import { getCurrentWindow } from "@tauri-apps/api/window";
import MultiMenu from "../ImageViewer/MultiMenu";
import SettingsMenu from "../SettingsMenu";
import type { GridPattern } from "../../context/AppStateContext";
import type { ThemeKey } from "../../lib/theme";

/**
 * Titlebarコンポーネントのprops
 */
interface TitlebarProps {
  /** ギャラリーサイドバーの表示状態 */
  showGallery: boolean;
  /** ギャラリーサイドバーの表示/非表示を切り替える */
  onToggleGallery: (show: boolean) => void | Promise<void>;

  // ズーム関連
  zoomScale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;

  // 画面操作
  onScreenFit: () => void;
  onRotate: () => void;

  // マルチメニュー関連
  gridPattern: GridPattern;
  onGridPatternChange: (pattern: GridPattern) => void;
  gridOpacity: number;
  onGridOpacityChange: (opacity: number) => void;
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

  // 設定関連
  theme: ThemeKey;
  onThemeChange: (theme: ThemeKey) => void;
  wheelSensitivity: number;
  onWheelSensitivityChange: (sensitivity: number) => void;
  showFullPath: boolean;
  onShowFullPathChange: (show: boolean) => void;
  controlPanelPosition: "top" | "bottom";
  onControlPanelPositionChange: (position: "top" | "bottom") => void;
}

/**
 * 統合されたTitlebarコンポーネント
 * ドラッグ領域、ウィンドウコントロールボタン、ギャラリー展開ボタン、
 * そしてFloatingControlPanelの全機能（ズーム、回転、マルチメニュー、設定）を提供
 */
const Titlebar: Component<TitlebarProps> = (props) => {
  const [showMultiMenu, setShowMultiMenu] = createSignal(false);
  const [showSettings, setShowSettings] = createSignal(false);

  const windowButtonClasses =
    "no-drag flex h-6 w-6 items-center justify-center rounded-md text-[var(--glass-text-secondary)] transition-all duration-200 hover:bg-white/[0.15] hover:backdrop-blur-md hover:scale-105 active:scale-98";

  const controlButtonClasses =
    "no-drag flex h-7 w-7 items-center justify-center rounded-md bg-transparent border border-transparent transition-all duration-200 cursor-pointer text-[var(--glass-text-primary)] hover:bg-white/[0.15] hover:backdrop-blur-md hover:border-white/[0.1] hover:scale-105 active:scale-98";

  const handleMinimize = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.minimize();
  };

  const handleMaximize = async () => {
    const appWindow = getCurrentWindow();
    const isMaximized = await appWindow.isMaximized();
    if (isMaximized) {
      await appWindow.unmaximize();
    } else {
      await appWindow.maximize();
    }
  };

  const handleClose = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.close();
  };

  /**
   * マルチメニューの表示切り替え
   */
  const toggleMultiMenu = () => {
    setShowMultiMenu(!showMultiMenu());
    // 設定メニューは閉じる
    if (showSettings()) {
      setShowSettings(false);
    }
  };

  /**
   * 設定メニューの表示切り替え
   */
  const toggleSettings = () => {
    setShowSettings(!showSettings());
    // マルチメニューは閉じる
    if (showMultiMenu()) {
      setShowMultiMenu(false);
    }
  };

  /**
   * メニュー外クリック時に全メニューを閉じる処理
   */
  onMount(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // タイトルバー、メニューボタン、メニュー内のクリックは無視
      if (
        target.closest("#titlebar") ||
        target.closest('[data-menu="multi"]') ||
        target.closest('[data-menu="settings"]')
      ) {
        return;
      }

      // メニュー外のクリックは全メニューを閉じる
      setShowMultiMenu(false);
      setShowSettings(false);
    };

    document.addEventListener("click", handleClickOutside);

    onCleanup(() => {
      document.removeEventListener("click", handleClickOutside);
    });
  });

  // グリッド、ピーキング、ヒストグラムのいずれかが有効かチェック
  const isAnyFeatureActive = () =>
    props.gridPattern !== "off" ||
    props.peakingEnabled ||
    props.histogramEnabled;

  return (
    <>
      <div
        id="titlebar"
        class="drag-region relative flex h-10 items-center justify-between border-b border-white/20 dark:border-white/10 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md px-2 text-sm text-[var(--glass-text-primary)] transition-colors duration-300"
        data-tauri-drag-region
      >
        {/* 左側: ギャラリー展開ボタン */}
        <div class="flex items-center gap-1">
          <button
            id="galleryBtn"
            class={windowButtonClasses}
            onClick={() => props.onToggleGallery(!props.showGallery)}
            aria-label="ギャラリー表示"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 6h18M3 12h18M3 18h18"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>

        {/* 中央右寄り: コントロールボタン群 */}
        <div class="flex items-center gap-1 mr-2">
          {/* ズームアウト */}
          <button
            class={controlButtonClasses}
            onClick={props.onZoomOut}
            aria-label="ズームアウト"
            title="ズームアウト"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 12h14"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </button>

          {/* 倍率表示(クリックでリセット) */}
          <button
            class={`${controlButtonClasses} min-w-[3rem]`}
            onClick={props.onZoomReset}
            aria-label="ズームリセット"
            title="ズームリセット"
          >
            <span class="text-xs font-medium text-tabular">
              {Math.round(props.zoomScale * 100)}%
            </span>
          </button>

          {/* ズームイン */}
          <button
            class={controlButtonClasses}
            onClick={props.onZoomIn}
            aria-label="ズームイン"
            title="ズームイン"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </button>

          {/* 画面フィットボタン */}
          <button
            class={controlButtonClasses}
            onClick={props.onScreenFit}
            aria-label="画面にフィット"
            title="画面にフィット"
          >
            <img
              class="h-4 w-4 opacity-90 dark:brightness-0 dark:invert"
              src="/全画面表示ボタン5.svg"
              alt="画面フィット"
            />
          </button>

          {/* 回転ボタン */}
          <button
            class={controlButtonClasses}
            onClick={props.onRotate}
            aria-label="回転"
            title="回転"
          >
            <img
              class="h-4 w-4 opacity-90 dark:brightness-0 dark:invert"
              src="/reload_hoso.svg"
              alt="回転"
            />
          </button>

          {/* マルチメニューボタン */}
          <button
            class={controlButtonClasses}
            classList={{
              "bg-white/20 border-white/30 dark:bg-white/10":
                isAnyFeatureActive(),
            }}
            onClick={toggleMultiMenu}
            aria-label="表示機能メニュー"
            title="表示機能メニュー"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 2h12v12H2V2z"
                stroke="currentColor"
                stroke-width="1.5"
                fill="none"
              />
              <path
                d="M2 6.5h12M2 10.5h12M6.5 2v12M10.5 2v12"
                stroke="currentColor"
                stroke-width="1"
              />
            </svg>
          </button>

          {/* 設定ボタン */}
          <button
            class={controlButtonClasses}
            onClick={toggleSettings}
            aria-label="設定"
            title="設定"
          >
            <img
              class="h-4 w-4 opacity-90 dark:brightness-0 dark:invert"
              src="/setting_ge_h.svg"
              alt="設定"
            />
          </button>
        </div>

        {/* 右側: ウィンドウコントロールボタン */}
        <div class="flex items-center gap-1">
          <button
            id="minimizeBtn"
            class={windowButtonClasses}
            onClick={handleMinimize}
            aria-label="最小化"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 1 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M2 7h8v1H2V7z" fill="currentColor" />
            </svg>
          </button>
          <button
            id="maximizeBtn"
            class={windowButtonClasses}
            onClick={handleMaximize}
            aria-label="最大化"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M2 2v8h8V2H2zm1 1h6v6H3V3z" fill="currentColor" />
            </svg>
          </button>
          <button
            id="closeBtn"
            class="no-drag flex h-6 w-6 items-center justify-center rounded-md text-[var(--glass-text-secondary)] transition-all duration-200 hover:bg-red-500/90 hover:text-white hover:scale-105 active:scale-98"
            onClick={handleClose}
            aria-label="閉じる"
          >
            <svg
              width="12"
              height="20"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.5 2.5l7 7M9.5 2.5l-7 7"
                stroke="currentColor"
                stroke-width="1"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* MultiMenu - Titlebarの下に表示 */}
      <Show when={showMultiMenu()}>
        <div
          class="absolute top-10 left-1/2 -translate-x-1/2 z-50 mt-2"
          data-menu="multi"
        >
          <MultiMenu
            gridPattern={props.gridPattern}
            onGridPatternChange={props.onGridPatternChange}
            gridOpacity={props.gridOpacity}
            onGridOpacityChange={props.onGridOpacityChange}
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
      </Show>

      {/* SettingsMenu - Titlebarの下に表示 */}
      <Show when={showSettings()}>
        <div
          class="absolute top-10 left-1/2 -translate-x-1/2 z-50 mt-2"
          data-menu="settings"
        >
          <SettingsMenu
            theme={props.theme}
            onThemeChange={(newTheme) => {
              props.onThemeChange(newTheme);
              setShowSettings(false);
            }}
            wheelSensitivity={props.wheelSensitivity}
            onWheelSensitivityChange={props.onWheelSensitivityChange}
            showFullPath={props.showFullPath}
            onShowFullPathChange={props.onShowFullPathChange}
            controlPanelPosition={props.controlPanelPosition}
            onControlPanelPositionChange={props.onControlPanelPositionChange}
          />
        </div>
      </Show>
    </>
  );
};

export default Titlebar;
