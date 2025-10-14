import type { Component } from 'solid-js';
import { createSignal, onMount, onCleanup } from 'solid-js';
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
  position: 'top' | 'bottom' | 'left' | 'right';
  onPositionChange: (position: 'top' | 'bottom' | 'left' | 'right') => void;
}

/**
 * フローティングコントロールパネルコンポーネント
 * ズーム、回転、マルチメニュー、設定などの全コントロールをガラス表現で統一
 * 位置は設定で変更可能（上下左右の4方向）
 * - top/bottom: タイトルバー付近/画面下部の水平中央に配置
 * - left/right: 左端/右端の垂直中央に配置
 */
const FloatingControlPanel: Component<FloatingControlPanelProps> = (props) => {
  const [showMultiMenu, setShowMultiMenu] = createSignal(false);
  const [showSettings, setShowSettings] = createSignal(false);
  const [menuPosition, setMenuPosition] = createSignal('');
  const [menuAnchor, setMenuAnchor] = createSignal('top-0');
  
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

  /**
   * 位置設定に応じたCSSクラスを生成
   * - top/bottom: 水平中央配置
   * - left/right: 垂直中央配置
   */
  const getPositionClasses = () => {
    const position = props.position;
    
    switch (position) {
      case 'top':
        // 上部中央: 水平中央、タイトルバーの下
        return 'top-12 left-1/2 -translate-x-1/2';
      case 'bottom':
        // 下部中央: 水平中央、画面下部
        return 'bottom-12 left-1/2 -translate-x-1/2';
      case 'left':
        // 左端中央: 垂直中央、左端
        return 'left-4 top-1/2 -translate-y-1/2';
      case 'right':
        // 右端中央: 垂直中央、右端
        return 'right-4 top-1/2 -translate-y-1/2';
    }
  };

  /**
   * パネルの方向を取得（横並び or 縦並び）
   */
  const getPanelDirection = () => {
    const position = props.position;
    // top/bottomは横並び、left/rightは縦並び
    return (position === 'top' || position === 'bottom') ? 'flex-row' : 'flex-col';
  };

  /**
   * メニューの配置クラスを取得
   * パネルの位置とメニューのサイズを考慮して、画面内に収まるように配置
   */
  const getMenuPositionClasses = () => {
    const position = props.position;
    
    // パネルの位置情報を取得
    if (!panelRef) {
      // 初期値: 基本的な配置
      return getDefaultMenuPosition();
    }
    
    const rect = panelRef.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    
    // メニューの推定サイズ（実際のメニューサイズに基づく）
    const menuHeight = 400; // SettingsMenu/MultiMenuの概算高さ
    const menuWidth = 200;  // メニューの概算幅
    
    switch (position) {
      case 'top':
        // 上部配置: 下に余裕があれば下、なければ上
        const spaceBelow = windowHeight - rect.bottom;
        if (spaceBelow >= menuHeight + 16) {
          return 'top-full mt-2'; // 下に展開
        } else {
          return 'bottom-full mb-2'; // 上に展開
        }
        
      case 'bottom':
        // 下部配置: 上に余裕があれば上、なければ下
        const spaceAbove = rect.top;
        if (spaceAbove >= menuHeight + 16) {
          return 'bottom-full mb-2'; // 上に展開
        } else {
          return 'top-full mt-2'; // 下に展開
        }
        
      case 'left':
        // 左端配置: 右に余裕があれば右、なければ左
        const spaceRight = windowWidth - rect.right;
        if (spaceRight >= menuWidth + 16) {
          return 'left-full ml-2'; // 右に展開
        } else {
          return 'right-full mr-2'; // 左に展開（画面内に収める）
        }
        
      case 'right':
        // 右端配置: 左に余裕があれば左、なければ右
        const spaceLeft = rect.left;
        if (spaceLeft >= menuWidth + 16) {
          return 'right-full mr-2'; // 左に展開
        } else {
          return 'left-full ml-2'; // 右に展開（画面内に収める）
        }
    }
  };
  
  /**
   * デフォルトのメニュー配置を取得（refが利用できない場合）
   */
  const getDefaultMenuPosition = () => {
    const position = props.position;
    
    switch (position) {
      case 'top':
        return 'top-full mt-2';
      case 'bottom':
        return 'bottom-full mb-2';
      case 'left':
        return 'left-full ml-2';
      case 'right':
        return 'right-full mr-2';
    }
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
    <div 
      ref={panelRef}
      class={`fixed z-50 flex gap-2 right-control-panel ${getPositionClasses()}`}
    >
      {/* ガラス表現のメインコンテナ */}
      <div class={`rounded-xl bg-black/20 p-2 backdrop-blur-md border border-white/10 shadow-lg flex ${getPanelDirection()} gap-2`}>
        {/* 上: ズームイン */}
        <button
          class="glass-button flex items-center justify-center"
          onClick={props.onZoomIn}
          aria-label="ズームイン"
          title="ズームイン"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-white/90">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>

        {/* 中央: 倍率表示(クリックでリセット) */}
        <button
          class="glass-button mt-2 flex flex-col items-center justify-center px-2"
          onClick={props.onZoomReset}
          aria-label="ズームリセット"
          title="ズームリセット"
        >
          <span class="text-sm font-medium text-white/80">
            {Math.round(props.zoomScale * 100)}%
          </span>
        </button>

        {/* 下: ズームアウト */}
        <button
          class="glass-button mt-2 flex items-center justify-center"
          onClick={props.onZoomOut}
          aria-label="ズームアウト"
          title="ズームアウト"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-white/90">
            <path d="M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>

        {/* 区切り線 */}
        <div class="h-px bg-white/10 my-2" />

        {/* 画面フィットボタン */}
        <button
          class="glass-button"
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
          class="glass-button mt-2"
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

        {/* 区切り線 */}
        <div class="h-px bg-white/10 my-2" />

        {/* マルチメニューボタン */}
        <button
          class="glass-button"
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
          class="glass-button mt-2"
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

      <style>
        {`
          .glass-button {
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 0.5rem;
            /* 初期状態では背景とボーダーを隠す */
            background: transparent;
            border: 1px solid transparent;
            color: rgba(255, 255, 255, 0.9);
            transition: background 0.18s ease, border 0.18s ease, transform 0.12s ease;
            cursor: pointer;
          }

          /* ホバー時にガラス表現を表示 */
          .glass-button:hover {
            background: rgba(255, 255, 255, 0.06);
            backdrop-filter: blur(8px) saturate(140%);
            border: 1px solid rgba(255, 255, 255, 0.12);
            transform: translateY(-2px);
          }

          .glass-button:active {
            transform: translateY(0) scale(0.98);
          }

          .glass-button img {
            filter: brightness(0) invert(1);
            opacity: 0.9;
          }
        `}
      </style>
    </div>
  );
};

export default FloatingControlPanel;
