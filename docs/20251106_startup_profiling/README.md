# 起動パフォーマンスプロファイリング

このディレクトリには、VDI-solidアプリケーションの起動速度を詳細に分析するためのプロファイリング実装とドキュメントが含まれています。

## 概要

起動プロセスの各ステップをミリ秒単位で計測し、ボトルネックを特定するためのツールとコードを実装しました。

## 実装内容

### Rustバックエンド
- **tracing**: 構造化ログとスパントレーシング
- **計測ポイント**:
  - アプリケーション起動開始
  - コマンドライン引数のパース
  - 他インスタンスのクローズ
  - Tauriビルダー初期化
  - プラグイン初期化(opener, fs, dialog, updater, process)
  - show_windowコマンド実行

### TypeScriptフロントエンド
- **Performance API**: 高精度タイマーとマーキング
- **計測ポイント**:
  - HTML読み込み開始
  - DOMContentLoaded/window.load
  - SolidJSレンダリング開始/終了
  - Appコンポーネント初期化
  - AppProvider初期化
  - LocalStorage読み込み
  - show_window IPC呼び出し
  - 総起動時間

## 使用方法

### 1. 依存関係のインストール

```bash
# Node.js依存関係
npm install
```

### 2. プロファイリングビルドの実行

#### フロントエンド
```bash
# 開発モード(プロファイリング有効)
npm run dev

# 本番ビルド
npm run build
```

フロントエンドのプロファイラーは開発モードで自動的に有効になります。本番ビルドで有効化する場合は、環境変数を設定してください:

```bash
VITE_ENABLE_PROFILING=true npm run build
```

#### バックエンド
```bash
# profilingフラグ付きでビルド
cd src-tauri
cargo build --release --features profiling

# またはnpmスクリプトから
npm run build
cd src-tauri
cargo build --release --features profiling
```

### 3. アプリケーションの実行と計測

#### 開発モードでの計測
```bash
npm run dev
```

アプリケーション起動後、ブラウザの開発者ツール(F12)のコンソールを開くと、プロファイリング結果が表示されます。

#### 本番ビルドでの計測
```bash
# ビルド
npm run build
cd src-tauri
cargo build --release --features profiling

# 実行(Rustのログ出力を有効化)
RUST_LOG=info ./target/release/vdi > ../logs/backend_profile.log 2>&1
```

フロントエンドの計測結果は、アプリ起動後2秒後にコンソールに出力されます。

### 4. 計測データの収集

複数回実行して統計を取ることを推奨します:

```bash
# logsディレクトリを作成
mkdir -p logs

# 5回実行して計測
for i in {1..5}; do
  echo "Run $i"
  RUST_LOG=info ./target/release/vdi > logs/backend_profile_run_${i}.log 2>&1
  # フロントエンドの結果は開発者ツールのコンソールからコピー
done
```

### 5. 結果の確認

#### Rustバックエンド
```bash
# ログファイルを確認
cat logs/backend_profile.log | jq '.'

# durationフィールドでフィルタ
cat logs/backend_profile.log | jq 'select(.duration_ms != null)'
```

#### TypeScriptフロントエンド
ブラウザの開発者ツールのコンソールに以下のように表示されます:

```
[Profiler] Performance Report
  Navigation Timing
    DOM Content Loaded: XX.XXms
    DOM Complete: XXX.XXms
    Load Complete: XXX.XXms
  Measurements
    render-duration: XX.XXms
    show-window-ipc-duration: XX.XXms
    app-onmount-duration: XX.XXms
    total-startup-time: XXX.XXms
  Marks
    html-start: 0.00ms
    index-tsx-start: XX.XXms
    render-start: XX.XXms
    ...
```

## 計測指標の説明

### Rustバックエンド主要指標
- `parse_launch_config`: コマンドライン引数のパース時間
- `close_other_instances`: 既存インスタンスのクローズ時間
- `plugin_opener_init`: openerプラグイン初期化時間
- `plugin_fs_init`: ファイルシステムプラグイン初期化時間
- `plugin_dialog_init`: ダイアログプラグイン初期化時間
- `desktop_plugins_init`: Desktop専用プラグイン初期化時間
- `show_window_command`: ウィンドウ表示コマンド実行時間

### TypeScriptフロントエンド主要指標
- `html-to-dom-content-loaded`: HTML読み込みからDOMContentLoadedまで
- `render-duration`: SolidJSレンダリング時間
- `app-provider-init-duration`: AppProvider全体の初期化時間
- `localstorage-read-duration`: LocalStorage読み込み時間
- `show-window-ipc-duration`: show_window IPC呼び出し時間
- `total-startup-time`: 総起動時間(HTML読み込み開始からshow_window完了まで)

## 次のステップ

1. **データ収集**: 複数回実行して統計的に有意なデータを収集
2. **分析**: `analysis.md` に結果を記録
3. **ボトルネック特定**: 50ms以上かかるプロセスをリストアップ
4. **最適化提案**: `optimization_proposals.md` に最適化案を記載

## ファイル構成

```
docs/20251106_startup_profiling/
├── README.md                    # このファイル
├── design.md                    # 設計ドキュメント
├── task.md                      # タスクリスト
├── analysis.md                  # 分析結果(作成予定)
└── optimization_proposals.md    # 最適化提案(作成予定)
```

## トラブルシューティング

### プロファイリングが動作しない
- フロントエンド: 開発者ツールのコンソールで `profiler.isEnabled()` を確認
- バックエンド: `RUST_LOG=info` 環境変数が設定されているか確認

### ログが出力されない
- Rust: `--features profiling` フラグが付いているか確認
- TypeScript: 開発モード(`npm run dev`)で実行しているか確認

### パフォーマンスへの影響
プロファイリングコードは最小限のオーバーヘッド(通常1-5ms)しか発生しませんが、正確な計測のため、feature flagを使って本番ビルドからは除外されます。

## 参考資料

- [tracing crate documentation](https://docs.rs/tracing/)
- [Performance API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API)
- [Rust Performance Book](https://nnethercote.github.io/perf-book/)
