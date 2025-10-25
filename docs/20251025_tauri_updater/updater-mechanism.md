# Tauri Updaterの仕組み

## 概要

Tauri Updaterは、デスクトップアプリケーションに自動アップデート機能を提供するプラグインです。署名検証により、悪意のあるアップデートからユーザーを保護します。

## アーキテクチャ

```
┌─────────────────┐
│   ユーザーPC    │
│   (v0.2.3)      │
└────────┬────────┘
         │ 1. アップデートチェック
         ↓
┌─────────────────────────────────────────┐
│   GitHub Release (エンドポイント)        │
│   https://github.com/.../latest.json    │
└────────┬────────────────────────────────┘
         │ 2. latest.jsonを返す
         ↓
┌─────────────────┐
│  latest.json    │  ← バージョン情報、ダウンロードURL、署名
└────────┬────────┘
         │ 3. バージョン比較
         │    (v0.2.4 > v0.2.3)
         ↓
┌─────────────────┐
│  新バージョン   │
│  発見！         │
└────────┬────────┘
         │ 4. インストーラーをダウンロード
         ↓
┌─────────────────────────────────────────┐
│  ダウンロード対象                        │
│  - Windows: .nsis.zip                   │
│  - Linux: .AppImage.tar.gz              │
│  - macOS: .app.tar.gz                   │
└────────┬────────────────────────────────┘
         │ 5. 署名検証
         ↓
┌─────────────────┐
│  署名検証       │  ← pubkeyで.sigファイルを検証
└────────┬────────┘
         │ 6. OK → インストール実行
         ↓
┌─────────────────┐
│  アップデート   │
│  完了           │
└─────────────────┘
```

## 処理フロー詳細

### 1. アップデートチェック

アプリが`check()`関数を呼び出すと、以下の処理が実行されます:

```typescript
// src/services/UpdateManager.ts
const update = await check();
```

内部処理:
1. `tauri.conf.json`の`plugins.updater.endpoints`からURLを取得
2. HTTPSリクエストで`latest.json`を取得
3. 現在のバージョンと比較

### 2. latest.jsonの構造

```json
{
  "version": "v0.2.4",
  "notes": "VDI-solid v0.2.4 がリリースされました",
  "pub_date": "2025-10-25T12:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6...",
      "url": "https://github.com/JunseiOgawa/VDI-solid/releases/download/v0.2.4/vdi-solid_0.2.4_x64-setup.nsis.zip"
    },
    "linux-x86_64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6...",
      "url": "https://github.com/JunseiOgawa/VDI-solid/releases/download/v0.2.4/vdi-solid_0.2.4_amd64.AppImage.tar.gz"
    }
  }
}
```

**重要なフィールド**:
- `version`: 新しいバージョン番号
- `platforms.<プラットフォーム>.url`: インストーラーのダウンロードURL
- `platforms.<プラットフォーム>.signature`: Minisign署名

### 3. プラットフォーム別のファイル形式

| プラットフォーム | ファイル形式 | 説明 |
|----------------|-------------|------|
| **Windows** | `.nsis.zip` | NSIS インストーラーのZIP圧縮版 |
| **Linux** | `.AppImage.tar.gz` | AppImageのtar.gz圧縮版 |
| **macOS** | `.app.tar.gz` | .appバンドルのtar.gz圧縮版 |

**なぜZIP/tar.gzなのか?**
- Updaterは圧縮ファイルをダウンロード
- 展開してからインストーラーを実行
- ダウンロードサイズを削減
- 署名検証がしやすい

### 4. 署名の仕組み

Tauriは[Minisign](https://jedisct1.github.io/minisign/)を使用して署名を検証します。

#### 4.1 鍵ペアの生成（初回のみ）

```bash
# Tauri CLIが自動生成（初回ビルド時）
tauri signer generate -w ~/.tauri/vdi-solid.key
```

生成されるファイル:
- **秘密鍵**: `~/.tauri/vdi-solid.key`（パスワードで暗号化）
- **公開鍵**: Base64文字列（tauri.conf.jsonに記載）

#### 4.2 署名の生成（ビルド時）

```bash
# GitHub Actionsで実行
export TAURI_SIGNING_PRIVATE_KEY="..."
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="..."
npm run tauri build
```

処理:
1. インストーラー（`.nsis.zip`など）を生成
2. 秘密鍵でファイルに署名
3. `.sig`ファイルを生成（署名データ）

生成されるファイル:
- `vdi-solid_0.2.4_x64-setup.nsis.zip` ← インストーラー
- `vdi-solid_0.2.4_x64-setup.nsis.zip.sig` ← 署名ファイル

#### 4.3 署名の検証（アップデート時）

```typescript
// ユーザーのPCで実行
await update.downloadAndInstall();
```

処理:
1. `latest.json`から署名を取得
2. インストーラーをダウンロード
3. `tauri.conf.json`の`pubkey`で署名を検証
4. 検証成功 → インストール実行
5. 検証失敗 → エラーでアップデート中止

**検証の流れ**:
```
ダウンロードファイル + 署名 + 公開鍵 → Minisign検証 → OK/NG
```

### 5. ダウンロードとインストール

#### 5.1 ダウンロードプロセス

```typescript
await update.downloadAndInstall((progress) => {
  if (progress.event === "Started") {
    console.log(`サイズ: ${progress.data.contentLength} bytes`);
  } else if (progress.event === "Progress") {
    console.log(`ダウンロード中: ${progress.data.chunkLength} bytes`);
  } else if (progress.event === "Finished") {
    console.log("ダウンロード完了");
  }
});
```

#### 5.2 インストールプロセス（Windows）

1. `.nsis.zip`をダウンロード
2. 一時ディレクトリに展開
3. NSIS インストーラー（`.exe`）を実行
4. インストーラーがバックグラウンドで実行される
5. アプリを再起動

```typescript
await update.close();  // 現在のアプリを終了
await relaunch();      // 新バージョンで再起動
```

## 設定ファイル

### tauri.conf.json

```json
{
  "version": "0.2.4",
  "bundle": {
    "createUpdaterArtifacts": true  // ← updater用ファイルを生成
  },
  "plugins": {
    "updater": {
      "active": true,  // ← updaterを有効化
      "endpoints": [
        "https://github.com/JunseiOgawa/VDI-solid/releases/latest/download/latest.json"
      ],
      "dialog": false,  // ← 自動ダイアログを無効化（カスタムUIを使用）
      "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6..."  // ← 公開鍵
    }
  }
}
```

### capabilities/default.json

```json
{
  "permissions": [
    "updater:default",  // ← アップデート機能の許可
    "updater:allow-check",
    "updater:allow-download-and-install"
  ]
}
```

## セキュリティ

### 1. HTTPS必須

本番ビルドでは、エンドポイントは必ずHTTPSでなければなりません。

```json
// NG: HTTPは許可されない
"endpoints": ["http://example.com/latest.json"]

// OK: HTTPSのみ許可
"endpoints": ["https://example.com/latest.json"]
```

### 2. 署名検証

公開鍵と秘密鍵のペアにより、以下を保証:
- ファイルが改ざんされていないこと
- ファイルが正規の開発者によって署名されたこと
- 中間者攻撃を防ぐ

### 3. 鍵の管理

**秘密鍵**:
- ❌ Gitにコミットしない
- ✅ GitHub Secretsで管理
- ✅ ローカルでは`.env`で管理（`.gitignore`に追加）

**公開鍵**:
- ✅ `tauri.conf.json`に記載（公開情報）
- ✅ アプリにバンドルされる

## GitHub Actions での自動化

### release.yml の役割

```yaml
# ビルド時に環境変数を設定
env:
  TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
  TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}

# 1. ビルド実行
npm run tauri build

# 2. 生成されるファイル（Windows）
# - vdi-solid_0.2.4_x64-setup.exe (通常のインストーラー)
# - vdi-solid_0.2.4_x64-setup.nsis.zip (updater用)
# - vdi-solid_0.2.4_x64-setup.nsis.zip.sig (署名)

# 3. latest.json生成
cat > latest.json << EOF
{
  "version": "v0.2.4",
  "platforms": {
    "windows-x86_64": {
      "signature": "$(cat *.nsis.zip.sig)",
      "url": "https://github.com/.../vdi-solid_0.2.4_x64-setup.nsis.zip"
    }
  }
}
EOF

# 4. GitHub Releaseにアップロード
gh release upload v0.2.4 \
  vdi-solid_0.2.4_x64-setup.nsis.zip \
  vdi-solid_0.2.4_x64-setup.nsis.zip.sig \
  latest.json
```

## トラブルシューティング

### エラー: "Could not fetch a valid release JSON"

**原因**: `latest.json`が存在しないか、形式が正しくない

**確認**:
```bash
curl https://github.com/JunseiOgawa/VDI-solid/releases/latest/download/latest.json
```

**解決**:
1. `tauri.conf.json`で`updater.active: true`を確認
2. `bundle.createUpdaterArtifacts: true`を確認
3. 新しいタグをプッシュしてリリースを再作成

### エラー: "Signature verification failed"

**原因**: 署名が一致しない

**確認**:
1. `tauri.conf.json`の`pubkey`が正しいか
2. GitHub Secretsの秘密鍵が正しいか
3. ビルド時に環境変数が設定されていたか

### エラー: "No private key found"

**原因**: ローカルビルドで環境変数が設定されていない

**解決**:
```bash
# .envから環境変数を読み込んでビルド
export $(cat .env | xargs) && npm run tauri build
```

## ファイル一覧（v0.2.4の例）

### GitHub Releaseにアップロードされるファイル

```
v0.2.4/
├── vdi-solid_0.2.4_x64-setup.exe          # 通常のインストーラー（ユーザーダウンロード用）
├── vdi-solid_0.2.4_x64_en-US.msi          # MSIインストーラー
├── vdi-solid_0.2.4_x64-setup.nsis.zip     # Updater用（NSIS ZIP）
├── vdi-solid_0.2.4_x64-setup.nsis.zip.sig # 署名ファイル
└── latest.json                            # アップデート情報
```

### ユーザーが直接使用するファイル

- **初回インストール**: `vdi-solid_0.2.4_x64-setup.exe` または `.msi`
- **アップデート**: アプリが自動的に`.nsis.zip`をダウンロード

## まとめ

1. **アップデートチェック**: `latest.json`を取得してバージョン比較
2. **ダウンロード**: プラットフォーム別の圧縮インストーラー（`.nsis.zip`など）
3. **署名検証**: Minisignで改ざんチェック
4. **インストール**: 展開してインストーラーを実行
5. **再起動**: 新バージョンで起動

**セキュリティ**: 公開鍵/秘密鍵ペアで署名検証を行い、悪意のあるアップデートを防ぐ
