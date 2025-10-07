# Ticket #007: CSS Animationとスタイリング

## メタ情報
- **優先度**: Low
- **見積**: 1時間
- **依存チケット**: #005, #006
- **ブロックするチケット**: なし

## 目的
フォーカスピーキングのエッジに視覚的な魅力を追加し、ユーザーがピント合わせ領域を容易に識別できるようにします。点滅・発光などのアニメーション効果を実装します。

## 対象ファイル

### 変更
- `src/components/ImageViewer/PeakingLayer.tsx`
- `src/App.css`（またはPeakingLayer.module.css新規作成）

### 影響範囲
- ピーキング表示の視覚効果のみ（機能に影響なし）

## 実装手順

### 1. CSSアニメーション定義
```css
/* src/App.css または PeakingLayer.module.css */

@keyframes peaking-pulse {
  0%, 100% {
    opacity: 0.3;
    stroke-width: 1.5;
  }
  50% {
    opacity: 0.7;
    stroke-width: 2.5;
  }
}

@keyframes peaking-glow {
  0%, 100% {
    filter: drop-shadow(0 0 0px currentColor);
  }
  50% {
    filter: drop-shadow(0 0 6px currentColor);
  }
}

@keyframes peaking-hue-shift {
  0%, 100% {
    filter: hue-rotate(0deg);
  }
  50% {
    filter: hue-rotate(30deg);
  }
}

.peaking-edge {
  animation: peaking-pulse 1.5s ease-in-out infinite;
}

.peaking-edge-glow {
  animation: peaking-glow 2s ease-in-out infinite;
}

.peaking-edge-hue {
  animation: peaking-hue-shift 3s linear infinite;
}
```

### 2. PeakingLayer.tsxにアニメーション適用
```tsx
// AppStateに animationStyle を追加（オプション）
// または、固定でpulsアニメーションを適用

<polyline
  points={edgeToPolylinePoints(edge)}
  stroke={props.color}
  stroke-width="1.5"
  fill="none"
  opacity={props.opacity}
  class="peaking-edge" // CSSアニメーション適用
  style={{
    // 波紋効果: 各エッジの開始タイミングをずらす
    'animation-delay': `${index * 0.05}s`,
  }}
/>
```

### 3. アニメーションスタイルの選択（オプション）
AppStateContextに追加:
```typescript
// AppState interfaceに追加
peakingAnimationStyle: () => 'pulse' | 'glow' | 'hue' | 'none';
setPeakingAnimationStyle: (style: 'pulse' | 'glow' | 'hue' | 'none') => void;
```

PeakingLayer.tsxで動的にクラス適用:
```tsx
const animationClass = () => {
  switch (props.animationStyle) {
    case 'pulse': return 'peaking-edge';
    case 'glow': return 'peaking-edge-glow';
    case 'hue': return 'peaking-edge-hue';
    case 'none': return '';
    default: return 'peaking-edge';
  }
};

<polyline
  class={animationClass()}
  // ...
/>
```

### 4. パフォーマンス最適化
- `will-change: opacity, stroke-width` を追加
- GPUアクセラレーション有効化

```css
.peaking-edge {
  will-change: opacity, stroke-width;
  animation: peaking-pulse 1.5s ease-in-out infinite;
}
```

### 5. アニメーション速度の調整（オプション）
```typescript
// AppStateに追加
peakingAnimationSpeed: () => number; // 0.5 = 遅い, 1.0 = 通常, 2.0 = 速い

// CSSで適用
<polyline
  style={{
    'animation-duration': `${1.5 / props.animationSpeed}s`,
  }}
/>
```

## 技術的詳細

### アニメーション種類

#### 1. Pulse（点滅）
- 不透明度と線幅を変化
- 視認性が高い
- デフォルト推奨

#### 2. Glow（発光）
- `drop-shadow` で光彩効果
- よりドラマチック
- パフォーマンス影響あり（重い）

#### 3. Hue Shift（色相変化）
- 緑→黄色→緑のグラデーション
- 色が変わるため注目度高い

#### 4. None（アニメーションなし）
- 静的表示
- 最もパフォーマンスが良い

### パフォーマンス考慮
- `transform`, `opacity` のアニメーションはGPUアクセラレーション対象
- `filter` のアニメーションは重い（Glow, Hue Shift）
- エッジ数が多い場合は `None` を推奨

### 波紋効果
各polylineの `animation-delay` をずらすことで、波が広がるような視覚効果:
```tsx
style={{ 'animation-delay': `${index * 0.05}s` }}
```

### エッジケース
1. **エッジ数が非常に多い**: アニメーション無効化を検討
2. **低スペックマシン**: Pulse以外は重い可能性
3. **VRゴーグル**: 60fps維持を優先、重いアニメーションは避ける

## 完了条件

### 機能チェックリスト
- [ ] CSSアニメーション定義
- [ ] PeakingLayerにアニメーション適用
- [ ] Pulseアニメーション動作確認
- [ ] 波紋効果（animation-delay）動作確認
- [ ] アニメーションスタイル選択実装（オプション）
- [ ] アニメーション速度調整実装（オプション）

### 品質チェックリスト
- [ ] 60fps維持（DevTools Performance）
- [ ] GPU使用率確認
- [ ] メモリリークなし
- [ ] CSS警告なし

## テスト項目

### 視覚テスト
1. **Pulseアニメーション**
   - エッジが点滅する
   - 滑らかに動作する

2. **波紋効果**
   - 各エッジが順次点滅する
   - 波が広がるように見える

3. **色・不透明度**
   - アニメーション中も指定色で表示
   - 不透明度が正しく適用される

4. **ズーム追従**
   - ズーム時もアニメーションが継続
   - カクつきなし

### パフォーマンステスト
1. DevToolsのPerformanceタブでFPS測定
2. GPU使用率確認（高負荷にならないか）
3. 複数画像切り替え時のアニメーション挙動

### オプション機能テスト（実装した場合）
1. アニメーションスタイル切り替え（Pulse, Glow, Hue, None）
2. アニメーション速度調整（0.5x, 1.0x, 2.0x）

## 参考資料
- [CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations)
- [CSS will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change)
- [SVG filter drop-shadow](https://developer.mozilla.org/en-US/docs/Web/CSS/filter-function/drop-shadow)
- [CSS Animation Performance](https://web.dev/animations-guide/)
