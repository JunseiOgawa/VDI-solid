import type { Component } from 'solid-js';
import { useAppState } from '../../App';

const Footer: Component = () => {
  const { currentImagePath, zoomScale } = useAppState();

  return (
    <footer>
      <p>
        {currentImagePath() || 'No image loaded'} | Zoom: {Math.round(zoomScale() * 100)}%
      </p>
    </footer>
  );
};

export default Footer;
