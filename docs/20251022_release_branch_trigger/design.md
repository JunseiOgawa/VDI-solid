# Release ブランチトリガーへの変更

## 概要

GitHub Actions のリリースワークフローを、main ブランチではなく release ブランチでトリガーされるように変更する。

## 背景

現在のワークフローは main ブランチへのプッシュでトリガーされているが、運用上 release ブランチでリリースプロセスを実行したい。

## 発見された問題

### 問題1: プッシュ先のブランチ不一致
- L92のプッシュ先が`main`のままだったため、releaseブランチに存在しないmainブランチへのプッシュでエラーが発生

### 問題2: ジョブ依存関係の論理矛盾
- **releaseジョブ**が`needs: version`でversionジョブに依存していた
- しかし、versionジョブは「bump versionを含まない」コミットで実行
- releaseジョブは「bump versionを含む」コミットで実行
- この論理的矛盾により、releaseジョブが実行されない状態だった

### 問題3: [skip ci]によるワークフローのスキップ
- L87のバージョン更新コミットメッセージに`[skip ci]`が含まれていた
- バージョン更新コミットがプッシュされてもワークフロー全体がスキップされるため、releaseジョブが実行されなかった

### 問題4: releaseジョブの実行条件が厳しすぎる
- releaseジョブが「bump versionを含む」コミットでのみ実行される設定だった
- これにより、通常のコミットではリリースが作成されず、手動でバージョンを上げないとリリースできない状態だった
- ユーザーの要求: releaseブランチへのコミットは**必ず**リリースにつなげたい

## 要件

### 機能要件

1. **トリガー変更**
   - `.github/workflows/release.yml` のトリガーブランチを `main` から `release` に変更

2. **プッシュ先変更**
   - バージョン更新コミットのプッシュ先を `main` から `release` に変更

### 非機能要件

1. 既存のバージョン自動インクリメント機能は維持
2. ビルドとリリースの自動化機能は維持

## 設計

### 変更箇所

**ファイル**: `.github/workflows/release.yml`

1. **L9: トリガーブランチの変更**
   ```yaml
   # 変更前
   - main

   # 変更後
   - release
   ```

2. **L92: プッシュ先ブランチの変更**
   ```yaml
   # 変更前
   git push origin main

   # 変更後
   git push origin release
   ```

3. **L96: releaseジョブの実行条件**
   ```yaml
   # 変更なし（元の条件のまま）
   release:
     if: ${{ contains(github.event.head_commit.message, 'bump version') }}
   ```
   - versionジョブとreleaseジョブは完全に独立
   - それぞれ異なるコミットで実行される
   - `needs`を使わないため、同時処理の問題なし

4. **L118-127: バージョン情報の取得ステップを追加**
   - package.jsonから直接バージョンを読み取る新しいステップを追加
   - `VERSION`と`TAG`を環境変数に設定

5. **L132-134, L180-183: 環境変数への参照変更**
   - `${{ needs.version.outputs.new_tag }}`を`${{ env.TAG }}`に変更
   - タグ作成とtauri-actionのパラメータで使用

6. **L87: [skip ci]の削除**
   ```yaml
   # 変更前
   git commit -m "chore: bump version to ... [skip ci]"

   # 変更後
   git commit -m "chore: bump version to ..."
   ```

## 実装方針

1. `release.yml` の該当箇所を修正
2. 変更内容を確認
3. コミット前にユーザーに確認を求める

## CD（継続的デリバリー）の動作フロー詳細

### 全体の流れ

```
releaseブランチへのプッシュ
    ↓
versionジョブ実行（バージョン更新）
    ↓
バージョン更新コミットをreleaseブランチにプッシュ
    ↓
releaseジョブ実行（ビルド＆リリース）
    ↓
GitHubリリースページに公開
```

### フェーズ1: バージョン更新（versionジョブ）

#### トリガー条件
- **ブランチ**: releaseブランチへのプッシュ
- **条件**: コミットメッセージに`bump version`を**含まない**
  ```yaml
  if: ${{ !contains(github.event.head_commit.message, 'bump version') }}
  ```

#### 実行内容

1. **リポジトリのチェックアウト**
   - 全履歴を取得（`fetch-depth: 0`）してタグを参照可能にする

2. **最新バージョンの取得とインクリメント**
   - Gitタグから最新バージョンを取得（例: `v0.1.5`）
   - vプレフィックスを除去（例: `0.1.5`）
   - バージョンをパース（MAJOR.MINOR.PATCH）
   - PATCHバージョンをインクリメント（例: `0.1.5` → `0.1.6`）
   - 新しいタグを生成（例: `v0.1.6`）

3. **バージョンファイルの更新**
   - `package.json`の`version`フィールドを更新
   - `src-tauri/tauri.conf.json`の`version`フィールドを更新
   - `src-tauri/Cargo.toml`の`version`フィールドを更新

4. **変更のコミットとプッシュ**
   - 3つのファイルをステージング
   - コミットメッセージ: `chore: bump version to X.Y.Z`
   - releaseブランチにプッシュ
   - **重要**: このコミットメッセージに`bump version`が含まれるため、次のプッシュでreleaseジョブがトリガーされる

### フェーズ2: ビルドとリリース（releaseジョブ）

#### トリガー条件
- **ブランチ**: releaseブランチへのプッシュ
- **条件**: コミットメッセージに`bump version`を**含む**
  ```yaml
  if: ${{ contains(github.event.head_commit.message, 'bump version') }}
  ```
- **依存関係**: なし（versionジョブと完全に独立）
- **結果**: バージョン更新コミット後のみビルドが実行される（効率的）

#### 並列実行（マトリックス戦略）

2つのプラットフォームで並列にビルド:
- **Windows**: `windows-latest` / `x86_64-pc-windows-msvc`
- **Linux**: `ubuntu-22.04` / `x86_64-unknown-linux-gnu`

#### 各プラットフォームでの実行内容

1. **リポジトリのチェックアウト**
   - デフォルトの履歴深度でチェックアウト

2. **バージョン情報の取得**
   - `package.json`から現在のバージョンを読み取る
   - バージョン番号（例: `0.1.6`）とタグ（例: `v0.1.6`）を環境変数に設定
   - `VERSION`: バージョン番号
   - `TAG`: vプレフィックス付きタグ

3. **新しいタグの作成とプッシュ**
   - ローカルでGitタグを作成
   - リモートにタグをプッシュ
   - このタグがGitHubリリースに使用される

4. **開発環境のセットアップ**
   - **Node.js 20**のセットアップ
   - **Rust**のセットアップ（ターゲットプラットフォーム指定）
   - Rustキャッシュの有効化（ビルド高速化）

5. **Linuxのみ: システム依存関係のインストール**
   ```bash
   libwebkit2gtk-4.1-dev
   libappindicator3-dev
   librsvg2-dev
   patchelf
   libssl-dev
   ```

6. **依存関係のインストール**
   - `npm ci`で依存関係をインストール

7. **フロントエンドのビルド**
   - `npm run build`でSolidJSアプリをビルド

8. **Tauriアプリのビルドとリリース**
   - `tauri-apps/tauri-action@v0`を使用
   - **生成される成果物**:
     - **Windows**: `.msi`インストーラー、`-setup.exe`セットアップファイル
     - **Linux**: `.AppImage`実行ファイル、`.deb`パッケージ
   - **リリース情報**:
     - タグ名: `${{ env.TAG }}`（例: `v0.1.6`）
     - リリース名: `VDI-solid ${{ env.TAG }}`
     - リリース本文: ダウンロードリンクと説明
     - ドラフト: `false`（即座に公開）
     - プレリリース: `false`（正式リリース）

### 成果物の公開

両プラットフォームのビルドが完了すると、GitHubのリリースページに以下が公開される:

- **リリースタグ**: `v0.1.6`
- **リリースタイトル**: `VDI-solid v0.1.6`
- **添付ファイル**:
  - `VDI-solid_0.1.6_x64.msi`
  - `VDI-solid_0.1.6_x64-setup.exe`
  - `vdi-solid_0.1.6_amd64.AppImage`
  - `vdi-solid_0.1.6_amd64.deb`

### 重要な注意事項

1. **無限ループの防止**
   - versionジョブは`bump version`を**含まない**コミットで実行
   - releaseジョブは`bump version`を**含む**コミットで実行
   - releaseジョブはコミットをプッシュしない
   - バージョン更新コミット（`bump version`を含む）がプッシュされると：
     - versionジョブがスキップされる（条件falseのため）
     - releaseジョブのみが実行される（条件trueのため）
   - releaseジョブが終了してもコミットがないため、ワークフローは終了
   - この仕組みにより、無限ループを防ぐ

2. **`[skip ci]`を使用しない理由**
   - 以前は`[skip ci]`を使用して無限ループを防いでいた
   - しかし、これによりreleaseジョブもスキップされてしまう
   - 現在は条件分岐により適切に制御

3. **タグの作成タイミング**
   - versionジョブではタグを作成しない
   - releaseジョブでビルド前にタグを作成
   - これにより、ビルドが失敗した場合でもリトライが可能

4. **並列ビルドの利点**
   - WindowsとLinuxのビルドが同時に実行される
   - 全体の実行時間が短縮される
   - 一方が失敗しても他方は継続（`fail-fast: false`）

## 実際の運用例

### ケース1: 通常のリリース

```bash
# 1. releaseブランチに切り替え
git checkout release

# 2. mainブランチの最新の変更をマージ
git merge main

# 3. releaseブランチにプッシュ
git push origin release

# 以降は自動実行される
# - versionジョブが実行され、バージョンが0.1.5 → 0.1.6に更新
# - バージョン更新コミットがプッシュされる
# - releaseジョブが実行され、WindowsとLinuxのビルドが並列実行
# - GitHubリリースページに成果物が公開される
```

**タイムライン例**:
```
00:00 - プッシュ（例: "feat: 新機能追加"）
00:01 - versionジョブ開始
00:02 - バージョン更新完了（0.1.5 → 0.1.6）、コミット＆プッシュ
00:03 - releaseジョブスキップ（「bump version」を含まないため）

# 直後にバージョン更新コミットがトリガーとなる
00:03 - プッシュ（"chore: bump version to 0.1.6"）
00:04 - versionジョブスキップ（「bump version」を含むため）
00:04 - releaseジョブ開始（条件を満たすため実行）
00:11 - Windowsビルド完了（約7分）
00:13 - Linuxビルド完了（約9分）
00:14 - GitHubリリースページに公開（v0.1.6）
```

**効率化のポイント**: バージョン更新後の1回のみビルドが実行されるため、計算リソースを無駄にしません。

### ケース2: 緊急のホットフィックス

```bash
# 1. releaseブランチで直接修正
git checkout release
# 修正作業...
git add .
git commit -m "fix: 緊急バグ修正"
git push origin release

# 自動的にリリースプロセスが開始
```

### ケース3: ビルドが失敗した場合

releaseジョブでビルドが失敗した場合:

```bash
# 1. 問題を修正
git checkout release
# 修正作業...
git add .
git commit -m "fix: ビルドエラーを修正"

# 2. プッシュ
git push origin release

# versionジョブが再度実行され、0.1.6 → 0.1.7にインクリメント
# releaseジョブが実行され、正常にリリース
```

### ケース4: バージョンを手動で調整したい場合

マイナーバージョンやメジャーバージョンを上げたい場合:

```bash
# 1. releaseブランチで手動でバージョンを変更
git checkout release

# package.json、tauri.conf.json、Cargo.tomlを手動編集
# 例: 0.1.6 → 0.2.0

git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "chore: bump version to 0.2.0"
git push origin release

# 注意: このコミットメッセージには "bump version" が含まれるため、
# releaseジョブが実行される（versionジョブはスキップ）
```

## トラブルシューティング

### 問題: versionジョブもreleaseジョブも実行されない

**原因**: コミットメッセージに`[skip ci]`や`[ci skip]`が含まれている

**解決策**: コミットメッセージから`[skip ci]`を削除してプッシュ

### 問題: versionジョブは実行されるがreleaseジョブがスキップされる

**原因1**: バージョン更新コミットのメッセージに`bump version`が含まれていない

**解決策**: ワークフローのL87を確認し、正しいコミットメッセージを使用しているか確認

**原因2**: コミットメッセージに`[skip ci]`が含まれている

**解決策**: L87から`[skip ci]`を削除

### 問題: releaseジョブが実行されるがビルドが失敗する

**原因**: 依存関係の問題、コードのエラー、環境の問題など

**解決策**:
1. GitHub Actionsのログでエラーメッセージを確認
2. 問題を修正してプッシュ（新しいバージョンでリリースが再実行される）

### 問題: タグが重複してエラーになる

**原因**: 既に同じタグが存在する

**解決策**:
```bash
# ローカルとリモートのタグを削除
git tag -d v0.1.6
git push origin :refs/tags/v0.1.6

# 再度プッシュ
git push origin release
```

## テスト計画

1. release ブランチにプッシュして、ワークフローがトリガーされることを確認
2. バージョンが自動的にインクリメントされることを確認
3. ビルドとリリースが正常に実行されることを確認
4. GitHubリリースページに成果物が公開されることを確認
5. ダウンロードしたインストーラーが正常に動作することを確認
