# Ticket #002: スケール・画像変更時のキャッシュクリア

## メタデータ
- **優先度**: High
- **見積**: 1時間
- **依存チケット**: #001
- **ステータス**: 未着手

## 目的
画像変更時やリセット時に境界計算のキャッシュを確実にクリアし、キャッシュの不整合によるバグを防ぐ。

## 対象ファイル

### 変更ファイル
- `src/components/ImageViewer/index.tsx`

### 新規ファイル
なし

## 影響範囲
- 画像切り替え時の境界制約
- スクリーンフィット実行時の境界計約
- リセット時の境界制約

## 実装手順

### 1. キャッシュクリア関数の作成
キャッシュを無効化するヘルパー関数を追加:
```typescript
const clearBoundaryCache = () => {
  cachedBoundary = null;
  lastScale = 0;
  lastRotation = 0;
  lastContainerWidth = 0;
  lastContainerHeight = 0;
};
```

### 2. 画像変更時のキャッシュクリア
`createEffect`を使って画像パス変更を監視し、キャッシュをクリア:
```typescript
createEffect(() => {
  // 画像パスが変わったらキャッシュをクリア
  const path = currentImagePath();
  if (path) {
    clearBoundaryCache();
  }
});
```

### 3. スクリーンフィット実行時のキャッシュクリア
`calculateAndSetScreenFit`関数の最初でキャッシュをクリア:
```typescript
const calculateAndSetScreenFit = () => {
  if (!imgEl) return null;
  
  // スケールが大きく変わるのでキャッシュをクリア
  clearBoundaryCache();
  
  // 既存の処理...
};
```

### 4. リセット時のキャッシュクリア
`resetImagePosition`関数でキャッシュをクリア:
```typescript
const resetImagePosition = () => {
  clearBoundaryCache();
  
  setPosition({ x: 0, y: 0 });
  setDisplaySize(null);
  setBaseSize(null);
  requestAnimationFrame(() => {
    measureAll();
    setPosition((prev) => clampToBounds(prev));
  });
};
```

### 5. コンテナサイズ変更時の対応
既に`clampToBounds`内でコンテナサイズをキャッシュキーにしているため、追加の処理は不要。ただし、念のため`measureAll`実行箇所を確認。

## 技術的詳細

### `createEffect`の使用理由
- SolidJSのリアクティブシステムを活用
- 画像パスが変わったタイミングで自動的に実行される
- 手動でのイベントリスナー管理が不要

### キャッシュクリアのタイミング
1. **画像変更時**: 画像サイズが変わるため境界計算も変わる
2. **スクリーンフィット時**: スケールが大きく変わるため
3. **リセット時**: 位置・スケールが初期化されるため

### エッジケース
1. **高速な画像切り替え**: `createEffect`が適切に処理
2. **ズーム中の画像切り替え**: キャッシュクリア後に正しく再計算
3. **回転中の画像切り替え**: 同上

## 完了条件

- [ ] `clearBoundaryCache`関数が実装されている
- [ ] 画像変更時に`createEffect`でキャッシュがクリアされる
- [ ] `calculateAndSetScreenFit`でキャッシュがクリアされる
- [ ] `resetImagePosition`でキャッシュがクリアされる
- [ ] 画像切り替え後も境界制約が正しく動作する
- [ ] スクリーンフィット後も境界制約が正しく動作する
- [ ] リセット後も境界制約が正しく動作する

## テスト項目

### 機能テスト
1. 画像を切り替えてドラッグ → 境界制約が正しく適用される
2. ズーム後にスクリーンフィット → 境界制約が正しく適用される
3. リセット後にドラッグ → 境界制約が正しく適用される
4. 回転後に画像切り替え → 境界制約が正しく適用される
5. 高速に複数回画像切り替え → クラッシュしない

### 統合テスト
1. ドラッグ → ズーム → 画像切り替え → ドラッグ
2. スクリーンフィット → 回転 → ドラッグ
3. ドラッグ中に画像切り替え（エッジケース）

## 参考資料
- SolidJS Effects: https://www.solidjs.com/docs/latest/api#createeffect
- 既存のクリーンアップロジック: `onCleanup`内の実装を参考
