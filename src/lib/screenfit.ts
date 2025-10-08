import type { Size } from './boundaryUtils';


/**
 * 画像をコンテナ内にアスペクト比を保持して収めるための縮尺（スケール）を計算します。
 *
 * イメージとコンテナのアスペクト比を比較し、画像のアスペクト比がコンテナより大きい（コンテナに対して横長）場合は
 * 横幅基準（container.width / image.width）で、小さい（コンテナに対して縦長）場合は
 * 縦幅基準（container.height / image.height）でスケールを算出します。
 * これにより画像全体がコンテナ内に収まります。
 * いずれかの幅または高さが 0 または falsy（未定義など）の場合は null を返します。
 *
 * **注意**: この関数は画像が自然サイズで表示される場合のスケール計算用です。
 * img 要素で `object-fit: contain` を使用している場合は、そちらが自動的にフィッティングを行うため、
 * この関数で計算したスケールを適用すると二重にスケーリングされてしまいます。
 * その場合は zoom = 1.0 を使用してください。
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

  // コンテナに対して画像が横長なら横幅基準、縦長なら縦幅基準でスケールを算出
  return imageAspect > containerAspect ? (cw / iw) : (ch / ih);
}
