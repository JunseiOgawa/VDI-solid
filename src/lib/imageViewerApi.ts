
export type ScreenFitFn = () => number | null;
export type ResetPositionFn = () => void;
export type ZoomToCenterFn = (newScale: number) => void;

let _calculateAndSetScreenFit: ScreenFitFn | null = null;
let _resetImagePosition: ResetPositionFn | null = null;
let _zoomToCenter: ZoomToCenterFn | null = null;

export const registerCalculateAndSetScreenFit = (fn: ScreenFitFn | null) => {
  _calculateAndSetScreenFit = fn;
};

export const registerResetImagePosition = (fn: ResetPositionFn | null) => {
  _resetImagePosition = fn;
};

export const registerZoomToCenter = (fn: ZoomToCenterFn | null) => {
  _zoomToCenter = fn;
};

/**
 * 画面フィット計算と設定を行う関数を呼び出す。
 * `_calculateAndSetScreenFit` が関数であればそれを呼び出し、結果を返す。
 * そうでなければ null を返す。
 * @returns {number | null} 計算結果の数値、または null。
 */
export const callCalculateAndSetScreenFit = (): number | null => {
  if (typeof _calculateAndSetScreenFit === 'function') return _calculateAndSetScreenFit();
  return null;
};

export const callResetImagePosition = (): void => {
  if (typeof _resetImagePosition === 'function') _resetImagePosition();
};

export const callZoomToCenter = (newScale: number): void => {
  if (typeof _zoomToCenter === 'function') _zoomToCenter(newScale);
};

export const hasImageViewerHandlers = () => Boolean(_calculateAndSetScreenFit || _resetImagePosition);
