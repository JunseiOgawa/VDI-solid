import type { ParentComponent } from 'solid-js';
import { createContext, createSignal, onCleanup, onMount, useContext } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import { convertFileToAssetUrlWithCacheBust } from '../lib/fileUtils';
import { fetchNextImagePath, fetchPreviousImagePath } from '../lib/tauri';
import { clampIntensity, clampOpacity } from '../lib/peakingUtils';
import { createThemeController, isThemeKey, type ThemeKey } from '../lib/theme';
import { CONFIG } from '../config/config';

// 画像回転のためのrust関数の呼び出しに使用するオプション
interface SetImagePathOptions {
  filePath?: string | null;
  preserveQueue?: boolean;
}

/**
 * グリッドパターンの種類
 * - 'off': グリッド非表示
 * - '3x3': 3×3グリッド
 * - '5x3': 5×3グリッド
 * - '4x4': 4×4グリッド
 */
export type GridPattern = 'off' | '3x3' | '5x3' | '4x4';

/**
 * コントローラーバインディングの設定
 */
export interface ControllerBinding {
  action: string; // 'zoomIn', 'zoomOut', 'nextImage', etc.
  input: string;  // 'ButtonA', 'AxisLeftY', etc.
}

/**
 * コントローラー設定
 */
export interface ControllerConfig {
  enabled: boolean;
  bindings: ControllerBinding[];
}

/**
 * アプリケーションの状態を管理するためのコンテキストインターフェース。
 */
export interface AppState {
  currentImagePath: () => string;
  currentImageFilePath: () => string | null;
  setCurrentImagePath: (path: string, options?: SetImagePathOptions) => void;
  zoomScale: () => number;
  setZoomScale: (scale: number) => void;
  rotation: () => number;
  setRotation: (updater: (prev: number) => number) => void;
  pendingRotation: () => number;
  enqueueRotation: (increment: number) => void;
  flushRotationQueue: () => Promise<void>;
  isRotationInProgress: () => boolean;
  theme: () => ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  loadNextImage: () => Promise<boolean>;
  loadPreviousImage: () => Promise<boolean>;
  /** 現在のグリッド表示パターンを取得 */
  gridPattern: () => GridPattern;
  /** グリッド表示パターンを設定 */
  setGridPattern: (pattern: GridPattern) => void;
  /** グリッド線の不透明度を取得 (0.0-1.0) */
  gridOpacity: () => number;
  /** グリッド線の不透明度を設定 (0.0-1.0) */
  setGridOpacity: (opacity: number) => void;
  /** グリッド永続化が有効かどうかを取得 */
  gridPersistEnabled: () => boolean;
  /** グリッド永続化の有効/無効を設定 */
  setGridPersistEnabled: (enabled: boolean) => void;
  
  // ピーキング関連
  /** ピーキング機能の有効/無効 */
  peakingEnabled: () => boolean;
  /** ピーキング機能の有効/無効を設定 */
  setPeakingEnabled: (enabled: boolean) => void;
  /** エッジ検出閾値 (0-255) */
  peakingIntensity: () => number;
  /** エッジ検出閾値を設定 */
  setPeakingIntensity: (intensity: number) => void;
  /** ピーキング表示色 */
  peakingColor: () => string;
  /** ピーキング表示色を設定 */
  setPeakingColor: (color: string) => void;
  /** ピーキング不透明度 (0.0-1.0) */
  peakingOpacity: () => number;
  /** ピーキング不透明度を設定 */
  setPeakingOpacity: (opacity: number) => void;
  /** ピーキング点滅の有効/無効 */
  peakingBlink: () => boolean;
  /** ピーキング点滅の有効/無効を設定 */
  setPeakingBlink: (enabled: boolean) => void;

  // ホイール感度関連
  /** ホイール感度 (0.1-5.0) */
  wheelSensitivity: () => number;
  /** ホイール感度を設定 */
  setWheelSensitivity: (sensitivity: number) => void;

  // ヒストグラム関連
  /** ヒストグラム機能の有効/無効 */
  histogramEnabled: () => boolean;
  /** ヒストグラム機能の有効/無効を設定 */
  setHistogramEnabled: (enabled: boolean) => void;
  /** ヒストグラム表示タイプ */
  histogramDisplayType: () => 'rgb' | 'luminance';
  /** ヒストグラム表示タイプを設定 */
  setHistogramDisplayType: (type: 'rgb' | 'luminance') => void;
  /** ヒストグラム表示位置 */
  histogramPosition: () => 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** ヒストグラム表示位置を設定 */
  setHistogramPosition: (position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left') => void;
  /** ヒストグラムサイズ倍率 */
  histogramSize: () => number;
  /** ヒストグラムサイズ倍率を設定 */
  setHistogramSize: (size: number) => void;
  /** ヒストグラム不透明度 */
  histogramOpacity: () => number;
  /** ヒストグラム不透明度を設定 */
  setHistogramOpacity: (opacity: number) => void;

  // 画像解像度関連
  /** 画像解像度を取得 */
  imageResolution: () => { width: number; height: number } | null;
  /** 画像解像度を設定 */
  setImageResolution: (resolution: { width: number; height: number } | null) => void;

  // ファイルパス表示形式関連
  /** フルパス表示の有効/無効（true: フルパス, false: ファイル名のみ） */
  showFullPath: () => boolean;
  /** フルパス表示の有効/無効を設定 */
  setShowFullPath: (show: boolean) => void;

  // VirtualDesktop & コントローラー関連
  /** VirtualDesktopモードの有効/無効 */
  virtualdesktopMode: () => boolean;
  /** VirtualDesktopモードの有効/無効を設定 */
  setVirtualDesktopMode: (enabled: boolean) => void;
  /** コントローラー検出状態 */
  controllerDetected: () => boolean;
  /** コントローラー検出状態を設定 */
  setControllerDetected: (detected: boolean) => void;
  /** コントローラーバインディング設定 */
  controllerBindings: () => ControllerConfig;
  /** コントローラーバインディング設定を設定 */
  setControllerBindings: (config: ControllerConfig) => void;
}

const AppContext = createContext<AppState>();

const ROTATION_DEBOUNCE_MS = 3000;

const normalizeRotation = (value: number) => {
  const remainder = value % 360;
  return remainder < 0 ? remainder + 360 : remainder;
};

/**
 * アプリケーションの状態を管理するプロバイダーコンポーネント。
 * 現在の画像パス、ズームスケール、テーマを状態として保持し、
 * ローカルストレージからテーマを復元し、デフォルトの画像パスを設定する。
 * 子コンポーネントにAppStateを提供する。
 * @param props - 親コンポーネントのプロパティ
 */
/**
 * アプリケーションの状態を外部コンポーネントに提供するコンテキストのインターフェース。
 *
 * 各プロパティ／関数の役割：
 * - currentImagePath: 現在表示している画像のアセットURL（キャッシュバストを含む可能性あり）を返すシグナル。
 * - currentImageFilePath: 元のファイルパス（ファイルシステム上の実パス）を返すシグナル。ファイルが無い場合は null。
 * - setCurrentImagePath(path, options?): 画像パスを設定する。options で filePath を与えれば currentImageFilePath を設定し、preserveQueue を指定しない限り回転キューをリセットする。
 * - zoomScale: 表示倍率を返すシグナル。
 * - setZoomScale(scale): 表示倍率を設定するための関数。
 * - rotation: UI上で即時に反映する「現在の見た目上の回転角度」を返すシグナル（0〜359 等の正規化された角度）。
 * - setRotation(updater): rotation を更新するための関数。 updater は前回値を受け取り新値を返す。
 * - pendingRotation: バックグラウンドで実際にディスク上の画像を回転するためにキューされている合計回転角度を返すシグナル（内部累積値）。
 * - enqueueRotation(increment): 回転キューに角度を追加する。UI の即時表示用に rotation も更新し、デバウンス／フラッシュ処理をスケジュールする。
 * - flushRotationQueue(): キューに溜まった回転操作を直ちに（または現在の回転処理終了後に直ちに）実行するための非同期関数。
 * - isRotationInProgress: 現在ネイティブ側で回転処理（ファイル操作）が実行中かどうかを返すシグナル。
 * - theme: 現在のテーマ（'auto' | 'light' | 'dark' 等）を返すシグナル。
 * - setTheme(theme): テーマを変更する関数。ローカルストレージへの保存等の副作用を担う。
 *
 * 補足：
 * - rotation は UI 表示のための正規化された角度を保持し、pendingRotation は実ファイルに適用すべき「累積角度」を保持するという役割分担がある。
 * - 実際のファイル回転はデバウンスとキュー管理を通じてまとめて行われ、失敗時のロールバックや残差処理（applyResidualRotation）を行う。
 */
export const AppProvider: ParentComponent = (props) => {
  const [currentImagePath, _setCurrentImagePath] = createSignal<string>('');
  const [currentImageFilePath, setCurrentImageFilePath] = createSignal<string | null>(null);
  const [zoomScale, setZoomScale] = createSignal<number>(1);
  const [rotation, setRotation] = createSignal<number>(0);
  const [pendingRotation, setPendingRotation] = createSignal<number>(0);
  const [isRotating, setIsRotating] = createSignal<boolean>(false);
  const [theme, setTheme] = createSignal<ThemeKey>('auto');
  /** グリッド表示パターンの状態管理（初期値: 'off'） */
  const [gridPattern, setGridPattern] = createSignal<GridPattern>('off');
  /** グリッド線の不透明度（0.0-1.0、初期値は CONFIG から取得） */
  const [gridOpacity, setGridOpacity] = createSignal<number>(CONFIG.grid.defaultOpacity);
  /** グリッドの永続化を有効化するかのフラグ */
  const [gridPersistEnabled, setGridPersistEnabled] = createSignal<boolean>(false);

  // ピーキング関連Signal（新規追加）
  const [peakingEnabled, setPeakingEnabledSignal] = createSignal<boolean>(false);
  const [peakingIntensity, setPeakingIntensitySignal] = createSignal<number>(60);
  const [peakingColor, setPeakingColorSignal] = createSignal<string>('lime');
  const [peakingOpacity, setPeakingOpacitySignal] = createSignal<number>(0.5);
  const [peakingBlink, setPeakingBlinkSignal] = createSignal<boolean>(false);

  // ホイール感度関連Signal
  const [wheelSensitivity, setWheelSensitivity] = createSignal<number>(CONFIG.zoom.wheelSensitivity);

  // ヒストグラム関連Signal
  const [histogramEnabled, setHistogramEnabled] = createSignal<boolean>(CONFIG.histogram.enabled);
  const [histogramDisplayType, setHistogramDisplayType] = createSignal<'rgb' | 'luminance'>(CONFIG.histogram.displayType);
  const [histogramPosition, setHistogramPosition] = createSignal<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'>(CONFIG.histogram.position);
  const [histogramSize, setHistogramSize] = createSignal<number>(CONFIG.histogram.size);
  const [histogramOpacity, setHistogramOpacity] = createSignal<number>(CONFIG.histogram.opacity);

  // 画像解像度関連Signal
  const [imageResolution, setImageResolution] = createSignal<{ width: number; height: number } | null>(null);

  // ファイルパス表示形式関連Signal（デフォルト: false = ファイル名のみ）
  const [showFullPath, setShowFullPathSignal] = createSignal<boolean>(false);

  // VirtualDesktop & コントローラー関連Signal
  const [virtualdesktopMode, setVirtualdesktopModeSignal] = createSignal<boolean>(false);
  const [controllerDetected, setControllerDetectedSignal] = createSignal<boolean>(false);
  const [controllerBindings, setControllerBindingsSignal] = createSignal<ControllerConfig>({
    enabled: false,
    bindings: [],
  });

  // ピーキング設定の永続化付きセッター
  const setPeakingEnabled = (enabled: boolean) => {
    setPeakingEnabledSignal(enabled);
    localStorage.setItem('vdi-peaking-enabled', enabled ? 'true' : 'false');
  };

  const setPeakingIntensity = (intensity: number) => {
    const clampedIntensity = clampIntensity(intensity);
    setPeakingIntensitySignal(clampedIntensity);
    localStorage.setItem('vdi-peaking-intensity', clampedIntensity.toString());
  };

  const setPeakingColor = (color: string) => {
    setPeakingColorSignal(color);
    localStorage.setItem('vdi-peaking-color', color);
  };

  const setPeakingOpacity = (opacity: number) => {
    const clampedOpacityValue = clampOpacity(opacity);
    setPeakingOpacitySignal(clampedOpacityValue);
    localStorage.setItem('vdi-peaking-opacity', clampedOpacityValue.toString());
  };

  const setPeakingBlink = (enabled: boolean) => {
    setPeakingBlinkSignal(enabled);
    localStorage.setItem('vdi-peaking-blink', enabled ? 'true' : 'false');
  };

  let rotationTimer: number | undefined;
  let pendingFlush = false;

  const updateCurrentImageAssetPath = (path: string) => {
    _setCurrentImagePath(path);
  };

  const clearRotationTimer = () => {
    if (rotationTimer !== undefined) {
      clearTimeout(rotationTimer);
      rotationTimer = undefined;
    }
  };

  const resetRotationQueue = () => {
    clearRotationTimer();
    pendingFlush = false;
    setPendingRotation(() => 0);
    setRotation(() => 0);
  };

  const scheduleRotationFlush = () => {
    clearRotationTimer();
    rotationTimer = window.setTimeout(() => {
      rotationTimer = undefined;
      if (isRotating()) {
        pendingFlush = true;
        return;
      }
      void performRotation();
    }, ROTATION_DEBOUNCE_MS);
  };

  const applyResidualRotation = (executedTotal: number) => {
    setPendingRotation((prev) => {
      const residual = prev - executedTotal;
      const normalizedResidual = normalizeRotation(residual);
      setRotation(() => normalizedResidual);
      return residual;
    });
  };

  const performRotation = async (): Promise<void> => {
    pendingFlush = false;
    const total = pendingRotation();

    if (total === 0) {
      setRotation(() => 0);
      return;
    }

    const normalized = normalizeRotation(total);

    if (normalized % 90 !== 0) {
      console.warn('[Rotation] 90度単位以外の回転はサポートされていません:', normalized);
      setPendingRotation(() => 0);
      setRotation(() => 0);
      return;
    }

    if (normalized === 0) {
      setPendingRotation(() => 0);
      setRotation(() => 0);
      return;
    }

    const filePath = currentImageFilePath();
    if (!filePath) {
      console.warn('[Rotation] 実ファイルパスが設定されていないため、回転処理をスキップします');
      setPendingRotation(() => 0);
      return;
    }

    setIsRotating(true);
    try {
      await invoke('rotate_image', { imagePath: filePath, rotationAngle: normalized });
      updateCurrentImageAssetPath(convertFileToAssetUrlWithCacheBust(filePath));
    } catch (error) {
      console.error('[Rotation] 画像の回転に失敗しました', error);
    } finally {
      applyResidualRotation(total);
      setIsRotating(false);

      if (pendingRotation() !== 0) {
        if (pendingFlush) {
          pendingFlush = false;
          void performRotation();
        } else {
          scheduleRotationFlush();
        }
      } else {
        setRotation(() => 0);
      }
    }
  };

  const flushRotationQueue = async (): Promise<void> => {
    clearRotationTimer();
    if (isRotating()) {
      pendingFlush = true;
      return;
    }
    await performRotation();
  };

  const enqueueRotation = (increment: number) => {
    if (increment === 0) {
      return;
    }

    setPendingRotation((prev) => prev + increment);
    setRotation((prev) => normalizeRotation(prev + increment));
    scheduleRotationFlush();
  };

  const setCurrentImagePath = (path: string, options?: SetImagePathOptions) => {
    updateCurrentImageAssetPath(path);

    if (options && Object.prototype.hasOwnProperty.call(options, 'filePath')) {
      setCurrentImageFilePath(options.filePath ?? null);
    }

    if (!options?.preserveQueue) {
      resetRotationQueue();
    }
  };
  
  //画像のシーケンシャル読み込み
  const loadImageBySequence = async (
    resolvePath: (current: string) => Promise<string | null>
  ): Promise<boolean> => {
    const filePath = currentImageFilePath();
    if (!filePath) {
      console.warn('[Navigation] 現在の画像ファイルパスが設定されていません');
      return false;
    }

    const nextPath = await resolvePath(filePath);
    if (!nextPath) {
      console.warn('[Navigation] 次/前の画像が取得できませんでした');
      return false;
    }

    setZoomScale(1);
    setCurrentImagePath(convertFileToAssetUrlWithCacheBust(nextPath), { filePath: nextPath });
    return true;
  };

  const loadNextImage = async (): Promise<boolean> => {
    return loadImageBySequence((current: string) => fetchNextImagePath(current, true));
  };

  const loadPreviousImage = async (): Promise<boolean> => {
    return loadImageBySequence((current: string) => fetchPreviousImagePath(current, true));
  };

  createThemeController(theme);

  onMount(() => {
    const savedTheme = localStorage.getItem('vdi-theme');
    if (isThemeKey(savedTheme)) {
      setTheme(savedTheme);
    }

    // グリッド永続化設定を復元
    const savedGridPersist = localStorage.getItem('vdi-grid-persist');
    const persistEnabled = savedGridPersist === 'true';
    setGridPersistEnabled(persistEnabled);

    // 永続化が有効な場合はパターンを復元
    if (persistEnabled) {
      const savedGridPattern = localStorage.getItem('vdi-grid-pattern');
      if (savedGridPattern && ['off', '3x3', '5x3', '4x4'].includes(savedGridPattern)) {
        setGridPattern(savedGridPattern as GridPattern);
      }
    }

    // ホイール感度設定を復元
    const savedWheelSensitivity = localStorage.getItem('vdi-wheel-sensitivity');
    if (savedWheelSensitivity) {
      const sensitivity = parseFloat(savedWheelSensitivity);
      if (!isNaN(sensitivity)) {
        setWheelSensitivity(Math.max(CONFIG.zoom.minWheelSensitivity, Math.min(CONFIG.zoom.maxWheelSensitivity, sensitivity)));
      }
    }

    // フォーカスピーキング設定を復元
    const savedPeakingEnabled = localStorage.getItem('vdi-peaking-enabled');
    if (savedPeakingEnabled !== null) {
      setPeakingEnabled(savedPeakingEnabled === 'true');
    }

    const savedPeakingIntensity = localStorage.getItem('vdi-peaking-intensity');
    if (savedPeakingIntensity) {
      const intensity = parseInt(savedPeakingIntensity, 10);
      if (!Number.isNaN(intensity)) {
        setPeakingIntensity(intensity);
      }
    }

    const savedPeakingColor = localStorage.getItem('vdi-peaking-color');
    if (savedPeakingColor) {
      setPeakingColor(savedPeakingColor);
    }

    const savedPeakingOpacity = localStorage.getItem('vdi-peaking-opacity');
    if (savedPeakingOpacity) {
      const opacity = parseFloat(savedPeakingOpacity);
      if (!Number.isNaN(opacity)) {
        setPeakingOpacity(opacity);
      }
    }

    const savedPeakingBlink = localStorage.getItem('vdi-peaking-blink');
    if (savedPeakingBlink !== null) {
      setPeakingBlink(savedPeakingBlink === 'true');
    }

    // ヒストグラム設定を復元
    const savedHistogramEnabled = localStorage.getItem('vdi-histogram-enabled');
    if (savedHistogramEnabled !== null) {
      setHistogramEnabled(savedHistogramEnabled === 'true');
    }

    const savedHistogramDisplayType = localStorage.getItem('vdi-histogram-display-type');
    if (savedHistogramDisplayType && (savedHistogramDisplayType === 'rgb' || savedHistogramDisplayType === 'luminance')) {
      setHistogramDisplayType(savedHistogramDisplayType);
    }

    const savedHistogramPosition = localStorage.getItem('vdi-histogram-position');
    if (savedHistogramPosition && ['top-right', 'top-left', 'bottom-right', 'bottom-left'].includes(savedHistogramPosition)) {
      setHistogramPosition(savedHistogramPosition as 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left');
    }

    const savedHistogramSize = localStorage.getItem('vdi-histogram-size');
    if (savedHistogramSize) {
      const size = parseFloat(savedHistogramSize);
      if (!isNaN(size)) {
        setHistogramSize(Math.max(CONFIG.histogram.minSize, Math.min(CONFIG.histogram.maxSize, size)));
      }
    }

    const savedHistogramOpacity = localStorage.getItem('vdi-histogram-opacity');
    if (savedHistogramOpacity) {
      const opacity = parseFloat(savedHistogramOpacity);
      if (!isNaN(opacity)) {
        setHistogramOpacity(Math.max(CONFIG.histogram.minOpacity, Math.min(CONFIG.histogram.maxOpacity, opacity)));
      }
    }

    // ファイルパス表示形式設定を復元
    const savedShowFullPath = localStorage.getItem('vdi-show-full-path');
    if (savedShowFullPath !== null) {
      setShowFullPathSignal(savedShowFullPath === 'true');
    }

    // VirtualDesktopモード設定を復元
    const savedVirtualDesktopMode = localStorage.getItem('vdi-virtualdesktop-mode');
    if (savedVirtualDesktopMode !== null) {
      setVirtualdesktopModeSignal(savedVirtualDesktopMode === 'true');
    }

    // コントローラーバインディング設定を復元
    const savedControllerBindings = localStorage.getItem('vdi-controller-bindings');
    if (savedControllerBindings) {
      try {
        const bindings = JSON.parse(savedControllerBindings);
        setControllerBindingsSignal(bindings);
      } catch (e) {
        console.error('Failed to parse controller bindings:', e);
      }
    }

    setCurrentImagePath('public/sen38402160.png', { filePath: null });
  });

  onCleanup(() => {
    clearRotationTimer();
    pendingFlush = false;
  });

  const handleThemeChange = (newTheme: ThemeKey) => {
    setTheme(newTheme);
    localStorage.setItem('vdi-theme', newTheme);
  };

  const handleGridPatternChange = (pattern: GridPattern) => {
    setGridPattern(pattern);
    if (gridPersistEnabled()) {
      localStorage.setItem('vdi-grid-pattern', pattern);
    }
  };

  const handleGridPersistChange = (enabled: boolean) => {
    setGridPersistEnabled(enabled);
    localStorage.setItem('vdi-grid-persist', enabled ? 'true' : 'false');

    if (enabled) {
      // 有効化時は現在のパターンを保存
      localStorage.setItem('vdi-grid-pattern', gridPattern());
    } else {
      // 無効化時はグリッドをoffにしてストレージをクリア
      setGridPattern('off');
      localStorage.removeItem('vdi-grid-pattern');
    }
  };

  const handleWheelSensitivityChange = (sensitivity: number) => {
    const clampedSensitivity = Math.max(CONFIG.zoom.minWheelSensitivity, Math.min(CONFIG.zoom.maxWheelSensitivity, sensitivity));
    setWheelSensitivity(clampedSensitivity);
    localStorage.setItem('vdi-wheel-sensitivity', clampedSensitivity.toString());
  };

  const handleHistogramEnabledChange = (enabled: boolean) => {
    setHistogramEnabled(enabled);
    localStorage.setItem('vdi-histogram-enabled', enabled ? 'true' : 'false');
  };

  const handleHistogramDisplayTypeChange = (type: 'rgb' | 'luminance') => {
    setHistogramDisplayType(type);
    localStorage.setItem('vdi-histogram-display-type', type);
  };

  const handleHistogramPositionChange = (position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left') => {
    setHistogramPosition(position);
    localStorage.setItem('vdi-histogram-position', position);
  };

  const handleHistogramSizeChange = (size: number) => {
    const clampedSize = Math.max(CONFIG.histogram.minSize, Math.min(CONFIG.histogram.maxSize, size));
    setHistogramSize(clampedSize);
    localStorage.setItem('vdi-histogram-size', clampedSize.toString());
  };

  const handleHistogramOpacityChange = (opacity: number) => {
    const clampedOpacity = Math.max(CONFIG.histogram.minOpacity, Math.min(CONFIG.histogram.maxOpacity, opacity));
    setHistogramOpacity(clampedOpacity);
    localStorage.setItem('vdi-histogram-opacity', clampedOpacity.toString());
  };

  const handleShowFullPathChange = (show: boolean) => {
    setShowFullPathSignal(show);
    localStorage.setItem('vdi-show-full-path', show ? 'true' : 'false');
  };

  const handleVirtualDesktopModeChange = (enabled: boolean) => {
    setVirtualdesktopModeSignal(enabled);
    localStorage.setItem('vdi-virtualdesktop-mode', enabled ? 'true' : 'false');
  };

  const handleControllerDetectedChange = (detected: boolean) => {
    setControllerDetectedSignal(detected);
  };

  const handleControllerBindingsChange = (config: ControllerConfig) => {
    setControllerBindingsSignal(config);
    localStorage.setItem('vdi-controller-bindings', JSON.stringify(config));
  };

  const appState: AppState = {
    currentImagePath,
    currentImageFilePath,
    setCurrentImagePath,
    zoomScale,
    setZoomScale,
    rotation,
    setRotation,
    pendingRotation,
    enqueueRotation,
    flushRotationQueue,
    isRotationInProgress: isRotating,
    theme,
    setTheme: handleThemeChange,
    loadNextImage,
    loadPreviousImage,
    gridPattern,
    setGridPattern: handleGridPatternChange,
    gridOpacity,
    setGridOpacity,
    gridPersistEnabled,
    setGridPersistEnabled: handleGridPersistChange,
    peakingEnabled,
    setPeakingEnabled,
    peakingIntensity,
    setPeakingIntensity,
    peakingColor,
    setPeakingColor,
    peakingOpacity,
    setPeakingOpacity,
    peakingBlink,
    setPeakingBlink,
    wheelSensitivity,
    setWheelSensitivity: handleWheelSensitivityChange,
    histogramEnabled,
    setHistogramEnabled: handleHistogramEnabledChange,
    histogramDisplayType,
    setHistogramDisplayType: handleHistogramDisplayTypeChange,
    histogramPosition,
    setHistogramPosition: handleHistogramPositionChange,
    histogramSize,
    setHistogramSize: handleHistogramSizeChange,
    histogramOpacity,
    setHistogramOpacity: handleHistogramOpacityChange,
    imageResolution,
    setImageResolution,
    showFullPath,
    setShowFullPath: handleShowFullPathChange,
    virtualdesktopMode,
    setVirtualDesktopMode: handleVirtualDesktopModeChange,
    controllerDetected,
    setControllerDetected: handleControllerDetectedChange,
    controllerBindings,
    setControllerBindings: handleControllerBindingsChange,
  };

  return (
    <AppContext.Provider value={appState}>{props.children}</AppContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
};
