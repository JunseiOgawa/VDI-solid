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
  /** ピーキング点滅 */
  peakingBlink: boolean;
  /** 画像ソースURL（null可、キャッシュバスト付き） */
  imageSrc: string | null;
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
  let wrapperRef: HTMLDivElement | undefined;
  let imgRef: HTMLImageElement | undefined;

  const handleImgRef = (el: HTMLImageElement) => {
    imgRef = el;
    if (props.imgRef) {
      props.imgRef(el);
    }
  };

  const handleLoad = () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[ImageManager] 画像読み込み完了');

    if (imgRef) {
      const rect = imgRef.getBoundingClientRect();
      console.log('[ImageManager] img.naturalWidth:', imgRef.naturalWidth);
      console.log('[ImageManager] img.naturalHeight:', imgRef.naturalHeight);
      console.log('[ImageManager] img.width:', imgRef.width);
      console.log('[ImageManager] img.height:', imgRef.height);
      console.log('[ImageManager] img.clientWidth:', imgRef.clientWidth);
      console.log('[ImageManager] img.clientHeight:', imgRef.clientHeight);
      console.log('[ImageManager] img.getBoundingClientRect():', {
        width: rect.width,
        height: rect.height
      });
      const computedStyle = getComputedStyle(imgRef);
      console.log('[ImageManager] img computed style:', {
        width: computedStyle.width,
        height: computedStyle.height,
        display: computedStyle.display,
        objectFit: computedStyle.objectFit
      });
    }

    if (wrapperRef) {
      const wrapperRect = wrapperRef.getBoundingClientRect();
      console.log('[ImageManager] wrapper.clientWidth:', wrapperRef.clientWidth);
      console.log('[ImageManager] wrapper.clientHeight:', wrapperRef.clientHeight);
      console.log('[ImageManager] wrapper.getBoundingClientRect():', {
        width: wrapperRect.width,
        height: wrapperRect.height
      });
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (props.onLoad) {
      props.onLoad();
    }
  };

  return (
    <div
      ref={(el) => (wrapperRef = el)}
      style={{
        position: 'relative',
        display: 'inline-block',
      }}
    >
      {/* Layer 1: 基礎画像 */}
      <img
        ref={handleImgRef}
        src={props.src}
        alt="Displayed Image"
        onLoad={handleLoad}
        onDragStart={(e) => e.preventDefault()}
        style={{
          display: 'block',
          width: 'auto',
          height: 'auto',
          'max-width': 'none',
          'max-height': 'none',
        }}
      />

      {/* Layer 2: フォーカスピーキング */}
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

      {/* Layer 3: グリッドオーバーレイ */}
      <GridOverlay gridPattern={props.gridPattern} gridOpacity={props.gridOpacity} />

      {/* 将来のレイヤー追加位置 */}
      {/* Layer 4: ... */}
    </div>
  );
};

export default ImageManager;
