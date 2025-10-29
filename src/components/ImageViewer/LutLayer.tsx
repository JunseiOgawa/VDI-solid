import type { Component } from "solid-js";
import { createEffect, onCleanup, onMount } from "solid-js";
import type { LutData } from "../../lib/lutUtils";
import {
  createProgram,
  setupQuad,
  createTextureFromImage,
  create3DLutTexture,
  VERTEX_SHADER_SOURCE,
  FRAGMENT_SHADER_SOURCE,
} from "../../lib/webglUtils";

interface LutLayerProps {
  /** 画像ソースURL */
  imageSrc: string;
  /** LUTデータ（3D LUT配列） */
  lutData: LutData | null;
  /** LUT適用の不透明度 (0.0-1.0) */
  opacity: number;
  /** Canvas要素のref（ヒストグラム計算用） */
  canvasRef?: (el: HTMLCanvasElement) => void;
}

/**
 * LutLayer コンポーネント
 *
 * WebGLを使用してLUTを画像に適用し、Canvas要素として描画します。
 * position: absolute で画像の上に重ねて表示されます。
 */
const LutLayer: Component<LutLayerProps> = (props) => {
  let canvasRef: HTMLCanvasElement | undefined;
  let gl: WebGLRenderingContext | null = null;
  let program: WebGLProgram | null = null;
  let imageTexture: WebGLTexture | null = null;
  let lutTexture: WebGLTexture | null = null;
  let imageElement: HTMLImageElement | null = null;

  // 現在のimageSrcとlutDataを追跡
  let currentImageSrc = "";
  let currentLutData: LutData | null = null;

  /**
   * WebGLの初期化
   */
  const initWebGL = (): boolean => {
    if (!canvasRef) return false;

    gl = canvasRef.getContext("webgl", {
      premultipliedAlpha: false,
      alpha: true,
    });

    if (!gl) {
      console.error("[LutLayer] WebGL not supported");
      return false;
    }

    try {
      // シェーダープログラムのコンパイルとリンク
      program = createProgram(gl, VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE);
      gl.useProgram(program);

      // フルスクリーン四角形の設定
      setupQuad(gl, program);

      console.log("[LutLayer] WebGL initialized successfully");
      return true;
    } catch (error) {
      console.error("[LutLayer] Failed to initialize WebGL:", error);
      return false;
    }
  };

  /**
   * 画像テクスチャを作成
   */
  const createImageTexture = async (): Promise<void> => {
    if (!gl || !program) return;

    const imageSrc = props.imageSrc;

    // 同じ画像の場合は再作成しない
    if (imageSrc === currentImageSrc && imageTexture) {
      return;
    }

    // 画像を読み込む
    const img = new Image();
    img.crossOrigin = "anonymous";

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () =>
        reject(new Error(`Failed to load image: ${imageSrc}`));
      img.src = imageSrc;
    });

    // 古いテクスチャを削除
    if (imageTexture) {
      gl.deleteTexture(imageTexture);
    }

    // 新しいテクスチャを作成
    imageTexture = createTextureFromImage(gl, img);
    imageElement = img;
    currentImageSrc = imageSrc;

    console.log(`[LutLayer] Image texture created: ${imageSrc}`);
  };

  /**
   * LUTテクスチャを作成
   */
  const createLutTexture = (): void => {
    if (!gl || !props.lutData) return;

    // 同じLUTデータの場合は再作成しない
    if (currentLutData && currentLutData.fileName === props.lutData.fileName) {
      return;
    }

    // 古いテクスチャを削除
    if (lutTexture) {
      gl.deleteTexture(lutTexture);
    }

    // 新しいLUTテクスチャを作成
    lutTexture = create3DLutTexture(gl, props.lutData.data, props.lutData.size);
    currentLutData = props.lutData;

    console.log(`[LutLayer] LUT texture created: ${props.lutData.fileName}`);
  };

  /**
   * 描画処理
   */
  const render = async (): Promise<void> => {
    if (!gl || !program || !canvasRef) return;

    try {
      // 画像テクスチャとLUTテクスチャを作成
      await createImageTexture();
      createLutTexture();

      if (!imageTexture || !lutTexture || !imageElement) return;

      // Canvasのサイズを画像に合わせる
      const parent = canvasRef.parentElement;
      if (parent) {
        const rect = parent.getBoundingClientRect();
        canvasRef.width = rect.width;
        canvasRef.height = rect.height;
      }

      // ビューポートの設定
      gl.viewport(0, 0, canvasRef.width, canvasRef.height);

      // 背景をクリア
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // プログラムを使用
      gl.useProgram(program);

      // ユニフォーム変数の設定
      const imageLocation = gl.getUniformLocation(program, "u_image");
      const lutLocation = gl.getUniformLocation(program, "u_lut");
      const lutSizeLocation = gl.getUniformLocation(program, "u_lutSize");

      // テクスチャユニットにバインド
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, imageTexture);
      gl.uniform1i(imageLocation, 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, lutTexture);
      gl.uniform1i(lutLocation, 1);

      gl.uniform1f(lutSizeLocation, props.lutData?.size || 33);

      // 描画
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      console.log("[LutLayer] Rendered successfully");
    } catch (error) {
      console.error("[LutLayer] Render failed:", error);
    }
  };

  // マウント時にWebGLを初期化
  onMount(() => {
    const success = initWebGL();
    if (success) {
      void render();
    }
  });

  // propsが変更されたら再描画
  createEffect(() => {
    // 依存関係を明示的に宣言
    const imageSrc = props.imageSrc;
    const lutData = props.lutData;
    const opacity = props.opacity;

    // opacityはCSSで制御するため、ここでは使用しない
    void opacity;

    if (gl && program && imageSrc && lutData) {
      void render();
    }
  });

  // クリーンアップ
  onCleanup(() => {
    if (gl) {
      if (imageTexture) gl.deleteTexture(imageTexture);
      if (lutTexture) gl.deleteTexture(lutTexture);
      if (program) gl.deleteProgram(program);

      console.log("[LutLayer] WebGL resources cleaned up");
    }
  });

  const handleCanvasRef = (el: HTMLCanvasElement) => {
    canvasRef = el;
    if (props.canvasRef) {
      props.canvasRef(el);
    }
  };

  return (
    <canvas
      ref={handleCanvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        "pointer-events": "none",
        opacity: props.opacity,
      }}
    />
  );
};

export default LutLayer;
