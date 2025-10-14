import type { Component } from 'solid-js';
import { onMount } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';

import Titlebar from './components/Titlebar';
import ImageViewer from './components/ImageViewer';
import Footer from './components/Footer';
import FloatingControlPanel from './components/FloatingControlPanel';
import { AppProvider, useAppState } from './context/AppStateContext';
import { handleScreenFit } from './lib/screenfit';
import { callResetImagePosition } from './lib/imageViewerApi';

import './App.css';

/**
 * メインコンテンツコンポーネント
 * FloatingControlPanelに必要なpropsを渡すためのラッパー
 */
const AppContent: Component = () => {
  const {
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
    showFullPath,
    setShowFullPath,
    controlPanelPosition,
    setControlPanelPosition,
  } = useAppState();

  /**
   * ズームイン
   */
  const handleZoomIn = () => {
    setZoomScale(zoomScale() * 1.2);
  };

  /**
   * ズームアウト
   */
  const handleZoomOut = () => {
    setZoomScale(zoomScale() / 1.2);
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

  return (
    <>
      <main class="relative flex flex-1 flex-col overflow-hidden min-h-0">
        <ImageViewer />
        {/* フローティングコントロールパネル */}
        <FloatingControlPanel
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
          position={controlPanelPosition()}
          onPositionChange={setControlPanelPosition}
        />
      </main>
      <Footer />
    </>
  );
};

const App: Component = () => {
  // UIがマウントされた後にウィンドウを表示
  onMount(() => {
    // 次のフレームでウィンドウを表示(レンダリング完了を確実に待つ)
    requestAnimationFrame(() => {
      invoke('show_window').catch((err: unknown) => 
        console.error('Failed to show window:', err)
      );
    });
  });

  return (
    <AppProvider>
      <div class="flex h-screen flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
        <Titlebar />
        <AppContent />
      </div>
    </AppProvider>
  );
};

export default App;
