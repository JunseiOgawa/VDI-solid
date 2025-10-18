import type { Component } from 'solid-js';
import { createSignal, onMount, onCleanup, Show } from 'solid-js';
import MultiMenu from '../ImageViewer/MultiMenu';
import SettingsMenu from '../SettingsMenu';
import type { GridPattern } from '../../context/AppStateContext';
import type { ThemeKey } from '../../lib/theme';

/**
 * FloatingControlPanelのProps型定義
 */
interface FloatingControlPanelProps {
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
  histogramDisplayType: 'rgb' | 'luminance';
  onHistogramDisplayTypeChange: (type: 'rgb' | 'luminance') => void;
  histogramPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  onHistogramPositionChange: (position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left') => void;
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
  
  // 位置設定
  position: 'top' | 'bottom';
  onPositionChange: (position: 'top' | 'bottom') => void;

  // ファイル操作
  currentImageFilePath: string | null;
}

/**
 * フローティングコントロールパネルコンポーネント
 * ズーム、回転、マルチメニュー、設定などの全コントロールをガラス表現で統一
 * 位置は設定で変更可能（上下左右の4方向）
 * - top/bottom: タイトルバー付近/画面下部の水平中央に配置
 * - left/right: 左端/右端の垂直中央に配置
 */
const FloatingControlPanel: Component<FloatingControlPanelProps> = (props) => {
  // 展開状態（初期値はlocalStorageから取得）
  const [isExpanded, setIsExpanded] = createSignal(
    localStorage.getItem('controlPanelExpanded') !== 'false'
  );

  const [showMultiMenu, setShowMultiMenu] = createSignal(false);
  const [showSettings, setShowSettings] = createSignal(false);
  const [menuPosition, setMenuPosition] = createSignal('');
  const [menuAnchor, setMenuAnchor] = createSignal('top-0');
  
  // ホバー状態管理
  const [isPinned, setIsPinned] = createSignal(
    localStorage.getItem('controlPanelExpanded') !== 'false'
  );
  
  // パネルの参照を保持
  let panelRef: HTMLDivElement | undefined;

  /**
   * マルチメニューの表示切り替え
   */
  const toggleMultiMenu = () => {
    const willShow = !showMultiMenu();
    setShowMultiMenu(willShow);
    // 設定メニューは閉じる
    if (showSettings()) {
      setShowSettings(false);
    }
    // メニューを開く場合は位置を計算
    if (willShow) {
      updateMenuPosition();
    }
  };

  /**
   * 設定メニューの表示切り替え
   */
  const toggleSettings = () => {
    const willShow = !showSettings();
    setShowSettings(willShow);
    // マルチメニューは閉じる
    if (showMultiMenu()) {
      setShowMultiMenu(false);
    }
    // メニューを開く場合は位置を計算
    if (willShow) {
      updateMenuPosition();
    }
  };

  /**
   * 展開/折りたたみのトグル
   * 手動クリック時はピン状態を切り替え
   */
  const toggleExpand = () => {
    const newPinState = !isPinned();
    setIsPinned(newPinState);
    setIsExpanded(newPinState);
    localStorage.setItem('controlPanelExpanded', String(newPinState));

    // 折りたたみ時はメニューを閉じる
    if (!newPinState) {
      setShowMultiMenu(false);
      setShowSettings(false);
    }
  };

  /**
   * メニュー位置を更新
   */
  const updateMenuPosition = () => {
    // 次のフレームで計算（DOMが更新された後）
    requestAnimationFrame(() => {
      setMenuPosition(getMenuPositionClasses());
      setMenuAnchor(getMenuAnchor());
    });
  };

  /**
   * メニュー外クリック時に全メニューを閉じる処理
   */
  onMount(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // コントロールパネル、メニューボタン、メニュー内のクリックは無視
      if (
        target.closest('.right-control-panel') ||
        target.closest('[data-menu="multi"]') ||
        target.closest('[data-menu="settings"]')
      ) {
        return;
      }
      
      // メニュー外のクリックは全メニューを閉じる
      setShowMultiMenu(false);
      setShowSettings(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    
    onCleanup(() => {
      document.removeEventListener('click', handleClickOutside);
    });
  });

  // グリッド、ピーキング、ヒストグラムのいずれかが有効かチェック
  const isAnyFeatureActive = () =>
    props.gridPattern !== 'off' || props.peakingEnabled || props.histogramEnabled;

  // ガラスボタンの共通クラス
  const glassButtonClasses = "w-12 h-12 min-w-[48px] min-h-[48px] flex-shrink-0 flex items-center justify-center rounded-lg bg-transparent border border-transparent transition-all duration-200 cursor-pointer text-[var(--glass-text-primary)] hover:bg-white/[0.15] hover:backdrop-blur-md hover:border-white/[0.1] hover:scale-105 active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed";

  /**
   * 位置設定に応じたCSSクラスを生成
   * - top: タイトルバーの下、水平中央配置
   * - bottom: 画面下部、水平中央配置
   */
  const getPositionClasses = () => {
    return props.position === 'top'
      ? 'top-10 left-1/2 -translate-x-1/2'
      : 'bottom-10 left-1/2 -translate-x-1/2';
  };

  /**
   * メニューの配置クラスを取得
   * パネルの位置とメニューのサイズを考慮して、画面内に収まるように配置
   */
  const getMenuPositionClasses = () => {
    // パネルの位置情報を取得
    if (!panelRef) {
      return getDefaultMenuPosition();
    }

    const rect = panelRef.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const menuHeight = 400; // SettingsMenu/MultiMenuの概算高さ

    if (props.position === 'top') {
      // 上部配置: 下に余裕があれば下、なければ上
      const spaceBelow = windowHeight - rect.bottom;
      return spaceBelow >= menuHeight + 16 ? 'top-full mt-2' : 'bottom-full mb-2';
    } else {
      // 下部配置: 上に余裕があれば上、なければ下
      const spaceAbove = rect.top;
      return spaceAbove >= menuHeight + 16 ? 'bottom-full mb-2' : 'top-full mt-2';
    }
  };

  /**
   * デフォルトのメニュー配置を取得（refが利用できない場合）
   */
  const getDefaultMenuPosition = () => {
    return props.position === 'top' ? 'top-full mt-2' : 'bottom-full mb-2';
  };
  
  /**
   * メニューのアンカーポイントを取得（top-0 or bottom-0）
   * 下部配置でメニューが上に展開される場合はbottom-0を使用
   */
  const getMenuAnchor = () => {
    if (!panelRef) {
      return 'top-0';
    }
    
    const position = props.position;
    const rect = panelRef.getBoundingClientRect();
    const menuHeight = 400;
    
    // 下部配置の場合のみ特別処理
    if (position === 'bottom') {
      const spaceAbove = rect.top;
      // 上に余裕があり、メニューが上に展開される場合はbottom-0
      if (spaceAbove >= menuHeight + 16) {
        return 'bottom-0';
      }
    }
    
    // その他の場合はtop-0
    return 'top-0';
  };

  return (
    <>
      {/* 折りたたみ時：トグルボタンのみ */}
      <Show when={!isExpanded()}>
        <button
          class={`fixed z-50 w-[70px] h-6 rounded-xl bg-[var(--glass-bg-primary)] backdrop-blur-lg border border-[var(--glass-border-subtle)] flex items-center justify-center cursor-pointer transition-all duration-200 text-[var(--glass-text-primary)] hover:bg-white/[0.15] hover:border-[var(--glass-border-emphasis)] hover:scale-105 active:scale-95 ${getPositionClasses()}`}
          onClick={toggleExpand}
          aria-label="コントロールパネルを開く"
          title="コントロールパネルを開く"
        >
          {props.position === 'top' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 9l-7 7-7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 15l7-7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          )}
        </button>
      </Show>

      {/* 展開時：フルパネル */}
      <Show when={isExpanded()}>
        <div
          ref={panelRef}
          class={`fixed z-50 flex gap-2 right-control-panel animate-expand-panel ${getPositionClasses()}`}
        >
          {/* ガラス表現のメインコンテナ */}
          <div class="bg-[var(--glass-bg-primary)] backdrop-blur-xl border border-[var(--glass-border-subtle)] rounded-xl p-2 flex flex-row gap-2">
            {/* ズームイン */}
            <button
              class={glassButtonClasses}
              onClick={props.onZoomIn}
              aria-label="ズームイン"
              title="ズームイン"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-white/90">
                <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>

            {/* 倍率表示(クリックでリセット) */}
            <button
              class={glassButtonClasses}
              onClick={props.onZoomReset}
              aria-label="ズームリセット"
              title="ズームリセット"
            >
              <span class="text-xs font-medium text-white/80 text-tabular">
                {Math.round(props.zoomScale * 100)}%
              </span>
            </button>

            {/* ズームアウト */}
            <button
              class={glassButtonClasses}
              onClick={props.onZoomOut}
              aria-label="ズームアウト"
              title="ズームアウト"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-white/90">
                <path d="M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>

            {/* 画面フィットボタン */}
            <button
              class={glassButtonClasses}
              onClick={props.onScreenFit}
              aria-label="画面にフィット"
              title="画面にフィット"
            >
              <img
                class="h-5 w-5 brightness-0 invert opacity-90"
                src="/全画面表示ボタン5.svg"
                alt="画面フィット"
              />
            </button>

            {/* 回転ボタン */}
            <button
              class={glassButtonClasses}
              onClick={props.onRotate}
              aria-label="回転"
              title="回転"
            >
              <img
                class="h-5 w-5 brightness-0 invert opacity-90"
                src="/reload_hoso.svg"
                alt="回転"
              />
            </button>

            {/* マルチメニューボタン */}
            <button
              class={glassButtonClasses}
              classList={{
                'bg-white/20 border-white/30': isAnyFeatureActive(),
              }}
              onClick={toggleMultiMenu}
              aria-label="表示機能メニュー"
              title="表示機能メニュー"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                class="text-white/90"
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
              class={glassButtonClasses}
              onClick={toggleSettings}
              aria-label="設定"
              title="設定"
            >
              <img
                class="h-5 w-5 brightness-0 invert opacity-90"
                src="/setting_ge_h.svg"
                alt="設定"
              />
            </button>

            {/* トグルボタン（閉じる） */}
            <button
              class={glassButtonClasses}
              onClick={toggleExpand}
              aria-label="コントロールパネルを閉じる"
              title="コントロールパネルを閉じる"
            >
              {props.position === 'top' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-white/90">
                  <path d="M5 15l7-7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-white/90">
                  <path d="M19 9l-7 7-7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              )}
            </button>
          </div>

          {/* MultiMenu - 動的配置 */}
          {showMultiMenu() && (
            <div
              class={`absolute ${menuAnchor()} ${menuPosition() || getDefaultMenuPosition()}`}
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
          )}

          {/* SettingsMenu - 動的配置 */}
          {showSettings() && (
            <div
              class={`absolute ${menuAnchor()} ${menuPosition() || getDefaultMenuPosition()}`}
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
                controlPanelPosition={props.position}
                onControlPanelPositionChange={props.onPositionChange}
              />
            </div>
          )}
        </div>
      </Show>
    </>
  );
};

export default FloatingControlPanel;
