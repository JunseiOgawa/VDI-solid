// コントローラー入力を管理するフック
import { createEffect, onCleanup } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';

/**
 * コントローラー検出状態を定期的にチェックするフック
 * VirtualDesktopモードが有効な場合のみチェックを行う
 */
export function useControllerDetection(
  virtualdesktopMode: () => boolean,
  onDetectionChange: (detected: boolean) => void
) {
  let intervalId: number | undefined;

  createEffect(() => {
    if (virtualdesktopMode()) {
      // VirtualDesktopモードがONの場合、定期的にコントローラーをチェック
      const checkController = async () => {
        try {
          const detected = await invoke<boolean>('detect_gamepad');
          onDetectionChange(detected);
        } catch (error) {
          console.error('Failed to detect gamepad:', error);
          onDetectionChange(false);
        }
      };

      // 初回チェック
      checkController();

      // 2秒ごとにチェック
      intervalId = window.setInterval(checkController, 2000);
    } else {
      // VirtualDesktopモードがOFFの場合、検出状態をリセット
      onDetectionChange(false);
      if (intervalId !== undefined) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
    }
  });

  onCleanup(() => {
    if (intervalId !== undefined) {
      clearInterval(intervalId);
    }
  });
}
