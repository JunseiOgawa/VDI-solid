import { convertFileSrc } from "@tauri-apps/api/core";

export const SUPPORTED_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "bmp",
  "webp",
  "tiff",
  "tif",
  "avif",
  "jxl",
]);

export const convertFileToAssetUrl = (filePath: string): string => {
  return convertFileSrc(filePath);
};

export const isSupportedImageFile = (filePath: string): boolean => {
  const extension = filePath.split(".").pop()?.toLowerCase();
  return extension ? SUPPORTED_EXTENSIONS.has(extension) : false;
};

/**
 * ファイルパスをアセットURLに変換し、キャッシュバスティング用のクエリパラメータを追加する関数。
 *
 * この関数は、指定されたファイルパスを基に、TauriのconvertFileSrc関数を使用してベースURLを生成します。
 * その後、URLにキャッシュを無効化するためのバージョン番号（seed）をクエリパラメータとして追加します。
 * これにより、ブラウザのキャッシュを回避して最新のファイルを読み込むことができます。
 *
 * @param filePath - 変換対象のファイルパス。文字列として指定します。
 * @param seed - キャッシュバスティング用のバージョン番号。デフォルトは現在のタイムスタンプ（Date.now()）です。数値として指定します。
 * @returns キャッシュバスティングが適用されたアセットURL。文字列として返されます。
 *
 * @example
 * ```typescript
 * const url = convertFileToAssetUrlWithCacheBust('/path/to/file.png');
 * console.log(url); // 例: "asset://localhost/path/to/file.png?v=1234567890"
 * ```
 *
 * 内部の処理詳細:
 * - `convertFileSrc(filePath)` を呼び出して、ファイルパスをアセットURLのベース部分に変換します。
 * - ベースURLにクエリパラメータが既に含まれているかをチェックし、適切なセパレータ（'?' または '&'）を選択します。
 * - 最終的に、ベースURLに `v=${seed}` の形式でバージョン番号を追加したURLを返します。
 */
export const convertFileToAssetUrlWithCacheBust = (
  filePath: string,
  seed: number = Date.now(),
): string => {
  const base = convertFileSrc(filePath);
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}v=${seed}`;
};
