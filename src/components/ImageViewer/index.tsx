import type { Component } from 'solid-js';
import { createSignal, createEffect } from 'solid-js';
import { useAppState } from '../../App';

const ImageViewer: Component = () => {
  const { currentImagePath, zoomScale, rotationAngle } = useAppState();
  const [imageSrc, setImageSrc] = createSignal<string | null>(null);

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
  <div class="checkerboard-bg flex h-full w-full flex-1 items-center justify-center overflow-hidden transition-colors duration-300">
      {imageSrc() ? (
        <img
          src={imageSrc()!}
          alt="Displayed Image"
          style={{
            transform: `scale(${zoomScale()}) rotate(${rotationAngle()}deg)`,
            'transform-origin': 'center',
            'max-width': '100%',
            'max-height': '100%',
            'object-fit': 'contain'
          }}
        />
      ) : (
        <div class="rounded-md border border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-secondary)]">
          No image selected
        </div>
      )}
    </div>
  );
};

export default ImageViewer;
