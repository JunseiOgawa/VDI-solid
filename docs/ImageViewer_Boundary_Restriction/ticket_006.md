# Ticket #006: フォーカス喪失後のドラッグ不能とリサイズ後の境界逸脱の修正
**優先度**: High

## 対象ファイル
- 変更: `src/components/ImageViewer/index.tsx`
- 変更: `src/hooks/useBoundaryConstraint.ts`
- 変更（必要に応じて）: `src/lib/boundaryUtils.ts`

## 影響範囲
- 画像ビューアのドラッグ/ズーム操作全般
- 境界制約の再利用部分（他コンポーネントで利用する可能性）

## 実装手順
1. **フォーカス喪失時のドラッグ状態リセット**
   - `window` の `blur`、`visibilitychange` にフックして、ドラッグ中であれば `handleMouseUp` 相当の処理を実行。
   - `Pointer` API を利用している場合は `pointercancel`、`mouseleave` なども検討し、グローバルイベントリスナーを `onCleanup` で破棄。
   - `isDragging` 状態と `startX/startY` を確実にリセットし、操作復帰時も安全にスタートできるようにする。

2. **コンテナサイズ変更への追従強化**
   - `ResizeObserver` または Solid の `createResizeObserver` 等を使用し、コンテナ要素のサイズ変化を常時監視。
   - 既存の `window.resize` リスナーに加え、Observer 内で `measureAll()` と `clampToBounds()` を呼び、遅延無く境界を再適用する。
   - `useBoundaryConstraint` に渡す `containerSize` / `displaySize` を Observer の更新タイミングで更新。

3. **境界計算の再確認**
   - `useBoundaryConstraint` や `computeMinMax` において、最新の `displaySize` が取得できない場合のフォールバックロジックを見直し、0サイズや `null` を受けた際はドラッグ更新をスキップするようにガードを追加。
   - 必要であれば `clampToBounds` に `if (!displaySize || !containerSize)` で原点へリセットする処理を追加。

4. **手動テスト**
   - ScreenFit状態→ドラッグ→他アプリへフォーカス→復帰後にドラッグ可能か確認。
   - 縮小/拡大後にウィンドウサイズを変更し、その後のドラッグで画像がcheckerboard-bg外へ出ないことを確認。

## 完了条件
- [ ] 他アプリ操作でフォーカスを外して戻ってもドラッグ操作が復帰する
- [ ] ウィンドウリサイズ後もドラッグで画像が画面外に外れない
- [ ] 型エラーなし・ビルド成功
- [ ] 上記手動テストが通過し、回帰がないことを確認
