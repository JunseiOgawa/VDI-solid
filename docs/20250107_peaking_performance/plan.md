# フォーカスピーキング処理高速化 実装計画

**作成日**: 2025-01-07  
**計画名**: `20250107_peaking_performance`

---

## 概要

フォーカスピーキング処理をマルチスレッド化 + 処理中断機能の追加により高速化。
ユーザーの連続操作時の重さを解消し、処理速度を総合的に4~5倍向上させる。

### 確定した方針
- **C案（ハイブリッド）**: マルチスレッド並列化 + AbortControllerによる中断機能
- **並列化**: Rust側でRayonを使用してSobelフィルタとエッジ抽出を並列処理
- **中断機能**: TypeScript側でAbortController、Rust側でAtomicBoolによるキャンセルチェック

---

## 目的

### 問題
- 処理時間が遅くユーザー体験を損なう
- 連続操作（強度150→155→200）で毎回処理が実行され重い
- 実行中の処理をキャンセルできず無駄な計算が発生

### ゴール
- 処理速度を2~3倍高速化（並列処理）
- 連続操作時の無駄な計算を削減（中断機能）
- 総合的に体感4~5倍の高速化
- UI反応性の大幅向上

---

## 技術スタック

### Rust側
- **Rayon**: データ並列処理ライブラリ
- **std::sync::atomic**: Atomic操作によるキャンセルフラグ
- **Arc**: スレッド間共有データ構造

### TypeScript側
- **AbortController**: Web標準のキャンセルAPI
- **Tauri IPC**: Rustとの通信（拡張）

### 追加依存関係
```toml
[dependencies]
rayon = "1.8"  # 並列処理
```

---

## 影響範囲

### 変更が必要なファイル
- `src-tauri/src/peaking.rs` - 並列化 + キャンセルチェック実装
- `src-tauri/Cargo.toml` - Rayon依存追加
- `src/components/ImageViewer/PeakingLayer.tsx` - AbortController統合
- `src/lib/peakingUtils.ts` - 型定義拡張（オプショナル）

### 影響を受けるファイル
- `src/context/AppStateContext.tsx` - 既存のピーキング状態（変更不要）
- `src/components/SettingsMenu/index.tsx` - Debounce機構（変更不要）

### 新規作成ファイル
- `docs/20250107_peaking_performance/performance_analysis.md` - 計測結果記録用

---

## タスク一覧

### Phase 1: 基盤整備

**Ticket #001**: 処理時間計測とボトルネック分析  
- 優先度: High  
- 見積: 0.5時間  
- 現状の処理時間内訳を計測

**Ticket #002**: Rayon依存追加とビルド確認  
- 優先度: High  
- 見積: 0.25時間  
- Cargo.tomlにRayon追加

### Phase 2: Rust並列化実装

**Ticket #003**: Sobelフィルタの並列化  
- 優先度: High  
- 見積: 1.5時間  
- 依存: #002  
- Rayonで行ごとに並列処理

**Ticket #004**: エッジ抽出の並列化  
- 優先度: High  
- 見積: 1時間  
- 依存: #003  
- エッジトレースを並列化

### Phase 3: 中断機能実装

**Ticket #005**: Rust側キャンセルチェック実装  
- 優先度: High  
- 見積: 1時間  
- 依存: なし（#003, #004と並行可）  
- AtomicBoolによるキャンセルフラグ

**Ticket #006**: TypeScript側AbortController統合  
- 優先度: High  
- 見積: 1時間  
- 依存: #005  
- PeakingLayerにAbortController追加

### Phase 4: 統合とテスト

**Ticket #007**: パフォーマンステストと調整  
- 優先度: Medium  
- 見積: 0.75時間  
- 依存: #004, #006  
- 処理速度測定、最適化調整

---

## 依存関係図

```
Phase 1 (並行)
├── Ticket #001: 処理時間計測
└── Ticket #002: Rayon依存追加

Phase 2
├── Ticket #003: Sobelフィルタ並列化 (依存: #002)
└── Ticket #004: エッジ抽出並列化 (依存: #003)

Phase 3 (Phase 2と一部並行可)
├── Ticket #005: Rustキャンセルチェック (並行可)
└── Ticket #006: TypeScript AbortController (依存: #005)

Phase 4
└── Ticket #007: テスト・調整 (依存: #004, #006)
```

**クリティカルパス**: #002 → #003 → #004 → #007  
**並行実行可能**: #001, #005 は他のタスクと並行可

---

## リスクと対策

### リスク1: 並列化でメモリ使用量増加
**影響度**: 中  
**対策**: 
- チャンクサイズを調整してメモリ効率を維持
- 大きい画像での動作確認
- 必要に応じてスレッド数を制限

### リスク2: キャンセル処理のタイミング問題
**影響度**: 中  
**対策**: 
- AtomicBoolの適切な配置（ループごとにチェック）
- 部分的な結果が返らないようエラーハンドリング
- 中断時のメモリリークを防ぐ

### リスク3: Rayonの学習コスト
**影響度**: 低  
**対策**: 
- Rayonのドキュメント参照
- par_iter()の基本パターンから開始
- 段階的に並列度を上げる

### リスク4: 並列化の効果が期待より低い
**影響度**: 低  
**対策**: 
- Ticket #001で事前にボトルネック特定
- ボトルネック箇所を優先的に並列化
- CPU使用率をモニタリング

---

## 完了条件

### 機能要件
- ✅ 処理速度が2~3倍向上（並列化）
- ✅ 連続操作時に古い処理がキャンセルされる
- ✅ キャッシュ機構が正常に動作
- ✅ エラーハンドリングが適切

### 非機能要件
- ✅ TypeScriptコンパイルエラーなし
- ✅ Rustビルドエラーなし
- ✅ 既存機能に影響なし
- ✅ メモリ使用量が許容範囲内

### パフォーマンス
- ✅ 単一処理: 現状の50%以下の時間
- ✅ 連続操作: 体感3~4倍の高速化
- ✅ CPU使用率: 複数コアを活用
- ✅ UI反応性: ブロッキングなし

---

## 実装時の注意事項

### 1. Rayon並列処理
```rust
// 正しい使い方
use rayon::prelude::*;

let results: Vec<_> = data
    .par_iter()  // ← 並列イテレータ
    .map(|item| process(item))
    .collect();
```

### 2. Atomicキャンセルフラグ
```rust
// グローバルまたはスレッド安全な共有
use std::sync::atomic::{AtomicBool, Ordering};
static SHOULD_CANCEL: AtomicBool = AtomicBool::new(false);

// 定期的にチェック
if SHOULD_CANCEL.load(Ordering::Relaxed) {
    return Err("Cancelled".into());
}
```

### 3. AbortController
```typescript
// 前回の処理を中断
if (abortController) {
    abortController.abort();
}
abortController = new AbortController();
```

### 4. メモリ管理
- Rayonはデフォルトでスレッドプールを使用
- 明示的なメモリ解放は不要
- 大きいデータのcloneを避ける

---

## パフォーマンス目標

### Before（現状）
```
処理時間（1920x1080画像）: 約1000ms
- 画像読み込み: 200ms
- Sobelフィルタ: 450ms
- エッジ抽出: 350ms
```

### After（目標）
```
処理時間（1920x1080画像）: 約400ms（60%削減）
- 画像読み込み: 200ms（変化なし）
- Sobelフィルタ: 150ms（並列化で67%削減）
- エッジ抽出: 50ms（並列化 + 早期キャンセル）

連続操作時: 
- Before: 3回処理 = 3000ms
- After: 1回処理 = 400ms（87%削減）
```

---

## 次のステップ

この計画を基に各チケットを順次実装します。

**推奨実行順序**:
1. Phase 1: Ticket #001 + #002（並行）
2. Phase 2: Ticket #003 → #004
3. Phase 3: Ticket #005（Phase 2と並行可）→ #006
4. Phase 4: Ticket #007

**合計見積時間**: 6時間
