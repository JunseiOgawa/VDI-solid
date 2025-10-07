# レイヤー管理システム実装計画

## 概要
SVGベクター方式によるレイヤー管理システムを導入し、フォーカスピーキング機能を実装します。最大5層のレイヤーを扱える拡張可能なアーキテクチャを構築します。

### 方針サマリー
- **Rust**: Sobelフィルタでエッジ検出、座標リストをJSON返却
- **Frontend**: SVG polylineで描画、CSS Animationで視覚効果
- **アーキテクチャ**: ImageManagerによるコンポジションパターン
- **状態管理**: AppStateContext拡張

## 目的
1. フォーカスピーキング機能の実装（ピント合わせ支援）
2. ズーム時に荒れないSVGベクター描画
3. 将来のレイヤー追加に対応可能な設計
4. VRゴーグル環境でのパフォーマンス維持

## 技術スタック

### Frontend
- **SolidJS**: リアクティブUI
- **TypeScript**: 型安全性
- **SVG**: ベクター描画
- **CSS Animation**: 視覚効果

### Backend
- **Rust**: 画像処理エンジン
- **Tauri**: フロント-バックエンド連携
- **image crate**: 画像読み込み・操作

### 画像処理
- **Sobelフィルタ**: エッジ検出
- **Douglas-Peucker**: 座標間引き（オプション）

## 影響範囲

### 新規作成ファイル
1. `src/components/ImageViewer/ImageManager.tsx` - レイヤー統合管理コンポーネント
2. `src/components/ImageViewer/PeakingLayer.tsx` - SVGピーキング描画コンポーネント
3. `src-tauri/src/peaking.rs` - フォーカスピーキング処理モジュール
4. `src/lib/peakingUtils.ts` - ピーキング関連ユーティリティ（TypeScript型定義等）

### 変更ファイル
1. `src/components/ImageViewer/index.tsx` - ImageManager組み込み、既存コード移行
2. `src/context/AppStateContext.tsx` - ピーキング状態追加
3. `src-tauri/src/lib.rs` - peakingモジュール登録、コマンド追加
4. `src-tauri/Cargo.toml` - 依存クレート追加（必要に応じて）

### 影響ファイル（読み取り参照のみ）
1. `src/components/ImageViewer/GridOverlay.tsx` - 統合テスト時の動作確認
2. `src/config/config.ts` - ズーム設定参照

## タスク一覧

### Phase 1: 基盤構築（並行可能）
- **Ticket #001**: Rust フォーカスピーキング実装（High, 3h）
- **Ticket #002**: TypeScript型定義とユーティリティ作成（Medium, 1h）

### Phase 2: レイヤー管理システム構築（依存: #001, #002）
- **Ticket #003**: ImageManager.tsx 実装（High, 2.5h）
- **Ticket #004**: PeakingLayer.tsx 実装（High, 2h）

### Phase 3: 状態管理統合（依存: #003, #004）
- **Ticket #005**: AppStateContext拡張（High, 1.5h）
- **Ticket #006**: ImageViewer統合（Medium, 1.5h）

### Phase 4: 視覚効果とUI（依存: #005, #006）
- **Ticket #007**: CSS Animationとスタイリング（Low, 1h）
- **Ticket #008**: 設定UI追加（Medium, 2h）

### Phase 5: テストと最適化（依存: 全チケット）
- **Ticket #009**: 統合テストとパフォーマンス最適化（Medium, 2h）

## 依存関係図
```
[#001 Rust実装] ──┐
                  ├──> [#003 ImageManager] ──┐
[#002 型定義] ────┤                          ├──> [#005 Context] ──┐
                  └──> [#004 PeakingLayer] ──┘                     ├──> [#007 Animation] ──┐
                                                                    │                        ├──> [#009 Test]
                                           [#006 ImageViewer統合] ──┘──> [#008 設定UI] ──────┘
```

## リスクと対策

### リスク1: エッジ座標数が多すぎる
**症状**: SVG描画が重くなる、ブラウザが固まる  
**対策**:
- Douglas-Peuckerアルゴリズムで座標間引き（Ticket #001で実装）
- 閾値のデフォルト値を調整（エッジ数を制限）
- 最大座標数のリミット設定（例: 10,000点）

### リスク2: Rust処理の待ち時間
**症状**: 画像変更時に1秒程度待たされる  
**対策**:
- ローディングインジケーター表示（Ticket #006）
- 前回結果のキャッシュ（Ticket #004）
- バックグラウンド処理（async/await）

### リスク3: メモリリーク
**症状**: 長時間使用でメモリ消費増加  
**対策**:
- SolidJSのonCleanupで適切なクリーンアップ
- 古いピーキングデータの破棄
- メモリプロファイリング（Ticket #009）

### リスク4: 既存機能の破壊
**症状**: GridOverlayやズーム機能が正常動作しない  
**対策**:
- 段階的統合（Ticket #006で慎重に）
- 既存テストの実行
- 後方互換性の確保

## 完了条件

### 機能要件
- ✅ フォーカスピーキングのON/OFF切り替えが動作
- ✅ 強度スライダーでエッジ検出感度を調整可能
- ✅ 色と不透明度の変更が反映される
- ✅ ズーム・パン・回転時にピーキングが追従
- ✅ グリッドオーバーレイとの同時表示が正常動作

### 非機能要件
- ✅ 画像変更時のピーキング生成が1秒以内（通常画像）
- ✅ ズーム500%時もエッジが荒れない
- ✅ 60fps維持（VRゴーグル環境）
- ✅ メモリリークなし

### コード品質
- ✅ TypeScript型エラーなし
- ✅ Rust警告なし
- ✅ 既存テストが通過
- ✅ コードレビュー完了

## 見積もり
- **総作業時間**: 16.5時間
- **推奨実装期間**: 3-4日（1日4-5時間想定）

## 実装順序の推奨
1. **Day 1**: Ticket #001, #002（基盤）
2. **Day 2**: Ticket #003, #004（コアレイヤー）
3. **Day 3**: Ticket #005, #006（統合）
4. **Day 4**: Ticket #007, #008, #009（仕上げ）
