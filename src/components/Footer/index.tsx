import type { Component } from "solid-js";
import { createSignal, Show } from "solid-js";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useAppState } from "../../context/AppStateContext";

const Footer: Component = () => {
  const [showInfoTooltip, setShowInfoTooltip] = createSignal(false);
  const {
    currentImagePath,
    currentImageFilePath,
    imageResolution,
    imageFileSize,
    showFullPath,
    loadNextImage,
    loadPreviousImage,
    t,
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
      return t("footer.noImage");
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
    const confirmed = window.confirm(t("footer.deleteConfirm", { fileName }));

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
      alert(t("footer.deleteFailed", { error: String(error) }));
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
      console.log(`[Footer Fullscreen] Toggled fullscreen: ${!isFullscreen}`);
    } catch (error) {
      console.error("[Footer Fullscreen] Failed to toggle fullscreen:", error);
    }
  };

  return (
    <>
      <footer class="border-t border-white/20 dark:border-white/10 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md px-4 text-xs text-[var(--glass-text-secondary)] transition-colors duration-300">
        <div class="mx-auto flex h-8 items-center overflow-hidden gap-2">
          {/* 左側: ファイルサイズ、解像度 */}
          <div class="flex items-center gap-2 min-w-0" style="flex: 1 1 0;">
            <p class="whitespace-nowrap text-tabular w-20">
              {displayFileSize()}
            </p>
            <p class="whitespace-nowrap text-tabular w-24">
              {displayResolution()}
            </p>
          </div>

          {/* 中央: ファイルパス */}
          <div
            class="flex items-center justify-center min-w-0"
            style="flex: 1 1 0;"
          >
            <p class="overflow-hidden text-ellipsis whitespace-nowrap text-center">
              {displayPath()}
            </p>
          </div>

          {/* 右側: 削除、エクスプローラ、フルスクリーンボタン */}
          <div
            class="flex items-center justify-end gap-1 min-w-0"
            style="flex: 1 1 0;"
          >
            {/* 削除ボタン */}
            <button
              id="footerDeleteBtn"
              class="inline-flex h-6 items-center justify-center gap-1 rounded-md border border-transparent bg-transparent px-2 text-xs text-[var(--glass-text-secondary)] transition-all duration-200 hover:bg-red-500/20 hover:text-red-400 hover:backdrop-blur-md hover:scale-105 hover:border-red-500/30 active:scale-98 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={t("footer.delete")}
              title={t("footer.delete")}
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
              aria-label={t("footer.explorer")}
              title={t("footer.explorer")}
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

            {/* インフォボタン */}
            <button
              id="footerInfoBtn"
              class="relative inline-flex h-6 items-center justify-center gap-1 rounded-md border border-transparent bg-transparent px-2 text-xs text-[var(--glass-text-secondary)] transition-all duration-200 hover:bg-white/[0.15] hover:backdrop-blur-md hover:scale-105 hover:border-[var(--glass-border-emphasis)] active:scale-98"
              aria-label={t("footer.info")}
              title={t("footer.info")}
              onMouseEnter={() => setShowInfoTooltip(true)}
              onMouseLeave={() => setShowInfoTooltip(false)}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="8"
                  cy="8"
                  r="6"
                  stroke="currentColor"
                  stroke-width="1.5"
                  fill="none"
                />
                <path
                  d="M8 7v4M8 5v0.5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </svg>

              {/* ツールチップ */}
              <Show when={showInfoTooltip()}>
                <div class="absolute bottom-full right-0 mb-2 w-64 rounded-lg bg-[var(--glass-bg-primary)] backdrop-blur-xl border border-[var(--glass-border-subtle)] p-3 text-xs text-[var(--glass-text-secondary)] shadow-lg pointer-events-none">
                  <p class="font-medium text-[var(--glass-text-primary)] mb-1">
                    {t("footer.infoTooltipTitle")}
                  </p>
                  <p>{t("footer.infoTooltipDescription")}</p>
                </div>
              </Show>
            </button>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
