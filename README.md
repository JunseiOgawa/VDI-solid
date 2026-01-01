# VDI-solid (vdi-egui)

**VDI-solid (vdi-egui)** は、VRゴーグル向けの高精度画像ビューアです。Rustと`egui`を使用した**軽量・高速なネイティブアプリケーション**です。

![VDI-solid Screenshot](docs/screenshot.png)

## 🚀 特徴

- **超高速起動**: Webviewを使用しないため、瞬時に起動します
- **低レイテンシ**: ズームやパン操作が遅延なく追従します
- **メモリ効率**: 軽量なネイティブGUIのためメモリ使用量が少ない

### 実装機能
- **画像操作**: ズーム、パン、90度回転(Rキー)、フィット(Fキー)
- **分析ツール**: ピーキング(Pキー)、ヒストグラム(Hキー)、グリッド表示(Gキー)
- **UI**: ダークテーマ、フローティング設定
- **対応形式**: PNG, JPEG, WEBP, BMP, GIF, TIFF

---

## 📥 開発・ビルド方法

### 開発時の実行（ホットリロード）
コード変更を検知して自動的に再起動します。

```bash
cargo watch -x "run"
```
※ `cargo-watch` が必要です: `cargo install cargo-watch`

### リリースビルド

```bash
cargo build --release
```
生成物: `target/release/vdi-egui.exe` (Windows) / `target/release/vdi-egui` (Linux/macOS)

---

## 🛠 プロジェクト構成

```
VDI-solid/
├── src/
│   ├── main.rs        # メインエントリーポイント
│   ├── settings.rs    # 設定管理
│   ├── cli_args.rs    # CLI引数パース
│   ├── img.rs         # 画像処理（回転など）
│   ├── peaking.rs     # ピーキング解析ロジック
│   ├── histogram.rs   # ヒストグラム計算ロジック
│   └── navigation.rs  # フォルダ内画像ナビゲーション
├── Cargo.toml         # 依存関係定義
├── docs/              # ドキュメント
├── installer/         # インストーラー設定
└── README.md
```

### アーキテクチャ概要

`vdi-egui` はRustの `eframe` (egui framework) 上で動作し、描画ループ内で以下の処理を行います。

1. **Input Handling**: キーボード・マウス入力の即時処理
2. **Background Processing**: 画像読み込み・回転・解析などの重い処理は別スレッドで実行
3. **Immediate Mode Rendering**: 毎フレームUIを再構築・描画

詳細な設計は [docs/design_egui.md](docs/design_egui.md) を参照してください。

---

## 📜 ライセンス

MIT License
