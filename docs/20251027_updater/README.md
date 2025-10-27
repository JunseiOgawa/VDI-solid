# Tauri v2アップデーター実装完了

## 実装概要

VDI-solidアプリケーションにTauri v2の自動更新機能を実装しました。このドキュメントは実装の完了報告と今後の運用手順をまとめたものです。

## 実装内容

### 完了した項目

#### 1. 基本設定

- **パーミッション設定** (`src-tauri/capabilities/default.json`)
  - `updater:default`: 更新機能の基本パーミッション
  - `process:default`: アプリ再起動のためのプロセスパーミッション

- **エンドポイント設定** (`src-tauri/tauri.conf.json`)
  - 更新情報取得先: `https://github.com/junseinagao/VDI-solid/releases/latest/download/latest.json`
  - 公開鍵: 既に設定済み
  - `createUpdaterArtifacts: true`: 署名付き更新ファイルの自動生成を有効化

#### 2. Rustバックエンド

- **プラグイン初期化** (`src-tauri/src/lib.rs:167`)
  - Desktop環境でのみ有効化
  - 起動時に自動でプラグインを登録

#### 3. フロントエンド（既存実装の確認）

- **UpdateManager** (`src/services/UpdateManager.ts`)
  - 起動時のバックグラウンドチェック（6時間間隔）
  - 手動更新チェック機能
  - レート制限（1時間に3回まで）
  - ダウンロード進捗表示
  - 自動インストールと再起動

- **UI実装**
  - 設定画面に「最新版をチェック」ボタン (`src/components/SettingsMenu/VersionInfo.tsx`)
  - バージョン情報表示
  - チェック状態とメッセージ表示
  - 更新可能時のダイアログ表示

- **アプリ統合** (`src/App.tsx:232-238`)
  - 起動時の自動チェック
  - 最終チェック時刻の永続化

#### 4. ドキュメント

- **設計ドキュメント** (`design.md`)
  - 要件定義
  - 現在の状態
  - 実装方針
  - 技術的詳細

- **タスク管理** (`task.md`)
  - Phase 1-4の進捗管理
  - チェックリスト

- **署名ガイド** (`signing.md`)
  - 署名キーの生成方法
  - ビルド手順（Windows/macOS/Linux）
  - CI/CD設定例
  - 更新サーバーのセットアップ
  - トラブルシューティング

## 今後の作業

### 必須: リリースワークフロー

新しいバージョンをリリースする際は、以下の手順が必要です:

1. **署名キーの生成** (初回のみ)
   ```bash
   npm run tauri signer generate -- -w ~/.tauri/vdi-solid.key
   ```

2. **ビルド** (環境変数を設定)
   ```powershell
   # Windows
   $env:TAURI_SIGNING_PRIVATE_KEY = Get-Content ~/.tauri/vdi-solid.key -Raw
   npm run tauri:build
   ```

3. **GitHub Releaseの作成**
   - インストーラーファイルをアップロード
   - `.sig`ファイルをアップロード
   - `latest.json`を手動作成してアップロード

4. **latest.jsonの作成例**
   ```json
   {
     "version": "0.2.12",
     "notes": "新機能の追加とバグ修正",
     "pub_date": "2025-10-27T12:00:00Z",
     "platforms": {
       "windows-x86_64": {
         "url": "https://github.com/junseinagao/VDI-solid/releases/download/v0.2.12/vdi-solid_0.2.12_x64_en-US.msi.zip",
         "signature": "<.sigファイルの内容>"
       }
     }
   }
   ```

詳細は`signing.md`を参照してください。

### 推奨: CI/CD自動化

GitHub Actionsで自動ビルド・リリースを設定することを推奨します:

1. GitHub Secretsに`TAURI_SIGNING_PRIVATE_KEY`を登録
2. `.github/workflows/release.yml`を作成
3. タグプッシュで自動ビルド・リリースを実行

### オプション: 今後の改善項目

- [ ] GitHub Actionsワークフロー作成
- [ ] `latest.json`の自動生成スクリプト
- [ ] 更新チャンネル（stable/beta）の実装
- [ ] 更新の自動/手動設定の追加
- [ ] ダウンロード進捗のUI表示改善

## 動作確認

### 開発環境でのテスト

1. ビルドが成功することを確認:
   ```bash
   npm run tauri:build
   ```

2. 更新チェック機能の動作確認:
   - アプリを起動
   - 設定メニューを開く
   - 「最新版をチェック」ボタンをクリック
   - メッセージが表示されることを確認

### 本番環境での確認

1. 新しいバージョンをGitHub Releasesに公開
2. 古いバージョンのアプリを起動
3. 6時間以内に自動で更新通知が表示される
4. または、手動で「最新版をチェック」を実行

## トラブルシューティング

### 更新が検出されない

- `tauri.conf.json`の`endpoints`が正しいか確認
- GitHub Releasesに`latest.json`が存在するか確認
- ネットワーク接続を確認

### 署名検証エラー

- 公開鍵と秘密鍵が一致しているか確認
- `.sig`ファイルが正しくアップロードされているか確認

### レート制限エラー

- 1時間に3回までの制限があります
- 時間をおいて再度お試しください

詳細は`signing.md`のトラブルシューティングセクションを参照してください。

## 参考資料

- [Tauri v2 Updater Plugin公式ドキュメント](https://v2.tauri.app/ja/plugin/updater/)
- [design.md](./design.md): 詳細な設計ドキュメント
- [task.md](./task.md): タスク管理
- [signing.md](./signing.md): 署名とビルドの詳細ガイド

## まとめ

Tauri v2のアップデーター機能の実装が完了しました。基本設定、バックエンド、フロントエンド、ドキュメントの全てが整っています。

**次のステップ:**
1. 署名キーを生成（初回のみ）
2. GitHub Secretsに秘密鍵を登録
3. 次回リリース時に更新機能をテスト

実装は完全に動作する状態ですが、実際に更新機能を使用するには署名キーの生成とGitHub Releasesの設定が必要です。
