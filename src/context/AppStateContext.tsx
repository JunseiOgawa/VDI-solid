import type { ParentComponent } from 'solid-js';
import { createContext, createSignal, onCleanup, onMount, useContext } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import { convertFileToAssetUrlWithCacheBust } from '../lib/fileUtils';
import { createThemeController, isThemeKey, type ThemeKey } from '../lib/theme';

// 画像回転のためのrust関数の呼び出しに使用するオプション
interface SetImagePathOptions {
  filePath?: string | null;
  preserveQueue?: boolean;
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

  createThemeController(theme);

  onMount(() => {
    const savedTheme = localStorage.getItem('vdi-theme');
    if (isThemeKey(savedTheme)) {
      setTheme(savedTheme);
    }
    setCurrentImagePath('public/sen19201080.png', { filePath: null });
  });

  onCleanup(() => {
    clearRotationTimer();
    pendingFlush = false;
  });

  const handleThemeChange = (newTheme: ThemeKey) => {
    setTheme(newTheme);
    localStorage.setItem('vdi-theme', newTheme);
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
