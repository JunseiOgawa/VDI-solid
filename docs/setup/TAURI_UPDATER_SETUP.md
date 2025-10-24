# Tauri Updater セットアップガイド

このドキュメントでは、VDI-solidアプリケーションでTauri Updater機能を有効化し、自動アップデート機能を実装する方法を説明します。

## 目次

1. [概要](#概要)
2. [前提条件](#前提条件)
3. [公開鍵・秘密鍵の生成](#公開鍵秘密鍵の生成)
4. [Tauri設定の変更](#tauri設定の変更)
5. [GitHub Secretsの設定](#github-secretsの設定)
6. [GitHub Actionsワークフローの修正](#github-actionsワークフローの修正)
7. [リリースプロセス](#リリースプロセス)
8. [動作確認](#動作確認)
9. [トラブルシューティング](#トラブルシューティング)

---

## 概要

Tauri Updaterは、アプリケーションの自動アップデート機能を提供します。

### 仕組み

1. アプリ起動時またはユーザーの手動操作で、GitHubリリースページから`latest.json`を取得
2. 現在のバージョンと比較して、新しいバージョンが利用可能かチェック
3. アップデートが利用可能な場合、ダウンロードとインストールを実行
4. 署名検証により、改ざんされていないことを確認

### セキュリティ

Tauri Updaterは、署名検証を使用してセキュリティを確保します：
- **秘密鍵**: リリース時にアップデートファイルに署名するために使用（秘密に保つ）
- **公開鍵**: アプリケーション内に埋め込まれ、署名を検証するために使用

---

## 前提条件

- Node.js 20以上
- Rust 1.70以上
- Tauri CLI
- GitHubリポジトリへのアクセス権限

---

## 公開鍵・秘密鍵の生成

### 1. 鍵ペアの生成

プロジェクトディレクトリで以下のコマンドを実行します：

```bash
npx @tauri-apps/cli signer generate -w ~/.tauri/vdi-solid.key
```

パスワード保護付きで生成する場合（推奨）：

```bash
npx @tauri-apps/cli signer generate -w ~/.tauri/vdi-solid.key -p
```

**注意**: `-p`オプションを使用すると、パスワードの入力を求められます。このパスワードは後でGitHub Secretsに設定する必要があります。

**出力例:**
```
Generating key pair...
Private key written to C:\Users\YourName\.tauri\vdi-solid.key

Your public key is:
dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDEyMzQ1Njc4OTAK
UldRMTIzNDU2Nzg5MAo=
```

### 2. 鍵の保存

- **秘密鍵**: `~/.tauri/vdi-solid.key`に保存されています（絶対にコミットしない！）
- **公開鍵**: コンソールに表示された文字列をコピー

---

## Tauri設定の変更

### src-tauri/tauri.conf.json

以下の2箇所を変更します：

#### 1. `bundle.createUpdaterArtifacts`を`true`に変更

```json
{
  "bundle": {
    "active": true,
    "targets": "all",
    "createUpdaterArtifacts": true,  // ← falseからtrueに変更
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

#### 2. `plugins.updater`を設定

```json
{
  "plugins": {
    "updater": {
      "active": true,  // ← falseからtrueに変更
      "endpoints": [
        "https://github.com/JunseiOgawa/VDI-solid/releases/latest/download/latest.json"
      ],
      "dialog": false,
      "pubkey": "生成した公開鍵をここに貼り付け"  // ← 公開鍵を設定
    }
  }
}
```

**重要**: `pubkey`には、先ほど生成した公開鍵の文字列をそのまま貼り付けてください。

---

## GitHub Secretsの設定

秘密鍵をGitHub Actionsで使用するため、リポジトリのSecretsに保存します。

### 1. GitHubリポジトリにアクセス

https://github.com/JunseiOgawa/VDI-solid/settings/secrets/actions

### 2. 新しいSecretを作成

- **Name**: `TAURI_SIGNING_PRIVATE_KEY`
- **Value**: `~/.tauri/vdi-solid.key`ファイルの内容をコピー&ペースト

#### 秘密鍵ファイルの内容を取得（Windows）

```powershell
Get-Content $env:USERPROFILE\.tauri\vdi-solid.key | Set-Clipboard
```

または、テキストエディタで開いてコピー：

```bash
notepad ~/.tauri/vdi-solid.key
```

#### 秘密鍵ファイルの内容を取得（Linux/Mac）

```bash
cat ~/.tauri/vdi-solid.key
```

### 3. 秘密鍵のパスワード（オプション）

鍵生成時にパスワードを設定した場合：

- **Name**: `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
- **Value**: パスワード

---

## GitHub Actionsワークフローの修正

`.github/workflows/release.yml`を以下のように修正します。

### 変更点

1. Tauri Updater用の環境変数を追加
2. `latest.json`の生成とアップロード
3. 署名ファイル（`.sig`）のアップロード

### 修正後のrelease.yml

既存のワークフローに以下のステップを追加します：

```yaml
# 9. Tauri アプリのビルド
- name: Build Tauri app
  env:
    TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
    TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
  run: npm run tauri build -- --target ${{ matrix.target }}

# 12-A. Windows成果物のアップロード（署名ファイル含む）
- name: Upload Windows artifacts
  if: matrix.platform == 'windows-latest'
  shell: bash
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    gh release upload ${{ env.TAG }} \
      src-tauri/target/${{ matrix.target }}/release/bundle/msi/*.msi \
      src-tauri/target/${{ matrix.target }}/release/bundle/msi/*.msi.zip \
      src-tauri/target/${{ matrix.target }}/release/bundle/msi/*.msi.zip.sig \
      src-tauri/target/${{ matrix.target }}/release/bundle/nsis/*-setup.exe \
      src-tauri/target/${{ matrix.target }}/release/bundle/nsis/*-setup.nsis.zip \
      src-tauri/target/${{ matrix.target }}/release/bundle/nsis/*-setup.nsis.zip.sig \
      --clobber

# 13-A. Linux成果物のアップロード（署名ファイル含む）
- name: Upload Linux artifacts
  if: matrix.platform == 'ubuntu-22.04'
  shell: bash
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    gh release upload ${{ env.TAG }} \
      src-tauri/target/${{ matrix.target }}/release/bundle/appimage/*.AppImage \
      src-tauri/target/${{ matrix.target }}/release/bundle/appimage/*.AppImage.tar.gz \
      src-tauri/target/${{ matrix.target }}/release/bundle/appimage/*.AppImage.tar.gz.sig \
      src-tauri/target/${{ matrix.target }}/release/bundle/deb/*.deb \
      --clobber

# 14. latest.jsonの生成とアップロード（最後に実行）
- name: Generate and upload latest.json
  if: matrix.platform == 'ubuntu-22.04'  # 最後のジョブで実行
  shell: bash
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    # latest.jsonを生成
    cat > latest.json << EOF
    {
      "version": "${{ env.TAG }}",
      "notes": "VDI-solid ${{ env.TAG }} リリース",
      "pub_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
      "platforms": {
        "windows-x86_64": {
          "signature": "$(cat src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi/*.msi.zip.sig)",
          "url": "https://github.com/${{ github.repository }}/releases/download/${{ env.TAG }}/vdi-solid_${{ env.VERSION }}_x64_en-US.msi.zip"
        },
        "linux-x86_64": {
          "signature": "$(cat src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/appimage/*.AppImage.tar.gz.sig)",
          "url": "https://github.com/${{ github.repository }}/releases/download/${{ env.TAG }}/vdi-solid_${{ env.VERSION }}_amd64.AppImage.tar.gz"
        }
      }
    }
    EOF

    # アップロード
    gh release upload ${{ env.TAG }} latest.json --clobber
```

**注意**: ファイル名のパターンは実際のビルド成果物に合わせて調整してください。

---

## リリースプロセス

### 1. バージョンアップ

以下のファイルのバージョンを更新します：

#### package.json
```json
{
  "version": "0.1.14"
}
```

#### src-tauri/Cargo.toml
```toml
[package]
version = "0.1.14"
```

#### src-tauri/tauri.conf.json
```json
{
  "version": "0.1.14"
}
```

### 2. 変更をコミット

```bash
git add .
git commit -m "chore: bump version to 0.1.14"
```

### 3. タグを作成

```bash
git tag v0.1.14
```

### 4. プッシュ

```bash
git push origin main
git push origin v0.1.14
```

### 5. GitHub Actionsの実行

GitHubで自動的にビルドが開始されます：
https://github.com/JunseiOgawa/VDI-solid/actions

### 6. リリースの確認

ビルド完了後、以下を確認：
- リリースページに成果物がアップロードされている
- `latest.json`がアップロードされている
- 各成果物に対応する`.sig`ファイルがアップロードされている

---

## 動作確認

### 1. アプリケーションのビルド

```bash
npm run tauri build
```

### 2. アプリケーションの起動

ビルドされたアプリを起動し、設定メニューから「アップデートを確認」をクリックします。

### 3. デバッグ出力の確認

開発者ツールのコンソールで以下のようなログを確認：

```
[UpdateManager] アップデートをチェック中...
[UpdateManager] 最新版です
```

または

```
[UpdateManager] アップデート利用可能: 0.1.14
```

---

## 鍵を紛失した場合の対処方法

### 影響

**鍵を紛失すると、既存のユーザーに対して自動アップデートができなくなります。**

#### なぜ？

- 既にリリースされているアプリには**古い公開鍵**が埋め込まれている
- 新しい鍵で署名したアップデートは、古い公開鍵で検証できない
- 署名検証に失敗するため、アップデートがインストールされない

### 対処手順

#### 1. 新しい鍵ペアを生成

```bash
npx @tauri-apps/cli signer generate -w ~/.tauri/vdi-solid-new.key -p
```

#### 2. 新しい公開鍵を設定

`src-tauri/tauri.conf.json`の`plugins.updater.pubkey`を新しい公開鍵に更新

#### 3. GitHub Secretsを更新

- `TAURI_SIGNING_PRIVATE_KEY`を新しい秘密鍵の内容に更新
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`も更新（パスワードを変更した場合）

#### 4. バージョンを上げてリリース

新しい鍵で署名された新バージョンをリリース

#### 5. ユーザーへの通知

**重要**: 既存ユーザーには以下を通知する必要があります：

> **お知らせ**: セキュリティ強化のため、署名鍵を更新しました。
>
> **対応が必要な方**: バージョンX.X.X以前をご利用の方
>
> **手順**:
> 1. [GitHubリリースページ](リンク)から最新版をダウンロード
> 2. 手動でインストール
> 3. 次回以降は自動アップデートが利用可能になります

### 予防策

鍵を紛失しないために、以下を推奨します：

#### 1. バックアップ

秘密鍵を安全な場所にバックアップ：

```bash
# 秘密鍵をコピー
cp ~/.tauri/vdi-solid.key ~/Backups/vdi-solid-key-backup-$(date +%Y%m%d).key

# 暗号化して保存（推奨）
gpg -c ~/.tauri/vdi-solid.key
mv ~/.tauri/vdi-solid.key.gpg ~/Backups/
```

#### 2. 複数の安全な場所に保存

- ローカルの暗号化されたストレージ
- パスワードマネージャー（1Password、Bitwardenなど）
- クラウドストレージ（暗号化してから保存）
- 外部ドライブ（USBメモリなど、暗号化推奨）

#### 3. GitHub Secretsは自動バックアップ

GitHub Secretsに秘密鍵を保存しているため、GitHubアカウントにアクセスできれば復元可能です：

1. GitHubリポジトリの Settings → Secrets → Actions
2. `TAURI_SIGNING_PRIVATE_KEY`の値を確認（表示されませんが、更新時に参照可能）

**注意**: GitHub Secretsは一度設定すると値を**表示できません**。更新はできますが、確認はできないため、ローカルでのバックアップが重要です。

#### 4. ドキュメント化

秘密鍵の保存場所を記録しておく：

```markdown
# 鍵管理メモ（プライベートに保管）

- **鍵の生成日**: 2025-10-24
- **秘密鍵の場所**: ~/.tauri/vdi-solid.key
- **バックアップ場所1**: ~/Backups/encrypted/
- **バックアップ場所2**: 1Password (VDI-solid Signing Key)
- **GitHub Secrets**: TAURI_SIGNING_PRIVATE_KEY に設定済み
- **パスワード**: 1Passwordに保存
```

### チーム開発の場合

複数人で開発する場合：

1. **鍵管理者を決める**: 1名が鍵を管理
2. **GitHub Secretsで共有**: リポジトリメンバーはGitHub Actions経由で署名
3. **ドキュメント化**: 鍵の管理方法をチーム内で共有
4. **アクセス制限**: リポジトリのSecretsへのアクセスを制限

---

## トラブルシューティング

### エラー: "アップデートチェックに失敗しました"

**原因**: Updaterが無効化されている、またはエンドポイントが正しくない

**解決策**:
1. `tauri.conf.json`の`plugins.updater.active`が`true`になっているか確認
2. エンドポイントURLが正しいか確認
3. `latest.json`がリリースページに存在するか確認

### エラー: "署名検証に失敗しました"

**原因**: 公開鍵と秘密鍵が一致していない

**解決策**:
1. `tauri.conf.json`の`pubkey`が正しいか確認
2. GitHub Secretsの秘密鍵が正しいか確認
3. 鍵ペアを再生成して、両方を更新

### latest.jsonが生成されない

**原因**: ワークフローのステップが実行されていない、またはファイルパスが間違っている

**解決策**:
1. GitHub Actionsのログを確認
2. ビルド成果物のパスを確認（`ls -la`の出力）
3. `latest.json`生成スクリプトのファイルパス（`*.sig`のパス）を修正

### Windows/Linuxで異なるファイル名

**解決策**:
ビルド後に実際のファイル名を確認し、ワークフローとlatest.jsonのURLを調整してください。

例：
```bash
# Windowsビルド後
ls src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi/

# Linuxビルド後
ls src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/appimage/
```

---

## 参考資料

- [Tauri Updater公式ドキュメント](https://v2.tauri.app/plugin/updater/)
- [GitHub Actions公式ドキュメント](https://docs.github.com/en/actions)
- [Tauri署名ガイド](https://v2.tauri.app/plugin/updater/#signing-updates)

---

## 注意事項

### セキュリティ

- **秘密鍵は絶対にコミットしない**
- `.gitignore`に`*.key`を追加する
- GitHub Secretsは暗号化されて保存される

### バージョン管理

- セマンティックバージョニング（SemVer）を推奨
- `v`接頭辞付きのタグを使用（例: `v0.1.14`）

### テスト

- 本番環境にリリースする前に、テストリリースで動作確認することを推奨
- プライベートリポジトリでテストすることも可能
