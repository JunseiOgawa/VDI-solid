import type { Component } from "solid-js";
import { onMount, onCleanup, lazy, Suspense } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

import Titlebar from "./components/Titlebar";
import ImageViewer from "./components/ImageViewer";
import Footer from "./components/Footer";
import { AppProvider, useAppState } from "./context/AppStateContext";
import { profiler } from "./lib/performanceProfiler";

// 遅延ロードコンポーネント
const ImageGallery = lazy(() => import("./components/ImageGallery"));
const SettingsMenuPreload = lazy(() => import("./components/SettingsMenu"));
import { handleScreenFit } from "./lib/screenfit";
import { callResetImagePosition, callZoomToCenter } from "./lib/imageViewerApi";
import { convertFileToAssetUrlWithCacheBust } from "./lib/fileUtils";
import { expandWindowForGallery, contractWindowForGallery } from "./lib/tauri";
import { updateManager } from "./services/UpdateManager";

import "./App.css";

/**
 * メインコンテンツコンポーネント
 */
const AppContent: Component = () => {
  const {
    showGallery,
    setShowGallery,
    setZoomScale,
    currentImageFilePath,
    setCurrentImagePath,
  } = useAppState();

  /**
   * 画像選択時のハンドラー
   */
  const handleImageSelect = async (imagePath: string) => {
    setZoomScale(1);
    setCurrentImagePath(convertFileToAssetUrlWithCacheBust(imagePath), {
      filePath: imagePath,
    });

    // ギャラリーを閉じる前に状態を更新
    setShowGallery(false);

    // トランジション完了を待ってからウィンドウを縮小
    await new Promise((resolve) => setTimeout(resolve, 300));
    await contractWindowForGallery();
  };

  return (
    <>
      <main class="flex flex-1 flex-row overflow-hidden min-h-0">
        {/* ギャラリーサイドバー(遅延ロード) */}
        <Suspense fallback={<div />}>
          <ImageGallery
            isOpen={showGallery()}
            onClose={async () => {
              setShowGallery(false);
              await new Promise((resolve) => setTimeout(resolve, 300));
              await contractWindowForGallery();
            }}
            currentImagePath={currentImageFilePath()}
            onImageSelect={handleImageSelect}
          />
        </Suspense>
        <ImageViewer />
      </main>
      <Footer />
    </>
  );
};

const AppMain: Component = () => {
  const {
    showGallery,
    setShowGallery,
    zoomScale,
    setZoomScale,
    theme,
    setTheme,
    enqueueRotation,
    gridPattern,
    setGridPattern,
    gridOpacity,
    setGridOpacity,
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
    setWheelSensitivity,
    histogramEnabled,
    setHistogramEnabled,
    histogramDisplayType,
    setHistogramDisplayType,
    histogramPosition,
    setHistogramPosition,
    histogramSize,
    setHistogramSize,
    histogramOpacity,
    setHistogramOpacity,
    lutEnabled,
    setLutEnabled,
    lutOpacity,
    setLutOpacity,
    lutFileName,
    currentLutPath,
    lutHistory,
    loadLutFromHistory,
    removeLutFromHistory,
    handleLutFileSelect,
    showFullPath,
    setShowFullPath,
    controlPanelPosition,
    setControlPanelPosition,
  } = useAppState();

  /**
   * ズームイン（画面中央を基準に）
   */
  const handleZoomIn = () => {
    const newScale = zoomScale() * 1.2;
    callZoomToCenter(newScale);
  };

  /**
   * ズームアウト（画面中央を基準に）
   */
  const handleZoomOut = () => {
    const newScale = zoomScale() / 1.2;
    callZoomToCenter(newScale);
  };

  /**
   * ズームリセット
   */
  const handleZoomReset = () => {
    setZoomScale(1);
    try {
      callResetImagePosition();
    } catch (e) {
      // ignore
    }
  };

  /**
   * 画面フィット
   */
  const handleScreenFitClick = () => {
    try {
      handleScreenFit();
    } catch (e) {
      // ignore
    }
  };

  /**
   * 回転
   */
  const handleRotate = () => {
    enqueueRotation(90);
  };

  /**
   * ギャラリーの開閉をウィンドウリサイズと連動させる
   */
  const handleToggleGallery = async (open: boolean) => {
    if (open) {
      // ギャラリーを開く: ウィンドウを拡張してからギャラリーを表示
      await expandWindowForGallery();
      requestAnimationFrame(() => {
        setShowGallery(true);
      });
    } else {
      // ギャラリーを閉じる: ギャラリーを非表示にしてからウィンドウを縮小
      setShowGallery(false);
      await new Promise((resolve) => setTimeout(resolve, 300)); // トランジション待ち
      await contractWindowForGallery();
    }
  };

  return (
    <div class="flex h-screen flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
      <Titlebar
        showGallery={showGallery()}
        onToggleGallery={handleToggleGallery}
        zoomScale={zoomScale()}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onScreenFit={handleScreenFitClick}
        onRotate={handleRotate}
        gridPattern={gridPattern()}
        onGridPatternChange={setGridPattern}
        gridOpacity={gridOpacity()}
        onGridOpacityChange={setGridOpacity}
        peakingEnabled={peakingEnabled()}
        onPeakingEnabledChange={setPeakingEnabled}
        peakingIntensity={peakingIntensity()}
        onPeakingIntensityChange={setPeakingIntensity}
        peakingColor={peakingColor()}
        onPeakingColorChange={setPeakingColor}
        peakingOpacity={peakingOpacity()}
        onPeakingOpacityChange={setPeakingOpacity}
        peakingBlink={peakingBlink()}
        onPeakingBlinkChange={setPeakingBlink}
        lutEnabled={lutEnabled()}
        onLutEnabledChange={setLutEnabled}
        lutOpacity={lutOpacity()}
        onLutOpacityChange={setLutOpacity}
        lutFileName={lutFileName()}
        currentLutPath={currentLutPath()}
        lutHistory={lutHistory()}
        onLutFileSelect={handleLutFileSelect}
        onLutLoadFromHistory={(filePath) => void loadLutFromHistory(filePath)}
        onLutRemoveFromHistory={removeLutFromHistory}
        histogramEnabled={histogramEnabled()}
        onHistogramEnabledChange={setHistogramEnabled}
        histogramDisplayType={histogramDisplayType()}
        onHistogramDisplayTypeChange={setHistogramDisplayType}
        histogramPosition={histogramPosition()}
        onHistogramPositionChange={setHistogramPosition}
        histogramSize={histogramSize()}
        onHistogramSizeChange={setHistogramSize}
        histogramOpacity={histogramOpacity()}
        onHistogramOpacityChange={setHistogramOpacity}
        theme={theme()}
        onThemeChange={setTheme}
        wheelSensitivity={wheelSensitivity()}
        onWheelSensitivityChange={setWheelSensitivity}
        showFullPath={showFullPath()}
        onShowFullPathChange={setShowFullPath}
        controlPanelPosition={controlPanelPosition()}
        onControlPanelPositionChange={setControlPanelPosition}
      />
      <AppContent />
    </div>
  );
};

const App: Component = () => {
  // App コンポーネント初期化開始
  profiler.mark("app-component-start");

  // UIがマウントされた後にウィンドウを表示
  onMount(() => {
    profiler.mark("app-onmount-start");

    // queueMicrotaskで可能な限り早くウィンドウを表示
    queueMicrotask(async () => {
      profiler.mark("show-window-prep");

      try {
        profiler.mark("show-window-call-start");
        await invoke("show_window");
        profiler.mark("show-window-call-end");
        profiler.measureFromMark(
          "show-window-ipc-duration",
          "show-window-call-start",
        );

        // ウィンドウ表示後にアップデートチェックを実行
        // 起動速度に影響しないよう、さらに遅延させる
        setTimeout(() => {
          updateManager.loadLastCheckTime();

          // タイムアウト付きでバックグラウンドチェック
          const updateCheckTimeout = setTimeout(() => {
            console.warn("[App] アップデートチェックがタイムアウトしました");
          }, 10000); // 10秒タイムアウト

          updateManager
            .checkForUpdatesBackground()
            .catch((error) => {
              console.error("[App] アップデートチェック失敗:", error);
            })
            .finally(() => {
              clearTimeout(updateCheckTimeout);
            });
        }, 3000); // ウィンドウ表示から3秒後に実行(起動速度優先)

        // SettingsMenuを3秒後にプリロード(初回開く際の遅延を防ぐ)
        setTimeout(() => {
          // プリロード用のダミーコンポーネントをレンダリング
          const preloadDiv = document.createElement("div");
          preloadDiv.style.display = "none";
          document.body.appendChild(preloadDiv);
          SettingsMenuPreload.preload();
          console.log("[App] SettingsMenuをプリロードしました");
        }, 3000);
      } catch (err) {
        console.error("Failed to show window:", err);
      }
    });

    // F11キーでフルスクリーン切り替え
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.key === "F11") {
        event.preventDefault();
        const appWindow = getCurrentWindow();
        try {
          const isFullscreen = await appWindow.isFullscreen();
          await appWindow.setFullscreen(!isFullscreen);
          console.log(
            `[App] F11 pressed - Toggled fullscreen: ${!isFullscreen}`,
          );
        } catch (error) {
          console.error("[App] Failed to toggle fullscreen:", error);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    onCleanup(() => {
      document.removeEventListener("keydown", handleKeyDown);
    });

    profiler.mark("app-onmount-end");
    profiler.measureFromMark(
      "app-onmount-duration",
      "app-onmount-start",
    );

    // 起動プロセス全体の計測
    profiler.measureFromMark(
      "total-startup-time",
      "html-start",
    );

    // レポートを出力(2秒後、安定してから)
    setTimeout(() => {
      profiler.printReport();
      console.log("[Profiler] JSON Report:", profiler.exportToJSON());
    }, 2000);
  });

  return (
    <AppProvider>
      <AppMain />
    </AppProvider>
  );
};

export default App;
