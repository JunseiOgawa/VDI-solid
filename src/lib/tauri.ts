import { invoke } from "@tauri-apps/api/core";
import { Window, LogicalSize, LogicalPosition } from "@tauri-apps/api/window";

import { revealItemInDir } from "@tauri-apps/plugin-opener";

// 現在のウィンドウインスタンスを取得
const appWindow = Window.getCurrent();

// ギャラリーの幅(px)
const GALLERY_WIDTH = 256;

/**
 * ウィンドウを最小化
 */
export async function minimizeWindow(): Promise<void> {
  await appWindow.minimize();
}

/**
 * ウィンドウを最大化または元に戻す
 */
export async function toggleMaximizeWindow(): Promise<void> {
  if (await appWindow.isMaximized()) {
    await appWindow.unmaximize();
  } else {
    await appWindow.maximize();
  }
}

/**
 * ウィンドウを閉じる
 */
export async function closeWindow(): Promise<void> {
  await appWindow.close();
}

/**
 * 指定されたパスのファイルをエクスプローラーで開く
 * @param path ファイルの絶対パス
 */
export async function openFileInExplorer(path: string): Promise<void> {
  await revealItemInDir(path);
}
// 次の画像のパスを取得する

export async function fetchNextImagePath(
  currentPath: string,
  folderNavigationEnabled: boolean,
): Promise<string | null> {
  try {
    const result = await invoke<string | null>("get_next_image", {
      currentPath,
      folderNavigationEnabled,
    });
    return result ?? null;
  } catch (error) {
    console.error("[Tauri] Failed to fetch next image path", error);
    return null;
  }
}
// 前の画像のパスを取得する
export async function fetchPreviousImagePath(
  currentPath: string,
  folderNavigationEnabled: boolean,
): Promise<string | null> {
  try {
    const result = await invoke<string | null>("get_previous_image", {
      currentPath,
      folderNavigationEnabled,
    });
    return result ?? null;
  } catch (error) {
    console.error("[Tauri] Failed to fetch previous image path", error);
    return null;
  }
}

/**
 * ギャラリー表示のためにウィンドウを左に拡張する
 * ウィンドウが最大化されている場合は何もしない
 */
export async function expandWindowForGallery(): Promise<void> {
  try {
    // 最大化されている場合は何もしない
    if (await appWindow.isMaximized()) {
      console.log(
        "[Window] ウィンドウが最大化されているため、拡張をスキップします",
      );
      return;
    }

    // 現在のウィンドウ位置とサイズを取得
    const currentPosition = await appWindow.outerPosition();
    const currentSize = await appWindow.innerSize();

    // 新しいX座標を計算(画面左端チェック)
    const newX = Math.max(0, currentPosition.x - GALLERY_WIDTH);
    const actualShift = currentPosition.x - newX;

    // 新しい幅を計算(実際の移動量に応じて調整)
    const newWidth = currentSize.width + actualShift;

    console.log("[Window] ギャラリー展開:", {
      currentPosition: { x: currentPosition.x, y: currentPosition.y },
      currentSize: { width: currentSize.width, height: currentSize.height },
      newPosition: { x: newX, y: currentPosition.y },
      newSize: { width: newWidth, height: currentSize.height },
      actualShift,
    });

    // サイズと位置を同時に変更
    await Promise.all([
      appWindow.setSize(new LogicalSize(newWidth, currentSize.height)),
      appWindow.setPosition(new LogicalPosition(newX, currentPosition.y)),
    ]);
  } catch (error) {
    console.error("[Window] ギャラリー展開に失敗しました:", error);
  }
}

/**
 * ギャラリー非表示のためにウィンドウを元のサイズに戻す
 * ウィンドウが最大化されている場合は何もしない
 */
export async function contractWindowForGallery(): Promise<void> {
  try {
    // 最大化されている場合は何もしない
    if (await appWindow.isMaximized()) {
      console.log(
        "[Window] ウィンドウが最大化されているため、縮小をスキップします",
      );
      return;
    }

    // 現在のウィンドウ位置とサイズを取得
    const currentPosition = await appWindow.outerPosition();
    const currentSize = await appWindow.innerSize();

    // 新しいサイズと位置を計算
    const newWidth = currentSize.width - GALLERY_WIDTH;
    const newX = currentPosition.x + GALLERY_WIDTH;

    console.log("[Window] ギャラリー収納:", {
      currentPosition: { x: currentPosition.x, y: currentPosition.y },
      currentSize: { width: currentSize.width, height: currentSize.height },
      newPosition: { x: newX, y: currentPosition.y },
      newSize: { width: newWidth, height: currentSize.height },
    });

    // サイズと位置を同時に変更
    await Promise.all([
      appWindow.setSize(new LogicalSize(newWidth, currentSize.height)),
      appWindow.setPosition(new LogicalPosition(newX, currentPosition.y)),
    ]);
  } catch (error) {
    console.error("[Window] ギャラリー収納に失敗しました:", error);
  }
}
