# Ticket #005: ScreenFit状態でのドラッグ逸脱防止の実装実行
**優先度**: High

## 概要
ticket_004.mdの詳細手順に基づき、ScreenFit状態での画像ドラッグ逸脱を防ぐ実装を実行。表示サイズ計測、境界計算改修、呼び出し更新を行い、ビルド・テストを実施。

## 対象ファイル
- 変更: `src/components/ImageViewer/index.tsx`
- 変更: `src/hooks/useBoundaryConstraint.ts`
- 変更: `src/lib/boundaryUtils.ts`

## 影響範囲
- ImageViewerのドラッグ・ズーム挙動
- 境界制約機能の再利用箇所

## 実装手順
1. **ImageViewerの表示サイズ計測追加**  
   - `displaySize` signal を追加。  
   - `onLoad` ハンドラで `imgEl.getBoundingClientRect()` を呼び `setDisplaySize`。  
   - `handleWheelZoom` でズーム変更後に `setDisplaySize`。  
   - `window.addEventListener('resize', () => { if (imgEl) setDisplaySize(imgEl.getBoundingClientRect()); })` を追加。

2. **useBoundaryConstraintの拡張**  
   - `Args` 型に `displaySize?: Size` を追加。  
   - フック内で `displaySize` があればそれを `computeMinMax` に渡す。

3. **boundaryUtils.computeMinMaxの改修**  
   - 引数を `(container: Size, displaySize: Size, scale: number)` に変更。  
   - `displayW = displaySize.width`, `displayH = displaySize.height`。  
   - 小さい画像: `minX = - (container.width - displayW) / 2 / scale`, `maxX = (container.width - displayW) / 2 / scale`。  
   - 大きい画像: `minX = - (displayW - container.width) / 2 / scale` など。

4. **ImageViewerの境界計算呼び出し更新**  
   - `useBoundaryConstraint` 呼び出しで `displaySize: displaySize() || { width: imgEl.naturalWidth, height: imgEl.naturalHeight }` を渡す。  
   - `onLoad` で `displaySize` 設定後、初期位置clamp。

5. **ビルド・テスト**  
   - `npm run build` 実行。  
   - ScreenFit状態・ズーム後のドラッグテスト。

## 完了条件
- [ ] 各ファイルの変更完了
- [ ] ビルド成功
- [ ] ScreenFit状態でドラッグしてもcheckerboard-bg外に出ない
- [ ] ズーム後も適切に制約