import type { ParentComponent } from "solid-js";
import {
  createContext,
  createSignal,
  onCleanup,
  onMount,
  useContext,
  createMemo,
} from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { convertFileToAssetUrlWithCacheBust } from "../lib/fileUtils";
import { fetchNextImagePath, fetchPreviousImagePath } from "../lib/tauri";
import { clampIntensity, clampOpacity } from "../lib/peakingUtils";
import { createThemeController, isThemeKey, type ThemeKey } from "../lib/theme";
import { CONFIG } from "../config/config";
import { getLaunchConfig } from "../lib/launchConfig";
import {
  type Locale,
  type Translation,
  translations,
  getInitialLocale,
  saveLocaleToStorage,
  getValue,
  interpolate,
} from "../locales";

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
export type GridPattern = "off" | "3x3" | "5x3" | "4x4";

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
  histogramDisplayType: () => "rgb" | "luminance";
  /** ヒストグラム表示タイプを設定 */
  setHistogramDisplayType: (type: "rgb" | "luminance") => void;
  /** ヒストグラム表示位置 */
  histogramPosition: () =>
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left";
  /** ヒストグラム表示位置を設定 */
  setHistogramPosition: (
    position: "top-right" | "top-left" | "bottom-right" | "bottom-left",
  ) => void;
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
  setImageResolution: (
    resolution: { width: number; height: number } | null,
  ) => void;

  // ファイルサイズ関連
  /** 画像ファイルのサイズをバイト単位で取得 */
  imageFileSize: () => number | null;
  /** 画像ファイルのサイズを設定 */
  setImageFileSize: (size: number | null) => void;

  // ファイルパス表示形式関連
  /** フルパス表示の有効/無効（true: フルパス, false: ファイル名のみ） */
  showFullPath: () => boolean;
  /** フルパス表示の有効/無効を設定 */
  setShowFullPath: (show: boolean) => void;

  // コントロールパネル位置関連
  /** コントロールパネルの表示位置 (top: タイトルバー付近中央, bottom: 画面下部中央) */
  controlPanelPosition: () => "top" | "bottom";
  /** コントロールパネルの表示位置を設定 */
  setControlPanelPosition: (position: "top" | "bottom") => void;

  // ギャラリー表示関連
  /** ギャラリーサイドバーの表示/非表示 */
  showGallery: () => boolean;
  /** ギャラリーサイドバーの表示/非表示を設定 */
  setShowGallery: (show: boolean) => void;

  // 国際化(i18n)関連
  /** 現在のロケール(言語設定) */
  locale: () => Locale;
  /** ロケール(言語設定)を設定 */
  setLocale: (locale: Locale) => void;
  /** 翻訳関数(キーから翻訳テキストを取得) */
  t: (key: string, vars?: Record<string, string | number>) => string;
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
  const [currentImagePath, _setCurrentImagePath] = createSignal<string>("");
  const [currentImageFilePath, setCurrentImageFilePath] = createSignal<
    string | null
  >(null);
  const [zoomScale, setZoomScale] = createSignal<number>(1);
  const [rotation, setRotation] = createSignal<number>(0);
  const [pendingRotation, setPendingRotation] = createSignal<number>(0);
  const [isRotating, setIsRotating] = createSignal<boolean>(false);
  const [theme, setTheme] = createSignal<ThemeKey>("auto");
  /** グリッド表示パターンの状態管理（初期値: 'off'） */
  const [gridPattern, setGridPattern] = createSignal<GridPattern>("off");
  /** グリッド線の不透明度（0.0-1.0、初期値は CONFIG から取得） */
  const [gridOpacity, setGridOpacity] = createSignal<number>(
    CONFIG.grid.defaultOpacity,
  );
  /** グリッドの永続化を有効化するかのフラグ */
  const [gridPersistEnabled, setGridPersistEnabled] =
    createSignal<boolean>(false);

  // ピーキング関連Signal（新規追加）
  const [peakingEnabled, setPeakingEnabledSignal] =
    createSignal<boolean>(false);
  const [peakingIntensity, setPeakingIntensitySignal] =
    createSignal<number>(60);
  const [peakingColor, setPeakingColorSignal] = createSignal<string>("lime");
  const [peakingOpacity, setPeakingOpacitySignal] = createSignal<number>(0.5);
  const [peakingBlink, setPeakingBlinkSignal] = createSignal<boolean>(false);

  // ホイール感度関連Signal
  const [wheelSensitivity, setWheelSensitivity] = createSignal<number>(
    CONFIG.zoom.wheelSensitivity,
  );

  // ヒストグラム関連Signal
  const [histogramEnabled, setHistogramEnabled] = createSignal<boolean>(
    CONFIG.histogram.enabled,
  );
  const [histogramDisplayType, setHistogramDisplayType] = createSignal<
    "rgb" | "luminance"
  >(CONFIG.histogram.displayType);
  const [histogramPosition, setHistogramPosition] = createSignal<
    "top-right" | "top-left" | "bottom-right" | "bottom-left"
  >(CONFIG.histogram.position);
  const [histogramSize, setHistogramSize] = createSignal<number>(
    CONFIG.histogram.size,
  );
  const [histogramOpacity, setHistogramOpacity] = createSignal<number>(
    CONFIG.histogram.opacity,
  );

  // 画像解像度関連Signal
  const [imageResolution, setImageResolution] = createSignal<{
    width: number;
    height: number;
  } | null>(null);

  // ファイルサイズ関連Signal
  const [imageFileSize, setImageFileSize] = createSignal<number | null>(null);

  // ファイルパス表示形式関連Signal（デフォルト: false = ファイル名のみ）
  const [showFullPath, setShowFullPathSignal] = createSignal<boolean>(false);

  // コントロールパネル位置関連Signal
  const [controlPanelPosition, setControlPanelPositionSignal] = createSignal<
    "top" | "bottom"
  >("top");

  // ギャラリー表示関連Signal
  const [showGallery, setShowGallerySignal] = createSignal<boolean>(false);

  // 国際化(i18n)関連Signal
  const [locale, setLocaleSignal] = createSignal<Locale>(getInitialLocale());

  // 現在のロケールに応じた翻訳リソースを取得
  const currentTranslation = createMemo<Translation>(
    () => translations[locale()],
  );

  // 翻訳関数
  const t = (key: string, vars?: Record<string, string | number>): string => {
    const template = getValue(currentTranslation(), key, key);
    return interpolate(template, vars);
  };

  // ピーキング設定の永続化付きセッター
  const setPeakingEnabled = (enabled: boolean) => {
    setPeakingEnabledSignal(enabled);
    localStorage.setItem("vdi-peaking-enabled", enabled ? "true" : "false");
  };

  const setPeakingIntensity = (intensity: number) => {
    const clampedIntensity = clampIntensity(intensity);
    setPeakingIntensitySignal(clampedIntensity);
    localStorage.setItem("vdi-peaking-intensity", clampedIntensity.toString());
  };

  const setPeakingColor = (color: string) => {
    setPeakingColorSignal(color);
    localStorage.setItem("vdi-peaking-color", color);
  };

  const setPeakingOpacity = (opacity: number) => {
    const clampedOpacityValue = clampOpacity(opacity);
    setPeakingOpacitySignal(clampedOpacityValue);
    localStorage.setItem("vdi-peaking-opacity", clampedOpacityValue.toString());
  };

  const setPeakingBlink = (enabled: boolean) => {
    setPeakingBlinkSignal(enabled);
    localStorage.setItem("vdi-peaking-blink", enabled ? "true" : "false");
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
      console.warn(
        "[Rotation] 90度単位以外の回転はサポートされていません:",
        normalized,
      );
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
      console.warn(
        "[Rotation] 実ファイルパスが設定されていないため、回転処理をスキップします",
      );
      setPendingRotation(() => 0);
      return;
    }

    setIsRotating(true);
    try {
      await invoke("rotate_image", {
        imagePath: filePath,
        rotationAngle: normalized,
      });
      updateCurrentImageAssetPath(convertFileToAssetUrlWithCacheBust(filePath));
    } catch (error) {
      console.error("[Rotation] 画像の回転に失敗しました", error);
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

    if (options && Object.prototype.hasOwnProperty.call(options, "filePath")) {
      setCurrentImageFilePath(options.filePath ?? null);

      // ファイルパスが設定されたときにファイルサイズを取得
      const filePath = options.filePath;
      if (filePath) {
        invoke<number>("get_file_size", { filePath })
          .then((size) => {
            setImageFileSize(size);
          })
          .catch((error) => {
            console.error("[AppStateContext] Failed to get file size:", error);
            setImageFileSize(null);
          });
      } else {
        setImageFileSize(null);
      }
    }

    if (!options?.preserveQueue) {
      resetRotationQueue();
    }
  };

  //画像のシーケンシャル読み込み
  const loadImageBySequence = async (
    resolvePath: (current: string) => Promise<string | null>,
  ): Promise<boolean> => {
    const filePath = currentImageFilePath();
    if (!filePath) {
      console.warn("[Navigation] 現在の画像ファイルパスが設定されていません");
      return false;
    }

    const nextPath = await resolvePath(filePath);
    if (!nextPath) {
      console.warn("[Navigation] 次/前の画像が取得できませんでした");
      return false;
    }

    setZoomScale(1);
    setCurrentImagePath(convertFileToAssetUrlWithCacheBust(nextPath), {
      filePath: nextPath,
    });
    return true;
  };

  const loadNextImage = async (): Promise<boolean> => {
    return loadImageBySequence((current: string) =>
      fetchNextImagePath(current, true),
    );
  };

  const loadPreviousImage = async (): Promise<boolean> => {
    return loadImageBySequence((current: string) =>
      fetchPreviousImagePath(current, true),
    );
  };

  // テーマ設定をできるだけ早く読み込む(ウィンドウ表示前に実行)
  const savedTheme = typeof localStorage !== "undefined" ? localStorage.getItem("vdi-theme") : null;
  if (isThemeKey(savedTheme)) {
    setTheme(savedTheme);
  }

  createThemeController(theme);

  onMount(async () => {
    // コマンドライン引数から起動設定を取得
    const launchConfig = await getLaunchConfig();

    // グリッド永続化設定を復元
    const savedGridPersist = localStorage.getItem("vdi-grid-persist");
    const persistEnabled = savedGridPersist === "true";
    setGridPersistEnabled(persistEnabled);

    // グリッドパターンの適用（コマンドライン引数 > localStorage）
    if (launchConfig.gridPattern !== undefined) {
      setGridPattern(launchConfig.gridPattern);
    } else if (persistEnabled) {
      const savedGridPattern = localStorage.getItem("vdi-grid-pattern");
      if (
        savedGridPattern &&
        ["off", "3x3", "5x3", "4x4"].includes(savedGridPattern)
      ) {
        setGridPattern(savedGridPattern as GridPattern);
      }
    }

    // グリッド不透明度の適用（コマンドライン引数 > localStorage）
    if (launchConfig.gridOpacity !== undefined) {
      setGridOpacity(launchConfig.gridOpacity);
    }

    // ホイール感度設定を復元
    const savedWheelSensitivity = localStorage.getItem("vdi-wheel-sensitivity");
    if (savedWheelSensitivity) {
      const sensitivity = parseFloat(savedWheelSensitivity);
      if (!isNaN(sensitivity)) {
        setWheelSensitivity(
          Math.max(
            CONFIG.zoom.minWheelSensitivity,
            Math.min(CONFIG.zoom.maxWheelSensitivity, sensitivity),
          ),
        );
      }
    }

    // ピーキング有効/無効の適用（コマンドライン引数 > localStorage）
    if (launchConfig.peakingEnabled !== undefined) {
      setPeakingEnabled(launchConfig.peakingEnabled);
    } else {
      const savedPeakingEnabled = localStorage.getItem("vdi-peaking-enabled");
      if (savedPeakingEnabled !== null) {
        setPeakingEnabled(savedPeakingEnabled === "true");
      }
    }

    // ピーキング閾値の適用（コマンドライン引数 > localStorage）
    if (launchConfig.peakingIntensity !== undefined) {
      setPeakingIntensity(launchConfig.peakingIntensity);
    } else {
      const savedPeakingIntensity = localStorage.getItem(
        "vdi-peaking-intensity",
      );
      if (savedPeakingIntensity) {
        const intensity = parseInt(savedPeakingIntensity, 10);
        if (!Number.isNaN(intensity)) {
          setPeakingIntensity(intensity);
        }
      }
    }

    // ピーキング色の適用（コマンドライン引数 > localStorage）
    if (launchConfig.peakingColor !== undefined) {
      setPeakingColor(launchConfig.peakingColor);
    } else {
      const savedPeakingColor = localStorage.getItem("vdi-peaking-color");
      if (savedPeakingColor) {
        setPeakingColor(savedPeakingColor);
      }
    }

    // ピーキング不透明度の適用（コマンドライン引数 > localStorage）
    if (launchConfig.peakingOpacity !== undefined) {
      setPeakingOpacity(launchConfig.peakingOpacity);
    } else {
      const savedPeakingOpacity = localStorage.getItem("vdi-peaking-opacity");
      if (savedPeakingOpacity) {
        const opacity = parseFloat(savedPeakingOpacity);
        if (!Number.isNaN(opacity)) {
          setPeakingOpacity(opacity);
        }
      }
    }

    // ピーキング点滅の適用（コマンドライン引数 > localStorage）
    if (launchConfig.peakingBlink !== undefined) {
      setPeakingBlink(launchConfig.peakingBlink);
    } else {
      const savedPeakingBlink = localStorage.getItem("vdi-peaking-blink");
      if (savedPeakingBlink !== null) {
        setPeakingBlink(savedPeakingBlink === "true");
      }
    }

    // ヒストグラム設定を復元
    const savedHistogramEnabled = localStorage.getItem("vdi-histogram-enabled");
    if (savedHistogramEnabled !== null) {
      setHistogramEnabled(savedHistogramEnabled === "true");
    }

    const savedHistogramDisplayType = localStorage.getItem(
      "vdi-histogram-display-type",
    );
    if (
      savedHistogramDisplayType &&
      (savedHistogramDisplayType === "rgb" ||
        savedHistogramDisplayType === "luminance")
    ) {
      setHistogramDisplayType(savedHistogramDisplayType);
    }

    const savedHistogramPosition = localStorage.getItem(
      "vdi-histogram-position",
    );
    if (
      savedHistogramPosition &&
      ["top-right", "top-left", "bottom-right", "bottom-left"].includes(
        savedHistogramPosition,
      )
    ) {
      setHistogramPosition(
        savedHistogramPosition as
          | "top-right"
          | "top-left"
          | "bottom-right"
          | "bottom-left",
      );
    }

    const savedHistogramSize = localStorage.getItem("vdi-histogram-size");
    if (savedHistogramSize) {
      const size = parseFloat(savedHistogramSize);
      if (!isNaN(size)) {
        setHistogramSize(
          Math.max(
            CONFIG.histogram.minSize,
            Math.min(CONFIG.histogram.maxSize, size),
          ),
        );
      }
    }

    const savedHistogramOpacity = localStorage.getItem("vdi-histogram-opacity");
    if (savedHistogramOpacity) {
      const opacity = parseFloat(savedHistogramOpacity);
      if (!isNaN(opacity)) {
        setHistogramOpacity(
          Math.max(
            CONFIG.histogram.minOpacity,
            Math.min(CONFIG.histogram.maxOpacity, opacity),
          ),
        );
      }
    }

    // ファイルパス表示形式設定を復元
    const savedShowFullPath = localStorage.getItem("vdi-show-full-path");
    if (savedShowFullPath !== null) {
      setShowFullPathSignal(savedShowFullPath === "true");
    }

    // コントロールパネル位置設定を復元
    const savedControlPanelPosition = localStorage.getItem(
      "vdi-control-panel-position",
    );
    if (
      savedControlPanelPosition === "top" ||
      savedControlPanelPosition === "bottom"
    ) {
      setControlPanelPositionSignal(savedControlPanelPosition);
    }

    // 画像パスの適用（コマンドライン引数 > デフォルト画像）
    if (launchConfig.imagePath) {
      const assetUrl = convertFileToAssetUrlWithCacheBust(
        launchConfig.imagePath,
      );
      setCurrentImagePath(assetUrl, { filePath: launchConfig.imagePath });
    } else {
      setCurrentImagePath("public/sen38402160.png", { filePath: null });
    }
  });

  onCleanup(() => {
    clearRotationTimer();
    pendingFlush = false;
  });

  const handleThemeChange = (newTheme: ThemeKey) => {
    setTheme(newTheme);
    localStorage.setItem("vdi-theme", newTheme);
  };

  const handleGridPatternChange = (pattern: GridPattern) => {
    setGridPattern(pattern);
    if (gridPersistEnabled()) {
      localStorage.setItem("vdi-grid-pattern", pattern);
    }
  };

  const handleGridPersistChange = (enabled: boolean) => {
    setGridPersistEnabled(enabled);
    localStorage.setItem("vdi-grid-persist", enabled ? "true" : "false");

    if (enabled) {
      // 有効化時は現在のパターンを保存
      localStorage.setItem("vdi-grid-pattern", gridPattern());
    } else {
      // 無効化時はグリッドをoffにしてストレージをクリア
      setGridPattern("off");
      localStorage.removeItem("vdi-grid-pattern");
    }
  };

  const handleWheelSensitivityChange = (sensitivity: number) => {
    const clampedSensitivity = Math.max(
      CONFIG.zoom.minWheelSensitivity,
      Math.min(CONFIG.zoom.maxWheelSensitivity, sensitivity),
    );
    setWheelSensitivity(clampedSensitivity);
    localStorage.setItem(
      "vdi-wheel-sensitivity",
      clampedSensitivity.toString(),
    );
  };

  const handleHistogramEnabledChange = (enabled: boolean) => {
    setHistogramEnabled(enabled);
    localStorage.setItem("vdi-histogram-enabled", enabled ? "true" : "false");
  };

  const handleHistogramDisplayTypeChange = (type: "rgb" | "luminance") => {
    setHistogramDisplayType(type);
    localStorage.setItem("vdi-histogram-display-type", type);
  };

  const handleHistogramPositionChange = (
    position: "top-right" | "top-left" | "bottom-right" | "bottom-left",
  ) => {
    setHistogramPosition(position);
    localStorage.setItem("vdi-histogram-position", position);
  };

  const handleHistogramSizeChange = (size: number) => {
    const clampedSize = Math.max(
      CONFIG.histogram.minSize,
      Math.min(CONFIG.histogram.maxSize, size),
    );
    setHistogramSize(clampedSize);
    localStorage.setItem("vdi-histogram-size", clampedSize.toString());
  };

  const handleHistogramOpacityChange = (opacity: number) => {
    const clampedOpacity = Math.max(
      CONFIG.histogram.minOpacity,
      Math.min(CONFIG.histogram.maxOpacity, opacity),
    );
    setHistogramOpacity(clampedOpacity);
    localStorage.setItem("vdi-histogram-opacity", clampedOpacity.toString());
  };

  const handleShowFullPathChange = (show: boolean) => {
    setShowFullPathSignal(show);
    localStorage.setItem("vdi-show-full-path", show ? "true" : "false");
  };

  const handleControlPanelPositionChange = (position: "top" | "bottom") => {
    setControlPanelPositionSignal(position);
    localStorage.setItem("vdi-control-panel-position", position);
  };

  const handleShowGalleryChange = (show: boolean) => {
    setShowGallerySignal(show);
  };

  const handleLocaleChange = (newLocale: Locale) => {
    setLocaleSignal(newLocale);
    saveLocaleToStorage(newLocale);
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
    imageFileSize,
    setImageFileSize,
    showFullPath,
    setShowFullPath: handleShowFullPathChange,
    controlPanelPosition,
    setControlPanelPosition: handleControlPanelPositionChange,
    showGallery,
    setShowGallery: handleShowGalleryChange,
    locale,
    setLocale: handleLocaleChange,
    t,
  };

  return (
    <AppContext.Provider value={appState}>{props.children}</AppContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppProvider");
  }
  return context;
};
