# Ticket #004: ScreenFit状態でのドラッグによる画像逸脱防止
**優先度**: High

## 概要
ScreenFit（ズーム倍率=1）の初期状態でも、画像をドラッグするとcheckerboard-bg外に画像が出てしまう問題が発生している。原因は境界制約に利用している画像サイズが実際の表示サイズではなく自然サイズ（naturalWidth/Height）に基づいているためである。実表示サイズに基づく境界計算に改修し、初期状態から画像が外に出ないようにする。

## 対象ファイル
- 変更: `src/lib/boundaryUtils.ts`
- 変更: `src/hooks/useBoundaryConstraint.ts`
- 変更: `src/components/ImageViewer/index.tsx`

## 影響範囲
- 画像のドラッグ・ズーム挙動全般
- 将来の境界制約再利用箇所

## 実装手順（詳細）
1. **ImageViewerの表示サイズ計測追加**  
   - `src/components/ImageViewer/index.tsx` に `displaySize` signal を追加（例: `const [displaySize, setDisplaySize] = createSignal<Size | null>(null);`）。  
   - 画像ロード時（`onLoad` ハンドラ内）とズーム変更後（`handleWheelZoom` 内）に `imgEl.getBoundingClientRect()` を呼び、実サイズを取得して `setDisplaySize`。  
   - ウィンドウリサイズ時にも再計算（`window.addEventListener('resize', ...)` を追加）。

2. **useBoundaryConstraintの拡張**  
   - `src/hooks/useBoundaryConstraint.ts` の `Args` 型に `displaySize?: Size` を追加。  
   - フック内で `displaySize` が提供された場合、それを優先して `computeMinMax` に渡す。未提供時は従来の `imageSize` を使用。

3. **boundaryUtils.computeMinMaxの改修**  
   - `src/lib/boundaryUtils.ts` の `computeMinMax` 関数を変更:  
     - 引数を `(container: Size, displaySize: Size, scale: number)` に変更（displaySizeは実表示サイズ）。  
     - 内部で `displayW = displaySize.width`, `displayH = displaySize.height` とし、scaleで割らずに直接使用。  
     - 小さい画像の場合: `minX = - (container.width - displayW) / 2 / scale`, `maxX = (container.width - displayW) / 2 / scale` （画像の端がcontainer外に出ない範囲）。  
     - 大きい画像の場合: 従来通り `minX = - (displayW - container.width) / 2 / scale` など。

4. **ImageViewerの境界計算呼び出し更新**  
   - `handleMouseMove` と `handleWheelZoom` で `useBoundaryConstraint({ containerSize: containerSize(), displaySize: displaySize() || { width: imgEl.naturalWidth, height: imgEl.naturalHeight }, scale: zoomScale() })` のように呼び出し。  
   - `onLoad` ハンドラで `displaySize` を設定後、初期位置をclamp。

5. **ビルド・テスト**  
   - `npm run build` で型チェック・ビルド確認。  
   - 手動テスト: ScreenFit状態でドラッグ、ズームイン/アウト後のドラッグで画像がcheckerboard-bg外に出ないことを確認。

## 完了条件
- [ ] ScreenFit状態（ズーム倍率=1）で画像をドラッグしてもcheckerboard-bg外にはみ出さない
- [ ] ズームイン/アウト後も画像が完全に画面外へ消えない
- [ ] 型エラー・ビルドエラーがない
- [ ] 手動テストで問題が再現しない
