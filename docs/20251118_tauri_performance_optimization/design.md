# Tauri起動時間最適化：包括的パフォーマンス改善

実施日: 2025-11-18

## 概要

Tauri公式ガイドに基づいて、VDI-solidアプリケーションの起動時間を劇的に短縮する包括的な最適化を実施します。Rust側、TypeScript/SolidJS側、Tauri設定の3つの側面から、実証済みの最適化手法を適用し、起動時間を62%短縮、バイナリサイズを最大78%削減することを目指します。

## 目標

### パフォーマンス目標
- **起動時間**: 現状から50-60%短縮
- **バイナリサイズ**: 現状から30-50%削減
- **初期化時間**: 現状から60-70%削減
- **体感起動速度**: 現状から60%以上改善

### 具体的な数値目標
- ウィンドウ表示までの時間: 300ms以下
- 初期バンドルサイズ: gzip 40kB以下
- バイナリサイズ: 現状から30%削減

## 背景

### 現在の実装状況

#### Rust側
- Cargo.toml設定:
  - `opt-level = 3` (速度優先)
  - `lto = "thin"` (軽量なLTO)
  - `strip = true`
  - `panic = "abort"`
  - `codegen-units = 1`
- 依存関係:
  - `lazy_static` 使用中(once_cellが推奨)
  - `tokio` 全機能使用中
  - `image` 全フォーマット対応

#### フロントエンド側
- バンドルサイズ: 約180kB (gzip: 約51kB)
- 既存の最適化:
  - Terser圧縮設定
  - 手動チャンク分割
  - ソースマップ無効化
  - 一部遅延読み込み実装済み

#### Tauri設定
- `visible: false` 実装済み
- `transparent: true` (パフォーマンスオーバーヘッドあり)
- `withGlobalTauri: true` (最適化の余地あり)
- `removeUnusedCommands` 未設定

### 問題点

1. **Cargo.toml設定が最適でない**
   - `opt-level = 3`は速度優先だが、ガイドでは起動時間とサイズのバランスが取れた`"s"`を推奨
   - `lto = "thin"`はビルド時間優先だが、`true`の方が最適化効果が高い

2. **非推奨の依存関係を使用**
   - `lazy_static`は`once_cell`または標準ライブラリの`LazyLock`が推奨

3. **不要な機能が有効**
   - `transparent: true`はレンダリングオーバーヘッドを追加
   - `withGlobalTauri: true`は不要なグローバル変数を追加

4. **依存関係の機能が過剰**
   - `tokio`の全機能を有効化(必要な機能のみに絞るべき)

## 設計

### 1. Rust側の最適化

#### 1.1 Cargo.toml リリースプロファイル最適化

**変更内容**:
```toml
[profile.release]
panic = "abort"           # パニック時のクリーンアップロジックを除去
codegen-units = 1         # クレートを順次コンパイルして最適化を向上
lto = true                # 完全なLink Time Optimization
opt-level = "s"           # サイズと起動時間のバランス最適化
strip = true              # デバッグシンボル削除
incremental = false       # リリースビルドで最適化
```

**根拠**:
- `opt-level = "s"`: ガイドによれば、起動時間とサイズのバランスが最も良い
- `lto = true`: バイナリサイズを10-30%削減し、起動時間も改善
- `codegen-units = 1`との組み合わせで最大限の最適化効果

**期待効果**: バイナリサイズ20-40%削減、起動時間50-100ms短縮

#### 1.2 lazy_staticをonce_cellに置き換え

**変更内容**:
```toml
[dependencies]
# lazy_static = "1.4" を削除
once_cell = "1.19"
```

Rustコード:
```rust
// 変更前
use lazy_static::lazy_static;
lazy_static! {
    static ref SOME_VALUE: Type = initialize();
}

// 変更後
use once_cell::sync::Lazy;
static SOME_VALUE: Lazy<Type> = Lazy::new(|| initialize());
```

**根拠**:
- `once_cell`はマクロを使用せず、より透過的でデバッグしやすい
- rust-analyzerのサポートが優れている
- Rust 1.70以降では標準ライブラリに部分的に含まれている

**期待効果**: 初期化オーバーヘッド削減、コード品質向上

#### 1.3 依存関係の機能フラグ最適化

**tokio最適化**:
```toml
# 変更前
tokio = { version = "1.0", features = ["rt-multi-thread", "macros", "sync", "fs", "process"] }

# 変更後(必要な機能のみ)
tokio = { version = "1.0", features = ["rt-multi-thread", "macros", "sync", "fs", "process"] }
```

**image最適化**:
```toml
# 変更前
image = { version = "0.24", default-features = false, features = ["png", "jpeg", "gif", "webp", "bmp", "tiff"] }

# 変更後(使用頻度の高いフォーマットのみ)
image = { version = "0.24", default-features = false, features = ["png", "jpeg", "webp"] }
```

**期待効果**: バイナリサイズ5-15%削減

### 2. Tauri設定の最適化

#### 2.1 ウィンドウ設定最適化

**変更内容**:
```json
{
  "app": {
    "withGlobalTauri": false,
    "windows": [
      {
        "label": "main",
        "title": "VDI-solid",
        "width": 800,
        "height": 600,
        "visible": false,
        "minWidth": 500,
        "minHeight": 300,
        "transparent": false,
        "decorations": false
      }
    ]
  }
}
```

**変更点**:
- `withGlobalTauri: true` → `false`: 不要なグローバル変数を削除
- `transparent: true` → `false`: レンダリングオーバーヘッドを削減

**注意**: transparentをfalseにすると、カスタムタイトルバーの透明性が失われるため、代替デザインが必要になる可能性があります。まずはテストして影響を確認します。

**期待効果**: 初期化時間20-50ms短縮

#### 2.2 未使用コマンド削除設定

**変更内容**:
```json
{
  "build": {
    "beforeDevCommand": "vite",
    "devUrl": "http://localhost:50500",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist",
    "removeUnusedCommands": true
  }
}
```

**期待効果**: バイナリサイズ削減、IPCオーバーヘッド削減

#### 2.3 CSP最適化

**変更内容**:
```json
{
  "app": {
    "security": {
      "csp": {
        "default-src": "'self'",
        "script-src": "'self'",
        "style-src": "'self' 'unsafe-inline'",
        "img-src": "'self' asset: http://asset.localhost blob: data:"
      }
    }
  }
}
```

**期待効果**: セキュリティ向上、パース時間の最小化

### 3. フロントエンド最適化

#### 3.1 既存の最適化確認

現在の`vite.config.ts`は既に以下の最適化が実装済み:
- Terser圧縮
- 手動チャンク分割
- ソースマップ無効化

これらは維持します。

#### 3.2 追加の最適化(必要に応じて)

バンドルサイズが既に小さい(gzip 51kB)ため、フロントエンド側の追加最適化は控えめに実施します。

## 実装順序

### Phase 1: Rust側の最適化
1. Cargo.tomlのリリースプロファイル最適化
2. lazy_staticをonce_cellに置き換え
3. 依存関係の機能フラグ最適化

### Phase 2: Tauri設定の最適化
1. withGlobalTauriをfalseに変更
2. removeUnusedCommandsを追加
3. transparent設定の影響確認とテスト

### Phase 3: 検証とテスト
1. ビルドサイズ比較
2. 起動時間計測
3. 動作確認

## リスクと対策

### リスク1: transparent: falseによるUI崩れ

**対策**:
- まずテスト環境で確認
- 必要に応じてCSSで代替デザインを実装
- 最悪の場合はtransparent: trueに戻す

### リスク2: 依存関係の機能削減による動作不良

**対策**:
- 段階的に削減してテスト
- 必要な機能は残す
- ビルドエラーが出た場合は機能を追加

### リスク3: ビルド時間の増加

**対策**:
- 開発用プロファイルは維持
- リリースビルドのみ最適化設定を適用

## 計測方法

### ビルドサイズ
```bash
# バイナリサイズ
ls -lh src-tauri/target/release/vdi-solid

# バンドルサイズ
npm run build
```

### 起動時間
- 手動計測: アプリ起動からウィンドウ表示までの時間
- Performance API: フロントエンドの初期化時間

## 成功基準

### 必須要件
- ビルドが成功すること
- アプリケーションが正常に起動すること
- 全機能が正常に動作すること

### パフォーマンス要件
- バイナリサイズが30%以上削減されること
- 起動時間が改善されること(数値は計測後に判断)

### 品質要件
- 既存機能が全て動作すること
- UI/UXが劣化しないこと

## 参考資料

- [Tauri起動時間最適化ガイド：完全版](提供されたガイド)
- [Tauri Performance Best Practices](https://v2.tauri.app/)
- [Cargo Profile Documentation](https://doc.rust-lang.org/cargo/reference/profiles.html)
- [once_cell Documentation](https://docs.rs/once_cell/)
