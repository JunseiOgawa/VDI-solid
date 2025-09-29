import type { Component } from 'solid-js';
import { createSignal, createEffect, onMount, onCleanup } from 'solid-js';
import { useAppState } from '../../App';
import { CONFIG } from '../../config/config';
import { listen, TauriEvent } from '@tauri-apps/api/event';
import { convertFileToAssetUrl, isSupportedImageFile } from '../../lib/fileUtils';

const logDropEvent = (label: string, payload: unknown) => {
  const timestamp = new Date().toISOString();
  console.log(`[D&D ${timestamp}] ${label}`, payload);
};

const ImageViewer: Component = () => {
  const { currentImagePath, setCurrentImagePath, zoomScale, setZoomScale } = useAppState();
  const [imageSrc, setImageSrc] = createSignal<string | null>(null);
  const [isDragActive, setDragActive] = createSignal(false);
  const [position, setPosition] = createSignal({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = createSignal(false);
  let startX = 0;
  let startY = 0;

  // Tauri D&Dイベントリスナー
  onMount(() => {
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
        const assetUrl = convertFileToAssetUrl(filePath);
        logDropEvent('Converted asset URL', assetUrl);
        setCurrentImagePath(assetUrl);
        console.info('[D&D] Updated current image path', assetUrl);
      } catch (error) {
        console.error('[D&D] Failed to convert file path to asset URL.', error);
      }
    });

    onCleanup(async () => {
      (await unlistenDragEnter)();
      (await unlistenDragOver)();
      (await unlistenDragLeave)();
      (await unlistenDragDrop)();
    });
  });

  // マウスホイールズーム機能
  const handleWheelZoom = (event: WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -CONFIG.zoom.step : CONFIG.zoom.step; // 上で拡大、下で縮小
    const newScale = Math.max(CONFIG.zoom.minScale, Math.min(CONFIG.zoom.maxScale, zoomScale() + delta));
    setZoomScale(newScale);
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
    if (isDragging()) {
      setPosition({
        x: event.clientX - startX,
        y: event.clientY - startY
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // currentImagePathが変更されたら画像を読み込む
  createEffect(() => {
    const path = currentImagePath();
    if (path) {
      setImageSrc(path);
    } else {
      setImageSrc(null);
    }
  });

  return (
    <div
      class="checkerboard-bg relative flex h-full w-full flex-1 items-center justify-center overflow-hidden transition-colors duration-300"
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
      {imageSrc() ? (
        <img
          src={imageSrc()!}
          alt="Displayed Image"
          onWheel={handleWheelZoom}
          onMouseDown={handleMouseDown}
          onDragStart={(e) => e.preventDefault()}
          style={{
            transform: `translate(${position().x}px, ${position().y}px) scale(${zoomScale()})`,
            'transform-origin': 'center',
            'max-width': '100%',
            'max-height': '100%',
            'object-fit': 'contain',
            cursor: isDragging() ? 'grabbing' : 'grab'
          }}
        />
      ) : (
        <div class="rounded-md border border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-secondary)]">
          No image selected
        </div>
      )}
    </div>
  );
};export default ImageViewer;
