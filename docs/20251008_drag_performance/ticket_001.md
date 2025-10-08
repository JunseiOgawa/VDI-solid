# Ticket #001: 境界計算キャッシュの実装

## メタデータ
- **優先度**: High
- **見積**: 1.5時間
- **依存チケット**: なし
- **ステータス**: 未着手

## 目的
`clampToBounds`関数内で`useBoundaryConstraint`の計算結果をキャッシュし、スケール変更時のみ再計算することで、ドラッグ操作時のパフォーマンスを大幅に改善する。

## 対象ファイル

### 変更ファイル
- `src/components/ImageViewer/index.tsx`

### 新規ファイル
なし

## 影響範囲
- `clampToBounds`関数の内部実装
- ドラッグ操作時のパフォーマンス
- ズーム、回転時の境界制約

## 実装手順

### 1. キャッシュ用変数の追加
`ImageViewer`コンポーネント内に以下のキャッシュ変数を追加:
```typescript
let cachedBoundary: ReturnType<typeof useBoundaryConstraint> | null = null;
let lastScale = 0;
let lastRotation = 0;
let lastContainerWidth = 0;
let lastContainerHeight = 0;
```

### 2. `clampToBounds`関数の最適化
現在の実装:
```typescript
const { clampPosition: applyClamp } = useBoundaryConstraint({
  containerSize: container,
  imageSize: natural,
  displaySize: display,
  scale,
  maxTravelFactor: scale < 1.0 ? 2 : 1
});
return applyClamp(candidate);
```

最適化後:
```typescript
// キャッシュキーの比較
const currentRotation = rotation();
const needsRecalculation = 
  cachedBoundary === null ||
  lastScale !== scale ||
  lastRotation !== currentRotation ||
  lastContainerWidth !== container.width ||
  lastContainerHeight !== container.height;

if (needsRecalculation) {
  // 境界計算を実行してキャッシュ
  cachedBoundary = useBoundaryConstraint({
    containerSize: container,
    imageSize: natural,
    displaySize: display,
    scale,
    maxTravelFactor: scale < 1.0 ? 2 : 1
  });
  
  // キャッシュキーを更新
  lastScale = scale;
  lastRotation = currentRotation;
  lastContainerWidth = container.width;
  lastContainerHeight = container.height;
}

return cachedBoundary.clampPosition(candidate);
```

### 3. デバッグログの追加（オプション）
開発時にキャッシュヒット率を確認するためのログを追加:
```typescript
if (needsRecalculation) {
  console.log('[clampToBounds] Cache miss - recalculating boundary');
  // ...
} else {
  console.log('[clampToBounds] Cache hit - reusing cached boundary');
}
```

## 技術的詳細

### キャッシュキーの選定理由
- **scale**: 境界計算の最も重要なパラメータ
- **rotation**: 回転により画像の表示サイズが変わるため
- **containerSize**: コンテナサイズ変更時は境界を再計算する必要がある

### パフォーマンス改善の仕組み
- `useBoundaryConstraint`内の`computeMinMax`は複雑な計算を含む
- ドラッグ中はスケール・回転・コンテナサイズが変わらないため、キャッシュが有効
- 毎フレーム（60-120Hz）の計算が1回の計算で済む

### エッジケース
1. **初回呼び出し**: `cachedBoundary === null`で必ず計算実行
2. **数値誤差**: スケールの浮動小数点誤差は無視（厳密一致で比較）
3. **メモリリーク**: キャッシュは関数スコープ内の変数なので問題なし

## 完了条件

- [ ] キャッシュ用変数が正しく定義されている
- [ ] `clampToBounds`関数でキャッシュロジックが実装されている
- [ ] スケール変更時にキャッシュが無効化される
- [ ] 回転変更時にキャッシュが無効化される
- [ ] コンテナサイズ変更時にキャッシュが無効化される
- [ ] ドラッグ操作が滑らかに動作する
- [ ] 既存のズーム・回転機能が正常に動作する

## テスト項目

### 機能テスト
1. ドラッグ操作のスムーズさ
2. ズーム時の境界制約が正しく動作
3. 回転時の境界制約が正しく動作
4. 画像切り替え時の動作

### パフォーマンステスト
1. ドラッグ中の`clampToBounds`呼び出し回数（ログで確認）
2. CPU使用率の測定（開発者ツール）
3. フレームレートの確認（60fps維持）

## 参考資料
- SolidJS Reactivity: https://www.solidjs.com/docs/latest#reactivity
- `useBoundaryConstraint`: `src/hooks/useBoundaryConstraint.ts`
- `boundaryUtils`: `src/lib/boundaryUtils.ts`
