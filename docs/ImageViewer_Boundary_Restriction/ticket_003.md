# Ticket #003: 画像が小さい場合もドラッグで少し動かせるがcheckerboard-bg外に出ない境界制約強化
**優先度**: Medium

## 概要
現在の境界制約では、画像がコンテナより小さい場合、中央固定でドラッグ不可となっている。これを変更し、画像が小さい場合も画像の端がcheckerboard-bgの外に出ない範囲でドラッグ可能にする。これにより、ユーザーが画像を少し動かして位置調整できるが、完全に外に出て操作不能になることを防ぐ。

## 対象ファイル
- 変更: `src/lib/boundaryUtils.ts` - `computeMinMax`関数を変更し、小さい画像の場合のmin/max計算を調整

## 影響範囲
- `src/components/ImageViewer/index.tsx` - ドラッグ動作が変更（小さい画像も動かせるようになる）

## 実装手順
1. `src/lib/boundaryUtils.ts`の`computeMinMax`関数を変更
   - 画像が小さい場合（displayW <= container.width）のロジックを変更
   - minX = (displayW / 2) / scale, maxX = (container.width - displayW / 2) / scale
   - 同様にY軸
2. 変更後、ビルドと型チェックを実行

## 完了条件
- [ ] 画像が大きい場合の動作は変更なし（外に出ない）
- [ ] 画像が小さい場合、ドラッグで画像の端がcheckerboard-bg外に出ない範囲で動かせる
- [ ] 型エラーなし、ビルド成功
- [ ] 手動テスト: 小さい画像をドラッグして位置調整可能、外に出ないことを確認</content>
<parameter name="filePath">C:/Users/junse/Desktop/programmstage/VDI-solid/docs/ImageViewer_Boundary_Restriction/ticket_003.md