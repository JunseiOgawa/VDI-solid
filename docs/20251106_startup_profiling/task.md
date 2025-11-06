# 起動パフォーマンスプロファイリング タスクリスト

## フェーズ1: 環境準備とツール導入

### ✅ 完了
- [x] プロジェクト構造の理解
- [x] 既存の最適化状況の確認
- [x] 要件定義とdesign.md作成
- [x] task.md作成

### 📋 タスク1: 機能ブランチ作成
- [ ] ブランチ名: `feature/startup-profiling-detailed`
- [ ] 既存のclaudeブランチから分岐

### 📋 タスク2: Rust側プロファイリングツール導入

#### 2.1 依存関係追加
- [ ] Cargo.tomlに以下を追加:
  - `tracing = { version = "0.1", optional = true }`
  - `tracing-subscriber = { version = "0.3", optional = true, features = ["json", "env-filter"] }`
  - `tracing-appender = { version = "0.2", optional = true }`
- [ ] feature flag追加: `profiling = ["tracing", "tracing-subscriber", "tracing-appender"]`

#### 2.2 トレーシング初期化コード作成
- [ ] `src-tauri/src/profiling.rs` モジュール作成
- [ ] `init_tracing()` 関数実装
  - [ ] JSON形式でのログ出力
  - [ ] ファイル出力先: `logs/startup_profile_backend.json`
  - [ ] タイムスタンプとスパン情報を含む

#### 2.3 メイン関数への統合
- [ ] `lib.rs` の `run()` 関数にトレーシング初期化を追加
- [ ] feature flagで条件付きコンパイル

### 📋 タスク3: TypeScript側プロファイリングツール導入

#### 3.1 プロファイラークラス作成
- [ ] `src/lib/performanceProfiler.ts` 作成
- [ ] `PerformanceProfiler` クラス実装:
  - [ ] `mark(name: string)` メソッド
  - [ ] `measure(name: string, startMark: string, endMark?: string)` メソッド
  - [ ] `getReport()` メソッド
  - [ ] `exportToJSON()` メソッド
  - [ ] `saveToFile()` メソッド(Tauri IPC使用)

#### 3.2 グローバルプロファイラーインスタンス作成
- [ ] `src/lib/performanceProfiler.ts` でexport
- [ ] 開発環境のみ有効化(環境変数チェック)

#### 3.3 HTML head に計測開始マーク追加
- [ ] `index.html` の `<head>` 内に計測スクリプト追加
- [ ] 最も早いタイミングで `performance.mark('html-start')` を実行

## フェーズ2: 計測ポイント挿入

### 📋 タスク4: Rust側計測ポイント追加

#### 4.1 lib.rs - run()関数
- [ ] 関数開始時: `span!(Level::INFO, "app_run")`
- [ ] `LaunchConfig::from_args()` 前後に計測
- [ ] `close_other_vdi_instances()` 前後に計測
- [ ] `tauri::Builder::default()` 前後に計測

#### 4.2 lib.rs - プラグイン初期化
- [ ] `tauri_plugin_opener::init()` 前後に計測
- [ ] `fs_init()` 前後に計測
- [ ] `tauri_plugin_dialog::init()` 前後に計測
- [ ] Desktop専用プラグイン前後に計測

#### 4.3 lib.rs - setup関数
- [ ] setup関数開始時にスパン作成
- [ ] updaterプラグイン初期化前後に計測
- [ ] processプラグイン初期化前後に計測
- [ ] ウィンドウ取得とJavaScript評価前後に計測
- [ ] ウィンドウモード設定前後に計測

#### 4.4 コマンドハンドラー
- [ ] `show_window` コマンド内に計測追加
- [ ] `get_system_theme` コマンド内に計測追加
- [ ] `get_launch_config` コマンド内に計測追加

### 📋 タスク5: TypeScript側計測ポイント追加

#### 5.1 index.html
- [ ] HTML読み込み開始: `<head>` 最初に `performance.mark('html-start')`
- [ ] DOM読み込み完了: `DOMContentLoaded` イベントで計測

#### 5.2 index.tsx
- [ ] ファイル先頭: `profiler.mark('index-tsx-start')`
- [ ] `render()` 呼び出し前: `profiler.mark('render-start')`
- [ ] `render()` 呼び出し後: `profiler.mark('render-end')`

#### 5.3 App.tsx
- [ ] App コンポーネント開始: `profiler.mark('app-component-start')`
- [ ] AppProvider初期化前: `profiler.mark('app-provider-start')`
- [ ] onMount開始時: `profiler.mark('app-onmount-start')`
- [ ] queueMicrotask内開始時: `profiler.mark('show-window-prep')`
- [ ] invoke("show_window")呼び出し前: `profiler.mark('show-window-call-start')`
- [ ] invoke("show_window")完了後: `profiler.mark('show-window-call-end')`
- [ ] onMount完了時: `profiler.mark('app-onmount-end')`

#### 5.4 AppStateContext.tsx
- [ ] AppProvider初期化開始: `profiler.mark('context-init-start')`
- [ ] localStorage読み込み前: `profiler.mark('localstorage-read-start')`
- [ ] localStorage読み込み後: `profiler.mark('localstorage-read-end')`
- [ ] createSignal呼び出し完了後: `profiler.mark('context-init-end')`

#### 5.5 主要コンポーネント
- [ ] Titlebar: レンダリング開始/終了
- [ ] ImageViewer: レンダリング開始/終了
- [ ] Footer: レンダリング開始/終了

### 📋 タスク6: 測定(measure)の実装

#### 6.1 TypeScript側測定追加
- [ ] 各マークペアに対してmeasure呼び出しを追加
- [ ] App.tsx のonMount最後で全測定を実行
- [ ] 測定結果をコンソールに出力(開発時)

#### 6.2 測定結果の保存
- [ ] `saveProfileData()` 関数実装
- [ ] Tauri IPCで `logs/startup_profile_frontend.json` に保存

## フェーズ3: データ収集と分析

### 📋 タスク7: ビルドとテスト実行

#### 7.1 プロファイリングビルド
- [ ] package.jsonにスクリプト追加:
  - `"profile:build": "npm run build && cargo build --release --features profiling --manifest-path src-tauri/Cargo.toml"`
- [ ] ビルドが成功することを確認

#### 7.2 計測実行
- [ ] 計測条件1: 起動時画像なし(最小構成)
  - [ ] 5回実行してデータ収集
- [ ] 計測条件2: 起動時画像あり
  - [ ] 5回実行してデータ収集
- [ ] 計測条件3: フルスクリーン起動
  - [ ] 5回実行してデータ収集

#### 7.3 ログデータ確認
- [ ] `logs/startup_profile_backend.json` が生成されることを確認
- [ ] `logs/startup_profile_frontend.json` が生成されることを確認
- [ ] データ形式が正しいことを確認

### 📋 タスク8: データ分析

#### 8.1 データ統合
- [ ] `scripts/analyze-profile.js` スクリプト作成
- [ ] バックエンドとフロントエンドのログを統合
- [ ] タイムスタンプを同期
- [ ] `logs/startup_profile_combined.json` を生成

#### 8.2 統計計算
- [ ] 各プロセスの平均時間を計算
- [ ] 標準偏差を計算
- [ ] 中央値を計算
- [ ] 最大値/最小値を記録

#### 8.3 ボトルネック特定
- [ ] 50ms以上かかるプロセスをリストアップ
- [ ] 全起動時間に占める割合を計算
- [ ] トップ10ボトルネックを抽出

### 📋 タスク9: レポート作成

#### 9.1 分析レポート作成
- [ ] `docs/20251106_startup_profiling/analysis.md` 作成
- [ ] 計測環境の記載
- [ ] 各プロセスの時間内訳表作成
- [ ] ボトルネックランキング表作成
- [ ] タイムラインチャート(Mermaid図)作成

#### 9.2 最適化提案書作成
- [ ] `docs/20251106_startup_profiling/optimization_proposals.md` 作成
- [ ] 各ボトルネックに対する最適化案記載:
  - [ ] 問題の説明
  - [ ] 最適化アプローチ
  - [ ] 期待される効果(定量的)
  - [ ] 実装難易度(低/中/高)
  - [ ] 優先度(高/中/低)

#### 9.3 可視化レポート作成(オプション)
- [ ] `docs/20251106_startup_profiling/timeline.html` 作成
- [ ] D3.jsやChart.jsでタイムラインチャート生成
- [ ] インタラクティブな表示

## フェーズ4: 確認とクリーンアップ

### 📋 タスク10: コードレビューと整理

#### 10.1 プロファイリングコードの整理
- [ ] 不要なconsole.logを削除
- [ ] コメントを追加
- [ ] feature flagが正しく機能することを確認

#### 10.2 ドキュメント最終確認
- [ ] design.mdの更新
- [ ] task.mdの完了状況更新
- [ ] READMEにプロファイリング手順を追加(オプション)

#### 10.3 コミットとプッシュ
- [ ] 変更をコミット(コミットメッセージ: "feat: 起動パフォーマンス詳細プロファイリング実装")
- [ ] ブランチにプッシュ
- [ ] プルリクエスト作成(必要に応じて)

### 📋 タスク11: 報告と次ステップ

#### 11.1 分析結果のサマリー作成
- [ ] 主要な発見事項をまとめる
- [ ] 最優先で取り組むべき最適化項目を3つ選定
- [ ] 期待される総合的な改善効果を試算

#### 11.2 次フェーズの計画
- [ ] 最適化実装のロードマップ作成
- [ ] 各最適化の実装スケジュール策定

## 進捗管理

### 現在のステータス
- ✅ フェーズ1: 環境準備とツール導入 - **進行中**
- ⏳ フェーズ2: 計測ポイント挿入 - 未着手
- ⏳ フェーズ3: データ収集と分析 - 未着手
- ⏳ フェーズ4: 確認とクリーンアップ - 未着手

### 推定所要時間
- フェーズ1: 1-2時間
- フェーズ2: 2-3時間
- フェーズ3: 1-2時間
- フェーズ4: 1時間
- **合計**: 5-8時間

## 注意事項

1. **プロファイリングオーバーヘッド**: 計測自体が数ミリ秒のオーバーヘッドを生じる可能性があります
2. **feature flag**: 本番ビルドではprofilingフラグを無効にすること
3. **ログファイルサイズ**: 詳細な計測を行うとログファイルが大きくなる可能性があります
4. **キャッシュ**: 正確な計測のため、初回起動と2回目以降を分けて計測すること
5. **環境依存**: 計測結果はハードウェアやOS状態に依存するため、複数回実行して統計を取ること
