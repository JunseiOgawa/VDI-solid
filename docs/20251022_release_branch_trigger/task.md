# Release ブランチトリガーへの変更 - タスクリスト

## タスク一覧

### 1. ドキュメント作成
- [x] design.md の作成
- [x] task.md の作成

### 2. ワークフロー修正（第1回）
- [x] release.yml のトリガーブランチを release に変更（L9）
- [x] release.yml のプッシュ先を release に変更（L92）

### 3. 確認
- [x] 変更内容の確認
- [x] ユーザーへの確認依頼

### 4. バグ修正（第2回）
- [x] L92のプッシュ先が残っていた問題を修正
- [x] releaseジョブが実行されない問題を調査
- [x] ジョブ依存関係の論理矛盾を特定
- [x] `needs: version`を削除（L97）
- [x] バージョン情報取得ステップを追加（L118-127）
- [x] 環境変数への参照を変更（L132-134, L180-183）
- [x] コメント番号の整合性を修正

### 5. ドキュメント更新
- [x] design.mdに発見された問題を追記
- [x] design.mdに追加の変更箇所を記載
- [x] task.mdに詳細な修正履歴を追記

## 進捗管理

現在の状態: 全ての修正完了、コミット待ち

## 問題と修正の詳細

### 問題1: プッシュ先のブランチ不一致
- **症状**: バージョン更新時に`error: src refspec main does not match any`
- **原因**: L92のプッシュ先が`main`のままだった
- **修正**: `git push origin main`を`git push origin release`に変更

### 問題2: releaseジョブが実行されない
- **症状**: バージョン更新後、releaseビルドが実行されない
- **原因**: releaseジョブが`needs: version`でversionジョブに依存していたが、両ジョブの実行条件が相互排他的
  - versionジョブ: 「bump versionを含まない」コミットで実行
  - releaseジョブ: 「bump versionを含む」コミットで実行
- **修正**:
  1. `needs: version`を削除
  2. package.jsonから直接バージョンを読み取る新しいステップを追加
  3. `needs.version.outputs.new_tag`を`env.TAG`に変更
