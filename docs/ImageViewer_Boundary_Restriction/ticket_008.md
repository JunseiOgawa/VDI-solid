# Ticket #008: 画像が 100% を超える倍率のときに img 要素から範囲外に移動しないようにする
**優先度**: High

## 概要
画像を拡大（scale > 1.0）したときに、現在の実装では画像の移動（パン）が不適切に制限され、見た目上「2倍までしか動かせない」などの挙動が発生しています。本チケットはその原因を特定し、最小差分で修正するための設計とタスク分割を提供します。

既存コードの観察からの暫定結論:
- `ImageViewer` 側は `displaySize` として「表示上のピクセルサイズ（＝スケール適用済み）」を useBoundaryConstraint に渡している。
- `computeMinMax` は受け取った `displaySize` をさらに `safeScale` で割っており（/ safeScale）、スケール > 1 の場合に移動許容幅が不当に小さくなっている可能性が高い。

このため、修正方針は「displaySize をスケール済みとみなしている現在の呼出し側の挙動を維持するか、compute 側で期待する単位に合わせるか」を選び、最小コストで整合させることです。実装上の最小差分案としては compute 側の除算処理を見直す（スケールで割らない）修正がもっとも影響少なく迅速です。

## 対象ファイル
- 変更: `src/lib/boundaryUtils.ts` - computeMinMax のスケール取り扱いを修正
- 変更: `src/hooks/useBoundaryConstraint.ts` - doc/Args/コメント整備（振る舞い明記）、optional 引数のデフォルト挙動確認
- 変更: `src/components/ImageViewer/index.tsx` - `getDisplaySizeForScale` / `clampToBounds` 呼び出し箇所のコメント追加（単位確認）

（追補: 影響確認のため、以下ファイルの参照をチェック）
- `src/components/ImageViewer/index.tsx` - clamp 呼び出しと displaySize の生成ロジック

## 影響範囲
- ユーザーが画像をパン/ズームしたときの挙動全般。
- 他の UI（resizeObserver, wheel zoom, drag）の制約ロジック。

## 実装手順（最小差分案）
1. `src/lib/boundaryUtils.ts` の `computeMinMax` を修正
   - 背景: 現状は最終段で `halfWidth = Math.max(0, halfWidthScreen) / safeScale;` のように displaySize を safeScale で割っている。
   - 変更案（最小差分）: scaled displaySize（呼び出し側が渡している単位）に対して許容移動幅を計算するため、/ safeScale の除算を削除する。
   - 期待効果: scale > 1 のときに許容移動幅が縮小される問題が解消され、意図どおり画像を拡大時にも適切にパンできる。

2. 単体テスト（推奨）
   - `computeMinMax` に対して、コンテナサイズ固定、displaySize を scale = 0.5 / 1.0 / 2.0 のそれぞれで与え、返る min/max が期待値（拡大時に移動幅が減らない／縮小時の拡張が期待通り）か確認するテストを追加する。
   - `clampPosition` の境界値テスト（minX, maxX, minY, maxY のそれぞれ境界で clamp されること）を追加する。

3. 連携確認（手動 QA）
   - ImageViewer を起動して、代表的な画像でズーム 0.5 / 1.0 / 2.0 を試し、パンが期待どおり可能であることを確認する。
   - ウィンドウリサイズ、visibilitychange、Drag 操作でも同様に確認。

4. ドキュメント / コメント整備
   - `useBoundaryConstraint` および `computeMinMax` の JSDoc に「displaySize はスケール済みの表示サイズ（ピクセル）」という単位説明を明記するか、あるいは逆に呼び出し側に unscaled サイズを渡す設計に変更する場合はその旨を記載する。

## エッジケース / 注意点
- displaySize が null / 0 の場合は現状のガード（0 のとき clamp をスキップする等）を維持する。これを破ると NaN やゼロ除算の恐れあり。
- 呼び出し側（ImageViewer）の `getDisplaySizeForScale` が baseSize / displaySize のどちらを返すかで単位が異なるため、変更を行う際は両者の整合性を必ず確認する。
- maxTravelFactor の取り扱い（縮小時に移動範囲を広げる）には既存の要件があるため、今回の修正で不整合が生じないか確認する。

## 完了条件
- [ ] `src/lib/boundaryUtils.ts` の修正が行われている（PR レベル）
- [ ] `computeMinMax` の単体テストが追加され、通過している
- [ ] ImageViewer でズーム 2.0 のときに画像のパンが期待どおりに可能であることを手動 QA で確認済み
- [ ] JSDoc コメントまたは `useBoundaryConstraint` の Args 型注記で「displaySize の単位」が明確に記載されている

## 実装者への補足（小さな設計メモ）
- 最小差分で確実に直したい場合は compute 側の `/ safeScale` を削除する案が速いです。ただし、将来的に `computeMinMax` を「自然サイズで受け取り scale を別で乗算する仕様」に統一する設計（インターフェース変更）は API 的により明確になります。どちらを採るかはチームの方針次第。

## 次アクション
1. 本チケット内容に同意するか（最小差分案 or インターフェース変更案）を決定してください。
2. 同意が得られれば、該当ファイルのみを変更する PR を作成してください（PR タイトル: "fix: computeMinMax scale handling to allow panning when scale>1" など）。

---
作成者: 自動生成チケット（提案）
