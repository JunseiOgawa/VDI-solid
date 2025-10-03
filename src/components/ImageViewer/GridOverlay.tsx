import type { Component, JSX } from 'solid-js';
import { Show } from 'solid-js';
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
 * 画像のズームや回転に追従するため、親要素と同じ transform を適用します。
 * 
 * グリッド線は CSS の background-image (linear-gradient) で実装し、
 * pointer-events: none により下の画像のドラッグ操作を妨げません。
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

  /**
   * グリッド線のスタイルを生成
   * 各分割線を linear-gradient で描画し、背景として重ねる
   */
  const gridStyle = (): JSX.CSSProperties => {
    const size = props.displaySize;
    if (!size || props.gridPattern === 'off') {
      return {};
    }

    const [cols, rows] = getGridDivisions();
    if (cols === 0 || rows === 0) {
      return {};
    }

    const colWidth = 100 / cols;
    const rowHeight = 100 / rows;

    // 縦線を生成（横方向の分割）
    const verticalLines = Array.from({ length: cols - 1 }, (_, i) => {
      const position = (i + 1) * colWidth;
      return `linear-gradient(90deg, transparent ${position - 0.05}%, rgba(255, 255, 255, 0.5) ${position - 0.05}%, rgba(255, 255, 255, 0.5) ${position + 0.05}%, transparent ${position + 0.05}%)`;
    });

    // 横線を生成（縦方向の分割）
    const horizontalLines = Array.from({ length: rows - 1 }, (_, i) => {
      const position = (i + 1) * rowHeight;
      return `linear-gradient(180deg, transparent ${position - 0.05}%, rgba(255, 255, 255, 0.5) ${position - 0.05}%, rgba(255, 255, 255, 0.5) ${position + 0.05}%, transparent ${position + 0.05}%)`;
    });

    return {
      width: `${size.width}px`,
      height: `${size.height}px`,
      'background-image': [...verticalLines, ...horizontalLines].join(', '),
      'pointer-events': 'none' as const,
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)', // 中央配置
    };
  };

  return (
    <Show when={props.gridPattern !== 'off' && props.displaySize}>
      <div
        class="grid-overlay"
        style={gridStyle()}
        aria-hidden="true"
      />
    </Show>
  );
};

export default GridOverlay;
