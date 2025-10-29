import { readTextFile } from "@tauri-apps/plugin-fs";
import { open } from "@tauri-apps/plugin-dialog";

/**
 * LUTデータのインターフェース
 */
export interface LutData {
  /** LUTのサイズ（通常は17, 33, 64） */
  size: number;
  /** LUTデータ配列（RGB値、0.0-1.0の範囲） */
  data: Float32Array;
  /** LUTファイル名 */
  fileName: string;
}

/**
 * .cubeファイルをパースする
 * .cube形式は業界標準の3D LUTフォーマット
 *
 * @param filePath - パースする.cubeファイルのパス
 * @returns パースされたLUTデータ
 * @throws ファイル読み込みエラー、パースエラー、データ妥当性エラー
 */
export async function parseCubeFile(filePath: string): Promise<LutData> {
  try {
    // Tauriのファイル読み込み機能を使用
    const content = await readTextFile(filePath);

    // .cubeファイルをパース
    const lines = content.split("\n");
    let size = 0;
    const data: number[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // コメント行と空行をスキップ
      if (trimmed.startsWith("#") || trimmed === "") {
        continue;
      }

      // LUT_3D_SIZE を読み取り
      if (trimmed.startsWith("LUT_3D_SIZE")) {
        size = parseInt(trimmed.split(/\s+/)[1], 10);
        continue;
      }

      // TITLE、DOMAIN_MIN、DOMAIN_MAXなどのメタデータをスキップ
      if (trimmed.match(/^[A-Z_]+/)) {
        continue;
      }

      // RGB値を読み取り（0.0-1.0の範囲）
      const values = trimmed.split(/\s+/).map(Number);
      if (values.length === 3 && !values.some(isNaN)) {
        data.push(...values);
      }
    }

    // LUT_3D_SIZEが見つからない場合
    if (size === 0) {
      throw new Error("LUT_3D_SIZE not found in .cube file");
    }

    // データの妥当性チェック
    const expectedDataLength = size * size * size * 3;
    if (data.length !== expectedDataLength) {
      throw new Error(
        `Invalid LUT data: expected ${expectedDataLength} values, got ${data.length}`,
      );
    }

    const fileName = filePath.split(/[/\\]/).pop() || "unknown.cube";

    console.log(
      `[LUT] Parsed ${fileName}: size=${size}, data length=${data.length}`,
    );

    return {
      size,
      data: new Float32Array(data),
      fileName,
    };
  } catch (error) {
    console.error("[LUT] Failed to parse .cube file:", error);
    throw error;
  }
}

/**
 * LUTファイル選択ダイアログを表示
 *
 * @returns 選択されたファイルパス、キャンセルされた場合はnull
 */
export async function selectLutFile(): Promise<string | null> {
  try {
    const selected = await open({
      filters: [
        {
          name: "LUT Files",
          extensions: ["cube"],
        },
      ],
      multiple: false,
      directory: false,
    });

    // selectedはstring | string[] | nullの可能性がある
    if (typeof selected === "string") {
      console.log(`[LUT] Selected file: ${selected}`);
      return selected;
    }

    return null;
  } catch (error) {
    console.error("[LUT] Failed to open file dialog:", error);
    throw error;
  }
}

/**
 * LUTファイルを選択して読み込む
 *
 * @returns パースされたLUTデータ、キャンセルされた場合はnull
 */
export async function selectAndLoadLutFile(): Promise<LutData | null> {
  const filePath = await selectLutFile();

  if (!filePath) {
    return null;
  }

  return await parseCubeFile(filePath);
}

/**
 * LUTキャッシュ
 * ファイルパスをキーとしてLUTデータをキャッシュ
 */
const lutCache = new Map<string, LutData>();
const MAX_CACHE_SIZE = 5;

/**
 * キャッシュからLUTデータを取得
 *
 * @param filePath - LUTファイルのパス
 * @returns キャッシュされたLUTデータ、存在しない場合はundefined
 */
export function getCachedLut(filePath: string): LutData | undefined {
  return lutCache.get(filePath);
}

/**
 * LUTデータをキャッシュに追加
 *
 * @param filePath - LUTファイルのパス
 * @param data - LUTデータ
 */
export function cacheLut(filePath: string, data: LutData): void {
  // キャッシュサイズ制限
  if (lutCache.size >= MAX_CACHE_SIZE) {
    const firstKey = lutCache.keys().next().value;
    if (firstKey) {
      lutCache.delete(firstKey);
      console.log(`[LUT] Cache evicted: ${firstKey}`);
    }
  }

  lutCache.set(filePath, data);
  console.log(`[LUT] Cached: ${filePath} (cache size: ${lutCache.size})`);
}

/**
 * キャッシュをクリア
 */
export function clearLutCache(): void {
  lutCache.clear();
  console.log("[LUT] Cache cleared");
}
