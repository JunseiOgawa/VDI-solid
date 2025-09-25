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
    <div class="image-viewer">
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
        <div class="no-image">No image selected</div>
      )}
    </div>
  );
};

export default ImageViewer;
