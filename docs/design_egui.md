# VDI-solid (eGUI版) アーキテクチャ設計書

## 1. 概要

VDI-solid (eGUI版) は、Rust言語と`egui` (Immediate Mode GUIライブラリ) を使用して構築された、軽量かつ高性能な画像ビューアです。従来のTauri + SolidJS版と比較して、Webviewをバイパスし、GPUアクセラレーションを直接利用することで、極めて低い遅延と高い応答性を実現しています。

## 2. アーキテクチャ概観

アプリケーションは単一の実行ファイル (`vdi-solid.exe`) として動作し、以下の主要コンポーネントで構成されています。

```mermaid
graph TD
    UserInput[ユーザー入力 (マウス/キーボード)] --> WindowLoop[eframe イベントループ]
    WindowLoop --> VdiApp[VdiApp 構造体 (状態管理)]
    
    subgraph "Main Thread (UI)"
        VdiApp --> Update[update() メソッド]
        Update --> Logic[ロジック処理 (ズーム/パン/入力)]
        Update --> Paint[描画処理 (egui::Painter)]
        TopPanel[タイトルバー] -.-> Paint
        CentralPanel[画像表示エリア] -.-> Paint
        BottomPanel[フッター] -.-> Paint
        Settings[設定画面] -.-> Paint
    end
    
    subgraph "Background Threads"
        AsyncLoad[画像読み込み (async)]
        AsyncRotate[画像回転処理 (vdi_lib)]
        AsyncAnalyze[ヒストグラム/ピーキング解析]
    end
    
    Logic -- "channel (mpsc)" --> AsyncLoad
    Logic -- "channel (mpsc)" --> AsyncRotate
    
    AsyncLoad -- "channel (Arc<Texture>)" --> VdiApp
    AsyncRotate -- "channel (Result)" --> VdiApp
```

### 2.1 技術スタック

- **言語**: Rust 2021 edition
- **GUIフレームワーク**: `egui` (0.29), `eframe`
- **画像処理**: `image` crate (0.24)
- **非同期処理**: `tokio`
- **ウィンドウ管理**: `active-win-pos-rs` (ウィンドウ位置管理)

## 3. 主要コンポーネント詳細

### 3.1 `VdiApp` 構造体 (State Management)

アプリケーションの全状態は `src-tauri/src/main_egui.rs` 内の `VdiApp` 構造体に保持されます。

```rust
struct VdiApp {
    // 状態フラグ
    params_set: bool,
    fit_requested: bool,
    
    // 画像データ
    texture: Option<egui::TextureHandle>,
    current_image_size: Vec2,
    current_path: Option<PathBuf>,
    
    // バックグラウンド処理通信
    image_loader: Option<mpsc::Receiver<...>>,
    rotation_receiver: Option<mpsc::Receiver<...>>,
    
    // 表示制御
    zoom: f32,
    pan: Vec2,
    rotation: f32,
    
    // 機能フラグ
    peaking_enabled: bool,
    histogram_enabled: bool,
    grid_enabled: bool,
    
    // 設定
    settings: Settings,
}
```

### 3.2 描画ループ (`update` メソッド)

`eframe::App` トレイで定義される `update` メソッドが毎フレーム（またはイベント発生時）に呼び出されます。Immediate Mode GUIの特性上、UIの定義とロジック処理は同時に行われます。

1. **入力処理**: `ctx.input()` からキーボード入力やマウスイベントを取得し、ショートカットキー処理を行います。
2. **バックグラウンド受信**: `try_recv()` で画像読み込みや回転処理の完了を確認し、状態を更新します。
3. **UI構築**:
   - `egui::TopBottomPanel::top`: カスタムタイトルバー
   - `egui::CentralPanel`: 画像表示エリア（ズーム・パン処理を含む）
   - `egui::Window`: 設定ダイアログ（モーダル風表示）
   - `egui::TopBottomPanel::bottom`: フッター情報

### 3.3 画像描画と変換

画像は `egui::Painter` を使用して描画されます。

- **ズーム/パン**: `egui::Rect` の座標変換により実装されています。
- **回転**: 単純な `rotate` だけでなく、UV座標操作による90度単位の回転を行っています。これにより、アスペクト比を維持したまま正しい向きで表示されます。
  - **重要**: 90度/270度回転時は、矩形の幅と高さを入れ替えて計算し、UV座標を回転させることで、テクスチャデータの再生成なしに高速に回転表示を実現しています。

## 4. 非同期処理とパフォーマンス

### 4.1 画像読み込み
メインスレッドをブロックしないよう、画像のデコードは `std::thread` または `tokio::spawn` で別スレッドで行われます。デコード完了後、`egui::ColorImage` に変換され、チャネルを通じてメインスレッドに送られます。メインスレッドでは `ctx.load_texture` を呼び出してGPUテクスチャ化します。

### 4.2 回転処理
画像の回転（ファイル書き換え）は重い処理であるため、バックグラウンドスレッドで実行されます（`vdi_lib::img::rotate_image`）。
- **スタック機能**: ユーザーが連続してRキーを押した場合、回転リクエストはスタックされ、順番に処理されます。UI上では即座に回転したように見せる（プレビュー）ことで、体感待ち時間をゼロにしています。

## 5. UI/UX デザイン

- **ダークテーマ**: デフォルトでダークテーマを採用し、没入感を高めています。
- **カスタムタイトルバー**: OS標準のバーを非表示にし、独自のタイトルバーを描画することで、アプリケーション全体の一体感を醸成しています。
- **ショートカットキー**:
  - `F`: 画面にフィット
  - `R`: 90度回転
  - `G`: グリッド表示切り替え
  - `P`: ピーキング表示切り替え
  - `H`: ヒストグラム表示切り替え
  - `Arrow Left/Right`: 前後の画像へ移動
  - `Esc`: 設定を閉じる / アプリ終了

## 6. 今後の展望

- **日本語対応**: 現在は一部英語ですが、多言語対応の基盤は整っています。
- **プラグインシステム**: `vdi_lib` を拡張し、より多くの画像処理機能を追加可能です。
