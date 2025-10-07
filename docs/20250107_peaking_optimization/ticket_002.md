# Ticket #002: SVGエッジ平滑化

**優先度**: High  
**見積時間**: 0.25時間（15分）  
**依存チケット**: なし

---

## 目的

フォーカスピーキングのエッジラインをSVG属性で平滑化し、ギザギザを視覚的に軽減する。
`stroke-linejoin`と`stroke-linecap`プロパティを使用して角を丸める。

---

## 対象ファイル

### 変更
- `src/components/ImageViewer/PeakingLayer.tsx`

---

## 影響範囲

- PeakingLayerコンポーネントのSVG描画のみ
- 処理ロジックへの影響なし
- パフォーマンスへの影響なし（GPUレンダリング）

---

## 実装手順

### 1. 現在のpolyline要素を確認

現在の実装:
```tsx
<polyline
  points={edgeToPolylinePoints(edge)}
  stroke={props.color}
  stroke-width="1.5"
  fill="none"
  opacity={props.opacity}
  style={{
    'vector-effect': 'non-scaling-stroke',
  }}
/>
```

### 2. SVG平滑化属性を追加

以下の2つの属性を追加:

```tsx
<polyline
  points={edgeToPolylinePoints(edge)}
  stroke={props.color}
  stroke-width="1.5"
  stroke-linejoin="round"  // ← 追加: 線の接合部を丸める
  stroke-linecap="round"   // ← 追加: 線の端を丸める
  fill="none"
  opacity={props.opacity}
  style={{
    'vector-effect': 'non-scaling-stroke',
  }}
/>
```

### 3. 既存属性の維持

以下の属性は**変更しない**:
- `vector-effect: non-scaling-stroke` - ズーム時の線幅維持
- `stroke-width: 1.5` - 線の太さ
- `opacity` - 不透明度制御

---

## 技術的詳細

### stroke-linejoinプロパティ

**機能**: 線分の接合部の形状を指定

**値の選択肢**:
- `miter` (デフォルト): 尖った角
- `round`: 丸い角（採用）
- `bevel`: 面取り角

**採用理由**: `round`が最も視覚的に滑らか

### stroke-linecapプロパティ

**機能**: 線の端の形状を指定

**値の選択肢**:
- `butt` (デフォルト): 平らな端
- `round`: 丸い端（採用）
- `square`: 四角い端

**採用理由**: `round`でエッジの始点・終点も滑らかに

### パフォーマンスへの影響

- **レンダリング**: GPUで処理されるため影響なし
- **メモリ**: 座標データは変わらないため増加なし
- **互換性**: 全モダンブラウザでサポート

---

## 視覚的効果の比較

### Before（現状）
```
  ┌─┐
  │ └─┐
  │   │  ← 角が尖っている
  └───┘
```

### After（実装後）
```
  ╭─╮
  │ ╰─╮
  │   │  ← 角が丸い
  ╰───╯
```

---

## エッジケース

### ケース1: 1点のみのエッジ
- **動作**: `stroke-linecap="round"`で丸い点として描画
- **期待**: 視覚的に自然

### ケース2: 直線のエッジ
- **動作**: `stroke-linejoin`は影響なし
- **期待**: 既存と同じ表示

### ケース3: 複雑な折れ線
- **動作**: すべての接合部が丸くなる
- **期待**: 全体的に滑らかな印象

---

## 完了条件

- [x] `stroke-linejoin="round"`が追加されている
- [x] `stroke-linecap="round"`が追加されている
- [x] `vector-effect: non-scaling-stroke`が維持されている
- [x] TypeScriptの型エラーがない
- [x] ビルドが成功する

---

## テスト項目

### 視覚確認

1. **通常表示**
   - ピーキングを有効化
   - エッジの角が丸く表示されることを確認

2. **ズーム表示**
   - 画像を拡大（200%、300%）
   - 線幅が維持され、角が丸いままであることを確認

3. **回転表示**
   - 画像を回転（90度、180度）
   - エッジが正しく描画され、角が丸いことを確認

4. **色変更**
   - ピーキング色を変更（lime → red → cyan）
   - すべての色で角が丸いことを確認

---

## 参考資料

### SVG Stroke属性
- [MDN: stroke-linejoin](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-linejoin)
- [MDN: stroke-linecap](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-linecap)
- [SVG Path Styling](https://www.w3.org/TR/SVG/painting.html#StrokeProperties)

### ブラウザ互換性
- stroke-linejoin: 全ブラウザサポート
- stroke-linecap: 全ブラウザサポート

---

## 実装後の確認

```bash
# ビルド
npm run build

# 開発サーバー起動
npm run dev
```

ブラウザで以下を確認:
1. ピーキングを有効化
2. 画像を読み込む
3. エッジの角が丸く表示されているか目視確認

---

## 補足: 今後の拡張案

もし視覚的改善が不十分な場合、以下を検討可能:

### オプション1: stroke-widthの調整
```tsx
stroke-width="2.0"  // 現状1.5から増やす
```

### オプション2: Douglas-Peucker簡略化
- Rust側で座標点を削減
- より滑らかな折れ線を生成
- 見積: +2時間

### オプション3: Catmull-Romスプライン
- 完全な曲線補間
- 処理コストが高い
- 見積: +3時間
