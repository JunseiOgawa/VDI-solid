import type { Component } from 'solid-js';
import { createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import { listen } from '@tauri-apps/api/event';
import { TauriEvent } from '@tauri-apps/api/event';
import { useAppState } from '../../context/AppStateContext';
import { CONFIG } from '../../config/config';
import { useBoundaryConstraint } from '../../hooks/useBoundaryConstraint';
import {
  convertFileToAssetUrlWithCacheBust,
  isSupportedImageFile
} from '../../lib/fileUtils';
import { registerCalculateAndSetScreenFit, registerResetImagePosition } from '../../lib/imageViewerApi';
import ImageManager from './ImageManager';

const logDropEvent = (label: string, payload: unknown) => {
  const timestamp = new Date().toISOString();
  console.log(`[D&D ${timestamp}] ${label}`, payload);
};

const ImageViewer: Component = () => {
  const {
    currentImagePath,
    currentImageFilePath,
    setCurrentImagePath,
    zoomScale,
    setZoomScale,
    rotation,
    loadNextImage,
    loadPreviousImage,
    gridPattern,
    gridOpacity,
    peakingEnabled,
    peakingIntensity,
    peakingColor,
    peakingOpacity,
  } = useAppState();
  const [imageSrc, setImageSrc] = createSignal<string | null>(null);
  const [isDragActive, setDragActive] = createSignal(false);
  const [position, setPosition] = createSignal({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = createSignal(false);
  const [containerSize, setContainerSize] = createSignal({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = createSignal<{ width: number; height: number } | null>(null);
  const [baseSize, setBaseSize] = createSignal<{ width: number; height: number } | null>(null);
  const [isNavigating, setIsNavigating] = createSignal(false);
  let startX = 0;
  let startY = 0;
  let containerEl: HTMLDivElement | undefined;
  let imgEl: HTMLImageElement | undefined;
  let resizeObserver: ResizeObserver | undefined;

  const naturalSize = () => {
    if (!imgEl) return { width: 0, height: 0 };
    return {
      width: imgEl.naturalWidth || imgEl.width || 0,
      height: imgEl.naturalHeight || imgEl.height || 0
    };
  };

  const updateContainerMetrics = () => {
    if (!containerEl) return;
    const r = containerEl.getBoundingClientRect();
    setContainerSize({ width: r.width, height: r.height });
  };

  const updateImageMetrics = () => {
    if (!imgEl) return;
    const rect = imgEl.getBoundingClientRect();
    setDisplaySize({ width: rect.width, height: rect.height });
    const scale = zoomScale();
    if (scale > 0) {
      setBaseSize({ width: rect.width / scale, height: rect.height / scale });
    }
  };

  const measureAll = () => {
    updateContainerMetrics();
    updateImageMetrics();
  };

  const getDisplaySizeForScale = (scale: number, referenceScale?: number) => {
    const base = baseSize();
    if (base) {
      return { width: base.width * scale, height: base.height * scale };
    }

    const currentDisplay = displaySize();
    if (currentDisplay) {
      if (referenceScale && referenceScale > 0) {
        const ratio = scale / referenceScale;
        return { width: currentDisplay.width * ratio, height: currentDisplay.height * ratio };
      }
      return currentDisplay;
    }

    const natural = naturalSize();
    return { width: natural.width * scale, height: natural.height * scale };
  };

  const clampToBounds = (
    candidate: { x: number; y: number },
    options?: { scale?: number; display?: { width: number; height: number } | null; referenceScale?: number }
  ) => {
    if (!imgEl || !containerEl) return candidate;
    const container = containerSize();
    if (container.width === 0 || container.height === 0) {
      return { x: 0, y: 0 };
    }

    const scale = options?.scale ?? zoomScale();
    const natural = naturalSize();
    const display = options?.display ?? getDisplaySizeForScale(scale, options?.referenceScale);
    if (!display || display.width === 0 || display.height === 0) {
      return { x: 0, y: 0 };
    }
    const { clampPosition: applyClamp } = useBoundaryConstraint({
      containerSize: container,
      imageSize: natural,
      displaySize: display,
      scale,
      maxTravelFactor: scale < 1.0 ? 2 : 1
    });

    return applyClamp(candidate);
  };

  // スクリーンフィットの算出と適用を行う関数
  const calculateAndSetScreenFit = () => {
    if (!imgEl) return null;

    const naturalWidth = imgEl.naturalWidth || imgEl.width || 0;
    const naturalHeight = imgEl.naturalHeight || imgEl.height || 0;
    if (!naturalWidth || !naturalHeight) return null;

    let container = containerSize();
    if (!container.width || !container.height) {
      updateContainerMetrics();
      container = containerSize();
    }
    if (!container.width || !container.height) return null;

    const normalizedRotation = ((rotation() % 360) + 360) % 360;
    const quarterTurn = normalizedRotation === 90 || normalizedRotation === 270;
    const effectiveWidth = quarterTurn ? naturalHeight : naturalWidth;
    const effectiveHeight = quarterTurn ? naturalWidth : naturalHeight;

  const scaleX = container.width / effectiveWidth;
  const scaleY = container.height / effectiveHeight;
  let targetScale = Math.min(scaleX, scaleY);

    targetScale = Math.min(CONFIG.zoom.maxScale, Math.max(CONFIG.zoom.minScale, targetScale));
    const previousScale = zoomScale();
    const predictedDisplay = getDisplaySizeForScale(targetScale, previousScale);

    setZoomScale(targetScale);
    setDisplaySize(predictedDisplay);

    const centeredPosition = clampToBounds(
      { x: 0, y: 0 },
      { scale: targetScale, display: predictedDisplay, referenceScale: previousScale }
    );
    setPosition(centeredPosition);

    requestAnimationFrame(() => {
      measureAll();
      setPosition((prevPos) => clampToBounds(prevPos));
    });

    return targetScale;
  };

  // 画像位置と計測データをリセットする関数（コンポーネントスコープに切り出し）
  const resetImagePosition = () => {
    setPosition({ x: 0, y: 0 });
    setDisplaySize(null);
    setBaseSize(null);
    requestAnimationFrame(() => {
      measureAll();
      setPosition((prev) => clampToBounds(prev));
    });
  };

  // 画像のシーケンシャル読み込み・呼び出し
  const canNavigate = () => Boolean(currentImageFilePath());

  // Tauri D&Dイベントリスナー
  onMount(() => {
  // コンポーネントの API をモジュール経由で登録
  registerCalculateAndSetScreenFit(calculateAndSetScreenFit);
  registerResetImagePosition(resetImagePosition);

    measureAll();
    const handleResize = () => {
      measureAll();
      setPosition((prev) => clampToBounds(prev));
    };

    window.addEventListener('resize', handleResize);
    const releaseDrag = () => {
      if (isDragging()) {
        handleMouseUp();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        releaseDrag();
      } else {
        requestAnimationFrame(() => {
          measureAll();
          setPosition((prev) => clampToBounds(prev));
        });
      }
    };

    window.addEventListener('blur', releaseDrag);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (typeof ResizeObserver !== 'undefined' && containerEl) {
      resizeObserver = new ResizeObserver(() => {
        measureAll();
        setPosition((prev) => clampToBounds(prev));
      });
      resizeObserver.observe(containerEl);
    }

    const unlistenDragEnter = listen(TauriEvent.DRAG_ENTER, (event) => {
      logDropEvent('DRAG_ENTER', event.payload);
      setDragActive(true);
    });

    const unlistenDragOver = listen(TauriEvent.DRAG_OVER, (_event) => {
      // DRAG_OVER logging removed
    });

    const unlistenDragLeave = listen(TauriEvent.DRAG_LEAVE, (event) => {
      logDropEvent('DRAG_LEAVE', event.payload);
      setDragActive(false);
    });

    const unlistenDragDrop = listen(TauriEvent.DRAG_DROP, async (event) => {
      logDropEvent('DRAG_DROP', event.payload);
      setDragActive(false);

      const payload = event.payload as { paths: string[] };
      if (!payload.paths || payload.paths.length === 0) {
        console.error('[D&D] No paths in DRAG_DROP payload');
        return;
      }

      const filePath = payload.paths[0];
      logDropEvent('Processing file path', filePath);

      // 拡張子チェック
      const extension = filePath.split('.').pop()?.toLowerCase();
      if (!extension || !isSupportedImageFile(filePath)) {
        console.error('[D&D] Unsupported file extension detected.', { filePath, extension });
        return;
      }

      try {
        logDropEvent('Converting file path to asset URL', filePath);
        const assetUrl = convertFileToAssetUrlWithCacheBust(filePath);
        logDropEvent('Converted asset URL', assetUrl);
        setCurrentImagePath(assetUrl, { filePath });
        console.info('[D&D] Updated current image path', assetUrl);
      } catch (error) {
        console.error('[D&D] Failed to convert file path to asset URL.', error);
      }
    });

    onCleanup(async () => {
      // 登録解除
      registerCalculateAndSetScreenFit(null);
      registerResetImagePosition(null);

      (await unlistenDragEnter)();
      (await unlistenDragOver)();
      (await unlistenDragLeave)();
      (await unlistenDragDrop)();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('blur', releaseDrag);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (resizeObserver && containerEl) {
        resizeObserver.unobserve(containerEl);
        resizeObserver.disconnect();
      }
    });
  });

  // マウスホイールズーム機能
  const handleWheelZoom = (event: WheelEvent) => {
    event.preventDefault();
    const previousScale = zoomScale();
    const delta = event.deltaY > 0 ? -CONFIG.zoom.step : CONFIG.zoom.step; // 上で拡大、下で縮小
    const newScale = Math.max(CONFIG.zoom.minScale, Math.min(CONFIG.zoom.maxScale, previousScale + delta));
    if (newScale === previousScale) return;

    setZoomScale(newScale);
    const predictedDisplay = getDisplaySizeForScale(newScale, previousScale);
    setDisplaySize(predictedDisplay);
    setPosition((prev) => clampToBounds(prev, { scale: newScale, display: predictedDisplay, referenceScale: previousScale }));

    requestAnimationFrame(() => {
      measureAll();
      setPosition((prev) => clampToBounds(prev));
    });
  };

  // ドラッグ機能
  const handleMouseDown = (event: MouseEvent) => {
    setIsDragging(true);
    startX = event.clientX - position().x;
    startY = event.clientY - position().y;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging()) return;
    const candidate = {
      x: event.clientX - startX,
      y: event.clientY - startY
    };
    setPosition(clampToBounds(candidate));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    setPosition((prev) => clampToBounds(prev));
  };
  // 画像のシーケンシャル読み込み処理
  const handleSequentialNavigation = async (direction: 'next' | 'previous') => {
    if (isNavigating()) {
      return;
    }

    if (!canNavigate()) {
      console.warn('[Navigation] 現在の画像でフォルダナビゲーションが利用できません');
      return;
    }

    if (isDragging()) {
      handleMouseUp();
    }

    setIsNavigating(true);
    const loader = direction === 'next' ? loadNextImage : loadPreviousImage;
    try {
      const success = await loader();
      if (success) {
        resetImagePosition();
      }
    } catch (error) {
      console.error('[Navigation] 画像ナビゲーションに失敗しました', error);
    } finally {
      setIsNavigating(false);
    }
  };

  // currentImagePathが変更されたら画像を読み込む
  createEffect(() => {
    const path = currentImagePath();
    setPosition({ x: 0, y: 0 });
    setDisplaySize(null);
    setBaseSize(null);
    if (path) {
      setImageSrc(path);
    } else {
      setImageSrc(null);
    }
  });

  return (
    <div
      ref={(el: HTMLDivElement) => (containerEl = el)}
      class="checkerboard-bg group relative flex flex-1 min-h-0 min-w-0 items-center justify-center overflow-hidden transition-colors duration-300"
      classList={{
        'ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--bg-primary)]': isDragActive()
      }}
    >
      {isDragActive() && (
        <div class="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[color:rgba(0,0,0,0.35)] text-[var(--text-primary)]">
          <span class="text-lg font-semibold">ドラッグアンドドロップで画像を開きます</span>
          <span class="text-sm opacity-80">対応ファイル:JPG, PNG, GIF, BMP, WEBP, TIFF, AVIF</span>
        </div>
      )}
      <button
        type="button"
        class="absolute inset-y-0 left-0 z-20 flex w-[30%] items-center justify-start bg-gradient-to-r from-[color:rgba(0,0,0,0.35)] to-transparent px-4 text-left text-sm font-medium text-[var(--text-primary)] opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity duration-200"
        classList={{
          'cursor-not-allowed': !canNavigate() || isNavigating()
        }}
        disabled={!canNavigate() || isNavigating()}
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          void handleSequentialNavigation('previous');
        }}
        onMouseDown={(event) => {
          event.stopPropagation();
          event.preventDefault();
        }}
      >
        <span class="flex items-center gap-2">
          <span aria-hidden="true">◀</span>
          <span>前の画像</span>
        </span>
      </button>
      <button
        type="button"
        class="absolute inset-y-0 right-0 z-20 flex w-[30%] items-center justify-end bg-gradient-to-l from-[color:rgba(0,0,0,0.35)] to-transparent px-4 text-right text-sm font-medium text-[var(--text-primary)] opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity duration-200"
        classList={{
          'cursor-not-allowed': !canNavigate() || isNavigating()
        }}
        disabled={!canNavigate() || isNavigating()}
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          void handleSequentialNavigation('next');
        }}
        onMouseDown={(event) => {
          event.stopPropagation();
          event.preventDefault();
        }}
      >
        <span class="flex items-center gap-2">
          <span>次の画像</span>
          <span aria-hidden="true">▶</span>
        </span>
      </button>
      {imageSrc() ? (
        <>
          {/* 画像、ピーキング、グリッドを統合管理するImageManager */}
          <div
            style={{
              position: 'relative',
              transform: `translate(${position().x}px, ${position().y}px) scale(${zoomScale()}) rotate(${rotation()}deg)`,
              'transform-origin': 'center',
              'max-width': '100%',
              'max-height': '100%',
              cursor: isDragging() ? 'grabbing' : 'grab',
            }}
            onWheel={handleWheelZoom}
            onMouseDown={handleMouseDown}
          >
            <ImageManager
              src={imageSrc()!}
              imagePath={currentImageFilePath()}
              onLoad={() => {
                measureAll();
                setPosition((prev) => clampToBounds(prev));
                calculateAndSetScreenFit();
              }}
              imgRef={(el: HTMLImageElement) => (imgEl = el)}
              gridPattern={gridPattern()}
              gridOpacity={gridOpacity()}
              peakingEnabled={peakingEnabled()}
              peakingIntensity={peakingIntensity()}
              peakingColor={peakingColor()}
              peakingOpacity={peakingOpacity()}
            />
          </div>
        </>
      ) : (
        <div class="rounded-md border border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-secondary)]">
          No image selected
        </div>
      )}
    </div>
  );
};export default ImageViewer;
