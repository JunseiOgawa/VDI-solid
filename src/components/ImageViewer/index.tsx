import type { Component } from 'solid-js';
import { useAppState } from '../../App';

const ImageViewer: Component = () => {
  const { currentImagePath, setCurrentImagePath, zoomScale, rotationAngle } = useAppState();

  // ユーザーが手動で実装するエリア
  return <div>ImageViewer Placeholder</div>;
};

export default ImageViewer;
