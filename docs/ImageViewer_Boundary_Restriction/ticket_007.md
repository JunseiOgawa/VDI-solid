# Ticket #007: 低倍率時のドラッグ範囲を画像サイズの2倍以内に制限
**優先度**: Medium

## 目的
画像を極端に縮小（scale < 1.0）した際に、従来の境界制約では checkerboard-bg の外へ無限に移動できてしまう。縮小時のみ「現在の表示画像サイズの最大2倍まで」の矩形範囲にドラッグを制限する。

## 対象ファイル
- 変更: `src/lib/boundaryUtils.ts`
- 変更: `src/hooks/useBoundaryConstraint.ts`
- 変更: `src/components/ImageViewer/index.tsx`

## 影響範囲
- 画像ビューワーのドラッグ挙動
- drag制約ロジックを再利用する箇所（将来的に別コンポーネントで利用する可能性）

## 実装手順
1. **境界計算ロジックの拡張**
   - `computeMinMax` にオプション引数 `maxTravelFactor`（デフォルト=1）を追加し、低倍率のときのみ 2 を渡せるようにする。
   - `maxTravelFactor` をもとに、表示サイズベースの余白を `factor * displaySize` で再計算し、移動可能範囲を広げる。

2. **フック側の対応**
   - `useBoundaryConstraint` の引数に `maxTravelFactor` を追加。
   - scale < 1.0 の場合のみ `maxTravelFactor = 2` を渡し、それ以外は `1`。

3. **ImageViewer の呼び出し調整**
   - `clampToBounds` 内で、現在の `scale` が 1 未満なら `maxTravelFactor=2`、1 以上なら `1` を渡す。
   - これに伴い `clampPosition` 呼び出し箇所もフックの新引数を受け取るよう更新。

4. **手動テスト**
   - ズーム率 100%（scale=1.0）以上: 従来どおり checkerboard-bg 外に出ないことを確認。
   - 50%（scale=0.5）など低倍率: 表示サイズの2倍以内でのみドラッグできることを確認。

## 完了条件
- [ ] scale < 1.0 のとき画像が2倍サイズの矩形内に制限される
- [ ] scale >= 1.0 のとき従来通りの挙動（checkerboard-bg外に出ない）
- [ ] 型エラーなし・ビルド成功
- [ ] 手動テスト済み（低倍率・高倍率の両方）
