import { invoke } from '@tauri-apps/api/core';

/**
 * エッジ上の1点の座標
 */
export interface EdgePoint {
  x: number;
  y: number;
}

/**
 * Rustから返却されるピーキング結果
 */
export interface PeakingResult {
  /** 元画像の幅 */
  width: number;
  /** 元画像の高さ */
  height: number;
  /** エッジの座標リスト（各配列が1つの連続エッジ） */
  edges: EdgePoint[][];
}

/**
 * ピーキングレイヤーの設定
 */
export interface PeakingConfig {
  /** 有効/無効 */
  enabled: boolean;
  /** エッジ検出閾値 (0-255) */
  intensity: number;
  /** 表示色（CSS色文字列） */
  color: string;
  /** 不透明度 (0.0-1.0) */
  opacity: number;
}

/**
 * デフォルトのピーキング設定
 */
export const DEFAULT_PEAKING_CONFIG: PeakingConfig = {
  enabled: false,
  intensity: 60,
  color: 'lime',
  opacity: 0.5,
};

/**
 * エッジ座標配列をSVG polylineのpoints属性文字列に変換
 * @param edge - エッジの座標配列
 * @returns "x1,y1 x2,y2 x3,y3" 形式の文字列
 */
export function edgeToPolylinePoints(edge: EdgePoint[]): string {
  return edge.map((point) => `${point.x},${point.y}`).join(' ');
}

/**
 * ピーキング結果のキャッシュキーを生成
 * @param imagePath - 画像ファイルパス
 * @param intensity - エッジ検出閾値
 * @returns キャッシュキー文字列
 */
export function generatePeakingCacheKey(imagePath: string, intensity: number): string {
  return `${imagePath}:${intensity}`;
}

/**
 * 総エッジポイント数をカウント
 * @param result - ピーキング結果
 * @returns 総ポイント数
 */
export function countTotalEdgePoints(result: PeakingResult): number {
  return result.edges.reduce((sum, edge) => sum + edge.length, 0);
}

/**
 * Rustのfocus_peakingコマンドを呼び出す
 * @param imagePath - 画像ファイルパス
 * @param threshold - エッジ検出閾値 (0-255)
 * @returns ピーキング結果
 * @throws エラーメッセージ（Rustから返却）
 */
export async function invokeFocusPeaking(
  imagePath: string,
  threshold: number
): Promise<PeakingResult> {
  try {
    const result = await invoke<PeakingResult>('focus_peaking', {
      imagePath,
      threshold,
    });
    return result;
  } catch (error) {
    console.error('[PeakingUtils] Failed to invoke focus_peaking:', error);
    throw error;
  }
}

/**
 * intensity値を0-255の範囲にクランプ
 */
export function clampIntensity(value: number): number {
  return Math.max(0, Math.min(255, Math.floor(value)));
}

/**
 * opacity値を0.0-1.0の範囲にクランプ
 */
export function clampOpacity(value: number): number {
  return Math.max(0, Math.min(1, value));
}
