import { invoke } from '@tauri-apps/api/core';
import { Window } from '@tauri-apps/api/window';

import { revealItemInDir } from '@tauri-apps/plugin-opener';

// 現在のウィンドウインスタンスを取得
const appWindow = Window.getCurrent();

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
  folderNavigationEnabled: boolean
): Promise<string | null> {
  try {
    const result = await invoke<string | null>('get_next_image', {
      currentPath,
      folderNavigationEnabled
    });
    return result ?? null;
  } catch (error) {
    console.error('[Tauri] Failed to fetch next image path', error);
    return null;
  }
}
// 前の画像のパスを取得する
export async function fetchPreviousImagePath(
  currentPath: string,
  folderNavigationEnabled: boolean
): Promise<string | null> {
  try {
    const result = await invoke<string | null>('get_previous_image', {
      currentPath,
      folderNavigationEnabled
    });
    return result ?? null;
  } catch (error) {
    console.error('[Tauri] Failed to fetch previous image path', error);
    return null;
  }
}
