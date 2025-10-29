import {
  createEffect,
  createSignal,
  onCleanup,
  type Component,
} from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { CONFIG } from "../../config/config";

interface HistogramLayerProps {
  imagePath: string | null;
  imageSrc: string | null;
  enabled: boolean;
  displayType: "rgb" | "luminance";
  position: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  size: number;
  opacity: number;
  /** LUT有効フラグ */
  lutEnabled?: boolean;
  /** LutLayerのCanvasへの参照 */
  lutCanvasGetter?: () => HTMLCanvasElement | null;
}

interface HistogramDataRGB {
  type: "RGB";
  r: number[];
  g: number[];
  b: number[];
}

interface HistogramDataLuminance {
  type: "Luminance";
  y: number[];
}

type HistogramData = HistogramDataRGB | HistogramDataLuminance;

interface HistogramResult {
  width: number;
  height: number;
  histogram_type: string;
  data: HistogramData;
}

// キャッシュストレージ
const histogramCache = new Map<string, HistogramResult>();

const HistogramLayer: Component<HistogramLayerProps> = (props) => {
  let canvasRef: HTMLCanvasElement | undefined;
  let abortController: AbortController | null = null;

  const [histogramData, setHistogramData] =
    createSignal<HistogramResult | null>(null);
  const [isLoading, setIsLoading] = createSignal<boolean>(false);

  // キャンバスの幅と高さ（ベースサイズ）
  const BASE_WIDTH = 200;
  const BASE_HEIGHT = 100;

  // Rust側のcalculate_histogramコマンドを呼び出す
  const invokeCalculateHistogram = async (
    imagePath: string,
    displayType: string,
  ): Promise<HistogramResult> => {
    const result = await invoke<HistogramResult>("calculate_histogram", {
      imagePath,
      displayType,
      requestId: `${imagePath}:${displayType}`,
    });
    return result;
  };

  /**
   * CanvasからImageDataを取得してヒストグラムを計算
   * LUT適用後の画像データからヒストグラムを計算する際に使用
   */
  const calculateHistogramFromCanvas = (
    canvas: HTMLCanvasElement,
    displayType: "rgb" | "luminance",
  ): HistogramResult => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      throw new Error("Failed to get 2d context from canvas");
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    if (displayType === "rgb") {
      // RGB別ヒストグラム
      const r = new Array(256).fill(0);
      const g = new Array(256).fill(0);
      const b = new Array(256).fill(0);

      for (let i = 0; i < data.length; i += 4) {
        r[data[i]]++;
        g[data[i + 1]]++;
        b[data[i + 2]]++;
      }

      return {
        width: canvas.width,
        height: canvas.height,
        histogram_type: "RGB",
        data: { type: "RGB", r, g, b },
      };
    } else {
      // 輝度ヒストグラム（Rec.709の係数を使用）
      const y = new Array(256).fill(0);

      for (let i = 0; i < data.length; i += 4) {
        const luminance = Math.round(
          0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2],
        );
        y[Math.min(255, Math.max(0, luminance))]++;
      }

      return {
        width: canvas.width,
        height: canvas.height,
        histogram_type: "Luminance",
        data: { type: "Luminance", y },
      };
    }
  };

  // ヒストグラムを描画する関数
  const drawHistogram = (
    ctx: CanvasRenderingContext2D,
    data: HistogramData,
    width: number,
    height: number,
  ) => {
    // キャンバスをクリア
    ctx.clearRect(0, 0, width, height);

    // 背景を半透明の黒で塗りつぶし
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, width, height);

    if (data.type === "RGB") {
      // RGB別表示
      const { r, g, b } = data;
      drawHistogramLine(ctx, r, width, height, "rgba(255, 0, 0, 0.7)");
      drawHistogramLine(ctx, g, width, height, "rgba(0, 255, 0, 0.7)");
      drawHistogramLine(ctx, b, width, height, "rgba(0, 0, 255, 0.7)");
    } else {
      // 輝度表示
      const { y } = data;
      drawHistogramLine(ctx, y, width, height, "rgba(255, 255, 255, 0.8)");
    }
  };

  // ヒストグラムの1チャンネルを描画する関数
  const drawHistogramLine = (
    ctx: CanvasRenderingContext2D,
    histogram: number[],
    width: number,
    height: number,
    color: string,
  ) => {
    if (histogram.length === 0) return;

    // 最大値を取得して正規化
    const max = Math.max(...histogram);
    if (max === 0) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();

    const xStep = width / histogram.length;

    for (let i = 0; i < histogram.length; i++) {
      const x = i * xStep;
      const normalizedValue = histogram[i] / max;
      const y = height - normalizedValue * height;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  };

  // ヒストグラムデータの取得とキャッシュ管理
  createEffect(() => {
    const imagePath = props.imagePath;
    const imageSrc = props.imageSrc;
    const enabled = props.enabled;
    const displayType = props.displayType;
    const lutEnabled = props.lutEnabled || false;
    const lutCanvasGetter = props.lutCanvasGetter;

    // 有効でない、または画像パスがない場合はクリア
    if (!enabled || !imagePath || !imageSrc) {
      setHistogramData(null);
      setIsLoading(false);
      if (abortController) {
        abortController.abort();
        abortController = null;
      }
      return;
    }

    // LUT有効時はキャッシュキーにlut情報を含める
    const cacheKey = lutEnabled
      ? `${imageSrc}:${displayType}:lut`
      : `${imageSrc}:${displayType}`;

    // キャッシュチェック
    const cached = histogramCache.get(cacheKey);
    if (cached) {
      setHistogramData(cached);
      setIsLoading(false);
      console.log(`[HistogramLayer] Cache hit: ${cacheKey}`);
      return;
    }

    // キャッシュミス時は古いデータをクリアし、処理中状態に設定
    setHistogramData(null);
    setIsLoading(true);

    // 前回のリクエストをキャンセル
    if (abortController) {
      abortController.abort();
      console.log("[HistogramLayer] 前回のリクエストをキャンセル");
    }

    // 新しいAbortControllerを作成
    abortController = new AbortController();
    const currentController = abortController;

    // LUT有効時はCanvasから直接計算
    if (lutEnabled && lutCanvasGetter) {
      // 少し遅延させてLutLayerの描画完了を待つ
      setTimeout(() => {
        if (currentController.signal.aborted) {
          console.log("[HistogramLayer] リクエストがキャンセルされました");
          return;
        }

        const lutCanvas = lutCanvasGetter();
        if (!lutCanvas) {
          console.warn(
            "[HistogramLayer] LutCanvas not available, falling back to original image",
          );
          // LutCanvasが取得できない場合は元の画像から計算
          invokeCalculateHistogram(imagePath, displayType)
            .then((result) => {
              if (currentController.signal.aborted) return;
              setHistogramData(result);
              setIsLoading(false);
              histogramCache.set(cacheKey, result);
              console.log(
                `[HistogramLayer] ヒストグラム取得完了（フォールバック）: ${cacheKey}`,
              );
            })
            .catch((error) => {
              if (currentController.signal.aborted) return;
              console.error("[HistogramLayer] ヒストグラム取得エラー:", error);
              setHistogramData(null);
              setIsLoading(false);
            });
          return;
        }

        try {
          const result = calculateHistogramFromCanvas(lutCanvas, displayType);
          setHistogramData(result);
          setIsLoading(false);

          // キャッシュに保存
          histogramCache.set(cacheKey, result);

          // キャッシュサイズ制限（LRU方式）
          if (histogramCache.size > CONFIG.histogram.cacheSize) {
            const firstKey = histogramCache.keys().next().value;
            if (firstKey) {
              histogramCache.delete(firstKey);
              console.log(`[HistogramLayer] キャッシュから削除: ${firstKey}`);
            }
          }

          console.log(
            `[HistogramLayer] LUT適用後のヒストグラム計算完了: ${cacheKey}`,
          );
        } catch (error) {
          console.error(
            "[HistogramLayer] Canvas からヒストグラム計算エラー:",
            error,
          );
          setHistogramData(null);
          setIsLoading(false);
        }
      }, 100);

      return;
    }

    // 通常のヒストグラム取得（Rust側）
    invokeCalculateHistogram(imagePath, displayType)
      .then((result) => {
        // キャンセルされていないか確認
        if (currentController.signal.aborted) {
          console.log("[HistogramLayer] リクエストがキャンセルされました");
          return;
        }

        // データを設定
        setHistogramData(result);
        setIsLoading(false);

        // キャッシュに保存
        histogramCache.set(cacheKey, result);

        // キャッシュサイズ制限（LRU方式）
        if (histogramCache.size > CONFIG.histogram.cacheSize) {
          const firstKey = histogramCache.keys().next().value;
          if (firstKey) {
            histogramCache.delete(firstKey);
            console.log(`[HistogramLayer] キャッシュから削除: ${firstKey}`);
          }
        }

        console.log(`[HistogramLayer] ヒストグラム取得完了: ${cacheKey}`);
      })
      .catch((error) => {
        if (currentController.signal.aborted) {
          console.log("[HistogramLayer] リクエストがキャンセルされました");
          return;
        }
        console.error("[HistogramLayer] ヒストグラム取得エラー:", error);
        setHistogramData(null);
        setIsLoading(false);
      });
  });

  // キャンバス描画
  createEffect(() => {
    const data = histogramData();
    const loading = isLoading();
    const canvas = canvasRef;

    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    // サイズ倍率を適用
    const width = BASE_WIDTH * props.size;
    const height = BASE_HEIGHT * props.size;

    canvas.width = width;
    canvas.height = height;

    // 処理中の場合は「処理中...」と表示
    if (loading) {
      // 背景を半透明の黒で塗りつぶし
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, width, height);

      // 「処理中...」テキストを表示
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.font = `${14 * props.size}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("処理中...", width / 2, height / 2);
      return;
    }

    // データがない場合は何も描画しない
    if (!data) {
      // 背景を半透明の黒で塗りつぶし（空の状態を示す）
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, width, height);
      return;
    }

    drawHistogram(ctx, data.data, width, height);
  });

  // クリーンアップ
  onCleanup(() => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  });

  // 位置に応じたスタイル
  const getPositionStyle = () => {
    const base = {
      position: "absolute" as const,
      "pointer-events": "none" as const,
      "z-index": 30,
      margin: "10px",
    };

    switch (props.position) {
      case "top-right":
        return { ...base, top: "0", right: "0" };
      case "top-left":
        return { ...base, top: "0", left: "0" };
      case "bottom-right":
        return { ...base, bottom: "0", right: "0" };
      case "bottom-left":
        return { ...base, bottom: "0", left: "0" };
      default:
        return { ...base, top: "0", right: "0" };
    }
  };

  return (
    <canvas
      ref={canvasRef}
      style={{
        ...getPositionStyle(),
        opacity: props.opacity,
        border: "1px solid rgba(255, 255, 255, 0.3)",
        "border-radius": "4px",
        "box-shadow": "0 2px 8px rgba(0, 0, 0, 0.3)",
      }}
    />
  );
};

export default HistogramLayer;
