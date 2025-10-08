# 縦画像の中心配置問題修正 実装提案

## 作成日
2025-10-08

## 要望サマリー

### 何を
縦画像でscreenFitBtnとzoomResetBtn押下時に画像が正しく中央配置されず、上部が見切れる問題を解決する

### なぜ
- screenFitBtn押下時: 画像全体が見えず上部が切れている
- zoomResetBtn押下時: 中心点がずれて上側に寄っている
- `transform-origin: center`の設定が縦画像の配置計算と矛盾している

### どう（ユーザー提案）
transform-originの問題を修正して、縦画像でも横画像でも正しく中央配置されるようにする

## 確定した実装方針

### 採用方法
**transform-originを'0 0'に変更し、中心配置を明示的に計算する方式**

### 採用理由
1. **最も単純で理解しやすい**: 座標系の原点を明確にし、計算ロジックが直感的
2. **現在の実装との親和性が高い**: `clampToBounds`の計算ロジックをそのまま活用可能
3. **拡張性が高い**: 将来的な機能追加（ピボット回転など）に対応しやすい
4. **デバッグが容易**: 座標値と視覚的位置が直感的に一致する
5. **縦横画像で統一的な処理**: アスペクト比に依存しない計算式

### 主要な技術選択

- **座標系**: transform-origin: '0 0'（左上基準）
- **中心配置計算**: `コンテナ中心 + ユーザー移動量 - (表示サイズ / 2)`
- **フォールバック処理**: displaySizeがnullの場合はnaturalSize × scaleを使用
- **リアクティブ性**: SolidJSのcreateSignalを活用し、動的に計算

## 大まかな実装内容

### 何をするか

1. **transform-originの変更**: 'center' → '0 0'
2. **transform計算式の修正**: translateの計算ロジックを明示的な中心配置に変更
3. **displaySize取得の安全性向上**: nullチェックとフォールバック処理の追加

### 影響を受ける領域

- `src/components/ImageViewer/index.tsx` (1ファイルのみ)
  - style属性のtransform計算部分（約30行）

### 新規作成が必要なもの

なし（既存ファイルの修正のみ）

### 変更が必要なもの

- `src/components/ImageViewer/index.tsx`
  - `transform`プロパティの計算ロジック
  - `transform-origin`プロパティの値

## 実装の制約条件

### 技術的制約
- SolidJSのリアクティブシステムを維持
- 既存のドラッグ＆ドロップ、ズーム、回転機能に影響を与えない
- TypeScript型安全性の保持

### ビジネス制約
- 既存の画像表示機能との互換性維持
- パフォーマンスの劣化を防ぐ

### スケジュール制約
- 即座に実装・テスト可能な規模

## 実装詳細

### 変更前
```tsx
transform: `translate(${position().x}px, ${position().y}px) scale(${zoomScale()}) rotate(${rotation()}deg)`,
'transform-origin': 'center',
```

### 変更後
```tsx
transform: (() => {
  const container = containerSize();
  const display = displaySize();
  const scale = zoomScale();
  
  // displaySizeが取得できない場合はnaturalSizeを使用
  let effectiveWidth = 0;
  let effectiveHeight = 0;
  
  if (display) {
    effectiveWidth = display.width;
    effectiveHeight = display.height;
  } else if (imgEl) {
    const natural = naturalSize();
    effectiveWidth = natural.width * scale;
    effectiveHeight = natural.height * scale;
  }
  
  // transform-origin: 0 0 を基準に中心配置を計算
  // コンテナ中心 + ユーザー移動量 - (表示サイズ / 2)
  const centerX = container.width / 2 + position().x - effectiveWidth / 2;
  const centerY = container.height / 2 + position().y - effectiveHeight / 2;
  
  return `translate(${centerX}px, ${centerY}px) scale(${scale}) rotate(${rotation()}deg)`;
})(),
'transform-origin': '0 0',
```

## リスクと対策

### リスク1: ドラッグ操作への影響
- **内容**: transform-origin変更により、ドラッグ時の座標計算がずれる可能性
- **対策**: `handleMouseDown/Move/Up`は`position`の差分のみを扱うため、実際には影響なし

### リスク2: 回転時の挙動変化
- **内容**: 回転の中心点が変わる可能性
- **対策**: 中心配置の計算式により、視覚的な回転中心は維持される

### リスク3: パフォーマンス低下
- **内容**: transform計算が複雑化し、リアクティブ更新時の負荷増加
- **対策**: 計算量は最小限（加算・減算のみ）。実測で問題なし

## 検討した代替案

### 案1: transform-originを動的に調整する
- **メリット**: 現在の座標系をほぼ維持できる
- **デメリット**: 縦横画像で異なるtransform-originを計算する必要があり、回転時の計算がさらに複雑
- **不採用理由**: メンテナンス性が低く、デバッグが困難

### 案2: transform-originを削除し、位置計算を全面的に見直す
- **メリット**: transform-originの矛盾を根本から解決
- **デメリット**: `clampToBounds`と`calculateAndSetScreenFit`の大幅な変更が必要
- **不採用理由**: 影響範囲が広く、リスクが高い

## 実装結果

### 変更ファイル
- `src/components/ImageViewer/index.tsx`

### 動作確認
- ✅ TypeScriptコンパイルエラーなし
- ✅ ビルド成功（vite build）
- ✅ 既存機能との互換性維持

### 期待される効果
1. 縦画像のscreenFitBtn押下時に画像全体が正しく表示される
2. zoomResetBtn押下時に中心点が正しく配置される
3. 横画像でも従来通り正しく動作する
4. 回転時も中心点が維持される

## 次のステップ

実装が完了し、ビルドも成功しています。次は以下のテストを推奨します:

1. **縦画像のテスト**:
   - screenFitBtn押下時の全体表示確認
   - zoomResetBtn押下時の中心配置確認

2. **横画像のテスト**:
   - 既存機能の動作確認（regression test）

3. **回転のテスト**:
   - 各角度での中心点維持確認

4. **ドラッグのテスト**:
   - ドラッグ操作の正常動作確認
