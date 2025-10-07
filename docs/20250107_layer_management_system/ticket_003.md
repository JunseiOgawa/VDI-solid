# Ticket #003: ImageManager.tsx 実装

## メタ情報
- **優先度**: High
- **見積**: 2.5時間
- **依存チケット**: #001, #002
- **ブロックするチケット**: #005, #006

## 目的
画像とすべてのレイヤー（ピーキング、グリッド、将来の追加レイヤー）を統合管理するコンポーネントを作成します。transform（ズーム・パン・回転）を一元管理し、各レイヤーに伝播させます。

## 対象ファイル

### 新規作成
- `src/components/ImageViewer/ImageManager.tsx`

### 影響範囲
- ImageViewer/index.tsx（このコンポーネントから呼び出される）
- PeakingLayer.tsx（子コンポーネントとして配置）
- GridOverlay.tsx（子コンポーネントとして配置）

## 実装手順

### 1. コンポーネント構造設計
```tsx
import type { Component, JSX } from 'solid-js';
import { createMemo } from 'solid-js';
import type { GridPattern } from '../../context/AppStateContext';

interface ImageManagerProps {
  /** 画像要素のref */
  imageRef?: (el: HTMLImageElement) => void;
  /** 画像ソースURL */
  imageSrc: string;
  /** ズーム倍率 */
  zoomScale: number;
  /** 回転角度（度） */
  rotation: number;
  /** 位置オフセット */
  position: { x: number; y: number };
  /** ドラッグ中フラグ */
  isDragging: boolean;
  /** 画像読み込み完了時のコールバック */
  onImageLoad?: () => void;
  /** ホイールイベントハンドラ */
  onWheel?: (e: WheelEvent) => void;
  /** マウスダウンイベントハンドラ */
  onMouseDown?: (e: MouseEvent) => void;
  
  // レイヤー関連props
  /** グリッドパターン */
  gridPattern: GridPattern;
  /** グリッド不透明度 */
  gridOpacity: number;
  /** ピーキング有効フラグ */
  peakingEnabled: boolean;
  /** ピーキング設定 */
  peakingConfig?: {
    intensity: number;
    color: string;
    opacity: number;
  };
  /** 現在の画像ファイルパス（ピーキング処理用） */
  currentImageFilePath: string | null;
}

const ImageManager: Component<ImageManagerProps> = (props) => {
  // 実装
};

export default ImageManager;
```

### 2. Transform文字列の計算
```tsx
const transformStyle = createMemo(() => ({
  transform: `translate(${props.position.x}px, ${props.position.y}px) scale(${props.zoomScale}) rotate(${props.rotation}deg)`,
  'transform-origin': 'center',
}));

const cursorStyle = createMemo(() => 
  props.isDragging ? 'grabbing' : 'grab'
);
```

### 3. レイヤー構造のレンダリング
```tsx
return (
  <div
    style={{
      position: 'relative',
      ...transformStyle(),
      'max-width': '100%',
      'max-height': '100%',
      cursor: cursorStyle(),
    }}
    onWheel={props.onWheel}
    onMouseDown={props.onMouseDown}
  >
    {/* Layer 1: 基礎画像 */}
    <img
      ref={props.imageRef}
      src={props.imageSrc}
      alt="Displayed Image"
      onLoad={props.onImageLoad}
      onDragStart={(e) => e.preventDefault()}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        'object-fit': 'contain',
      }}
    />
    
    {/* Layer 2: フォーカスピーキング */}
    <Show when={props.peakingEnabled && props.currentImageFilePath}>
      <PeakingLayer
        imagePath={props.currentImageFilePath!}
        intensity={props.peakingConfig?.intensity ?? 60}
        color={props.peakingConfig?.color ?? 'lime'}
        opacity={props.peakingConfig?.opacity ?? 0.5}
      />
    </Show>
    
    {/* Layer 3: グリッドオーバーレイ */}
    <GridOverlay 
      gridPattern={props.gridPattern} 
      gridOpacity={props.gridOpacity} 
    />
    
    {/* 将来のレイヤー追加位置 */}
    {/* Layer 4: ... */}
    {/* Layer 5: ... */}
  </div>
);
```

### 4. イベントハンドリングの委譲
- `onWheel`, `onMouseDown` は親（ImageViewer）から受け取る
- イベント伝播を適切に制御（stopPropagation不要、親で処理）

### 5. レスポンシブ対応
- 親divが `max-width: 100%`, `max-height: 100%` を保持
- transformは親divに適用（子レイヤーも同じtransformが適用される）

## 技術的詳細

### Transform適用順序
```
translate → scale → rotate
```
この順序が重要。親divに適用することで、すべての子レイヤーが同じtransformを継承。

### レイヤーのz-index管理
- 明示的な`z-index`は不使用
- DOM順序で制御（後に書かれた要素が上に表示）
- 順序: 画像 → ピーキング → グリッド

### Position: absolute のレイヤー
PeakingLayerとGridOverlayは内部で `position: absolute` を使用し、親divのサイズにフィットする設計。

### メモ化の活用
- `transformStyle()` はcreateMemoで最適化
- propsの変更時のみ再計算

### エッジケース
1. **imageSrc が null/空文字**: 画像を表示しない、レイヤーも非表示
2. **currentImageFilePath が null**: ピーキング無効
3. **peakingEnabled が false**: PeakingLayer非表示
4. **gridPattern が 'off'**: GridOverlay内部で処理済み

## 完了条件

### 機能チェックリスト
- [ ] ImageManager.tsx ファイル作成
- [ ] Props型定義完了
- [ ] Transform計算実装
- [ ] レイヤー構造レンダリング実装
- [ ] イベントハンドラ委譲実装
- [ ] Show制御でピーキングON/OFF動作
- [ ] GridOverlay統合動作確認

### 品質チェックリスト
- [ ] TypeScript型エラーなし
- [ ] JSDocコメント記述
- [ ] コンポーネント名・Props名が明確
- [ ] eslint警告なし

## テスト項目

### 単体テスト（手動）
1. **画像表示テスト**
   - imageSrcを渡してimg要素が表示されるか
   - onImageLoadコールバックが発火するか

2. **Transform適用テスト**
   - zoomScale=2.0 → 画像が2倍に拡大
   - rotation=90 → 画像が90度回転
   - position={x:100, y:50} → 右下に移動

3. **レイヤー表示制御テスト**
   - peakingEnabled=false → PeakingLayer非表示
   - peakingEnabled=true → PeakingLayer表示（#004完成後）
   - gridPattern='off' → グリッド非表示

4. **イベントハンドリングテスト**
   - onWheelが親に伝播するか
   - onMouseDownが親に伝播するか

### 統合テスト
1. ImageViewer/index.tsx から ImageManager を呼び出し
2. ズーム・パン・回転が正常動作するか
3. GridOverlayが正常に表示されるか

## 参考資料
- [SolidJS Show component](https://www.solidjs.com/docs/latest/api#show)
- [CSS Transform property](https://developer.mozilla.org/en-US/docs/Web/CSS/transform)
- [SolidJS Memo](https://www.solidjs.com/docs/latest/api#creatememo)
