# Ticket #002: Rayon依存追加とビルド確認

**作成日**: 2025-01-07  
**優先度**: High  
**見積時間**: 0.25時間  
**担当**: Rust  
**依存関係**: なし  

---

## 目的

Rust並列処理ライブラリ「Rayon」を依存関係に追加し、
ビルドが正常に通ることを確認する。

---

## タスク

### 1. Cargo.tomlにRayonを追加

**ファイル**: `src-tauri/Cargo.toml`

```toml
[dependencies]
# ... 既存の依存関係 ...
rayon = "1.8"  # データ並列処理ライブラリ
```

### 2. peaking.rsでRayonをインポート

**ファイル**: `src-tauri/src/peaking.rs`

```rust
// ファイル先頭に追加
use rayon::prelude::*;
```

### 3. ビルド確認

```bash
cd src-tauri
cargo build
```

### 4. 動作確認

開発サーバーを起動し、既存機能が正常に動作することを確認:
```bash
npm run tauri dev
```

- 画像読み込みが正常
- フォーカスピーキングが表示される
- エラーログがない

---

## 完了条件

- ✅ `Cargo.toml` にRayonが追加されている
- ✅ `cargo build` がエラーなく完了
- ✅ 開発サーバーが起動できる
- ✅ 既存のピーキング機能が正常に動作

---

## トラブルシューティング

### ビルドエラーが出る場合
```bash
# キャッシュをクリア
cargo clean
cargo build
```

### バージョン互換性の問題
- Rayon 1.8が見つからない場合、`1.7`または`1.10`を試す
- Cargo.lockの更新: `cargo update`

---

## 次のステップ

このチケット完了後、以下に進む:
- Ticket #003: Sobelフィルタの並列化
- Ticket #004: エッジ抽出の並列化

---

## 参考リンク

- [Rayon Documentation](https://docs.rs/rayon/)
- [Rayon GitHub](https://github.com/rayon-rs/rayon)
