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

3. **L97: ジョブ依存関係の削除**
   ```yaml
   # 変更前
   release:
     if: ${{ contains(github.event.head_commit.message, 'bump version') }}
     needs: version

   # 変更後
   release:
     if: ${{ contains(github.event.head_commit.message, 'bump version') }}
   ```

4. **L118-127: バージョン情報の取得ステップを追加**
   - package.jsonから直接バージョンを読み取る新しいステップを追加
   - `VERSION`と`TAG`を環境変数に設定

5. **L132-134, L180-183: 環境変数への参照変更**
   - `${{ needs.version.outputs.new_tag }}`を`${{ env.TAG }}`に変更
   - タグ作成とtauri-actionのパラメータで使用

## 実装方針

1. `release.yml` の該当箇所を修正
2. 変更内容を確認
3. コミット前にユーザーに確認を求める

## テスト計画

1. release ブランチにプッシュして、ワークフローがトリガーされることを確認
2. バージョンが自動的にインクリメントされることを確認
3. ビルドとリリースが正常に実行されることを確認
