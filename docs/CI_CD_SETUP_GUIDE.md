# CI/CD セットアップガイド（GitHub Actions）

このドキュメントでは、GitHub Actionsを使用してVDI-solidプロジェクトの自動ビルドとリリースを設定する方法を解説します。

## 目次
1. [CI/CDとは](#cicdとは)
2. [GitHub Actionsの基本](#github-actionsの基本)
3. [セットアップ手順](#セットアップ手順)
4. [ワークフローの解説](#ワークフローの解説)
5. [使い方](#使い方)
6. [トラブルシューティング](#トラブルシューティング)

---

## CI/CDとは

### CI（Continuous Integration - 継続的インテグレーション）
- コードの変更を頻繁に統合し、自動でビルド・テストを実行
- バグを早期発見し、開発速度を向上

### CD（Continuous Delivery/Deployment - 継続的デリバリー/デプロイ）
- ビルドされたアプリケーションを自動でリリース・配布
- 手動作業を削減し、リリースプロセスを効率化

### このプロジェクトでのメリット
- ✅ Windows、macOS、Linux用のビルドを**自動で並行実行**
- ✅ タグをプッシュするだけで**自動リリース**
- ✅ 各プラットフォームのマシンを用意しなくても**すべてのOS用バイナリを生成**
- ✅ ビルドの失敗を即座に検知

---

## GitHub Actionsの基本

### GitHub Actionsとは
- GitHubが提供する無料のCI/CDサービス
- YAML形式のファイルでワークフローを定義
- Windows、macOS、Linuxの仮想マシンを使用可能

### 料金
- **パブリックリポジトリ**: 完全無料・無制限
- **プライベートリポジトリ**: 月2,000分まで無料（超過分は有料）

### ワークフローファイルの配置場所
```
.github/
  └── workflows/
      ├── build.yml         # プッシュ時の自動ビルド
      └── release.yml       # タグ時の自動リリース
```

---

## セットアップ手順

### ステップ1: ワークフローディレクトリの作成

プロジェクトルートで以下のコマンドを実行：
```bash
mkdir -p .github/workflows
```

### ステップ2: リリースワークフローの作成

`.github/workflows/release.yml` を作成します（このファイルは後述）。

### ステップ3: GitHubにプッシュ

```bash
git add .github/workflows/release.yml
git commit -m "Add GitHub Actions workflow for multi-platform release"
git push origin main
```

### ステップ4: リリースの作成

新しいバージョンをリリースするには、Gitタグを作成してプッシュ：
```bash
# バージョンタグを作成（例: v0.1.0）
git tag v0.1.0

# タグをプッシュ（これがワークフローをトリガー）
git push origin v0.1.0
```

### ステップ5: ビルドの確認

1. GitHubリポジトリの **「Actions」** タブを開く
2. 実行中のワークフローを確認
3. 完了後、**「Releases」** タブでダウンロード可能なバイナリが表示される

---

## ワークフローの解説

### リリースワークフロー (`release.yml`)

以下の内容で `.github/workflows/release.yml` を作成してください：

```yaml
name: Release

on:
  push:
    tags:
      - 'v*' # v0.1.0, v1.0.0 などのタグでトリガー

jobs:
  release:
    strategy:
      fail-fast: false
      matrix:
        include:
          # Windows (x64)
          - platform: 'windows-latest'
            os_name: 'Windows'
            target: 'x86_64-pc-windows-msvc'
            
          # macOS (Universal Binary: Intel + Apple Silicon)
          - platform: 'macos-latest'
            os_name: 'macOS'
            target: 'universal-apple-darwin'
            
          # Linux (x64)
          - platform: 'ubuntu-22.04'
            os_name: 'Linux'
            target: 'x86_64-unknown-linux-gnu'

    runs-on: ${{ matrix.platform }}

    steps:
      # 1. リポジトリのチェックアウト
      - name: Checkout repository
        uses: actions/checkout@v4

      # 2. Node.js のセットアップ
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      # 3. Rust のセットアップ
      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.target }}

      # 4. Rust キャッシュ（ビルド高速化）
      - name: Rust cache
        uses: swatinem/rust-cache@v2
        with:
          workspaces: './src-tauri -> target'

      # 5. Linux: システム依存関係のインストール
      - name: Install Linux dependencies
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y \
            libwebkit2gtk-4.1-dev \
            libappindicator3-dev \
            librsvg2-dev \
            patchelf \
            libssl-dev

      # 6. npm 依存関係のインストール
      - name: Install npm dependencies
        run: npm ci

      # 7. フロントエンドのビルド
      - name: Build frontend
        run: npm run build

      # 8. Tauri アプリのビルド
      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: ${{ github.ref_name }}
          releaseName: 'VDI-solid ${{ github.ref_name }}'
          releaseBody: |
            ## VDI-solid ${{ github.ref_name }}
            
            ### Downloads
            - **Windows**: `.msi` または `-setup.exe`
            - **macOS**: `.dmg` (Universal Binary: Intel + Apple Silicon)
            - **Linux**: `.AppImage` または `.deb`
            
            詳細は [CHANGELOG](https://github.com/${{ github.repository }}/blob/main/CHANGELOG.md) を参照してください。
          releaseDraft: false
          prerelease: false
          args: --target ${{ matrix.target }}
```

---

## 使い方

### 新しいバージョンをリリースする

#### 1. バージョン番号の更新

以下のファイルでバージョンを更新：

**`package.json`**:
```json
{
  "version": "0.2.0"
}
```

**`src-tauri/tauri.conf.json`**:
```json
{
  "version": "0.2.0"
}
```

**`src-tauri/Cargo.toml`**:
```toml
[package]
version = "0.2.0"
```

#### 2. 変更をコミット

```bash
git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "Bump version to 0.2.0"
git push origin main
```

#### 3. タグを作成してプッシュ

```bash
git tag v0.2.0
git push origin v0.2.0
```

#### 4. ビルドの進行状況を確認

1. https://github.com/JunseiOgawa/VDI-solid/actions にアクセス
2. "Release" ワークフローの実行状況を確認
3. 通常10〜20分でビルドが完了

#### 5. リリースされたバイナリをダウンロード

1. https://github.com/JunseiOgawa/VDI-solid/releases にアクセス
2. 最新のリリースから各OS用のインストーラーをダウンロード

---

## ワークフローの詳細解説

### 1. トリガー設定
```yaml
on:
  push:
    tags:
      - 'v*'
```
- `v` で始まるタグ（`v0.1.0`、`v1.0.0` など）がプッシュされたときに実行

### 2. マルチプラットフォームビルド
```yaml
strategy:
  matrix:
    include:
      - platform: 'windows-latest'
      - platform: 'macos-latest'
      - platform: 'ubuntu-22.04'
```
- 3つのOSで**並行してビルド**を実行
- それぞれ独立した仮想マシンで動作

### 3. Tauri Action
```yaml
- uses: tauri-apps/tauri-action@v0
```
- Tauriの公式アクション
- ビルド完了後、自動でGitHub Releasesに成果物をアップロード

### 4. 環境変数
```yaml
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
- GitHubが自動で提供するトークン
- リリースの作成・編集に使用（追加設定不要）

---

## トラブルシューティング

### ビルドが失敗する

#### 問題: npm dependencies のインストールエラー
**解決策**:
```yaml
# package-lock.json が最新か確認
npm install
git add package-lock.json
git commit -m "Update package-lock.json"
git push
```

#### 問題: Linux でのビルドエラー（webkit2gtk）
**解決策**: ワークフローに依存関係が正しく記載されているか確認
```yaml
- name: Install Linux dependencies
  if: matrix.platform == 'ubuntu-22.04'
  run: |
    sudo apt-get update
    sudo apt-get install -y libwebkit2gtk-4.1-dev
```

#### 問題: Rust のコンパイルエラー
**解決策**: `Cargo.lock` をコミット
```bash
git add src-tauri/Cargo.lock
git commit -m "Add Cargo.lock"
git push
```

### タグを間違えて作成した

#### タグの削除
```bash
# ローカルのタグを削除
git tag -d v0.1.0

# リモートのタグを削除
git push origin :refs/tags/v0.1.0
```

#### リリースの削除
1. GitHub の **「Releases」** タブを開く
2. 該当リリースの **「Delete」** をクリック

---

## 応用: 自動ビルドワークフロー

プルリクエストやプッシュ時にビルドテストを実行するワークフローも追加できます。

### `.github/workflows/build.yml`

```yaml
name: Build Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-22.04

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
      
      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
      
      - name: Install dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev
      
      - name: Install npm dependencies
        run: npm ci
      
      - name: Build frontend
        run: npm run build
      
      - name: Build Tauri (Linux)
        run: npm run tauri build
```

このワークフローは：
- プッシュやプルリクエストごとに自動実行
- ビルドが成功するか確認（リリースはしない）
- CI/CDの「CI」部分を担当

---

## まとめ

### セットアップに必要なこと
1. ✅ `.github/workflows/release.yml` を作成
2. ✅ GitHubにプッシュ
3. ✅ タグを作成してプッシュ

### 実行されること
- ✅ Windows、macOS、Linux用のビルドが自動で並行実行
- ✅ 成果物がGitHub Releasesに自動でアップロード
- ✅ ダウンロード可能なインストーラーが生成

### メリット
- 🚀 各OSマシンを用意する必要なし
- 🚀 手動ビルドの手間を削減
- 🚀 一貫性のあるリリースプロセス
- 🚀 ビルドエラーを即座に検知

---

## 参考リンク

- [GitHub Actions 公式ドキュメント](https://docs.github.com/ja/actions)
- [Tauri GitHub Action](https://github.com/tauri-apps/tauri-action)
- [Tauri ビルドガイド](https://tauri.app/v1/guides/building/)

---

**次のステップ**: 実際に `.github/workflows/release.yml` を作成してリリースを試してみましょう！
