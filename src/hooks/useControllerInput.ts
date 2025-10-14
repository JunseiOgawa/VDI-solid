// コントローラー入力フック
import { createEffect, onCleanup } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';

/**
 * コントローラーの状態を表す型
 */
interface ControllerState {
  connected_count: number;
  button_a: boolean;
  button_b: boolean;
  button_x: boolean;
  button_y: boolean;
  button_lb: boolean;
  button_rb: boolean;
  left_stick_x: number;
  left_stick_y: number;
  right_stick_x: number;
  right_stick_y: number;
  left_trigger: number;
  right_trigger: number;
  button_start: boolean;
}

/**
 * コントローラー入力のアクションハンドラー
 */
export interface ControllerActions {
  onPan?: (x: number, y: number) => void;
  onZoom?: (delta: number) => void;
  onNextImage?: () => void;
  onPreviousImage?: () => void;
  onFit?: () => void;
  onResetZoom?: () => void;
  onRotateLeft?: () => void;
  onRotateRight?: () => void;
  onToggleGrid?: () => void;
  onTogglePeaking?: () => void;
  onToggleSettings?: () => void;
}

/**
 * コントローラー入力を監視し、対応するアクションを実行するフック
 * VirtualDesktopモードが有効で、コントローラーが検出されている場合のみ動作
 */
export function useControllerInput(
  virtualdesktopMode: () => boolean,
  controllerDetected: () => boolean,
  actions: ControllerActions
) {
  let intervalId: number | undefined;
  let previousState: ControllerState | null = null;

  // デッドゾーン設定
  const DEADZONE = 0.15;
  const TRIGGER_THRESHOLD = 0.5;

  // スティック入力のデッドゾーン処理
  const applyDeadzone = (value: number): number => {
    return Math.abs(value) < DEADZONE ? 0 : value;
  };

  createEffect(() => {
    if (virtualdesktopMode() && controllerDetected()) {
      // コントローラー入力のポーリング
      const pollInput = async () => {
        try {
          const state = await invoke<ControllerState>('poll_controller_input');

          if (state.connected_count === 0) {
            return;
          }

          // 左スティック: パン操作
          const leftX = applyDeadzone(state.left_stick_x);
          const leftY = applyDeadzone(state.left_stick_y);
          if ((leftX !== 0 || leftY !== 0) && actions.onPan) {
            // Y軸を反転（スティック上 = 画像上に移動）
            // スケーリングはアクションハンドラー側で行う
            actions.onPan(leftX, -leftY);
          }

          // 右スティックY軸: ズーム操作
          const rightY = applyDeadzone(state.right_stick_y);
          if (rightY !== 0 && actions.onZoom) {
            // 上に倒すとズームイン、下に倒すとズームアウト
            // スケーリングはアクションハンドラー側で行う
            actions.onZoom(rightY);
          }

          // ボタン押下検出（前回の状態と比較）
          if (previousState) {
            // Aボタン: 次の画像
            if (state.button_a && !previousState.button_a && actions.onNextImage) {
              actions.onNextImage();
            }

            // Bボタン: 前の画像
            if (state.button_b && !previousState.button_b && actions.onPreviousImage) {
              actions.onPreviousImage();
            }

            // Xボタン: 画面フィット
            if (state.button_x && !previousState.button_x && actions.onFit) {
              actions.onFit();
            }

            // Yボタン: ズームリセット
            if (state.button_y && !previousState.button_y && actions.onResetZoom) {
              actions.onResetZoom();
            }

            // LBボタン: 左回転
            if (state.button_lb && !previousState.button_lb && actions.onRotateLeft) {
              actions.onRotateLeft();
            }

            // RBボタン: 右回転
            if (state.button_rb && !previousState.button_rb && actions.onRotateRight) {
              actions.onRotateRight();
            }

            // 左トリガー: グリッド表示切替
            if (
              state.left_trigger > TRIGGER_THRESHOLD &&
              previousState.left_trigger <= TRIGGER_THRESHOLD &&
              actions.onToggleGrid
            ) {
              actions.onToggleGrid();
            }

            // 右トリガー: ピーキング表示切替
            if (
              state.right_trigger > TRIGGER_THRESHOLD &&
              previousState.right_trigger <= TRIGGER_THRESHOLD &&
              actions.onTogglePeaking
            ) {
              actions.onTogglePeaking();
            }

            // Startボタン: 設定メニュー表示
            if (state.button_start && !previousState.button_start && actions.onToggleSettings) {
              actions.onToggleSettings();
            }
          }

          // 現在の状態を保存
          previousState = state;
        } catch (error) {
          console.error('Failed to poll controller input:', error);
        }
      };

      // 初回ポーリング
      pollInput();

      // 60FPSでポーリング（約16ms間隔）
      intervalId = window.setInterval(pollInput, 16);
    } else {
      // モードがOFFまたはコントローラー未検出の場合、クリーンアップ
      previousState = null;
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
