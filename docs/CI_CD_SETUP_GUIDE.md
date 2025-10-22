# CI/CD セットアップガイド

## 概要

このプロジェクトでは、GitHub Actionsを使用してリリースプロセスを自動化しています。

## リリースワークフロー

### トリガー方式

**Git Tagベース**: `v*`パターンのタグがプッシュされたときにリリースが作成されます。

```yaml
on:
  push:
    tags:
      - 'v*'  # 例: v0.1.7, v1.0.0
```

### ビルド対象プラットフォーム

- **Windows** (x64): `.msi`インストーラー、`-setup.exe`セットアップファイル
- **Linux** (x64): `.AppImage`実行ファイル、`.deb`パッケージ

両プラットフォームのビルドは並列で実行されます（約10分）。

## リリース手順

### 1. 開発作業

通常通りmainブランチで開発を行います。

```bash
git checkout main
# 開発作業...
git add .
git commit -m "feat: 新機能追加"
git push origin main
```

### 2. リリース準備

リリースするバージョンを決定し、自動更新スクリプトでバージョンを更新します。

#### 自動バージョン更新（推奨）

以下のコマンドで`package.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml`の3つのファイルを一度に更新できます：

```bash
npm run version:update 0.1.7
```

スクリプトが自動的に以下を実行します：
- `package.json`のバージョン更新
- `src-tauri/tauri.conf.json`のバージョン更新
- `src-tauri/Cargo.toml`のバージョン更新
- 次のステップの案内表示

変更をコミットしてプッシュ：

```bash
git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "chore: bump version to 0.1.7"
git push origin main
```

#### 手動バージョン更新（非推奨）

<details>
<summary>必要に応じて手動で更新することもできます（クリックして展開）</summary>

以下のファイルを手動で更新：

- `package.json`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`

```json
// package.json
{
  "version": "0.1.7"
}
```

```json
// src-tauri/tauri.conf.json
{
  "version": "0.1.7"
}
```

```toml
# src-tauri/Cargo.toml
[package]
version = "0.1.7"
```

</details>

### 3. タグの作成とプッシュ

バージョンに対応するタグを作成してプッシュします：

```bash
# タグを作成（vプレフィックスを付ける）
git tag v0.1.7

# タグをリモートにプッシュ
git push origin v0.1.7
```

**重要**: タグ名は必ず`v`で始めてください（例: `v0.1.7`, `v1.0.0`）

### 4. 自動ビルド＆リリース

タグがプッシュされると、GitHub Actionsが自動的に：

1. Windows・Linux向けにアプリをビルド
2. GitHubリリースページを作成
3. ビルド成果物を添付

約10分後、[リリースページ](https://github.com/JunseiOgawa/VDI-solid/releases)に新しいリリースが公開されます。

## バージョニング規則

セマンティックバージョニング（`MAJOR.MINOR.PATCH`）を採用：

- **PATCH** (`0.1.6` → `0.1.7`): バグ修正、小さな改善
- **MINOR** (`0.1.7` → `0.2.0`): 新機能追加（後方互換性あり）
- **MAJOR** (`0.2.0` → `1.0.0`): 破壊的変更

### 例

```bash
# パッチバージョンアップ（バグ修正）
git tag v0.1.7
git push origin v0.1.7

# マイナーバージョンアップ（新機能）
git tag v0.2.0
git push origin v0.2.0

# メジャーバージョンアップ（破壊的変更）
git tag v1.0.0
git push origin v1.0.0
```

## よくある問題と解決方法

### ワークフローが実行されない

**原因**: タグのパターンが`v*`と一致しない

**解決方法**: タグ名は必ず`v`で始めてください

```bash
# ✗ 間違い
git tag 0.1.7

# ✓ 正しい
git tag v0.1.7
```

### タグを間違えた場合

ローカルとリモートのタグを削除して、正しいタグを作成し直します：

```bash
# ローカルのタグを削除
git tag -d v0.1.7

# リモートのタグを削除
git push origin :refs/tags/v0.1.7

# 正しいタグを作成
git tag v0.1.8
git push origin v0.1.8
```

### ビルドが失敗した場合

1. [GitHub Actionsページ](https://github.com/JunseiOgawa/VDI-solid/actions)でログを確認
2. エラーを修正してコミット
3. 新しいバージョンでタグを作成（例: `v0.1.8`）

```bash
# 問題を修正
git add .
git commit -m "fix: ビルドエラーを修正"
git push origin main

# バージョンファイルを更新
# package.json, tauri.conf.json, Cargo.toml → 0.1.8

git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "chore: bump version to 0.1.8"
git push origin main

# 新しいタグで再度リリース
git tag v0.1.8
git push origin v0.1.8
```

### リリースが重複してしまう場合

**原因**: 既に存在するタグを再度プッシュした

**解決方法**: 常に新しいバージョン番号を使用してください。同じバージョンでリリースを更新したい場合は、タグを削除してから再度作成します。

## クイックリファレンス

### 通常のリリース手順（まとめ）

```bash
# 1. バージョンを自動更新
npm run version:update 0.1.7

# 2. コミット
git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml
git commit -m "chore: bump version to 0.1.7"
git push origin main

# 3. タグを作成してプッシュ
git tag v0.1.7
git push origin v0.1.7

# → 自動的にリリースが作成される（約10分）
```

## ワークフローファイル

`.github/workflows/release.yml`

このファイルでリリースプロセスが定義されています。変更する必要がある場合は、GitHub Actionsのドキュメントを参照してください。

## 参考リンク

- [GitHub Actions ドキュメント](https://docs.github.com/ja/actions)
- [Tauri アクション](https://github.com/tauri-apps/tauri-action)
- [セマンティックバージョニング](https://semver.org/lang/ja/)
