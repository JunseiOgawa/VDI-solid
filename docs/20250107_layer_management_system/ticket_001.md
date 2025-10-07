# Ticket #001: Rust フォーカスピーキング実装

## メタ情報
- **優先度**: High
- **見積**: 3時間
- **依存チケット**: なし
- **ブロックするチケット**: #003, #004

## 目的
Sobelフィルタを使用したエッジ検出処理を実装し、フォーカスが合っている領域のエッジ座標リストをJSON形式で返却するTauri Commandを作成します。

## 対象ファイル

### 新規作成
- `src-tauri/src/peaking.rs`

### 変更
- `src-tauri/src/lib.rs`
- `src-tauri/Cargo.toml`（依存追加が必要な場合）

## 影響範囲
- Tauriバックエンドモジュール構成
- フロントエンドからのコマンド呼び出しインターフェース

## 実装手順

### 1. peaking.rsモジュール作成
```rust
// src-tauri/src/peaking.rs
use image::{DynamicImage, GenericImageView, Luma};
use serde::{Serialize, Deserialize};
use std::path::Path;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct EdgePoint {
    pub x: f32,
    pub y: f32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PeakingResult {
    pub width: u32,
    pub height: u32,
    pub edges: Vec<Vec<EdgePoint>>,
}
```

### 2. Sobelフィルタ実装
- 画像を読み込み、グレースケール変換
- Sobelオペレーター適用（水平・垂直方向のエッジ検出）
- 勾配強度を計算: `sqrt(Gx^2 + Gy^2)`
- 閾値処理で強エッジを抽出

### 3. エッジ座標リスト生成
- 閾値を超えるピクセルの座標を収集
- 連続するエッジをグループ化（オプション: 輪郭抽出）
- 座標の間引き（Douglas-Peuckerアルゴリズム、オプション）

### 4. Tauri Command登録
```rust
#[tauri::command]
pub async fn focus_peaking(
    image_path: String,
    threshold: u8,
) -> Result<PeakingResult, String> {
    // 実装
}
```

### 5. lib.rsへの統合
- `mod peaking;` を追加
- `.invoke_handler()` に `focus_peaking` コマンドを登録

## 技術的詳細

### Sobelフィルタアルゴリズム
```
Gx = [-1  0  1]      Gy = [-1 -2 -1]
     [-2  0  2]           [ 0  0  0]
     [-1  0  1]           [ 1  2  1]

Gradient = sqrt(Gx^2 + Gy^2)
```

### 閾値処理
- `threshold`: 0-255（ユーザー指定）
- デフォルト推奨値: 50-80（中程度の感度）
- 低い値: より多くのエッジを検出（細かい模様も拾う）
- 高い値: 強いエッジのみ検出（主要な輪郭のみ）

### パフォーマンス最適化
- 画像サイズが大きい場合はダウンサンプリング検討
- 並列処理（Rayon使用、オプション）
- 座標数が多すぎる場合の間引き（最大10,000点など）

### エッジケース
1. **ファイルが存在しない**: `Err("File not found")` 返却
2. **画像読み込み失敗**: `Err("Failed to load image")` 返却
3. **サポートされていない形式**: `Err("Unsupported format")` 返却
4. **threshold範囲外**: 0-255にクランプ
5. **エッジが見つからない**: 空の配列を返却

## 完了条件

### 機能チェックリスト
- [ ] `peaking.rs` モジュール作成完了
- [ ] Sobelフィルタ実装完了
- [ ] エッジ座標リスト生成完了
- [ ] Tauri Command登録完了
- [ ] threshold パラメータが機能する
- [ ] 正常系: エッジ座標が返却される
- [ ] 異常系: 適切なエラーハンドリング

### 品質チェックリスト
- [ ] Rust警告なし（`cargo build`）
- [ ] Clippy警告なし（`cargo clippy`）
- [ ] エラーメッセージが明確
- [ ] コメント・ドキュメントコメント記述

## テスト項目

### 単体テスト（手動）
1. テスト画像（sen19201080.png）を使用
2. threshold=50 でコマンド実行
3. 返却されたJSONの構造確認
4. エッジ座標数が妥当か確認
5. 処理時間測定（1秒以内が目標）

### 統合テスト
1. フロントエンドから `invoke('focus_peaking', {...})` で呼び出し
2. 結果を `console.log` で確認
3. 複数の画像で試行

## 参考資料
- [Sobel Operator - Wikipedia](https://en.wikipedia.org/wiki/Sobel_operator)
- [image crate documentation](https://docs.rs/image/latest/image/)
- [Tauri Command documentation](https://tauri.app/v1/guides/features/command/)
- Douglas-Peucker: [line simplification algorithm](https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm)
