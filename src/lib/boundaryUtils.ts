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
 * @returns X軸とY軸の最小・最大値を含むオブジェクト。
 */
export function computeMinMax(container: Size, displaySize: Size, scale: number): MinMax {
  const safeScale = Math.max(scale, Number.EPSILON);
  const displayW = displaySize.width;
  const displayH = displaySize.height;

  const halfWidth = Math.abs(displayW - container.width) / (2 * safeScale);
  const halfHeight = Math.abs(displayH - container.height) / (2 * safeScale);

  const minX = -halfWidth;
  const maxX = halfWidth;
  const minY = -halfHeight;
  const maxY = halfHeight;

  return { minX, maxX, minY, maxY };
}

export function clampPosition(pos: { x: number; y: number }, mm: MinMax) {
  return {
    x: Math.min(mm.maxX, Math.max(mm.minX, pos.x)),
    y: Math.min(mm.maxY, Math.max(mm.minY, pos.y))
  };
}
