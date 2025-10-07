import type { Component } from 'solid-js';
import { Show } from 'solid-js';
import type { GridPattern } from '../../context/AppStateContext';
import GridOverlay from './GridOverlay';
import PeakingLayer from './PeakingLayer';

interface ImageManagerProps {
  /** 画像ソースURL */
  src: string;
  /** 画像ファイルパス（ピーキング処理用） */
  imagePath: string | null;
  /** 画像要素のref */
  imgRef?: (el: HTMLImageElement) => void;
  /** 画像読み込み完了時のコールバック */
  onLoad?: () => void;

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
}

/**
 * ImageManager コンポーネント
 *
 * 画像とすべてのレイヤー（ピーキング、グリッド）を統合管理します。
 * transformは親要素で管理されるため、このコンポーネントは純粋にレイヤーの描画を担当します。
 *
 * レイヤー構成:
 * 1. 基礎画像（img要素）
 * 2. フォーカスピーキング（SVG）
 * 3. グリッドオーバーレイ（Canvas）
 * (将来: レイヤー4, 5が来ても問題なく冗長化)
 */
const ImageManager: Component<ImageManagerProps> = (props) => {
  return (
    <div
      style={{
        position: 'relative',
        display: 'block',
        width: '100%',
        height: '100%',
      }}
    >
      {/* Layer 1: 基礎画像 */}
      <img
        ref={props.imgRef}
        src={props.src}
        alt="Displayed Image"
        onLoad={props.onLoad}
        onDragStart={(e) => e.preventDefault()}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          'object-fit': 'contain',
        }}
      />

      {/* Layer 2: フォーカスピーキング */}
      <Show when={props.peakingEnabled && props.imagePath}>
        <PeakingLayer
          imagePath={props.imagePath!}
          intensity={props.peakingIntensity}
          color={props.peakingColor}
          opacity={props.peakingOpacity}
        />
      </Show>

      {/* Layer 3: グリッドオーバーレイ */}
      <GridOverlay gridPattern={props.gridPattern} gridOpacity={props.gridOpacity} />

      {/* 将来のレイヤー追加位置 */}
      {/* Layer 4: ... */}
      {/* Layer 5: ... */}
    </div>
  );
};

export default ImageManager;
