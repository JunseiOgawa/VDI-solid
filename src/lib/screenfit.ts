import type { Size } from './boundaryUtils';
import { callCalculateAndSetScreenFit } from './imageViewerApi';


/**
 * 画像をコンテナ内にアスペクト比を保持して収めるための縮尺（スケール）を計算します。
 *
 * イメージとコンテナのアスペクト比を比較し、画像が横長の場合は横幅基準（container.width / image.width）で、
 * そうでない場合は縦幅基準（container.height / image.height）でスケールを算出します。
 * いずれかの幅または高さが 0 または falsy（未定義など）の場合は null を返します。
 *
 * @param imageSize - { width, height } を持つ画像サイズ
 * @param containerSize - { width, height } を持つコンテナサイズ
 * @returns 画像をコンテナ内に収めるためのスケール値（1 が原寸）。不正な寸法がある場合は null を返す。
 *
 * @example
 * // 画像を横幅基準で縮小
 * computeFitScale({ width: 800, height: 600 }, { width: 400, height: 300 }); // => 0.5
 *
 * @example
 * // 画像が縦長で縦基準で縮小
 * computeFitScale({ width: 600, height: 800 }, { width: 300, height: 400 }); // => 0.5
 */
export function computeFitScale(imageSize: Size, containerSize: Size): number | null {
  const iw = imageSize.width;
  const ih = imageSize.height;
  const cw = containerSize.width;
  const ch = containerSize.height;

  if (!iw || !ih || !cw || !ch) return null;

  const imageAspect = iw / ih;
  const containerAspect = cw / ch;

  // 横長なら横幅基準、縦長なら縦幅基準でスケールを算出
  return imageAspect > containerAspect ? (cw / iw) : (ch / ih);
}

/**
 * 画面フィット機能を実行する共通ハンドラ
 * ImageViewer側の登録済みハンドラを呼び出します
 */
export const handleScreenFit = (): void => {
  try {
    callCalculateAndSetScreenFit();
  } catch (e) {
    // ImageViewerが初期化されていない場合などは無視
  }
};
