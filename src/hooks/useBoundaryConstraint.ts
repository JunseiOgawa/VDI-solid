import type { Size } from '../lib/boundaryUtils';
import { computeMinMax, clampPosition } from '../lib/boundaryUtils';

type Args = {
  containerSize: Size;
  imageSize: Size;
  displaySize?: Size | null;
  scale: number;
  maxTravelFactor?: number;
};

/**
 * 境界制約を適用するためのカスタムフック。
 * コンテナサイズ、画像サイズ、表示サイズ、スケールに基づいて位置をクランプする関数を提供する。
 * 
 * @param args - フックの引数オブジェクト。
 * @param args.containerSize - コンテナのサイズ（幅と高さ）。
 * @param args.imageSize - 画像の元のサイズ（幅と高さ）。
 * @param args.displaySize - 表示サイズ（オプション、指定されない場合はスケールされた画像サイズを使用）。
 * @param args.scale - スケール値（安全のため最小値はNumber.EPSILON）。
 * @param args.maxTravelFactor - 移動可能範囲の倍率（デフォルト=1）。
 * @returns 位置をクランプする関数と可視性を確保する関数を含むオブジェクト。
 * @returns clampPosition - 指定された位置を境界内にクランプする関数。
 * @returns ensureVisible - 位置を境界内にクランプし、可視性を確保する関数（現在はclampと同じ動作）。
 */
export function useBoundaryConstraint(args: Args) {
  const { containerSize, imageSize, displaySize, scale, maxTravelFactor = 1 } = args;
  const safeScale = Math.max(scale, Number.EPSILON);
  const effectiveDisplay = displaySize ?? {
    width: imageSize.width * safeScale,
    height: imageSize.height * safeScale
  };
  const mm = computeMinMax(containerSize, effectiveDisplay, safeScale, maxTravelFactor);

  function clamp(pos: { x: number; y: number }) {
    return clampPosition(pos, mm);
  }

  function ensureVisible(pos: { x: number; y: number }) {
    // For now same as clamp; can be extended to center when image smaller than container
    return clamp(pos);
  }

  return { clampPosition: clamp, ensureVisible };
}

export default useBoundaryConstraint;
