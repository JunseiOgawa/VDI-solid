import type { Component } from 'solid-js';
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js';
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
import HistogramLayer from './HistogramLayer';

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
    peakingBlink,
    wheelSensitivity,
    histogramEnabled,
    histogramDisplayType,
    histogramPosition,
    histogramSize,
    histogramOpacity,
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

  // 境界計算キャッシュ用変数
  let cachedBoundary: ReturnType<typeof useBoundaryConstraint> | null = null;
  let lastScale = 0;
  let lastRotation = 0;
  let lastContainerWidth = 0;
  let lastContainerHeight = 0;

  // キャッシュクリア関数
  const clearBoundaryCache = () => {
    cachedBoundary = null;
    lastScale = 0;
    lastRotation = 0;
    lastContainerWidth = 0;
    lastContainerHeight = 0;
  };

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
    // 常にnaturalSizeを基準に計算（baseSizeは不正確な場合があるため）
    const natural = naturalSize();
    if (natural.width > 0 && natural.height > 0) {
      return { width: natural.width * scale, height: natural.height * scale };
    }

    // フォールバック: naturalSizeが取得できない場合のみbaseSizeやdisplaySizeを使用
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

    return { width: 0, height: 0 };
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

    // 境界計算のキャッシュ最適化
    const currentRotation = rotation();
    const needsRecalculation = 
      cachedBoundary === null ||
      lastScale !== scale ||
      lastRotation !== currentRotation ||
      lastContainerWidth !== container.width ||
      lastContainerHeight !== container.height;

    if (needsRecalculation) {
      // 境界計算を実行してキャッシュ
      cachedBoundary = useBoundaryConstraint({
        containerSize: container,
        imageSize: natural,
        displaySize: display,
        scale,
        maxTravelFactor: scale < 1.0 ? 2 : 1
      });
      
      // キャッシュキーを更新
      lastScale = scale;
      lastRotation = currentRotation;
      lastContainerWidth = container.width;
      lastContainerHeight = container.height;
    }

    // キャッシュが存在することを保証
    if (!cachedBoundary) {
      return candidate;
    }

    return cachedBoundary.clampPosition(candidate);
  };

  // スクリーンフィットの算出と適用を行う関数
  const calculateAndSetScreenFit = () => {
    if (!imgEl) return null;

    // スケールが大きく変わるのでキャッシュをクリア
    clearBoundaryCache();

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

    console.log('[ScreenFit DEBUG] Container:', container);
    console.log('[ScreenFit DEBUG] Natural size:', { width: naturalWidth, height: naturalHeight });
    console.log('[ScreenFit DEBUG] Effective size:', { width: effectiveWidth, height: effectiveHeight });
    console.log('[ScreenFit DEBUG] scaleX:', scaleX, 'scaleY:', scaleY);
    console.log('[ScreenFit DEBUG] targetScale (before clamp):', targetScale);

    targetScale = Math.min(CONFIG.zoom.maxScale, Math.max(CONFIG.zoom.minScale, targetScale));

    console.log('[ScreenFit DEBUG] targetScale (after clamp):', targetScale);
    console.log('[ScreenFit DEBUG] minScale:', CONFIG.zoom.minScale, 'maxScale:', CONFIG.zoom.maxScale);
    const previousScale = zoomScale();
    console.log('[ScreenFit DEBUG] previousScale:', previousScale);
    console.log('[ScreenFit DEBUG] baseSize:', baseSize());
    console.log('[ScreenFit DEBUG] displaySize (before):', displaySize());
    const predictedDisplay = getDisplaySizeForScale(targetScale, previousScale);
    console.log('[ScreenFit DEBUG] predictedDisplay:', predictedDisplay);

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
    // リセット時にキャッシュをクリア
    clearBoundaryCache();
    
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

    // 感度を適用したステップ幅を計算
    const adjustedStep = CONFIG.zoom.step * wheelSensitivity();
    const delta = event.deltaY > 0 ? -adjustedStep : adjustedStep; // 上で拡大、下で縮小

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
    
    // 画像変更時にキャッシュをクリア
    clearBoundaryCache();
    
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
        class="absolute inset-y-0 left-0 z-20 flex w-[15%] items-center justify-start bg-gradient-to-r from-[color:rgba(0,0,0,0.35)] to-transparent px-4 text-left text-sm font-medium text-[var(--text-primary)] opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity duration-200"
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
        class="absolute inset-y-0 right-0 z-20 flex w-[15%] items-center justify-end bg-gradient-to-l from-[color:rgba(0,0,0,0.35)] to-transparent px-4 text-right text-sm font-medium text-[var(--text-primary)] opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity duration-200"
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
              // フレックス中央寄せの影響を受けないよう、絶対配置でコンテナ左上を原点にする
              position: 'absolute',
              left: '0px',
              top: '0px',
              transform: (() => {
                const container = containerSize();
                const scale = zoomScale();
                const currentRotation = rotation();
                const display = displaySize();
                const natural = naturalSize();
                const positionValue = position();

                const safeScale = scale === 0 ? 1 : scale;

                // 現在の表示サイズ（スケール適用後）を取得
                let displayWidth = display?.width ?? 0;
                let displayHeight = display?.height ?? 0;

                if (displayWidth === 0 || displayHeight === 0) {
                  displayWidth = natural.width * safeScale;
                  displayHeight = natural.height * safeScale;
                }

                // 元の画像サイズ（スケール前）を算出
                let baseWidth = displayWidth / safeScale;
                let baseHeight = displayHeight / safeScale;

                if (!isFinite(baseWidth) || baseWidth === 0 || !isFinite(baseHeight) || baseHeight === 0) {
                  baseWidth = natural.width;
                  baseHeight = natural.height;
                }

                const centerX = container.width / 2 + positionValue.x;
                const centerY = container.height / 2 + positionValue.y;

                const transformString = `translate(${centerX}px, ${centerY}px) rotate(${currentRotation}deg) scale(${scale}) translate(${-baseWidth / 2}px, ${-baseHeight / 2}px)`;

                // デバッグ用ログ
                console.log('[Transform Debug] ================');
                console.log('[Transform] Container size:', container);
                console.log('[Transform] Display size:', { width: displayWidth, height: displayHeight });
                console.log('[Transform] Natural size:', natural);
                console.log('[Transform] Base size (pre-scale):', { width: baseWidth, height: baseHeight });
                console.log('[Transform] Scale:', scale);
                console.log('[Transform] Rotation:', currentRotation);
                console.log('[Transform] Position:', positionValue);
                console.log('[Transform] Center translation:', { x: centerX, y: centerY });
                console.log('[Transform] Final transform:', transformString);
                console.log('[Transform Debug] ================');

                return transformString;
              })(),
              'transform-origin': '0 0',
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
              peakingBlink={peakingBlink()}
            />
          </div>

          {/* ヒストグラムレイヤー - checkerboard-bgの直下に配置 */}
          <Show when={histogramEnabled() && currentImageFilePath()}>
            <HistogramLayer
              imagePath={currentImageFilePath()!}
              enabled={histogramEnabled()}
              displayType={histogramDisplayType()}
              position={histogramPosition()}
              size={histogramSize()}
              opacity={histogramOpacity()}
            />
          </Show>
        </>
      ) : (
        <div class="rounded-md border border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-secondary)]">
          No image selected
        </div>
      )}
    </div>
  );
};export default ImageViewer;
