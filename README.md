# VDI-solid (vdi-egui)

**VDI-solid (vdi-egui)** は、VRゴーグル向けの高精度画像ビューアです。Rustと`egui`を使用した**軽量・高速なネイティブアプリケーション**として再設計され、従来のWebviewベースのオーバーヘッドを排除し、快適な起動速度とレスポンスを実現しました。

![VDI-solid Screnshot](docs/screenshot.png) <!-- 必要に応じて追加 -->

## 🚀 特徴 (vdi-egui / eGUI版)

Webview (Tauri HTML/JS) を使用せず、RustネイティブGUIを採用することで以下の性能を実現しています。

- **超高速起動**: Webブラウザエンジンの初期化待ちがありません。
- **低レイテンシ**: ズームやパン操作が遅延なく追従します。
- **メモリ効率**: メモリ使用量を大幅に削減（従来比 -50%以上）。

### 実装機能
- **画像操作**: ズーム、パン、90度回転(Rキー)、フィット(Fキー)
- **分析ツール**: ピーキング(Pキー)、ヒストグラム(Hキー)、グリッド表示(Gキー)
- **UI**: ダークテーマ、カスタムタイトルバー、フローティング設定
- **多言語**: 日本語/英語対応（現在実装中）
- **対応形式**: PNG, JPEG, WEBP, BMP, GIF, TIFF, AVIF

---

## 📥 開発・ビルド方法

### 開発時の実行（ホットリロード）
コード変更を検知して自動的に再起動します。

```bash
cd src-tauri
cargo watch -x "run --bin vdi-egui"
```
※ `cargo-watch` が必要です: `cargo install cargo-watch`

### リリースビルド

#### Windows
```bash
cd src-tauri
cargo build --release --bin vdi-egui
```
生成物: `src-tauri/target/release/vdi-egui.exe`

#### Linux
```bash
# 依存関係をインストール (Ubuntu/Debian)
sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev libxdo-dev

# ビルド
cd src-tauri
cargo build --release --bin vdi-egui
```
生成物: `src-tauri/target/release/vdi-egui`

---

## 🛠 プロジェクト構成

このプロジェクトは現在、**Rust + eGUI** を中心に開発されています。

```
VDI-solid/
├── src-tauri/
│   ├── src/
│   │   ├── main_egui.rs   # ★ eGUI版メインエントリーポイント
│   │   ├── lib.rs         # 共通ライブラリ定義
│   │   ├── img.rs         # 画像処理 (回転・バックアップ)
│   │   ├── peaking.rs     # ピーキング解析ロジック
│   │   ├── histogram.rs   # ヒストグラム計算ロジック
│   │   ├── settings.rs    # 設定保存・読み込み
│   │   └── ...
│   └── Cargo.toml         # 依存関係定義
│
├── docs/
│   ├── design_egui.md          # ★ 新アーキテクチャ設計書
│   ├── design_legacy_solidjs.md # 旧設計書 (Tauri/React)
│   └── ...
└── release/                    # リリースビルド格納場所
```

### アーキテクチャ概要

`vdi-egui` はRustの `eframe` (egui framework) 上で動作し、描画ループ内で以下の処理を行います。

1. **Input Handling**: キーボード・マウス入力の即時処理
2. **Background Processing**: 画像読み込み・回転・解析などの重い処理は別スレッドで実行
3. **Immediate Mode Rendering**: 毎フレームUIを再構築・描画

詳細な設計は [docs/design_egui.md](docs/design_egui.md) を参照してください。

---

## ⚠️ Legacy Info (Webview / SolidJS Version)

以前のTauri + SolidJS/TypeScriptベースのフロントエンドコードは `src/` に残されていますが、現在はメンテナンスモードです。以下の機能は eGUI 版に移植済みです。

**旧構成 (参考)**:
- Frontend: SolidJS, TypeScript, TailwindCSS
- Backend: Rust (Tauri Commands)

Webview版のビルドコマンド:
```bash
npm install
npm run tauri build
```

---

## 📜 ライセンス

MIT License
