# Tauri v2アップデーター実装

## 目的

VDI-solidアプリケーションに自動更新機能を実装し、ユーザーが最新バージョンを簡単に入手できるようにする。

## 要件

### 機能要件

1. アプリ起動時に新しいバージョンをチェック
2. 新バージョンが利用可能な場合、ダウンロードとインストールを実行
3. インストール後にアプリケーションを再起動
4. 署名検証によるセキュアな更新
5. ユーザーへの通知とダウンロード進捗表示

### 非機能要件

1. セキュリティ: 全ての更新ファイルは署名検証が必須
2. プラットフォーム対応: Windows、macOS、Linux
3. エラーハンドリング: ネットワークエラーや検証失敗に対応

## 現在の状態

### 完了している項目

1. ✅ プラグインの依存関係追加
   - `@tauri-apps/plugin-updater` (JavaScript)
   - `@tauri-apps/plugin-process` (JavaScript)
   - Cargo.tomlにRust側の依存関係追加

2. ✅ 基本設定
   - `tauri.conf.json`に`updater`セクション追加
   - 公開鍵の設定
   - `createUpdaterArtifacts: true`の設定

3. ✅ Rustプラグインの初期化
   - `lib.rs`の`setup`関数内でプラグイン登録済み

### 未完了の項目

1. ❌ エンドポイントの設定
   - `tauri.conf.json`の`updater.endpoints`が未設定
   - 更新情報を提供するサーバーのURL設定が必要

2. ❌ パーミッション設定
   - `capabilities/default.json`に`updater:default`パーミッションが未追加

3. ❌ フロントエンド実装
   - 更新チェックロジックの実装
   - UIでの通知表示
   - ダウンロード進捗表示

4. ❌ 署名関連のドキュメント
   - 秘密鍵の保管場所
   - ビルド時の環境変数設定方法
   - 更新ファイルの署名方法

## 実装方針

### Phase 1: 基本設定の完了

1. パーミッション追加
2. エンドポイント設定（開発用とプロダクション用）
3. 署名ドキュメント作成

### Phase 2: フロントエンド実装

1. アプリ起動時の更新チェック
2. 設定画面に「更新確認」ボタン追加
3. 更新通知UIの実装
4. ダウンロード進捗表示

### Phase 3: テストと検証

1. ローカル更新サーバーでのテスト
2. 署名検証のテスト
3. 各プラットフォームでの動作確認

## 技術的詳細

### エンドポイント設計

更新サーバーは以下の形式でJSONを返す必要がある:

```json
{
  "version": "0.2.12",
  "notes": "新機能の追加とバグ修正",
  "pub_date": "2025-10-27T00:00:00Z",
  "url": "https://example.com/vdi-solid-0.2.12.tar.gz",
  "signature": "署名ファイルの内容"
}
```

動的変数:
- `{{current_version}}`: 現在のバージョン (例: 0.2.11)
- `{{target}}`: OS (windows, darwin, linux)
- `{{arch}}`: アーキテクチャ (x86_64, aarch64など)

### 署名フロー

1. キーペア生成: `npm run tauri signer generate -- -w ~/.tauri/vdi-solid.key`
2. ビルド時に環境変数設定: `TAURI_SIGNING_PRIVATE_KEY`
3. ビルド時に自動的に`.sig`ファイルが生成される
4. 更新JSONに`.sig`ファイルの内容を含める

### フロントエンド実装イメージ

```typescript
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

async function checkForUpdates() {
  const update = await check();
  if (update) {
    console.log(`新バージョン ${update.version} が利用可能です`);

    await update.downloadAndInstall((event) => {
      if (event.event === 'Started') {
        console.log(`ダウンロード開始: ${event.data.contentLength}バイト`);
      } else if (event.event === 'Progress') {
        console.log(`進捗: ${event.data.chunkLength}バイト受信`);
      }
    });

    await relaunch();
  }
}
```

## リスク

1. 更新サーバーの運用コスト
2. 秘密鍵の管理とセキュリティ
3. ネットワークエラーへの対応
4. 部分的なダウンロードからの復帰

## 今後の検討事項

1. 自動更新のオン/オフ設定
2. 更新チェックの頻度設定
3. GitHub Releasesとの統合
4. ベータ版チャンネルの追加
