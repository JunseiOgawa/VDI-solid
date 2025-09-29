# Ticket #002: 画像が画面外に出て操作不能になる問題の共通境界制約機能実装
**優先度**: High

## 概要
ドラッグやズーム操作によって `img` 要素がビューポート（画面）外へ移動し、以降操作不能になる問題を防止するための共通機能（境界制約）の設計案とタスク分割を提示します。ImageViewer 固有のロジックに散在させず、フック／ライブラリ化して複数コンポーネントで再利用できる形で実装します。

## 対象ファイル（提案）
- 変更: `src/components/ImageViewer/index.tsx` - ドラッグ/パン/ズーム時に位置を clamp（制限）する呼び出しを追加
- 新規: `src/hooks/useBoundaryConstraint.ts` - ビューポートサイズ、画像サイズ、スケール、現在座標を受け取り、制約された座標を返す React フック
- 新規（オプション）: `src/lib/boundaryUtils.ts` - 境界計算の純粋関数（ユニットテスト対象）
- 変更（テスト）: `vitest` または `jest` ベースのユニットテストを追加（`src/lib/__tests__/boundary.test.ts`）

> 備考: 実装は最小侵襲で行うため、まずフック +純粋関数の実装→ImageViewerへの差し込み→必要に応じ他コンポーネントで採用、の順を推奨します。

## 提案するアーキテクチャ（構造）
1. 純粋関数層（lib）
   - 画像矩形（画像サイズ x スケール）とビューポート矩形を入力に取り、許容される中心位置または左上座標の最小/最大を返す。副作用なしで単体テスト可能。
2. フック層（hooks）
   - React 用フック `useBoundaryConstraint` を用意。引数：ビューポート幅/高さ、画像本来の幅/高さ、現在のスケール、回転（必要なら）など。出力：clamped {x, y} と、ドラッグ中に使う onDragMove 用ユーティリティ（コールバックや差し込み用関数）。
3. UI 層（components）
   - `ImageViewer` 側でフックを利用し、drag や wheel イベントの移動先を計算前にフックへ渡して clamped 座標を取得してから state を更新する。ズーム時にはズーム中心を維持しつつ位置補正を適用する。

## インターフェース案（契約）
- useBoundaryConstraint(args) -> { clampPosition, ensureVisible }
- 引数（例）
  - containerSize: { width, height }  ビューポート（画像を表示する領域）
  - imageSize: { width, height }  元画像の自然サイズ
  - scale: number  現在の拡大率
  - rotation?: number  必要なら回転角
- 返り値
  - clampPosition(pos: { x, y }): { x, y }  与えた座標を境界内に丸める
  - ensureVisible(): { x, y }  画像が小さすぎて余白が出ている場合のセンタリングや、極端にズームアウトしたときの回復座標

## 基本ロジック（言葉での擬似説明）
1. 画像の表示サイズ = imageSize * scale
2. 許容される左上（min）と右下（max）座標を計算する。たとえば、画像幅が containerWidth より大きい場合は、左上 x の範囲は [containerWidth - imageDisplayWidth, 0]。小さい場合は中央に寄せるため min=max=center
3. ドラッグで移動しようとする位置を受け取り、上記 min/max の範囲に clamp する
4. ズーム操作では、ズーム中心（マウス位置）を維持するために、ズーム前後の表示サイズ差からオフセットを計算し、その後 clamp を適用する

## エッジケース
- 画像がコンテナより小さい（横または縦）：自動センタリングする。ドラッグで無限に動かせないように位置は中央に固定または小さな範囲だけパンを許可
- 非等倍スケール（幅と高さで個別スケーリング）: 現在は uniform scale 前提で実装する想定。必要なら拡張
- 回転がある場合: 単純な axis-aligned バウンディングボックスで近似するか、厳密には回転後の AABB を計算（コスト増）
- 高速な連続ドラッグ（イベントレート）: フックは副作用を持たず計算を速くし、UI 側で requestAnimationFrame によるバッチ更新を使う
- 高 DPI / スクロールバーの存在：container の実測サイズを使用する

## 実装タスク（分割）
1. 設計・契約確定（このチケット）
2. 新規ファイル `src/lib/boundaryUtils.ts` を追加
   - 関数: computeDisplaySize(imageSize, scale)
   - 関数: computeMinMaxPosition(containerSize, displaySize)
   - 関数: clampPosition(pos, min, max)
3. 新規ファイル `src/hooks/useBoundaryConstraint.ts` を追加
   - React フック実装。引数で container サイズ等を受け取り、clampPosition を公開
4. `src/components/ImageViewer/index.tsx` を最小修正
   - 既存のドラッグ/ズーム処理の中でフックを利用するよう差し替え
   - ドラッグ終了時とズーム後に ensureVisible を呼んで最終位置を補正
5. ユニットテスト作成
   - `src/lib/__tests__/boundary.test.ts`: displaySize 計算、min/max算出、clamp の境界ケース（小さい画像・大きい画像）をカバー
6. 動作確認（手動）
   - ローカルで ImageViewer のドラッグ/ズームを試し、画面外に完全に消えないことを確認

## 品質ゲート（チェックリスト）
- [ ] 型エラー／ビルドエラーなし
- [ ] 境界計算ロジックのユニットテストが追加され、主要ケースが通過
- [ ] ImageViewer でのドラッグ・ズーム動作確認（手動）で画像が完全に画面外へ行かないことを確認
- [ ] 既存のユーザー操作フローに変な副作用が無い（ズーム中心の維持等）

## 見積と優先度
- 基本実装（uniform scale 前提、回転は非対応）: 3〜6時間
- 回転対応や非等倍対応を含む拡張: 追加 3〜8時間

## 次のアクション（推奨順）
1. このチケット内容を確認・承認いただく（ここで契約を確定）
2. `src/lib/boundaryUtils.ts` の実装 → ユニットテスト作成
3. `src/hooks/useBoundaryConstraint.ts` の実装
4. `ImageViewer` に組み込み、手動で検証

## 完了条件
- [ ] ドラッグ・ズーム操作で画像が完全に画面外へ移動して操作不能になるケースが再現不能になっている
- [ ] 主要ユースケースに関するユニットテストが追加され、CI（またはローカル実行）で成功する
- [ ] 既存の ImageViewer の振る舞いを大きく壊さない

---
作成者: 自動生成チケット
