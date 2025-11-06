# アプリケーション起動パフォーマンス詳細プロファイリング

## 概要

VDI-solidアプリケーションの起動プロセスを徹底的にプロファイリングし、ミリ秒単位でのボトルネックを特定する。既存の最適化を踏まえて、さらなる高速化の可能性を探る。

## 目標

- 起動プロセスの全ステップを1ms単位で計測
- ボトルネックとなっているプロセスを特定(目標: 50ms以上かかるプロセスを特定)
- Rust/TypeScript両側の詳細な時系列データを収集
- 最適化可能な箇所を5〜10項目リストアップ

## 背景

### 既存の最適化状況

過去の最適化実績(docs/20251028_startup_optimization):
- Cargo.tomlリリースプロファイル最適化済み(lto, opt-level, strip等)
- コンポーネント遅延ロード実装済み(ImageGallery, SettingsMenu)
- ウィンドウ非表示起動とshow_window最適化済み
- アップデートチェック非同期化済み

### 現在のパフォーマンス指標

- フロントエンドバンドルサイズ: 約180 kB (gzip: 約51 kB)
- 最大チャンク: 89.45 kB (gzip: 27.94 kB)
- ビルド時間: 1.43秒

### 未計測領域

- 各起動ステップの詳細な時間(ミリ秒単位)
- Rust側の初期化プロセスの内訳
- プラグイン初期化の個別時間
- フロントエンドのコンポーネント初期化時間
- Tauri IPC通信のオーバーヘッド

## 計測対象プロセス

### 1. Rustバックエンド起動プロセス

#### 1.1 メイン関数からTauriビルダー初期化まで
- `main()` 開始
- `vdi_lib::run()` 呼び出し
- `LaunchConfig::from_args()` 実行時間
- `process_manager::close_other_vdi_instances()` 実行時間(条件付き)

#### 1.2 Tauriビルダー構築
- `tauri::Builder::default()` 初期化
- プラグイン初期化(個別計測):
  - `tauri_plugin_opener::init()` - 最軽量と想定
  - `fs_init()` - ファイルシステム
  - `tauri_plugin_dialog::init()` - ダイアログ
- `invoke_handler` 登録時間(全17コマンド)

#### 1.3 setup関数実行
- Desktop専用プラグイン初期化:
  - `tauri_plugin_updater::Builder::new().build()`
  - `tauri_plugin_process::init()`
- ウィンドウ取得とJavaScript評価:
  - 右クリックメニュー無効化
  - テキスト選択無効化
- ウィンドウモード設定(フルスクリーン/サイズ指定)

#### 1.4 Tauriランタイム起動
- `.run(tauri::generate_context!())` 開始からウィンドウ準備完了まで

### 2. フロントエンド起動プロセス

#### 2.1 初期ロード
- HTML読み込み開始から完了まで
- JavaScriptバンドル読み込み(各チャンク):
  - vendor chunk
  - main chunk
  - CSS chunk
- DOMContentLoaded イベント

#### 2.2 SolidJSレンダリング
- `render()` 関数開始
- `<App />` コンポーネント初期化:
  - `AppProvider` 初期化
  - `AppStateContext` 初期化
  - localStorage読み込み

#### 2.3 コンポーネント階層初期化
- `AppMain` 初期化
- `Titlebar` レンダリング
- `AppContent` レンダリング
- `ImageViewer` レンダリング
- `Footer` レンダリング
- 遅延ロードコンポーネント(SettingsMenu, ImageGallery)のpreload

#### 2.4 onMount処理
- `onMount` コールバック開始
- `queueMicrotask` キューイング
- `invoke("show_window")` IPC呼び出し
  - リクエスト送信時間
  - レスポンス受信時間
- キーボードイベントリスナー登録(F11)

#### 2.5 バックグラウンド処理
- アップデートチェック開始(3秒遅延後)
- SettingsMenuプリロード(3秒遅延後)

### 3. Tauri IPC通信

#### 3.1 起動時のコマンド呼び出し
各コマンドの個別計測:
- `get_launch_config` - 起動設定取得
- `get_system_theme` - システムテーマ取得
- `show_window` - ウィンドウ表示
- `get_launch_image_path` - 起動画像パス取得(使用時)
- `get_folder_images` - フォルダ画像スキャン(使用時)

#### 3.2 IPC通信の内訳
- シリアライズ時間
- IPC送信時間
- バックエンド処理時間
- レスポンスシリアライズ時間
- フロントエンド受信時間

### 4. 総合指標

#### 4.1 重要マイルストーン
- プロセス起動からmain関数実行まで
- main関数から最初のウィンドウ描画まで
- ウィンドウ描画から操作可能まで
- 総起動時間(プロセス起動から完全に操作可能まで)

#### 4.2 リソース使用量
- 初期メモリ使用量
- ピークメモリ使用量
- CPU使用率の推移

## 計測手法

### Rustバックエンド計測

#### 使用ツール
- **tracing**: 構造化ログとスパントレーシング
- **tracing-subscriber**: トレース収集とフォーマット
- **tracing-appender**: ログファイル出力
- **std::time::Instant**: 高精度タイマー

#### 実装方法

```rust
use tracing::{info, span, Level};
use std::time::Instant;

// 各関数やブロックにスパンを追加
let _span = span!(Level::INFO, "plugin_initialization").entered();
let start = Instant::now();
// 処理
let elapsed = start.elapsed();
info!("elapsed: {:?}", elapsed);
```

#### ログ出力先
- 開発環境: コンソール出力(JSON形式)
- 分析用: `logs/startup_profile.json` にファイル出力

### フロントエンド計測

#### 使用ツール
- **Performance API**: `performance.now()`, `performance.mark()`, `performance.measure()`
- **User Timing API**: カスタムマーク/測定
- **Navigation Timing API**: ページロード時間
- **Resource Timing API**: リソースロード時間

#### 実装方法

```typescript
// 開始マーク
performance.mark('app-start');

// 処理
// ...

// 終了マークと測定
performance.mark('app-end');
performance.measure('app-initialization', 'app-start', 'app-end');

// 結果取得
const measures = performance.getEntriesByType('measure');
console.log(measures);
```

#### ログ出力
- コンソール出力(整形済み)
- LocalStorageへの保存(オプション)
- Tauri IPCでファイル保存(オプション)

### 統合計測

#### タイムスタンプ同期
- Rust側: プロセス起動時のエポックタイムを記録
- TypeScript側: `performance.timeOrigin` を使用
- 両者を同期してタイムライン作成

#### 可視化
- 計測データをJSON形式でエクスポート
- Chrome DevTools Performance形式に変換(検討)
- カスタムHTMLレポート生成

## 計測環境

### ビルド設定
- Releaseビルドで計測(本番環境と同等)
- トレーシング用のfeature flagを追加
  - `cargo build --release --features profiling`
  - プロファイリング用のログ出力を有効化

### 実行環境
- 複数回実行(最低5回)して平均値/中央値を算出
- 初回起動と2回目以降を分けて計測
- システムキャッシュをクリアして計測

### 計測条件
- 起動時画像なし(最小構成)
- 起動時画像あり(通常使用)
- フルスクリーン起動
- サイズ指定起動

## 期待される成果物

### 1. 詳細プロファイリングデータ
- `logs/startup_profile_backend.json` - Rust側の計測データ
- `logs/startup_profile_frontend.json` - TypeScript側の計測データ
- `logs/startup_profile_combined.json` - 統合タイムライン

### 2. 分析レポート
- `docs/20251106_startup_profiling/analysis.md`
  - 各プロセスの時間内訳(表形式)
  - ボトルネックランキング(トップ10)
  - タイムラインチャート(Mermaid図)
  - 最適化提案リスト

### 3. 可視化レポート
- `docs/20251106_startup_profiling/timeline.html`
  - インタラクティブなタイムラインビュー
  - プロセスごとの色分け
  - ホバーで詳細表示

### 4. 最適化提案
- `docs/20251106_startup_profiling/optimization_proposals.md`
  - 特定されたボトルネック
  - 各ボトルネックの最適化案
  - 期待される効果(定量的)
  - 実装難易度と優先度

## 技術的詳細

### Cargo.toml の変更

```toml
[dependencies]
# 既存の依存関係...

# プロファイリング用
tracing = { version = "0.1", optional = true }
tracing-subscriber = { version = "0.3", optional = true, features = ["json", "env-filter"] }
tracing-appender = { version = "0.2", optional = true }

[features]
profiling = ["tracing", "tracing-subscriber", "tracing-appender"]
```

### package.json の変更(計測用スクリプト)

```json
{
  "scripts": {
    "profile": "npm run build && npm run tauri build -- --features profiling",
    "profile:dev": "npm run tauri dev -- --features profiling"
  }
}
```

### 計測コード例

#### Rust側
```rust
#[cfg(feature = "profiling")]
use tracing::{info, span, Level};

pub fn run() {
    #[cfg(feature = "profiling")]
    init_tracing();

    let _span = span!(Level::INFO, "app_run").entered();
    // 既存のコード
}

#[cfg(feature = "profiling")]
fn init_tracing() {
    use tracing_subscriber::{fmt, prelude::*, EnvFilter};

    tracing_subscriber::registry()
        .with(fmt::layer().json())
        .with(EnvFilter::from_default_env())
        .init();
}
```

#### TypeScript側
```typescript
class PerformanceProfiler {
  private marks: Map<string, number> = new Map();

  mark(name: string) {
    const time = performance.now();
    this.marks.set(name, time);
    performance.mark(name);
  }

  measure(name: string, startMark: string, endMark?: string) {
    if (endMark) {
      performance.measure(name, startMark, endMark);
    } else {
      performance.measure(name, startMark);
    }
  }

  getReport() {
    const measures = performance.getEntriesByType('measure');
    return measures.map(m => ({
      name: m.name,
      duration: m.duration,
      startTime: m.startTime
    }));
  }

  exportToJSON() {
    return JSON.stringify(this.getReport(), null, 2);
  }
}

export const profiler = new PerformanceProfiler();
```

## リスクと対策

### リスク
1. プロファイリングオーバーヘッドによる計測精度の低下
2. Releaseビルドでのログ出力によるパフォーマンス影響
3. 大量のログデータによるストレージ使用量増加

### 対策
1. feature flagでプロファイリングコードを条件付きコンパイル
2. 計測対象を必要最小限に絞る
3. ログレベルでフィルタリング
4. 計測終了後はfeatureを無効化

## タイムライン

- **Day 1**: 計測ツール導入とコード追加
- **Day 2**: 計測実行とデータ収集
- **Day 3**: データ分析とレポート作成
- **Day 4**: 最適化提案のドキュメント化

## 参考資料

- [tracing crate documentation](https://docs.rs/tracing/)
- [Performance API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API)
- [User Timing API](https://www.w3.org/TR/user-timing/)
- [Rust Performance Book](https://nnethercote.github.io/perf-book/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
