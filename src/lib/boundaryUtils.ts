export type Size = { width: number; height: number };
export type MinMax = { minX: number; maxX: number; minY: number; maxY: number };


export function computeBaseSize(imgEl: HTMLImageElement | null | undefined, scale: number): Size | null {
  if (!imgEl || scale === 0) return null;
  const rect = imgEl.getBoundingClientRect();
  return { width: rect.width / scale, height: rect.height / scale };
}


/**
 * 指定されたコンテナサイズ、表示サイズ、スケールに基づいて、X軸とY軸の最小・最大値を計算します。
 * これは、表示要素がコンテナ内でどのように移動可能かを決定するために使用されます。
 * 
 * @param container - コンテナのサイズ（幅と高さ）。
 * @param displaySize - 表示要素のサイズ（幅と高さ）。
 * @param scale - スケールファクター。ゼロ除算を避けるために最小値としてNumber.EPSILONを使用します。
 * @param maxTravelFactor - 移動可能範囲の倍率（デフォルト=1）。低倍率時に範囲を広げるために使用。
 * @returns X軸とY軸の最小・最大値を含むオブジェクト。
 */
export function computeMinMax(container: Size, displaySize: Size, scale: number, maxTravelFactor: number = 1): MinMax {
  const safeScale = Math.max(scale, Number.EPSILON);
  const factor = Math.max(1, maxTravelFactor);

  const desiredWidth = displaySize.width * factor;
  const desiredHeight = displaySize.height * factor;

  const halfWidthScreen = displaySize.width >= container.width
    ? (displaySize.width - container.width) / 2
    : Math.min(
        (container.width - displaySize.width) / 2,
        factor > 1 ? Math.max(0, (desiredWidth - displaySize.width) / 2) : (container.width - displaySize.width) / 2
      );

  const halfHeightScreen = displaySize.height >= container.height
    ? (displaySize.height - container.height) / 2
    : Math.min(
        (container.height - displaySize.height) / 2,
        factor > 1 ? Math.max(0, (desiredHeight - displaySize.height) / 2) : (container.height - displaySize.height) / 2
      );

  const halfWidth = Math.max(0, halfWidthScreen) / safeScale;
  const halfHeight = Math.max(0, halfHeightScreen) / safeScale;

  return {
    minX: -halfWidth,
    maxX: halfWidth,
    minY: -halfHeight,
    maxY: halfHeight
  };
}

export function clampPosition(pos: { x: number; y: number }, mm: MinMax) {
  return {
    x: Math.min(mm.maxX, Math.max(mm.minX, pos.x)),
    y: Math.min(mm.maxY, Math.max(mm.minY, pos.y))
  };
}
