import type { Component } from "solid-js";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useAppState } from "../../context/AppStateContext";

const Footer: Component = () => {
  const {
    currentImagePath,
    currentImageFilePath,
    imageResolution,
    imageFileSize,
    showFullPath,
    loadNextImage,
    loadPreviousImage,
  } = useAppState();

  // ファイル名を抽出する関数
  const getFileName = (path: string) => {
    // Windowsとunix両方の区切り文字に対応
    const parts = path.split(/[/\\]/);
    return parts[parts.length - 1];
  };

  // ファイルパスの表示
  const displayPath = () => {
    const filePath = currentImageFilePath();
    const imagePath = currentImagePath();
    const path = filePath || imagePath;

    if (!path) {
      return "No image loaded";
    }

    // フルパス表示設定に応じて表示を切り替え
    return showFullPath() ? path : getFileName(path);
  };

  // 解像度の表示
  const displayResolution = () => {
    const resolution = imageResolution();
    if (resolution) {
      return `${resolution.width}×${resolution.height}`;
    }
    return "---";
  };

  // ファイルサイズの表示
  const displayFileSize = () => {
    const size = imageFileSize();
    if (size === null) {
      return "---";
    }

    // 1MB = 1,048,576バイト
    const MB = 1024 * 1024;
    const KB = 1024;

    if (size >= MB) {
      // 1MB以上: 小数点第1位まで表示
      return `${(size / MB).toFixed(1)}MB`;
    } else if (size >= KB) {
      // 1KB以上1MB未満: 整数で表示
      return `${Math.round(size / KB)}KB`;
    } else {
      // 1KB未満: バイト表示
      return `${size}B`;
    }
  };

  // 削除ボタンの処理
  const handleDeleteFile = async () => {
    const filePath = currentImageFilePath();
    if (!filePath) {
      return;
    }

    // 確認ダイアログを表示
    const fileName = getFileName(filePath);
    const confirmed = window.confirm(
      `「${fileName}」を削除してもよろしいですか？\nこの操作は取り消せません。`,
    );

    if (!confirmed) {
      return;
    }

    try {
      console.log("[Footer Delete] Deleting file:", filePath);

      // まず次の画像を読み込んでから削除
      const hasNext = await loadNextImage();
      if (!hasNext) {
        // 次の画像がない場合は前の画像を試す
        const hasPrevious = await loadPreviousImage();
        if (!hasPrevious) {
          console.log("[Footer Delete] No more images to display");
        }
      }

      // ファイルを削除
      await invoke("delete_file", { filePath });
      console.log("[Footer Delete] Successfully deleted file");
    } catch (error) {
      console.error("[Footer Delete] Failed to delete file:", error);
      alert(`ファイルの削除に失敗しました: ${error}`);
    }
  };

  // エクスプローラで開く処理
  const handleRevealInExplorer = async () => {
    const filePath = currentImageFilePath();
    if (filePath) {
      try {
        console.log("[Footer Explorer] Opening file in explorer:", filePath);
        await revealItemInDir(filePath);
        console.log("[Footer Explorer] Successfully opened in explorer");
      } catch (error) {
        console.error("[Footer Explorer] Failed to open in explorer:", error);
      }
    } else {
      console.warn("[Footer Explorer] No file path available");
    }
  };

  // フルスクリーン切り替え処理
  const handleToggleFullscreen = async () => {
    const appWindow = getCurrentWindow();
    try {
      const isFullscreen = await appWindow.isFullscreen();
      await appWindow.setFullscreen(!isFullscreen);
      console.log(
        `[Footer Fullscreen] Toggled fullscreen: ${!isFullscreen}`,
      );
    } catch (error) {
      console.error("[Footer Fullscreen] Failed to toggle fullscreen:", error);
    }
  };

  return (
    <footer class="border-t border-white/20 dark:border-white/10 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md px-4 text-xs text-[var(--glass-text-secondary)] transition-colors duration-300">
      <div class="mx-auto flex h-8 items-center justify-between overflow-hidden gap-2">
        {/* 左側: ファイルサイズと解像度 */}
        <div class="flex-shrink-0 flex items-center gap-3">
          <p class="whitespace-nowrap text-tabular w-20">{displayFileSize()}</p>
          <p class="whitespace-nowrap text-tabular w-24">
            {displayResolution()}
          </p>
        </div>

        {/* 中央: ファイルパス */}
        <div class="flex-1 mx-4 overflow-hidden">
          <p class="overflow-hidden text-ellipsis whitespace-nowrap text-center">
            {displayPath()}
          </p>
        </div>

        {/* 右側: 削除、エクスプローラ、フルスクリーンボタン */}
        <div class="flex-shrink-0 flex items-center justify-end gap-1">
          {/* 削除ボタン */}
          <button
            id="footerDeleteBtn"
            class="inline-flex h-6 items-center justify-center gap-1 rounded-md border border-transparent bg-transparent px-2 text-xs text-[var(--glass-text-secondary)] transition-all duration-200 hover:bg-red-500/20 hover:text-red-400 hover:backdrop-blur-md hover:scale-105 hover:border-red-500/30 active:scale-98 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="削除"
            title="削除"
            onClick={handleDeleteFile}
            disabled={!currentImageFilePath()}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5 1v1H2v1h12V2h-3V1H5zm1 1h4V1H6v1z"
                fill="currentColor"
              />
              <path
                d="M3 4v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4H3zm2 1h6v9H5V5z"
                fill="currentColor"
              />
              <path d="M6 6h1v7H6V6zm3 0h1v7H9V6z" fill="currentColor" />
            </svg>
          </button>

          {/* エクスプローラで開くボタン */}
          <button
            id="footerExplorerBtn"
            class="inline-flex h-6 items-center justify-center gap-1 rounded-md border border-transparent bg-transparent px-2 text-xs text-[var(--glass-text-secondary)] transition-all duration-200 hover:bg-white/[0.15] hover:backdrop-blur-md hover:scale-105 hover:border-[var(--glass-border-emphasis)] active:scale-98 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="エクスプローラで開く"
            title="エクスプローラで開く"
            onClick={handleRevealInExplorer}
            disabled={!currentImageFilePath()}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 3v10h12V6h-4V3H2zm1 1h5v3h5v6H3V4z"
                fill="currentColor"
              />
            </svg>
          </button>

          {/* フルスクリーンボタン */}
          <button
            id="footerFullscreenBtn"
            class="inline-flex h-6 items-center justify-center gap-1 rounded-md border border-transparent bg-transparent px-2 text-xs text-[var(--glass-text-secondary)] transition-all duration-200 hover:bg-white/[0.15] hover:backdrop-blur-md hover:scale-105 hover:border-[var(--glass-border-emphasis)] active:scale-98"
            aria-label="フルスクリーン"
            title="フルスクリーン"
            onClick={handleToggleFullscreen}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 2v4h1V3h3V2H2zm8 0v1h3v3h1V2h-4zM2 10v4h4v-1H3v-3H2zm11 0v3h-3v1h4v-4h-1z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
