import type { Component } from 'solid-js';
import { useAppState } from '../../App';
import { handleScreenFit } from './screenfit';

const Controls: Component = () => {
  const { setZoomScale } = useAppState();

  return (
    <div class="pointer-events-auto absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
      <button
        class="no-drag rounded-md border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-2 text-sm text-[var(--text-primary)] shadow-sm transition-colors duration-150 hover:bg-[var(--bg-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
        onClick={() => handleScreenFit(setZoomScale)}
      >
        Fit to Screen
      </button>
      <button
        class="no-drag rounded-md border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-2 text-sm text-[var(--text-primary)] shadow-sm transition-colors duration-150 hover:bg-[var(--bg-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
        onClick={() => {
          /* 前の画像 */
        }}
      >
        Previous
      </button>
      <button
        class="no-drag rounded-md border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-2 text-sm text-[var(--text-primary)] shadow-sm transition-colors duration-150 hover:bg-[var(--bg-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
        onClick={() => {
          /* 次の画像 */
        }}
      >
        Next
      </button>
    </div>
  );
};

export default Controls;
