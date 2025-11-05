import type { Component } from "solid-js";
import { Show, createSignal, createEffect } from "solid-js";
import type { GridPattern } from "../../context/AppStateContext";
import type { LutData } from "../../lib/lutUtils";
import { isJxlFile } from "../../lib/fileUtils";
import { decodeJxlToBlob } from "../../lib/jxlDecoder";
import GridOverlay from "./GridOverlay";
import PeakingLayer from "./PeakingLayer";
import LutLayer from "./LutLayer";

interface ImageManagerProps {
  /** 画像ソースURL */
  src: string;
  /** 画像ファイルパス（ピーキング処理用） */
  imagePath: string | null;
  /** 画像要素のref */
  imgRef?: (el: HTMLImageElement) => void;
  /** 画像読み込み完了時のコールバック */
  onLoad?: () => void;
  /** 画像解像度変更時のコールバック */
  onResolutionChange?: (
    resolution: { width: number; height: number } | null,
  ) => void;

  // レイヤー関連props
  /** グリッドパターン */
  gridPattern: GridPattern;
  /** グリッド不透明度 */
  gridOpacity: number;
  /** ピーキング有効フラグ */
  peakingEnabled: boolean;
  /** ピーキング強度（0-255） */
  peakingIntensity: number;
  /** ピーキング色 */
  peakingColor: string;
  /** ピーキング不透明度（0.0-1.0） */
  peakingOpacity: number;
  /** ピーキング点滅 */
  peakingBlink: boolean;
  /** 画像ソースURL（null可、キャッシュバスト付き） */
  imageSrc: string | null;
  /** LUT有効フラグ */
  lutEnabled: boolean;
  /** LUTデータ */
  lutData: LutData | null;
  /** LUT不透明度 */
  lutOpacity: number;
  /** LutLayerのCanvas ref */
  lutCanvasRef?: (el: HTMLCanvasElement) => void;
}

/**
 * ImageManager コンポーネント
 *
 * 画像とすべてのレイヤー（LUT、ピーキング、グリッド）を統合管理します。
 * transformは親要素で管理されるため、このコンポーネントは純粋にレイヤーの描画を担当します。
 *
 * レイヤー構成:
 * 1. 基礎画像（img要素）
 * 2. LUT適用レイヤー（Canvas / WebGL）
 * 3. フォーカスピーキング（SVG）
 * 4. グリッドオーバーレイ（Canvas）
 */
const ImageManager: Component<ImageManagerProps> = (props) => {
  let wrapperRef: HTMLDivElement | undefined;
  let imgRef: HTMLImageElement | undefined;

  // JXL画像のデコード処理用のSignal
  const [decodedSrc, setDecodedSrc] = createSignal<string | null>(null);
  const [isDecoding, setIsDecoding] = createSignal<boolean>(false);
  const [decodeError, setDecodeError] = createSignal<string | null>(null);

  // JXL画像の場合はデコード処理を実行
  createEffect(() => {
    const imagePath = props.imagePath;
    const src = props.src;

    // 状態をリセット
    setDecodedSrc(null);
    setIsDecoding(false);
    setDecodeError(null);

    if (!imagePath || !src) return;

    // JXL画像かどうかをチェック
    if (isJxlFile(imagePath)) {
      console.log("[ImageManager] JXL画像を検出しました:", imagePath);
      setIsDecoding(true);

      decodeJxlToBlob(imagePath)
        .then((blobUrl) => {
          setDecodedSrc(blobUrl);
          setIsDecoding(false);
          console.log("[ImageManager] JXL画像のデコードが完了しました");
        })
        .catch((error) => {
          console.error("[ImageManager] JXL画像のデコードに失敗しました:", error);
          setDecodeError("JXL画像の読み込みに失敗しました");
          setIsDecoding(false);
        });
    }
  });

  const handleImgRef = (el: HTMLImageElement) => {
    imgRef = el;
    if (props.imgRef) {
      props.imgRef(el);
    }
  };

  const handleLoad = () => {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("[ImageManager] 画像読み込み完了");

    if (imgRef) {
      const rect = imgRef.getBoundingClientRect();
      console.log("[ImageManager] img.naturalWidth:", imgRef.naturalWidth);
      console.log("[ImageManager] img.naturalHeight:", imgRef.naturalHeight);
      console.log("[ImageManager] img.width:", imgRef.width);
      console.log("[ImageManager] img.height:", imgRef.height);
      console.log("[ImageManager] img.clientWidth:", imgRef.clientWidth);
      console.log("[ImageManager] img.clientHeight:", imgRef.clientHeight);
      console.log("[ImageManager] img.getBoundingClientRect():", {
        width: rect.width,
        height: rect.height,
      });
      const computedStyle = getComputedStyle(imgRef);
      console.log("[ImageManager] img computed style:", {
        width: computedStyle.width,
        height: computedStyle.height,
        display: computedStyle.display,
        objectFit: computedStyle.objectFit,
      });

      // 画像解像度をAppStateContextに設定
      if (props.onResolutionChange) {
        props.onResolutionChange({
          width: imgRef.naturalWidth,
          height: imgRef.naturalHeight,
        });
      }
    }

    if (wrapperRef) {
      const wrapperRect = wrapperRef.getBoundingClientRect();
      console.log(
        "[ImageManager] wrapper.clientWidth:",
        wrapperRef.clientWidth,
      );
      console.log(
        "[ImageManager] wrapper.clientHeight:",
        wrapperRef.clientHeight,
      );
      console.log("[ImageManager] wrapper.getBoundingClientRect():", {
        width: wrapperRect.width,
        height: wrapperRect.height,
      });
    }
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (props.onLoad) {
      props.onLoad();
    }
  };

  // JXL画像の場合はデコード済みsrcを使用、それ以外は元のsrcを使用
  const imageSrc = () => {
    if (props.imagePath && isJxlFile(props.imagePath)) {
      return decodedSrc() || props.src;
    }
    return props.src;
  };

  return (
    <div
      ref={(el) => (wrapperRef = el)}
      style={{
        position: "relative",
        display: "inline-block",
      }}
    >
      {/* デコード中のローディング表示 */}
      <Show when={isDecoding()}>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            "z-index": "10",
            padding: "12px 24px",
            background: "rgba(0, 0, 0, 0.7)",
            color: "white",
            "border-radius": "8px",
            "font-size": "14px",
          }}
        >
          JXL画像を読み込み中...
        </div>
      </Show>

      {/* デコードエラー表示 */}
      <Show when={decodeError()}>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            "z-index": "10",
            padding: "12px 24px",
            background: "rgba(220, 38, 38, 0.9)",
            color: "white",
            "border-radius": "8px",
            "font-size": "14px",
          }}
        >
          {decodeError()}
        </div>
      </Show>

      {/* Layer 1: 基礎画像 */}
      <img
        ref={handleImgRef}
        src={imageSrc()}
        alt="Displayed Image"
        onLoad={handleLoad}
        onDragStart={(e) => e.preventDefault()}
        style={{
          display: "block",
          width: "auto",
          height: "auto",
          "max-width": "none",
          "max-height": "none",
        }}
      />

      {/* Layer 2: LUT適用レイヤー */}
      <Show when={props.lutEnabled && props.lutData}>
        <LutLayer
          imageSrc={props.src}
          lutData={props.lutData}
          opacity={props.lutOpacity}
          canvasRef={props.lutCanvasRef}
        />
      </Show>

      {/* Layer 3: フォーカスピーキング */}
      <Show when={props.peakingEnabled && props.imagePath && props.imageSrc}>
        <PeakingLayer
          imagePath={props.imagePath!}
          imageSrc={props.imageSrc!}
          intensity={props.peakingIntensity}
          color={props.peakingColor}
          opacity={props.peakingOpacity}
          blink={props.peakingBlink}
        />
      </Show>

      {/* Layer 4: グリッドオーバーレイ */}
      <GridOverlay
        gridPattern={props.gridPattern}
        gridOpacity={props.gridOpacity}
      />
    </div>
  );
};

export default ImageManager;
