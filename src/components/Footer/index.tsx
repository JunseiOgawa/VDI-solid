import type { Component } from "solid-js";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { useAppState } from "../../context/AppStateContext";

const Footer: Component = () => {
  const {
    currentImagePath,
    currentImageFilePath,
    imageResolution,
    showFullPath,
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

  return (
    <footer class="border-t border-[var(--glass-border-subtle)] bg-[var(--glass-bg-primary)] backdrop-blur-xl px-4 text-xs text-[var(--glass-text-secondary)] transition-colors duration-300">
      <div class="mx-auto flex h-8 max-w-5xl items-center justify-between overflow-hidden">
        {/* 左側: 解像度 */}
        <div class="flex-shrink-0 w-32">
          <p class="whitespace-nowrap text-tabular">{displayResolution()}</p>
        </div>

        {/* 中央: ファイルパス */}
        <div class="flex-1 mx-4 overflow-hidden">
          <p class="overflow-hidden text-ellipsis whitespace-nowrap text-center">
            {displayPath()}
          </p>
        </div>

        {/* 右側: エクスプローラで開くボタン */}
        <div class="flex-shrink-0 flex items-center justify-end">
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
        </div>
      </div>
    </footer>
  );
};

export default Footer;
