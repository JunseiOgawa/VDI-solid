# VDI-solid# VDI-solid



Tauri、SolidJS、TypeScriptを用いて開発されたVRゴーグル向け画像ビューア。VRパススルー環境で素早く高精度な画像確認を実現します。このリポジトリは、Tauri と Solid と TypeScript を用いて開発する、VRゴーグル向けに最適化されたスタンドアロン画像ビューア「VDI（仮想デスクトップイメージャー）」の vdi-solid 版 README です。  

リポジトリ: https://github.com/JunseiOgawa/VDI-solid

**リポジトリ**: https://github.com/JunseiOgawa/VDI-solid

## 概要

VDI-solid は、VR パススルー環境で素早く画像を確認できる軽量の画像ビューアです。起動が速く、VR コントローラーで簡単に操作できることを重視しています。



## 📋 概要## アプリの考え方

- VR ゴーグルのパススルーで画像チェックを容易にする  

VDI-solidは、VRゴーグルのパススルー機能を活用して画像チェックを効率化する軽量画像ビューアです。高速起動とVRコントローラーでの直感的な操作を重視し、設計からモダンなUIデザイン（Glassmorphism）を採用しています。- VR コントローラーで直感的に画像操作（拡大・移動・回転・ページ送り）  

- 起動は軽量かつ高速

### デザイン思想

- **VR環境最適化**: パススルー表示での快適な画像確認## 提供機能

- **高速起動**: 最小限の依存で軽量実装[ x ]ローカルストレージ上の画像ファイルを開く（PNG / JPEG / BMP / GIF 等）

- **直感的操作**: VRコントローラーでの自然なジェスチャー対応[ x ]画像の拡大・縮小

- **モダンUI**: Glassmorphismによる洗練されたインターフェース[ x ]拡大表示中のパン（移動）

[ x ]画像の回転

---[ x ]複数画像のページ送り

[ - ]グリッドの表示

## 🎯 機能[ - ]画像比較



### ✅ 実装済み機能

- **ファイル操作**: ローカルストレージの画像ファイル読み込み（PNG、JPEG、BMP、GIF等）## 前提条件

- **ズーム機能**: 0.1倍～5倍の範囲で自由にズーム、中央基準のズーム、スクリーンフィット- 依存関係のインストール

- **パン（移動）**: 拡大表示時のドラッグによるスムーズな移動、自動境界制限    - Node.js (v18 以上推奨)

- **回転機能**: 90度単位での画像回転、キャッシュ管理'''

- **ページ送り**: フォルダ内画像の自動スキャンと前後画像への移動npm install

- **テーマ対応**: システムテーマの自動検出、ライト/ダークモード'''

- **ヒストグラム表示**: 画像分析用のヒストグラム表示・カスタマイズ- Tauri CLI のインストール

- **ピーキング機能**: フォーカスピーキングによる焦点確認（強度・色・不透明度・点滅調整可能）'''

- **ギャラリー表示**: フォルダ内画像のサムネイル一覧表示cargo install tauri-cli

- **グリッド表示**: 複数のグリッドパターン対応（不透明度調整可能）'''

- **ホイール感度調整**: マウスホイール操作の感度をカスタマイズ

- **画像バックアップ**: 回転等の変更を一時保存、復元機能## ビルド手順

1. 依存関係のインストール
---```bash

npm run tauri build:linux # Linux の場合

## 技術スタック


```bash

| **フロントエンド** | SolidJS 1.9、TypeScript 5.6、Vite 6.0 |npm run build-all

| **スタイリング** | TailwindCSS 4.1 |```

| **デスクトップフレームワーク** | Tauri 2.0 |

| **バックエンド** | Rust |

| **パッケージ管理** | npm |# 使い方（基本起動）

| **UI/UX** | Glassmorphism デザイン、Solid signals |VDI.exe [画像ファイルパス] [ウィンドウモード]



### 主要な依存パッケージ起動オプション:

- `@tauri-apps/api`: Tauriランタイム通信- 1番目の引数: 画像ファイルパス（PNG、JPEG、BMP、GIF など）

- `@tauri-apps/plugin-fs`: ファイルシステムアクセス- 2番目の引数（省略可）: ウィンドウモード

- `@tauri-apps/plugin-dialog`: ファイルダイアログ    - FullScreen — フルスクリーンで起動

- `@tauri-apps/plugin-opener`: 外部アプリケーション起動    - [幅]x[高さ] — 指定解像度で起動（例: 1920x1080）

- `vite-plugin-solid`: Solid.jsのViteプラグイン    - 省略時 — デフォルトサイズ（800x600）で起動



---起動例:

- デフォルトサイズで起動

## 🚀 インストール・ビルド    VDI.exe image.png

- フルスクリーンで起動

### 前提条件    VDI.exe image.png FullScreen

- 1280x720 で起動

**Node.js**（v18以上推奨）    VDI.exe image.png 1280x720

```bash

npm install

```


**Tauri CLI**
```bash
cargo install tauri-cli
```

### ビルド手順

1. **依存関係のインストール**
   ```bash
   npm install
   ```

2. **アプリケーションのビルド**
   - **Windows**
     ```bash
     npm run tauri build
     ```
   - **Linux**
     ```bash
     npm run tauri build:linux
     ```

3. **一括ビルド（WindowsとLinux）**
   ```bash
     npm run build-all
     ```

### 開発時の実行

```bash
npm run dev              # Tauri開発サーバー起動（ホットリロード対応）
npm run start            # Viteのみ起動（Tauri なし）
npm run serve            # ビルド済みアプリケーションのプレビュー
```

---

## 📖 使い方

### 基本的な起動方法

```bash
./vdi.exe [画像ファイルパス] [ウィンドウモード]
```

### 引数の仕様

| 引数 | 説明 | 例 |
|------|------|-----|
| **第1引数**（必須） | 起動時に表示する画像ファイルのパス | `VDI.exe C:\path\to\image.png` |
| **第2引数**（省略可） | ウィンドウサイズ/モード | `VDI.exe image.png FullScreen` |

### 第2引数のオプション詳細

- **`FullScreen`** — フルスクリーンモードで起動
- **`WIDTHxHEIGHT`** — 指定解像度で起動（例: `1920x1080`、`1280x720`）
- **省略** — デフォルトサイズ（800×600）で起動

### 起動例

```bash
# 1. デフォルトサイズ（800x600）で画像を開く
./vdi.exe image.png

# 2. フルスクリーンモードで起動
./vdi.exe C:\Images\photo.png FullScreen

# 3. 指定解像度（1280x720）で起動
./vdi.exe C:\Images\photo.png 1280x720

# 4. 1920x1080の指定解像度で起動
./vdi.exe image.png 1920x1080
```

---

## 🎮 操作方法

### キーボード・マウス操作

| 操作 | 動作 |
|------|------|
| **マウスホイール ↑/↓** | ズイン/ズームアウト |
| **ドラッグ** | 拡大表示時のパン（移動） |
| **Ctrl + ホイール** | ズーム感度を調整可能 |
| **R キー** | 画像を90度回転 |
| **← / →** | 前後の画像に移動 |
| **G キー** | グリッド表示のON/OFF |
| **P キー** | ピーキング機能のON/OFF |
| **H キー** | ヒストグラム表示のON/OFF |

### UIコントロール

- **タイトルバー**: ウィンドウ操作、ギャラリー表示切り替え
- **フローティングコントロールパネル**: 各種設定とプリセット
- **フッター**: 現在の画像情報、ステータス表示

---

## 📁 プロジェクト構成

```
VDI-solid/
├── src/                              # フロントエンド（TypeScript/SolidJS）
│   ├── components/                   # UIコンポーネント
│   │   ├── ImageViewer/              # 画像表示・操作コア
│   │   ├── Titlebar/                 # タイトルバー
│   │   ├── ImageGallery/             # ギャラリー表示
│   │   ├── FloatingControlPanel/     # 設定パネル
│   │   ├── Footer/                   # フッター
│   │   └── ...
│   ├── hooks/                        # カスタムフック
│   ├── lib/                          # ユーティリティ関数
│   │   ├── imageViewerApi.ts         # 画像操作API
│   │   ├── screenfit.ts              # スクリーンフィット
│   │   ├── fileUtils.ts              # ファイル操作
│   │   └── tauri.ts                  # Tauri連携
│   ├── context/                      # SolidJS コンテキスト
│   │   └── AppStateContext.tsx       # グローバル状態管理
│   ├── config/                       # アプリケーション設定
│   └── assets/                       # SVGアイコン等
│
├── src-tauri/                        # バックエンド（Rust）
│   ├── src/
│   │   ├── main.rs                   # エントリーポイント
│   │   ├── lib.rs                    # Tauri実装
│   │   ├── img.rs                    # 画像処理
│   │   ├── navigation.rs             # ファイルナビゲーション
│   │   ├── peaking.rs                # ピーキング処理
│   │   ├── histogram.rs              # ヒストグラム計算
│   │   └── file_operations.rs        # ファイル操作
│   └── tauri.conf.json               # Tauri設定
│
├── docs/                             # ドキュメント
│   ├── design.md                     # 設計書
│   ├── task.md                       # タスク管理
│   └── 20250107_*/                   # フェーズ別実装記録
│
└── package.json                      # npm設定
```

---

## 🏗️ アーキテクチャ

### 全体設計

```
┌─────────────────────────────────────────────┐
│         Tauri ウィンドウ (Rust)               │
├─────────────────────────────────────────────┤
│        フロントエンド (SolidJS/TypeScript)     │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │    ImageViewer コンポーネント         │  │
│  │  （Canvas実装、回転・ズーム対応）    │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │ FloatingControlPanel                 │  │
│  │ （設定・プリセット管理）             │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │ AppStateContext (SolidJS signals)    │  │
│  │ （グローバル状態管理）               │  │
│  └──────────────────────────────────────┘  │
├─────────────────────────────────────────────┤
│        Tauri IPC (invoke/listen)            │
├─────────────────────────────────────────────┤
│         バックエンド処理 (Rust)              │
│                                             │
│  • 画像読み込み・キャッシング              │
│  • 回転・変形処理                          │
│  • ピーキング演算                          │
│  • ヒストグラム計算                        │
│  • ファイルナビゲーション                  │
└─────────────────────────────────────────────┘
```

### 状態管理

**SolidJS Signals**を用いた細粒度リアクティビティ実装:
- `zoomScale`: ズーム倍率
- `rotation`: 画像回転角度
- `imagePosition`: 画像の位置情報
- `theme`: ライト/ダークモード
- `gridPattern`: グリッド表示設定
- `peakingEnabled`: ピーキング有効状態
- その他多数の設定値

---

## 🔧 開発ワークフロー

### 推奨フロー

1. **要件・設計**: `docs/design.md` に要件を記載
2. **タスク定義**: `docs/task.md` に実装タスクをリスト化
3. **ブランチ作成**: `feature/*` ブランチで実装
4. **実装**: 小単位のコミット（1機能=1コミット）
5. **コード整形**: TypeScriptの型チェックを実施
6. **コミット前レビュー**: ユーザーに確認を依頼

### 有用なコマンド

```bash
npm run dev              # 開発サーバー起動（ホットリロード）
npm run build            # フロントエンド構築
npm run test             # テスト実行（vitest）
npm run tauri build      # Tauriアプリビルド
npm run build-all        # 一括ビルド
```

---

## 📋 コード規約

### コメント・ドキュメント
- **日本語のコメント**: 実装背景や理由を詳説
- **TypeScriptコメント**: JSDocで型情報と説明を記載
- **Rustコメント**: 三スラッシュ (`///`) で実装説明

### ファイル命名規則
- **SolidJS コンポーネント**: PascalCase (`ImageViewer.tsx`)
- **フック**: camelCase with `use` prefix (`useImageState.ts`)
- **ユーティリティ**: camelCase (`imageViewerApi.ts`)
- **型定義**: `.d.ts` または `types.ts` ファイル

### プロジェクト設定
- 分離されたコンポーネント構成
- Tauri APIとの疎結合設計
- SolidJS のリアクティビティ最大活用

---

## 🐛 トラブルシューティング

### ビルドエラー
```bash
# キャッシュ削除後、再実行
rm -rf node_modules dist target
npm install
npm run build
```

### Tauri 通信エラー
- `src-tauri/src/lib.rs` の`#[tauri::command]`定義を確認
- Rustコンパイルエラーは`cargo check`で事前チェック

### UI描画問題
- ブラウザデベロッパーツール（F12）で検査
- コンポーネントの再レンダリング回数を最小化

---

## 📄 ライセンス

MIT

---

## 🤝 貢献

機能リクエストやバグ報告は GitHub Issues にお願いします。
大きな変更の場合は、`docs/design.md` に要件を記載してから実装開始をお願いします。

---

## 📚 参考資料

- [Tauri 公式ドキュメント](https://tauri.app)
- [SolidJS ドキュメント](https://solidjs.com)
- [TypeScript ハンドブック](https://www.typescriptlang.org/docs)
- [TailwindCSS](https://tailwindcss.com)
