# レイヤー管理システム実装計画

## 計画名
20250107_layer_management_system

## 概要
SVGベクター方式によるレイヤー管理システムを導入し、フォーカスピーキング機能を実装。最大5層のレイヤーを扱える拡張可能なアーキテクチャを構築。

## 主要技術選択
- **Rust**: Sobelフィルタでエッジ検出、座標リストをJSON返却
- **Frontend**: SVG polylineで描画、CSS Animationで視覚効果
- **アーキテクチャ**: ImageManagerによるコンポジションパターン
- **状態管理**: AppStateContext拡張

## 実装方針
- **レイヤー構成**: 画像 → ピーキング → グリッド（将来5層まで）
- **ズーム追従**: SVGベクターで荒れない表示
- **リアルタイム調整**: 強度・色・不透明度を動的変更
- **パフォーマンス**: 60fps維持、1秒以内の処理

## チケット構成
- **#001**: Rust フォーカスピーキング実装（3h）
- **#002**: TypeScript型定義とユーティリティ（1h）
- **#003**: ImageManager.tsx 実装（2.5h）
- **#004**: PeakingLayer.tsx 実装（2h）
- **#005**: AppStateContext拡張（1.5h）
- **#006**: ImageViewer統合（1.5h）
- **#007**: CSS Animationとスタイリング（1h）
- **#008**: 設定UI追加（2h）
- **#009**: 統合テストとパフォーマンス最適化（2h）

## 総見積
16.5時間（3-4日間）

## ドキュメント
- Suggest: `docs/suggest/20250107_layer_management_system.md`
- Plan: `docs/20250107_layer_management_system/plan.md`
- Tickets: `docs/20250107_layer_management_system/ticket_001.md` ~ `ticket_009.md`

## 実装順序
1. Day 1: #001, #002（基盤構築）
2. Day 2: #003, #004（コアレイヤー実装）
3. Day 3: #005, #006（状態管理統合）
4. Day 4: #007, #008, #009（UI・最適化）

## 完了条件
- フォーカスピーキングON/OFF動作
- 強度・色・不透明度調整可能
- ズーム・パン・回転時に追従
- 60fps維持、メモリリークなし
