# Ticket #009: 統合テストとパフォーマンス最適化

## メタ情報
- **優先度**: Medium
- **見積**: 2時間
- **依存チケット**: #001, #002, #003, #004, #005, #006, #007, #008
- **ブロックするチケット**: なし（最終チケット）

## 目的
すべての機能を統合テストし、パフォーマンスボトルネックを特定して最適化します。VRゴーグル環境での60fps維持を確認します。

## 対象ファイル

### 検証対象
- すべての実装済みファイル
- パフォーマンス測定
- メモリリーク確認

### 変更可能性のあるファイル
- `src/components/ImageViewer/PeakingLayer.tsx`（最適化）
- `src-tauri/src/peaking.rs`（最適化）
- `src/components/ImageViewer/ImageManager.tsx`（最適化）

## 実装手順

### 1. 機能統合テスト

#### 1-1. 基本機能テスト
- [ ] 画像表示
- [ ] ズーム（ホイール、ボタン）
- [ ] パン（ドラッグ）
- [ ] 回転（90度、リセット）
- [ ] ページ送り（前へ・次へ）
- [ ] D&Dで画像読み込み

#### 1-2. レイヤー機能テスト
- [ ] グリッド表示（3x3, 5x3, 4x4, off）
- [ ] グリッド不透明度調整
- [ ] ピーキング表示（ON/OFF）
- [ ] ピーキング強度調整
- [ ] ピーキング色変更
- [ ] ピーキング不透明度調整

#### 1-3. レイヤー統合テスト
- [ ] グリッド + ピーキング同時表示
- [ ] ズーム時にレイヤーが追従
- [ ] 回転時にレイヤーが追従
- [ ] パン時にレイヤーが追従

#### 1-4. エッジケーステスト
- [ ] 画像なし状態
- [ ] 非常に大きい画像（4K以上）
- [ ] 非常に小さい画像（100x100以下）
- [ ] エッジが非常に多い画像
- [ ] エッジがない画像（単色）

### 2. パフォーマンス測定

#### 2-1. FPS測定
```javascript
// DevTools Performanceタブで記録
// 操作シナリオ:
// 1. 画像読み込み
// 2. ピーキングON
// 3. ズームイン・アウト（5回）
// 4. パン操作（10秒間）
// 5. 回転（4回）
// 目標: 常時55fps以上（60fps維持）
```

#### 2-2. メモリ使用量測定
```javascript
// DevTools Memoryタブ
// 操作シナリオ:
// 1. 10枚の画像を順次表示
// 2. 各画像でピーキングON/OFF
// 3. ヒープスナップショット取得
// 確認: メモリリークなし、増加が緩やか
```

#### 2-3. Rust処理時間測定
```rust
// peaking.rs にログ追加
use std::time::Instant;

let start = Instant::now();
// エッジ検出処理
let duration = start.elapsed();
println!("Peaking processing time: {:?}", duration);
```

### 3. ボトルネック特定と最適化

#### 3-1. Rust最適化
**問題**: 処理時間が1秒を超える

**対策案**:
1. 画像のダウンサンプリング
```rust
// 大きい画像は縮小してから処理
if width > 1920 || height > 1080 {
    img = img.resize(1920, 1080, FilterType::Lanczos3);
}
```

2. 並列処理（Rayon使用）
```rust
use rayon::prelude::*;

edges.par_iter_mut().for_each(|edge| {
    // 並列処理
});
```

3. 座標の間引き（Douglas-Peucker）
```rust
fn simplify_edge(edge: Vec<EdgePoint>, tolerance: f32) -> Vec<EdgePoint> {
    // Douglas-Peuckerアルゴリズム実装
}
```

#### 3-2. Frontend最適化
**問題**: SVG描画が重い

**対策案**:
1. エッジ数の制限
```tsx
const MAX_EDGES = 1000;
const displayEdges = peakingData().edges.slice(0, MAX_EDGES);
```

2. `will-change` プロパティ追加
```tsx
<svg style={{ 'will-change': 'transform' }}>
```

3. `requestAnimationFrame` でバッチ更新
```tsx
let rafId: number;
createEffect(() => {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
    // 描画処理
  });
});
```

#### 3-3. キャッシュ最適化
**問題**: メモリ使用量が増加

**対策**:
```tsx
const MAX_CACHE_SIZE = 5;
const peakingCache = new LRUCache<string, PeakingResult>(MAX_CACHE_SIZE);
```

### 4. クロスブラウザテスト
- [ ] Chrome
- [ ] Firefox
- [ ] Edge
- [ ] Safari（Mac環境がある場合）

### 5. 最終確認チェックリスト
- [ ] すべての機能が正常動作
- [ ] 60fps維持
- [ ] メモリリークなし
- [ ] TypeScript型エラーなし
- [ ] Rust警告なし
- [ ] eslint警告なし
- [ ] console.errorなし
- [ ] ドキュメント整備（README更新）

## 技術的詳細

### パフォーマンスターゲット
- **FPS**: 55fps以上（常時）、60fps維持が理想
- **メモリ**: 初期状態から+200MB以内（10枚画像閲覧後）
- **Rust処理**: 1秒以内（通常画像 1920x1080）
- **レンダリング**: 16ms以内（60fpsを維持するため）

### 最適化の優先順位
1. **High**: FPS低下の解消（ユーザー体験に直結）
2. **Medium**: メモリリーク修正（長時間使用で問題）
3. **Low**: 処理時間短縮（1秒以内なら許容範囲）

### ツール
- **Chrome DevTools Performance**: FPS測定
- **Chrome DevTools Memory**: メモリリーク検出
- **Rust Profiler**: `cargo flamegraph`（オプション）

### エッジケースの定義
- **大きい画像**: 4K (3840x2160)以上
- **小さい画像**: 100x100以下
- **エッジ多い**: 総エッジポイント数 > 50,000
- **エッジなし**: 総エッジポイント数 = 0

## 完了条件

### 機能チェックリスト
- [ ] すべての統合テスト項目が合格
- [ ] パフォーマンス測定完了
- [ ] ボトルネック特定・最適化実施
- [ ] クロスブラウザテスト完了

### パフォーマンスチェックリスト
- [ ] 60fps維持（通常操作）
- [ ] メモリリーク なし
- [ ] Rust処理 1秒以内
- [ ] SVG描画 遅延なし

### 品質チェックリスト
- [ ] TypeScript型エラー なし
- [ ] Rust警告 なし
- [ ] eslint警告 なし
- [ ] console.error なし
- [ ] ドキュメント更新完了

## テスト項目

### 総合テスト（実機）
1. **VRゴーグル環境**（可能な場合）
   - VRパススルーモードでの動作確認
   - VRコントローラーでの操作
   - 酔わない程度のフレームレート維持

2. **デスクトップ環境**
   - マウス・キーボード操作
   - ホイールズーム
   - D&D操作

3. **長時間使用テスト**
   - 30分間連続使用
   - 50枚以上の画像を閲覧
   - メモリ使用量の推移確認

### パフォーマンスレポート作成
```
## Performance Report

### Environment
- OS: Windows 11
- Browser: Chrome 120
- CPU: Intel i7-12700K
- GPU: NVIDIA RTX 3070
- RAM: 32GB

### Results
- Average FPS: 60fps
- Frame drops: 0
- Memory usage: Initial 150MB → After 10 images 280MB
- Rust processing time: 600ms (avg)

### Bottlenecks Found
- None

### Optimizations Applied
- Image downsampling for > 2K images
- Edge count limit: 1000
- LRU cache: size 5
```

## 参考資料
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Chrome DevTools Memory](https://developer.chrome.com/docs/devtools/memory-problems/)
- [Rust Profiling](https://nnethercote.github.io/perf-book/)
- [Web Performance Best Practices](https://web.dev/performance/)
