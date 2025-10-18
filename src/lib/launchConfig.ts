import { invoke } from "@tauri-apps/api/core";
import type { GridPattern } from "../context/AppStateContext";

/**
 * アプリケーション起動時のコマンドライン引数から取得する設定
 *
 * すべてのフィールドはオプショナルで、引数が指定されていない場合は`undefined`になります。
 * フロントエンド側でlocalStorageの値より優先して適用されます。
 */
export interface LaunchConfig {
  // 基本設定（位置引数）
  imagePath?: string;
  windowMode?: string;

  // ピーキング設定
  peakingEnabled?: boolean;
  peakingIntensity?: number;
  peakingColor?: string;
  peakingOpacity?: number;
  peakingBlink?: boolean;

  // グリッド設定
  gridPattern?: GridPattern;
  gridOpacity?: number;
}

/**
 * コマンドライン引数から起動設定を取得
 *
 * Rust側の`get_launch_config`コマンドを呼び出し、パースされた起動設定を取得します。
 * エラーが発生した場合は空のオブジェクトを返します。
 *
 * @returns Promise<LaunchConfig> - パースされた起動設定
 */
export async function getLaunchConfig(): Promise<LaunchConfig> {
  try {
    // Rust側からコマンドライン引数をパースした結果を取得
    const config = await invoke<{
      image_path?: string;
      window_mode?: string;
      peaking_enabled?: boolean;
      peaking_intensity?: number;
      peaking_color?: string;
      peaking_opacity?: number;
      peaking_blink?: boolean;
      grid_pattern?: string;
      grid_opacity?: number;
    }>("get_launch_config");

    // snake_caseからcamelCaseに変換
    return {
      imagePath: config.image_path,
      windowMode: config.window_mode,
      peakingEnabled: config.peaking_enabled,
      peakingIntensity: config.peaking_intensity,
      peakingColor: config.peaking_color,
      peakingOpacity: config.peaking_opacity,
      peakingBlink: config.peaking_blink,
      gridPattern: config.grid_pattern as GridPattern | undefined,
      gridOpacity: config.grid_opacity,
    };
  } catch (error) {
    console.error(
      "[LaunchConfig] コマンドライン引数の取得に失敗しました",
      error,
    );
    // エラー時は空のオブジェクトを返す
    return {};
  }
}
