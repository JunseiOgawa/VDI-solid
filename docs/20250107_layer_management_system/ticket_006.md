# Ticket #006: ImageViewer統合

## メタ情報
- **優先度**: Medium
- **見積**: 1.5時間
- **依存チケット**: #003, #005
- **ブロックするチケット**: #007, #009

## 目的
ImageViewer/index.tsxを改修し、ImageManagerコンポーネントを組み込みます。既存の画像表示ロジックをImageManagerに移行し、レイヤー管理システムを統合します。

## 対象ファイル

### 変更
- `src/components/ImageViewer/index.tsx`

### 影響範囲
- App.tsx（レンダリング確認）
- すべての画像操作機能（ズーム、パン、回転、ページ送り）

## 実装手順

### 1. ImageManagerのインポート
```tsx
import ImageManager from './ImageManager';
import { useAppState } from '../../context/AppStateContext';
```

### 2. AppStateからピーキング状態を取得
```tsx
const ImageViewer: Component = () => {
  const {
    currentImagePath,
    currentImageFilePath,
    setCurrentImagePath,
    zoomScale,
    setZoomScale,
    rotation,
    loadNextImage,
    loadPreviousImage,
    gridPattern,
    gridOpacity,
    // ピーキング関連を追加
    peakingEnabled,
    peakingIntensity,
    peakingColor,
    peakingOpacity,
  } = useAppState();
  
  // ... 既存のロジック ...
};
```

### 3. 既存の画像表示部分をImageManagerに置き換え
**Before（既存コード）:**
```tsx
<div
  style={{
    position: 'relative',
    transform: `translate(${position().x}px, ${position().y}px) scale(${zoomScale()}) rotate(${rotation()}deg)`,
    'transform-origin': 'center',
    'max-width': '100%',
    'max-height': '100%',
    cursor: isDragging() ? 'grabbing' : 'grab',
  }}
  onWheel={handleWheelZoom}
  onMouseDown={handleMouseDown}
>
  <img
    ref={(el: HTMLImageElement) => (imgEl = el)}
    src={imageSrc()!}
    alt="Displayed Image"
    onLoad={() => {
      measureAll();
      setPosition((prev) => clampToBounds(prev));
      calculateAndSetScreenFit();
    }}
    onDragStart={(e) => e.preventDefault()}
    style={{
      display: 'block',
      width: '100%',
      height: '100%',
      'object-fit': 'contain',
    }}
  />
  <GridOverlay gridPattern={gridPattern()} gridOpacity={gridOpacity()} />
</div>
```

**After（ImageManager使用）:**
```tsx
<ImageManager
  imageRef={(el: HTMLImageElement) => (imgEl = el)}
  imageSrc={imageSrc()!}
  zoomScale={zoomScale()}
  rotation={rotation()}
  position={position()}
  isDragging={isDragging()}
  onImageLoad={() => {
    measureAll();
    setPosition((prev) => clampToBounds(prev));
    calculateAndSetScreenFit();
  }}
  onWheel={handleWheelZoom}
  onMouseDown={handleMouseDown}
  gridPattern={gridPattern()}
  gridOpacity={gridOpacity()}
  peakingEnabled={peakingEnabled()}
  peakingConfig={{
    intensity: peakingIntensity(),
    color: peakingColor(),
    opacity: peakingOpacity(),
  }}
  currentImageFilePath={currentImageFilePath()}
/>
```

### 4. 動作確認とデバッグ
- ズーム機能が正常動作するか
- パン機能が正常動作するか
- 回転機能が正常動作するか
- グリッドが正常表示されるか
- ピーキングが表示されるか（peakingEnabled=true時）

### 5. ローディングインジケーター（オプション）
画像読み込み中やピーキング処理中の表示を追加:
```tsx
<Show when={isNavigating() || isLoading()}>
  <div class="loading-indicator">Loading...</div>
</Show>
```

## 技術的詳細

### ImageManagerへの移行ポイント
- **transform管理**: ImageManager内部で管理
- **イベントハンドラ**: ImageViewerで定義し、propsで渡す
- **ref**: imgElは引き続きImageViewerで保持（measureAll等で使用）

### Props伝播
ImageManagerは「見た目の統合」のみ担当。ロジック（ズーム計算、境界制約等）はImageViewerに残る。

### 既存機能の保持
- `handleWheelZoom`: そのまま
- `handleMouseDown`: そのまま
- `handleSequentialNavigation`: そのまま
- `calculateAndSetScreenFit`: そのまま

### エッジケース
1. **imageSrc() が null**: ImageManagerに空文字を渡さない、Show制御で対応
2. **ピーキング無効時**: `peakingEnabled=false` で PeakingLayer非表示
3. **currentImageFilePath が null**: ImageManagerに渡す、PeakingLayer内で対応済み

## 完了条件

### 機能チェックリスト
- [ ] ImageManager インポート
- [ ] AppStateからピーキング状態取得
- [ ] 既存画像表示部分をImageManagerに置き換え
- [ ] ズーム機能正常動作
- [ ] パン機能正常動作
- [ ] 回転機能正常動作
- [ ] グリッド表示正常動作
- [ ] ピーキング表示正常動作（ON時）
- [ ] ピーキング非表示（OFF時）

### 品質チェックリスト
- [ ] TypeScript型エラーなし
- [ ] 既存の画像ナビゲーション機能が動作
- [ ] パフォーマンス劣化なし
- [ ] eslint警告なし

## テスト項目

### 統合テスト（手動）
1. **画像表示テスト**
   - アプリ起動 → 画像が表示される
   - D&Dで画像変更 → 画像が切り替わる

2. **ズーム・パン・回転テスト**
   - ホイールズーム → 拡大縮小動作
   - ドラッグ → パン動作
   - 回転ボタン → 90度回転

3. **グリッド表示テスト**
   - グリッドメニューで3x3選択 → グリッド表示
   - グリッドOFF → グリッド非表示

4. **ピーキング表示テスト**
   - AppStateで `peakingEnabled=true` に変更
   - 緑色のエッジが表示される
   - ズームしても追従する
   - `peakingEnabled=false` → エッジ非表示

5. **ページ送りテスト**
   - 次の画像ボタン → 画像変更、ピーキングも更新
   - 前の画像ボタン → 画像変更、ピーキングも更新

6. **境界制約テスト**
   - ズームアウト時に画像が中央に戻る
   - パン時に画像がコンテナ外に出ない

### パフォーマンステスト
1. 60fpsを維持できるか（DevToolsのPerformanceタブ）
2. メモリリークなし（長時間使用後のメモリ使用量）

## 参考資料
- [SolidJS Show component](https://www.solidjs.com/docs/latest/api#show)
- [Component composition patterns](https://www.solidjs.com/guides/component-patterns)
