import type { Component, JSX } from 'solid-js';
import { createEffect, createMemo, onMount } from 'solid-js';
import type { GridPattern } from '../../context/AppStateContext';

interface GridOverlayProps {
  /** 画像の表示サイズ（width, height） */
  displaySize: { width: number; height: number } | null;
  /** グリッドパターン（'off' の場合は何も描画しない） */
  gridPattern: GridPattern;
}

/**
 * GridOverlay コンポーネント
 * 
 * 画像の上に重ねて表示されるグリッド線を描画します。
 * Canvasを使ってグリッドを描画し、画像のズームや回転に追従します。
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
      case '3x3':
        return [3, 3];
      case '5x3':
        return [5, 3];
      case '4x4':
        return [4, 4];
      default:
        return [0, 0];
    }
  };

  const gridData = createMemo(() => {
    const size = props.displaySize;
    if (!size || props.gridPattern === 'off') {
      return { size: null, cols: 0, rows: 0 };
    }

    const [cols, rows] = getGridDivisions();
    if (cols === 0 || rows === 0) {
      return { size, cols: 0, rows: 0 };
    }

    return { size, cols, rows };
  });

  let canvasRef: HTMLCanvasElement | undefined;

  const drawGrid = () => {
    if (!canvasRef) return;

    const ctx = canvasRef.getContext('2d');
    if (!ctx) return;

    const { size, cols, rows } = gridData();
    if (!size || cols === 0 || rows === 0) {
      ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
      return;
    }

    // Canvasサイズを設定
    canvasRef.width = size.width;
    canvasRef.height = size.height;

    // 高解像度対応
    const dpr = window.devicePixelRatio || 1;
    canvasRef.width = size.width * dpr;
    canvasRef.height = size.height * dpr;
    canvasRef.style.width = `${size.width}px`;
    canvasRef.style.height = `${size.height}px`;
    ctx.scale(dpr, dpr);

    // 背景をクリア
    ctx.clearRect(0, 0, size.width, size.height);

    // 線を描画
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.lineCap = 'square';

    // 縦線
    for (let i = 1; i < cols; i++) {
      const x = Math.round((i * size.width) / cols);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size.height);
      ctx.stroke();
    }

    // 横線
    for (let j = 1; j < rows; j++) {
      const y = Math.round((j * size.height) / rows);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size.width, y);
      ctx.stroke();
    }
  };

  onMount(() => {
    drawGrid();
  });

  createEffect(() => {
    drawGrid();
  });

  const overlayStyle: JSX.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    'pointer-events': 'none',
    'z-index': 5,
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
