# Tauri Updater セットアップチェックリスト

このチェックリストを使用して、Tauri Updaterのセットアップが正しく完了しているか確認してください。

## 事前準備

- [ ] Node.js 20以上がインストールされている
- [ ] Rust 1.70以上がインストールされている
- [ ] GitHubリポジトリへのアクセス権限がある

## 鍵の生成と設定

- [ ] 公開鍵・秘密鍵のペアを生成済み
- [ ] 秘密鍵を安全な場所に保存（`~/.tauri/vdi-solid.key`）
- [ ] 公開鍵をコピー済み
- [ ] `.gitignore`に`*.key`を追加済み

### 鍵のバックアップ（重要！）

- [ ] 秘密鍵をバックアップ済み（最低2箇所）
  - [ ] ローカルバックアップ（暗号化推奨）
  - [ ] パスワードマネージャーまたは暗号化されたクラウドストレージ
- [ ] 鍵の保存場所をドキュメント化済み
- [ ] パスワードを安全に保管済み（パスワード保護を使用した場合）

## Tauri設定

### src-tauri/tauri.conf.json

- [ ] `bundle.createUpdaterArtifacts`を`true`に設定
- [ ] `plugins.updater.active`を`true`に設定
- [ ] `plugins.updater.pubkey`に公開鍵を設定
- [ ] `plugins.updater.endpoints`のURLが正しい

## GitHub設定

- [ ] GitHub Secretsに`TAURI_SIGNING_PRIVATE_KEY`を追加
- [ ] （オプション）`TAURI_SIGNING_PRIVATE_KEY_PASSWORD`を追加（パスワード設定時）

## GitHub Actionsワークフロー

### .github/workflows/release.yml

- [ ] ビルドステップに環境変数を追加
  - `TAURI_SIGNING_PRIVATE_KEY`
  - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`（オプション）
- [ ] 署名ファイル（`.sig`）のアップロードを追加
- [ ] `latest.json`生成・アップロードステップを追加

## バージョン管理

- [ ] `package.json`のバージョンを更新
- [ ] `src-tauri/Cargo.toml`のバージョンを更新
- [ ] `src-tauri/tauri.conf.json`のバージョンを更新
- [ ] 3つのファイルのバージョンが一致している

## リリーステスト

- [ ] タグを作成してプッシュ
- [ ] GitHub Actionsが正常に完了
- [ ] リリースページに以下がアップロードされている：
  - [ ] Windowsインストーラー（`.msi`または`.exe`）
  - [ ] Windows署名ファイル（`.msi.zip.sig`または`.nsis.zip.sig`）
  - [ ] Linux AppImage（`.AppImage`）
  - [ ] Linux署名ファイル（`.AppImage.tar.gz.sig`）
  - [ ] Debian パッケージ（`.deb`）
  - [ ] `latest.json`

## 動作確認

- [ ] アプリをビルドして起動
- [ ] 設定メニューから「アップデートを確認」を実行
- [ ] エラーが発生しない
- [ ] 最新版の場合「最新版です」と表示される
- [ ] 新バージョンがある場合、アップデートダイアログが表示される

## トラブルシューティング確認

もしエラーが発生した場合、以下を確認：

- [ ] ブラウザの開発者ツールでコンソールログを確認
- [ ] GitHub Actionsのログを確認
- [ ] `latest.json`の内容を確認
- [ ] 署名ファイルが正しく生成されているか確認
- [ ] 公開鍵と秘密鍵が一致しているか確認

## 完了

すべてのチェックが完了したら、Tauri Updaterのセットアップは完了です！

---

**最終更新**: 2025-10-24
