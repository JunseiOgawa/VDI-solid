import type { Component } from "solid-js";
import {
  createSignal,
  onMount,
  onCleanup,
  Show,
  lazy,
  Suspense,
} from "solid-js";
import { getCurrentWindow } from "@tauri-apps/api/window";
import MultiMenu from "../ImageViewer/MultiMenu";
import type {
  GridPattern,
  LutHistoryEntry,
} from "../../context/AppStateContext";

// SettingsMenuを遅延ロード
const SettingsMenu = lazy(() => import("../SettingsMenu"));
import { useAppState } from "../../context/AppStateContext";
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

  // LUT関連
  lutEnabled: boolean;
  onLutEnabledChange: (enabled: boolean) => void;
  lutOpacity: number;
  onLutOpacityChange: (opacity: number) => void;
  lutFileName: string | null;
  currentLutPath: string | null;
  lutHistory: LutHistoryEntry[];
  onLutFileSelect: () => void;
  onLutLoadFromHistory: (filePath: string) => void;
  onLutRemoveFromHistory: (filePath: string) => void;

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
  const { t } = useAppState();
  const [showMultiMenu, setShowMultiMenu] = createSignal(false);
  const [showSettings, setShowSettings] = createSignal(false);

  const windowButtonClasses =
    "no-drag flex h-full w-12 items-center justify-center text-[var(--glass-text-secondary)] transition-colors duration-200 hover:bg-white/[0.15]";

  const controlButtonClasses =
    "no-drag flex h-9 w-9 items-center justify-center rounded-md bg-transparent border border-transparent transition-all duration-200 cursor-pointer text-[var(--glass-text-primary)] hover:bg-white/[0.15] hover:backdrop-blur-md hover:border-white/[0.1] hover:scale-105 active:scale-98";

  const handleMinimize = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.minimize();
  };

  const handleMaximize = async () => {
    const appWindow = getCurrentWindow();
    const maximized = await appWindow.isMaximized();
    if (maximized) {
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
   * メニュー外クリック時に全メニューを閉じる処理と最大化状態の初期化
   */
  onMount(async () => {
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

  return (
    <>
      <div
        id="titlebar"
        class="drag-region relative flex h-10 items-center justify-between border-b border-white/20 dark:border-white/10 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md pl-2 pr-0 text-sm text-[var(--glass-text-primary)] transition-colors duration-300"
        data-tauri-drag-region
      >
        {/* 左側: ギャラリー、ズーム、画像操作 */}
        <div class="flex items-center gap-2">
          <button
            id="galleryBtn"
            class="no-drag flex h-6 w-6 items-center justify-center rounded-md text-[var(--glass-text-secondary)] transition-all duration-200 hover:bg-white/[0.15] hover:backdrop-blur-md hover:scale-105 active:scale-98 mr-2"
            onClick={() => props.onToggleGallery(!props.showGallery)}
            aria-label={t("titlebar.gallery")}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="3"
                y="3"
                width="7"
                height="18"
                stroke="currentColor"
                stroke-width="2"
                fill="none"
              />
              <line
                x1="14"
                y1="6"
                x2="21"
                y2="6"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
              <line
                x1="14"
                y1="12"
                x2="21"
                y2="12"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
              <line
                x1="14"
                y1="18"
                x2="21"
                y2="18"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </button>

          {/* ズーム3ボタングループ */}
          <div class="flex items-center border border-white/20 dark:border-white/10 rounded-md bg-transparent transition-all duration-200">
            {/* ズームイン */}
            <button
              class="no-drag flex h-7 w-7 items-center justify-center rounded-l-md rounded-r-none bg-transparent border-none transition-all duration-200 cursor-pointer text-[var(--glass-text-primary)] hover:bg-white/[0.15] hover:backdrop-blur-md active:scale-98"
              onClick={props.onZoomIn}
              aria-label={t("titlebar.zoomIn")}
              title={t("titlebar.zoomIn")}
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

            <div class="border-l border-white/10 dark:border-white/5 h-4" />

            {/* 倍率表示(クリックでリセット) */}
            <button
              class="no-drag flex h-7 min-w-[3rem] items-center justify-center rounded-none bg-transparent border-none transition-all duration-200 cursor-pointer text-[var(--glass-text-primary)] hover:bg-white/[0.15] hover:backdrop-blur-md active:scale-98"
              onClick={props.onZoomReset}
              aria-label={t("titlebar.zoomReset")}
              title={t("titlebar.zoomReset")}
            >
              <span class="text-xs font-medium text-tabular">
                {Math.round(props.zoomScale * 100)}%
              </span>
            </button>

            <div class="border-l border-white/10 dark:border-white/5 h-4" />

            {/* ズームアウト */}
            <button
              class="no-drag flex h-7 w-7 items-center justify-center rounded-l-none rounded-r-md bg-transparent border-none transition-all duration-200 cursor-pointer text-[var(--glass-text-primary)] hover:bg-white/[0.15] hover:backdrop-blur-md active:scale-98"
              onClick={props.onZoomOut}
              aria-label={t("titlebar.zoomOut")}
              title={t("titlebar.zoomOut")}
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
          </div>

          {/* 画面フィットボタン */}
          <button
            class={controlButtonClasses}
            onClick={props.onScreenFit}
            aria-label={t("titlebar.screenFit")}
            title={t("titlebar.screenFit")}
          >
            <img
              class="h-4 w-4 opacity-90 dark:brightness-0 dark:invert"
              src="/全画面表示ボタン5.svg"
              alt={t("titlebar.screenFit")}
            />
          </button>

          {/* 回転ボタン */}
          <button
            class={controlButtonClasses}
            onClick={props.onRotate}
            aria-label={t("titlebar.rotate")}
            title={t("titlebar.rotate")}
          >
            <img
              class="h-4 w-4 opacity-90 dark:brightness-0 dark:invert"
              src="/reload_hoso.svg"
              alt={t("titlebar.rotate")}
            />
          </button>
        </div>

        {/* 右側: メニューとウィンドウコントロール */}
        <div class="flex items-center h-full gap-1">
          {/* マルチメニューボタン */}
          <button
            class={controlButtonClasses}
            onClick={toggleMultiMenu}
            aria-label={t("titlebar.multiMenu")}
            title={t("titlebar.multiMenu")}
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
            aria-label={t("titlebar.settings")}
            title={t("titlebar.settings")}
          >
            <img
              class="h-4 w-4 opacity-90 dark:brightness-0 dark:invert"
              src="/setting_ge_h.svg"
              alt={t("titlebar.settings")}
            />
          </button>

          {/* 区切り線 */}
          <div class="h-6 w-px bg-white/20 dark:bg-white/10 mx-1" />

          <button
            id="minimizeBtn"
            class={windowButtonClasses}
            onClick={handleMinimize}
            aria-label={t("titlebar.minimize")}
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
            aria-label={t("titlebar.maximize")}
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
            class="no-drag flex h-full w-12 items-center justify-center text-[var(--glass-text-secondary)] transition-colors duration-200 hover:bg-red-600 hover:text-white"
            onClick={handleClose}
            aria-label={t("titlebar.close")}
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
          class="fixed top-10 left-0 right-0 z-50 mt-2 flex justify-center pointer-events-none"
          data-menu="multi"
        >
          <div class="pointer-events-auto">
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
              lutEnabled={props.lutEnabled}
              onLutEnabledChange={props.onLutEnabledChange}
              lutOpacity={props.lutOpacity}
              onLutOpacityChange={props.onLutOpacityChange}
              lutFileName={props.lutFileName}
              currentLutPath={props.currentLutPath}
              lutHistory={props.lutHistory}
              onLutFileSelect={props.onLutFileSelect}
              onLutLoadFromHistory={props.onLutLoadFromHistory}
              onLutRemoveFromHistory={props.onLutRemoveFromHistory}
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
      </Show>

      {/* SettingsMenu - Titlebarの下に表示(遅延ロード) */}
      <Show when={showSettings()}>
        <div
          class="fixed top-10 left-0 right-0 z-50 mt-2 flex justify-center pointer-events-none"
          data-menu="settings"
        >
          <div class="pointer-events-auto">
            <Suspense
              fallback={
                <div class="w-[300px] h-[200px] bg-[var(--bg-secondary)] rounded-lg animate-pulse" />
              }
            >
              <SettingsMenu
                theme={props.theme}
                onThemeChange={props.onThemeChange}
                wheelSensitivity={props.wheelSensitivity}
                onWheelSensitivityChange={props.onWheelSensitivityChange}
                showFullPath={props.showFullPath}
                onShowFullPathChange={props.onShowFullPathChange}
                controlPanelPosition={props.controlPanelPosition}
                onControlPanelPositionChange={
                  props.onControlPanelPositionChange
                }
              />
            </Suspense>
          </div>
        </div>
      </Show>
    </>
  );
};

export default Titlebar;
