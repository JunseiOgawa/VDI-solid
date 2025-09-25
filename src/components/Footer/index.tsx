import type { Component } from 'solid-js';
import { useAppState } from '../../App';

const Footer: Component = () => {
  const { currentImagePath, zoomScale } = useAppState();

  return (
    <footer class="fixed bottom-0 inset-x-0 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 text-xs text-[var(--text-secondary)] transition-colors duration-300">
      <div class="mx-auto flex h-8 max-w-5xl items-center justify-center overflow-hidden">
        <p class="overflow-hidden text-ellipsis whitespace-nowrap">
          {currentImagePath() || 'No image loaded'} | Zoom: {Math.round(zoomScale() * 100)}%
        </p>
      </div>
    </footer>
  );
};

export default Footer;
