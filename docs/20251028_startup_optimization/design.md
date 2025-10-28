# アプリケーション起動速度最適化

## 概要

VDI-solidアプリケーションの起動速度を最適化し、ウィンドウが表示されるまでの時間を短縮する。
特に初回起動時のユーザー体験を向上させることを目的とする。

## 目標

- ウィンドウ表示までの時間を100-300ms短縮
- 初期バンドルサイズを30-50%削減
- 体感起動速度を30-40%向上

## 現在の状況

### バンドルサイズ
- JavaScript: 114.47 kB (gzip: 34.32 kB)
- CSS: 45.69 kB (gzip: 7.56 kB)

### 既存の最適化
- ウィンドウ非表示起動(`visible: false`)は実装済み
- `show_window`コマンドでUI準備完了後に表示

## 最適化項目

### 1. Rustバックエンド最適化

#### 1.1 Cargo.tomlリリースプロファイル最適化
**目的**: バイナリサイズ削減と起動時間短縮

設定内容:
```toml
[profile.release]
lto = true              # Link Time Optimization
codegen-units = 1       # 単一コード生成ユニット
opt-level = "z"         # サイズ最適化
strip = true            # デバッグシンボル削除
panic = "abort"         # パニック時即座に終了
```

**期待効果**: バイナリサイズ15-25%削減、起動50-100ms短縮

#### 1.2 依存関係の機能フラグ最適化
**目的**: 不要な機能を除外してバイナリサイズ削減

対象:
- `tokio`: `features = ["full"]`を必要最小限の機能のみに変更
- `image`: 未使用画像フォーマットの無効化

**期待効果**: バイナリサイズ5-10%削減

### 2. フロントエンド最適化

#### 2.1 コンポーネントの遅延ロード
**目的**: 初期バンドルサイズ削減

対象コンポーネント:
- `SettingsMenu`: 設定メニュー全体を遅延ロード
- `ImageGallery`: ギャラリーコンポーネント全体を遅延ロード
- `Footer`のファイル名表示: Footer UIは即座に表示するが、ファイル情報は遅延取得

実装方法:
- SolidJSの`lazy()`関数を使用
- 動的import構文でコード分割

**期待効果**: 初期バンドルサイズ30-50%削減、起動100-300ms短縮

#### 2.2 Viteビルド最適化
**目的**: バンドルサイズ削減とロード効率向上

設定内容:
- Tree shaking強化
- manualChunksで戦略的なコード分割
  - vendor chunk(Tauri API等)
  - components chunk(共通コンポーネント)
- terserOptions最適化
- minify設定の強化

**期待効果**: バンドルサイズ10-20%削減

### 3. 起動フロー最適化

#### 3.1 アップデートチェックの完全な非同期化
**目的**: 起動ブロッキング処理の排除

実装内容:
- `updateManager.checkForUpdatesBackground()`をウィンドウ表示後に移動
- タイムアウト設定の追加
- エラーハンドリングの強化

**期待効果**: 起動時間100-500ms短縮

#### 3.2 初期レンダリングの段階的実行
**目的**: 体感起動速度の向上

段階的レンダリング戦略:
1. **即座に表示**: Titlebar + ImageViewer + Footer(UI のみ)
2. **遅延表示**: SettingsMenu、ImageGallery、Footerのファイル情報

実装方法:
- `requestIdleCallback`を使用した遅延レンダリング
- Critical Rendering Path最適化

**期待効果**: 体感起動速度30-40%向上

#### 3.3 show_windowコマンドの呼び出しタイミング最適化
**目的**: ウィンドウ表示タイミングの早期化

変更内容:
- `requestAnimationFrame`から`queueMicrotask`への変更
- より早い段階でのウィンドウ表示

**期待効果**: 起動時間20-50ms短縮

#### 3.4 システムテーマ取得の並列化
**目的**: 初期化処理の並列実行

実装内容:
- `get_system_theme`コマンドをウィンドウ表示前に非同期実行
- localStorage キャッシュの優先使用
- テーマ適用の非同期化

**期待効果**: 起動時間10-30ms短縮

#### 3.5 画像フォルダスキャンの遅延
**目的**: 初期化処理の軽量化

実装内容:
- `get_folder_images`の実行をウィンドウ表示後に遅延
- バックグラウンドでのスキャン実行
- プログレッシブローディングの実装

**期待効果**: 起動時間50-200ms短縮

## 実装しない項目

以下の項目は今回の最適化スコープ外:
- アイコン画像の最適化
- Rust側の重い処理の遅延初期化(histogram、peaking)
- Webフォントの最適化
- Service Worker導入
- ウィンドウ設定の事前計算(フルスクリーン引数起動時の残像懸念)

## 技術的な詳細

### SolidJS lazy()の使用方法

```typescript
import { lazy } from "solid-js";

const SettingsMenu = lazy(() => import("./components/SettingsMenu"));
const ImageGallery = lazy(() => import("./components/ImageGallery"));
```

### Vite設定例

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['@tauri-apps/api'],
          components: ['./src/components/...']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
});
```

### Cargo.toml tokio最適化例

```toml
tokio = { version = "1.0", features = ["rt-multi-thread", "macros", "sync"] }
```

## 検証方法

### パフォーマンス測定
- ビルド前後のバンドルサイズ比較
- 起動時間の計測(Performance API使用)
- メモリ使用量の監視

### ユーザー体験
- 初回起動時の体感速度
- ウィンドウ表示までのスムーズさ
- 操作可能になるまでの時間

## リスクと対策

### リスク
1. コード分割によるランタイムエラー
2. 遅延ロードによるユーザー体験の低下
3. ビルド時間の増加

### 対策
1. 十分なテストとエラーハンドリング
2. ローディング状態の適切な表示
3. CI/CD での継続的な監視

## 参考資料

- [Tauri Performance Best Practices](https://v2.tauri.app/)
- [SolidJS Code Splitting](https://docs.solidjs.com/solid-router/advanced-concepts/lazy-loading)
- [Vite Build Optimizations](https://vite.dev/guide/build.html)
- Cargo Profile Documentation
