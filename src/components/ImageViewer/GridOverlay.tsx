import type { Component, JSX } from "solid-js";
import { createEffect, createMemo, onCleanup, onMount } from "solid-js";
import type { GridPattern } from "../../context/AppStateContext";

interface GridOverlayProps {
  /** グリッドパターン（'off' の場合は何も描画しない） */
  gridPattern: GridPattern;
  /** グリッド線の不透明度 (0.0-1.0) */
  gridOpacity: number;
}

/**
 * GridOverlay コンポーネント
 *
 * 画像の上に重ねて表示されるグリッド線を描画します。
 * Canvasを使ってグリッドを描画し、画像のズームや回転に追従します。
 * 親要素（ラッパーdiv）と同じサイズで描画されるため、完全に追従します。
 *
 * Canvasは pointer-events: none により下の画像のドラッグ操作を妨げません。
 */
const GridOverlay: Component<GridOverlayProps> = (props) => {
  /**
   * グリッドパターンに応じた分割数を返す
   * @returns [横方向の分割数, 縦方向の分割数]
   */
  const getGridDivisions = (): [number, number] => {
    switch (props.gridPattern) {
      case "3x3":
        return [3, 3];
      case "5x3":
        return [5, 3];
      case "4x4":
        return [4, 4];
      default:
        return [0, 0];
    }
  };

  const gridData = createMemo(() => {
    if (props.gridPattern === "off") {
      return { cols: 0, rows: 0 };
    }

    const [cols, rows] = getGridDivisions();
    if (cols === 0 || rows === 0) {
      return { cols: 0, rows: 0 };
    }

    return { cols, rows };
  });

  let canvasRef: HTMLCanvasElement | undefined;

  const drawGrid = () => {
    if (!canvasRef) return;

    const ctx = canvasRef.getContext("2d");
    if (!ctx) return;

    const { cols, rows } = gridData();
    if (cols === 0 || rows === 0) {
      ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
      return;
    }

    // 親要素のサイズを取得（ラッパーdivのサイズ = img要素の実際の表示サイズ）
    const parent = canvasRef.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    if (width === 0 || height === 0) return;

    // 高解像度対応
    const dpr = window.devicePixelRatio || 1;
    canvasRef.width = width * dpr;
    canvasRef.height = height * dpr;
    ctx.scale(dpr, dpr);

    // 背景をクリア
    ctx.clearRect(0, 0, width, height);

    // 線を描画（不透明度は props から取得）
    ctx.strokeStyle = `rgba(255, 255, 255, ${props.gridOpacity})`;
    ctx.lineWidth = 1;
    ctx.lineCap = "square";

    // 縦線
    for (let i = 1; i < cols; i++) {
      const x = Math.round((i * width) / cols);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // 横線
    for (let j = 1; j < rows; j++) {
      const y = Math.round((j * height) / rows);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  onMount(() => {
    drawGrid();

    // 親要素のサイズ変更を監視してグリッドを再描画
    if (canvasRef?.parentElement) {
      const resizeObserver = new ResizeObserver(() => {
        drawGrid();
      });
      resizeObserver.observe(canvasRef.parentElement);

      onCleanup(() => {
        resizeObserver.disconnect();
      });
    }
  });

  createEffect(() => {
    // グリッドパターンまたは不透明度が変更されたら再描画
    props.gridPattern;
    props.gridOpacity;
    drawGrid();
  });

  const overlayStyle: JSX.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    "pointer-events": "none",
    "z-index": 1,
  };

  return (
    <canvas
      ref={canvasRef}
      class="grid-overlay"
      style={overlayStyle}
      aria-hidden="true"
    />
  );
};

export default GridOverlay;
