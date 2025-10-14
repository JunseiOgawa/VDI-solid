import type { Component } from 'solid-js';
import { getCurrentWindow } from '@tauri-apps/api/window';

/**
 * 簡素化されたTitlebarコンポーネント
 * ドラッグ領域とウィンドウコントロールボタンのみを提供
 */
const Titlebar: Component = () => {
  const windowButtonClasses =
    "no-drag flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]";

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
      class="drag-region relative flex h-8 items-center justify-between border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] px-2 text-sm text-[var(--text-primary)] transition-colors duration-300"
      data-tauri-drag-region
    >
      {/* 左側: 空(将来的な拡張用) */}
      <div class="flex items-center">
        {/* 必要に応じてアプリ名やアイコンを配置 */}
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
          class={`${windowButtonClasses} hover:bg-red-500 hover:text-white`}
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
