# アップデート署名とビルド手順

## 概要

Tauri v2のアップデーター機能はセキュリティのため、全ての更新ファイルに署名が必須です。このドキュメントでは、署名キーの生成、ビルド時の設定、更新ファイルの配布方法について説明します。

## 署名キーの生成

### 初回のみ実行

署名用のキーペアを生成します。このコマンドは一度だけ実行してください。

```bash
npm run tauri signer generate -- -w ~/.tauri/vdi-solid.key
```

このコマンドにより以下のファイルが生成されます:

- `~/.tauri/vdi-solid.key`: 秘密鍵（絶対に公開しないこと）
- `~/.tauri/vdi-solid.key.pub`: 公開鍵（`tauri.conf.json`に設定済み）

### 重要な注意事項

1. **秘密鍵は絶対にGitリポジトリにコミットしない**
2. **秘密鍵を紛失すると、既存ユーザーに更新を配信できなくなる**
3. **秘密鍵は安全な場所にバックアップを保管する**

## ビルド手順

### 開発環境でのビルド

#### Windows (PowerShell)

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content ~/.tauri/vdi-solid.key -Raw
npm run tauri:build
```

または、秘密鍵ファイルのパスを指定:

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY_PATH = "$HOME/.tauri/vdi-solid.key"
npm run tauri:build
```

#### macOS / Linux

```bash
export TAURI_SIGNING_PRIVATE_KEY=$(cat ~/.tauri/vdi-solid.key)
npm run tauri:build
```

または、秘密鍵ファイルのパスを指定:

```bash
export TAURI_SIGNING_PRIVATE_KEY_PATH=~/.tauri/vdi-solid.key
npm run tauri:build
```

### CI/CDでのビルド

GitHub ActionsなどのCI/CD環境では、秘密鍵をシークレットとして保存します。

#### GitHub Actions設定例

1. リポジトリのSettings > Secrets and variables > Actions
2. 新しいシークレットを追加:
   - Name: `TAURI_SIGNING_PRIVATE_KEY`
   - Value: 秘密鍵ファイルの内容

3. ワークフローファイル (`.github/workflows/build.yml`)の例:

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install dependencies
        run: npm ci

      - name: Build Tauri app
        env:
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
        run: npm run tauri:build
```

## 生成されるファイル

ビルド成功後、以下のファイルが生成されます:

### Windows
- `src-tauri/target/release/bundle/msi/vdi-solid_0.2.11_x64_en-US.msi`
- `src-tauri/target/release/bundle/msi/vdi-solid_0.2.11_x64_en-US.msi.zip`
- `src-tauri/target/release/bundle/msi/vdi-solid_0.2.11_x64_en-US.msi.zip.sig`

### macOS
- `src-tauri/target/release/bundle/dmg/vdi-solid_0.2.11_universal.dmg`
- `src-tauri/target/release/bundle/dmg/vdi-solid_0.2.11_universal.dmg.tar.gz`
- `src-tauri/target/release/bundle/dmg/vdi-solid_0.2.11_universal.dmg.tar.gz.sig`

### Linux
- `src-tauri/target/release/bundle/appimage/vdi-solid_0.2.11_amd64.AppImage`
- `src-tauri/target/release/bundle/appimage/vdi-solid_0.2.11_amd64.AppImage.tar.gz`
- `src-tauri/target/release/bundle/appimage/vdi-solid_0.2.11_amd64.AppImage.tar.gz.sig`

## 更新サーバーのセットアップ

### GitHub Releasesを使用する場合

1. 新しいリリースを作成
2. 以下のファイルをアップロード:
   - インストーラーファイル（`.msi.zip`, `.dmg.tar.gz`, `.AppImage.tar.gz`）
   - 署名ファイル（`.sig`）
   - `latest.json`（手動作成）

### latest.jsonの作成例

```json
{
  "version": "0.2.12",
  "notes": "新機能の追加とバグ修正\n\n- 機能A追加\n- バグB修正",
  "pub_date": "2025-10-27T12:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "url": "https://github.com/junseinagao/VDI-solid/releases/download/v0.2.12/vdi-solid_0.2.12_x64_en-US.msi.zip",
      "signature": "<.sigファイルの内容をここに貼り付け>"
    },
    "darwin-universal": {
      "url": "https://github.com/junseinagao/VDI-solid/releases/download/v0.2.12/vdi-solid_0.2.12_universal.dmg.tar.gz",
      "signature": "<.sigファイルの内容をここに貼り付け>"
    },
    "linux-x86_64": {
      "url": "https://github.com/junseinagao/VDI-solid/releases/download/v0.2.12/vdi-solid_0.2.12_amd64.AppImage.tar.gz",
      "signature": "<.sigファイルの内容をここに貼り付け>"
    }
  }
}
```

### 署名ファイルの内容取得

Windows PowerShell:
```powershell
Get-Content src-tauri/target/release/bundle/msi/vdi-solid_0.2.12_x64_en-US.msi.zip.sig -Raw
```

macOS / Linux:
```bash
cat src-tauri/target/release/bundle/dmg/vdi-solid_0.2.12_universal.dmg.tar.gz.sig
```

## トラブルシューティング

### エラー: "No signature found"

環境変数`TAURI_SIGNING_PRIVATE_KEY`または`TAURI_SIGNING_PRIVATE_KEY_PATH`が設定されていません。上記のビルド手順を確認してください。

### エラー: "Invalid signature"

公開鍵と秘密鍵が一致していません。キーペアを再生成するか、正しい秘密鍵を使用してください。

### エラー: ".env file not working on Windows"

Windowsでは`.env`ファイルが機能しません。PowerShellで直接環境変数を設定してください。

## 参考資料

- [Tauri v2 Updater Plugin公式ドキュメント](https://v2.tauri.app/ja/plugin/updater/)
- [Tauri Signing公式ガイド](https://v2.tauri.app/reference/cli/signer/)
