# フォーカスピーキング最適化 実装計画

**作成日**: 2025-01-07  
**計画名**: `20250107_peaking_optimization`

---

## 概要

フォーカスピーキング機能の2つの改善を実装:
1. **スライダー操作の最適化** (B案: Debounce + 即時フィードバック)
2. **エッジライン平滑化** (A案: SVG属性による角丸化)

### 確定した方針
- **スライダー**: Debounce実装で処理回数削減、UIは即座に反応
- **平滑化**: SVGの`stroke-linejoin`/`stroke-linecap`プロパティで角を丸める

---

## 目的

### 問題
- スライダー移動ごとにRust処理が実行され、UIが重くなる
- Sobelフィルタ出力がピクセル単位でギザギザしている

### ゴール
- スライダー連続移動時の処理回数を10分の1に削減
- エッジラインを視覚的に滑らかに表示
- ユーザー体験の向上（リアルタイムフィードバック維持）

---

## 技術スタック

- **Frontend**: SolidJS (Signals, createEffect)
- **UI**: SettingsMenu, PeakingLayer
- **Debounce**: カスタム実装（setTimeout利用）
- **SVG**: stroke-linejoin, stroke-linecap プロパティ

---

## 影響範囲

### 変更が必要なファイル
- `src/components/SettingsMenu/index.tsx` - Debounce実装
- `src/components/ImageViewer/PeakingLayer.tsx` - SVG属性追加

### 影響を受けるファイル
- `src/components/Titlebar/index.tsx` - 既存のprops構造は維持（変更不要）
- `src/context/AppStateContext.tsx` - 既存のsetter使用（変更不要）

### 新規作成ファイル
なし（既存ファイルの修正のみ）

---

## タスク一覧

### Phase 1: 基盤整備（並行実装可能）

**Ticket #001**: Debounceユーティリティ実装  
- 優先度: High  
- 見積: 0.5時間  
- SettingsMenu内にdebounce関数を実装

**Ticket #002**: SVGエッジ平滑化  
- 優先度: High  
- 見積: 0.25時間  
- PeakingLayerのpolylineに属性追加

### Phase 2: UI統合

**Ticket #003**: スライダーDebounce統合  
- 優先度: High  
- 見積: 1時間  
- 依存: #001  
- 強度・不透明度スライダーにDebounce適用

### Phase 3: 動作確認

**Ticket #004**: 統合テストと調整  
- 優先度: Medium  
- 見積: 0.5時間  
- 依存: #002, #003  
- 動作確認、Debounce遅延調整

---

## 依存関係図

```
Phase 1 (並行)
├── Ticket #001: Debounce実装
└── Ticket #002: SVG平滑化

Phase 2
└── Ticket #003: スライダー統合 (依存: #001)

Phase 3
└── Ticket #004: テスト・調整 (依存: #002, #003)
```

**クリティカルパス**: #001 → #003 → #004  
**並行実行可能**: #001と#002

---

## リスクと対策

### リスク1: Debounce遅延時間が最適でない
**影響度**: 中  
**対策**: 
- デフォルト500msで実装
- 必要に応じて300ms/700msで調整可能な設計
- ユーザーフィードバックで最適値を決定

### リスク2: SVG平滑化が期待通りでない
**影響度**: 低  
**対策**: 
- `stroke-linejoin`の値を`round`/`bevel`で比較検証
- 不十分な場合は後続タスクでDouglas-Peuckerを検討

### リスク3: Debounceによる状態不整合
**影響度**: 低  
**対策**: 
- 一時表示用Signalと実際の処理を分離
- クリーンアップ処理でタイマーを確実にクリア

---

## 完了条件

### 機能要件
- ✅ スライダー連続移動時、処理が1回のみ実行される
- ✅ スライダー移動中も数値表示が即座に更新される
- ✅ エッジラインの角が丸く表示される
- ✅ 既存のキャッシュ機構が正常に動作する

### 非機能要件
- ✅ TypeScriptコンパイルエラーなし
- ✅ ESLint警告なし
- ✅ ビルドが成功する
- ✅ 既存のピーキング機能に影響なし

### ユーザー体験
- ✅ スライダー操作が軽快になる
- ✅ UIの反応性が維持される
- ✅ エッジが視覚的に滑らかになる

---

## 実装時の注意事項

1. **Debounce実装**
   - onCleanupでタイマーをクリアすること
   - コンポーネントアンマウント時のメモリリーク防止

2. **SVG属性**
   - `vector-effect: non-scaling-stroke`は既存のまま維持
   - ズーム時の線幅維持を保証

3. **後方互換性**
   - 既存のprops構造は変更しない
   - AppStateContextのインターフェースは維持

---

## 次のステップ

この計画を基に各チケットを順次実装します。
Phase 1の2タスクは並行実装可能です。

**推奨実行順序**:
1. Phase 1: Ticket #001 + #002（並行）
2. Phase 2: Ticket #003
3. Phase 3: Ticket #004

**合計見積時間**: 2.25時間
