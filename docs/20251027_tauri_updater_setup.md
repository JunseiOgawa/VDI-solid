# Tauri アップデート配信（latest.json）導入ガイド

本ドキュメントは、VDI-solid（Tauri v2）でアプリの自己更新を実現するために必要な設定・ワークフロー・運用手順をまとめたものです。GitHub Releases の「最新リリース（releases/latest）」に `latest.json` を公開し、アプリがそこから更新情報を取得します。

- 対象: Windows（必要に応じて他プラットフォームも拡張可能）
- 方式: Tauri Updater（署名付きアップデータ成果物 + latest.json）
- 配信先: GitHub Releases（`https://github.com/<OWNER>/<REPO>/releases/latest/download/latest.json`）

---

## 1. 仕組みの全体像

Tauri Updater では、以下の3点が重要です。

1) アップデータ成果物（zip 形式）
   - 通常のインストーラ（MSI / NSIS）とは別に、アップデータ用の zip がビルドされます。
   - `src-tauri/tauri.conf.json` の `bundle.createUpdaterArtifacts: true` で生成されます。

2) 署名（.sig）
   - 各アップデータ成果物（zip）に対して、秘密鍵で署名された `.sig` ファイルを生成します。
   - アプリ側は公開鍵（pubkey）を組み込み、ダウンロードした zip の真正性を検証します。

3) latest.json
   - 現在の最新バージョン・配布 URL・署名などを記載したマニフェストです。
   - 例（Windows x64 の最小構成）:
     ```json
     {
       "version": "0.2.8",
       "notes": "Automatic update for v0.2.8",
       "pub_date": "2025-10-27T00:00:00Z",
       "platforms": {
         "windows-x86_64": {
           "url": "https://github.com/JunseiOgawa/VDI-solid/releases/download/v0.2.8/vdi-solid_0.2.8_x64_en-US.zip",
           "signature": "<対応する .sig の中身>"
         }
       }
     }
     ```

---

## 2. 事前準備（鍵の生成とSecrets設定）

1) アップデータ用の鍵（公開鍵/秘密鍵ペア）を生成します。
   - Tauri CLI（v2）を利用します。
   - 実行例（どれか一つの方法でOK）:
     ```bash
     # 1) npx を使う
     npx @tauri-apps/cli signer generate

     # 2) 既存の npm scripts がある場合
     npm run tauri signer generate

     # 3) グローバルに CLI インストール済みなら
     tauri signer generate
     ```
   - 生成時に表示される "Public Key" と、保存される秘密鍵（およびパスワード）を控えておきます。

2) GitHub リポジトリの Secrets を設定します。
   - リポジトリ設定 > Secrets and variables > Actions > New repository secret
   - 追加:
     - `TAURI_PRIVATE_KEY`: 生成した秘密鍵（必要に応じて Base64 化してください）
     - `TAURI_KEY_PASSWORD`: 秘密鍵にパスワードを設定した場合はその値（未設定なら空で可）

3) アプリ側設定に公開鍵（pubkey）を埋め込みます。
   - `src-tauri/tauri.conf.json` の `bundle.updater.pubkey` に手順1で得た Public Key を設定します。

---

## 3. Tauri 設定（tauri.conf.json）

本リポジトリでは、以下のように設定しています（抜粋）。

```json
{
  "bundle": {
    "createUpdaterArtifacts": true,
    "updater": {
      "active": false,
      "endpoints": [
        "https://github.com/JunseiOgawa/VDI-solid/releases/latest/download/latest.json"
      ],
      "pubkey": "<あなたの公開鍵に置換>"
    }
  }
}
```

- 運用開始時は `active: true` に変更してください（公開鍵と `latest.json` の配信が整った後）。
- `endpoints` は GitHub Releases の "最新リリース" に常に追従する固定 URL です。
- `createUpdaterArtifacts: true` により、`src-tauri/target/release/bundle/updater/` 配下に zip と sig が生成されます。

---

## 4. GitHub Actions（release.yml）の要点

`.github/workflows/release.yml` を以下の方針で更新済みです。

- ビルド時に秘密鍵（Secrets）を環境変数で供給
  ```yaml
  env:
    TAURI_PRIVATE_KEY: ${{ secrets.TAURI_PRIVATE_KEY }}
    TAURI_KEY_PASSWORD: ${{ secrets.TAURI_KEY_PASSWORD }}
  ```

- ビルド後に PowerShell で `latest.json` を生成
  - `src-tauri/target/release/bundle/updater/**/*.zip` を検出
  - 対応する `.sig` を読み取って `latest.json` を作成

- リリースに以下を同梱
  - MSI / NSIS インストーラ
  - アップデータ成果物（zip / sig）
  - `latest.json`

- `latest.json` は `releases/latest/download/latest.json` で常に最新を取得可能
  - アプリは `endpoints` の URL を参照して更新情報を取得

> 補足: 現在 `bundle.updater.active` は false です。Secrets の登録と公開鍵の設定が完了したら `true` に変更してください。

---

## 5. アプリ側（更新チェックの実装）

Tauri v2 では、標準の Updater 機能または公式プラグイン（`@tauri-apps/plugin-updater`）を利用します。UI から明示的にチェックしたい場合はプラグインを導入します。

- 例（フロントエンド）:
  ```ts
  import { check, install, onUpdaterEvent } from '@tauri-apps/plugin-updater'

  async function runUpdate() {
    const info = await check() // latest.json を取得して差分を判断
    if (info?.available) {
      onUpdaterEvent(({ event, payload }) => {
        console.log('updater:', event, payload) // ダウンロード進捗など
      })
      await install() // ダウンロード＆適用
    }
  }
  ```

必要に応じて、アプリ起動時の自動チェックやメニュー/UI ボタンでの手動更新などを実装してください。

---

## 6. リリース手順（運用フロー）

1) バージョンを更新（例: `0.2.9`）
2) タグを作成して push（`v0.2.9`）
3) GitHub Actions がビルド／署名／`latest.json` 生成／リリース公開
4) エンドユーザのアプリが `latest.json` を参照し、更新を検知

> 重要: `active: true` にするのはSecretsと公開鍵の設定が完了し、`latest.json` の配信が整った後にしてください。

---

## 7. よくあるハマりどころ（トラブルシュート）

- ビルドに署名情報が入らない / `.sig` が生成されない
  - `TAURI_PRIVATE_KEY` / `TAURI_KEY_PASSWORD` が Actions Secrets に未登録、もしくは誤り
  - `bundle.updater.pubkey` が未設定
  - `createUpdaterArtifacts` が `true` になっていない

- `latest.json` でダウンロード URL が 404
  - リリースに zip をアップロードしているか確認
  - ファイル名と `latest.json` の `url` が一致しているか確認

- アプリが更新を検知しない
  - `endpoints` の URL が正しいか
  - `bundle.updater.active` が `true` か
  - アプリのバージョン（`tauri.conf.json` の `version`）が `latest.json` の `version` より古いか

- 署名検証エラー
  - `latest.json.signature` とアップロードされた `.sig` の内容が一致しているか
  - アプリに埋め込んだ `pubkey` が正しいか

---

## 8. 次に行うこと（あなたがやるべきこと）

- [ ] Tauri CLI で鍵ペアを生成（公開鍵/秘密鍵）
- [ ] 公開鍵を `src-tauri/tauri.conf.json` の `bundle.updater.pubkey` に設定
- [ ] リポジトリ Secrets に `TAURI_PRIVATE_KEY` / `TAURI_KEY_PASSWORD` を登録
- [ ] `bundle.updater.active` を `true` に変更
- [ ] 新しいバージョンタグ（`vX.Y.Z`）をプッシュして動作確認

---

## 9. 参考（最新仕様）

- Tauri v2 Config（`bundle.createUpdaterArtifacts` / `bundle.updater`）
- 公式 Updater プラグイン: `@tauri-apps/plugin-updater`
- GitHub Releases（`releases/latest/download/latest.json` の固定 URL）

本ガイドは Tauri v2 系の一般的な運用に基づいています。詳細や仕様変更は公式ドキュメントをご参照ください。
