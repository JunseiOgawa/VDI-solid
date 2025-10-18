import type { Component } from 'solid-js';
import { getCurrentWindow } from '@tauri-apps/api/window';

/**
 * Titlebarコンポーネントのprops
 */
interface TitlebarProps {
  /** ギャラリーサイドバーの表示状態 */
  showGallery: boolean;
  /** ギャラリーサイドバーの表示/非表示を切り替える */
  onToggleGallery: (show: boolean) => void | Promise<void>;
}

/**
 * 簡素化されたTitlebarコンポーネント
 * ドラッグ領域とウィンドウコントロールボタン、ギャラリー展開ボタンを提供
 */
const Titlebar: Component<TitlebarProps> = (props) => {
  const windowButtonClasses =
    "no-drag flex h-6 w-6 items-center justify-center rounded-md text-[var(--glass-text-secondary)] transition-all duration-200 hover:bg-white/[0.15] hover:backdrop-blur-md hover:scale-105 active:scale-98";

  const handleMinimize = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.minimize();
  };

  const handleMaximize = async () => {
    const appWindow = getCurrentWindow();
    const isMaximized = await appWindow.isMaximized();
    if (isMaximized) {
      await appWindow.unmaximize();
    } else {
      await appWindow.maximize();
    }
  };

  const handleClose = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.close();
  };

  return (
    <div
      class="drag-region relative flex h-8 items-center justify-between border-b border-[var(--glass-border-subtle)] bg-[var(--glass-bg-primary)] backdrop-blur-xl px-2 text-sm text-[var(--glass-text-primary)] transition-colors duration-300"
      data-tauri-drag-region
    >
      {/* 左側: ギャラリー展開ボタン */}
      <div class="flex items-center gap-1">
        <button
          id="galleryBtn"
          class={windowButtonClasses}
          onClick={() => props.onToggleGallery(!props.showGallery)}
          aria-label="ギャラリー表示"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 6h18M3 12h18M3 18h18"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      {/* 中央: ドラッグ可能領域 */}
      <div class="flex-1" data-tauri-drag-region />

      {/* 右側: ウィンドウコントロールボタンのみ */}
      <div class="flex items-center gap-1">
        <button
          id="minimizeBtn"
          class={windowButtonClasses}
          onClick={handleMinimize}
          aria-label="最小化"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 1 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M2 7h8v1H2V7z" fill="currentColor" />
          </svg>
        </button>
        <button
          id="maximizeBtn"
          class={windowButtonClasses}
          onClick={handleMaximize}
          aria-label="最大化"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M2 2v8h8V2H2zm1 1h6v6H3V3z" fill="currentColor" />
          </svg>
        </button>
        <button
          id="closeBtn"
          class="no-drag flex h-6 w-6 items-center justify-center rounded-md text-[var(--glass-text-secondary)] transition-all duration-200 hover:bg-red-500/90 hover:text-white hover:scale-105 active:scale-98"
          onClick={handleClose}
          aria-label="閉じる"
        >
          <svg
            width="12"
            height="20"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.5 2.5l7 7M9.5 2.5l-7 7"
              stroke="currentColor"
              stroke-width="1"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Titlebar;
