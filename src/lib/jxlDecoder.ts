import { decode } from "@jsquash/jxl";

/**
 * JXLファイルのデコード結果をキャッシュする
 * キー: ファイルパス、値: デコード済みのBlobURL
 */
const jxlCache = new Map<string, string>();

/**
 * JPEG XL画像をデコードしてBlobURLに変換する
 *
 * @param filePath - JXL画像のファイルパス
 * @returns デコード済み画像のBlobURL
 * @throws デコード失敗時にエラーをthrow
 */
export async function decodeJxlToBlob(filePath: string): Promise<string> {
  // キャッシュチェック
  const cached = jxlCache.get(filePath);
  if (cached) {
    console.log("[JXL Decoder] キャッシュからJXL画像を取得:", filePath);
    return cached;
  }

  console.log("[JXL Decoder] JXL画像のデコードを開始:", filePath);

  try {
    // ファイルを読み込み
    const response = await fetch(`file://${filePath}`);
    if (!response.ok) {
      throw new Error(`ファイルの読み込みに失敗しました: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    // JXLをデコード（ArrayBuffer → ImageData）
    const imageData = await decode(arrayBuffer);

    // ImageDataをCanvasに描画してBlobに変換
    const canvas = document.createElement("canvas");
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas 2D contextの取得に失敗しました");
    }

    ctx.putImageData(imageData, 0, 0);

    // CanvasからBlobを生成
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Blobへの変換に失敗しました"));
        }
      }, "image/png");
    });

    // BlobURLを生成
    const blobUrl = URL.createObjectURL(blob);

    // キャッシュに保存
    jxlCache.set(filePath, blobUrl);

    console.log("[JXL Decoder] JXL画像のデコードが完了しました:", {
      filePath,
      width: imageData.width,
      height: imageData.height,
      blobUrl,
    });

    return blobUrl;
  } catch (error) {
    console.error("[JXL Decoder] JXL画像のデコードに失敗しました:", error);
    throw error;
  }
}

/**
 * キャッシュをクリアする
 */
export function clearJxlCache(): void {
  // すべてのBlobURLを解放
  for (const blobUrl of jxlCache.values()) {
    URL.revokeObjectURL(blobUrl);
  }
  jxlCache.clear();
  console.log("[JXL Decoder] キャッシュをクリアしました");
}

/**
 * 特定のファイルのキャッシュを削除する
 */
export function removeJxlCache(filePath: string): void {
  const blobUrl = jxlCache.get(filePath);
  if (blobUrl) {
    URL.revokeObjectURL(blobUrl);
    jxlCache.delete(filePath);
    console.log("[JXL Decoder] キャッシュを削除しました:", filePath);
  }
}
