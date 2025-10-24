# Tauri Updater セットアップ手順書（簡潔版）

このドキュメントは、Tauri Updaterを有効化するための手順を簡潔にまとめたものです。

---

## ステップ1: 公開鍵・秘密鍵の生成

### 1-1. プロジェクトディレクトリで以下のコマンドを実行

```bash
npx @tauri-apps/cli signer generate -w ~/.tauri/vdi-solid.key -p
```

### 1-2. パスワードを入力（2回）

プロンプトが表示されたら、パスワードを入力してください。
**このパスワードは必ず記録しておいてください。**

### 1-3. 公開鍵をコピー

出力された公開鍵をコピーします

**↑この部分をすべてコピー**

### 1-4. 秘密鍵をバックアップ

**超重要**: 秘密鍵を2箇所以上にバックアップしてください。

```bash
# バックアップディレクトリを作成
mkdir -p ~/Backups/vdi-solid

# 秘密鍵をコピー
cp ~/.tauri/vdi-solid.key ~/Backups/vdi-solid/vdi-solid-key-$(date +%Y%m%d).key
```

**推奨**: パスワードマネージャー（1Password、Bitwardenなど）にも保存

---

## ステップ2: Tauri設定ファイルの変更

### 2-1. `src-tauri/tauri.conf.json`を開く

### 2-2. `bundle.createUpdaterArtifacts`を変更

**変更前:**
```json
"bundle": {
  "createUpdaterArtifacts": false,
```

**変更後:**
```json
"bundle": {
  "createUpdaterArtifacts": true,
```

### 2-3. `plugins.updater`を変更

**変更前:**
```json
"plugins": {
  "updater": {
    "active": false,
    "endpoints": [
      "https://github.com/JunseiOgawa/VDI-solid/releases/latest/download/latest.json"
    ],
    "dialog": false,
    "pubkey": ""
  }
}
```

**変更後:**
```json
"plugins": {
  "updater": {
    "active": true,
    "endpoints": [
      "https://github.com/JunseiOgawa/VDI-solid/releases/latest/download/latest.json"
    ],
    "dialog": false,
    "pubkey": "ステップ1-3でコピーした公開鍵をここに貼り付け"
  }
}
```

### 2-4. ファイルを保存

---

## ステップ3: GitHub Secretsの設定

### 3-1. 秘密鍵ファイルの内容を取得

#### Windows (PowerShell)
```powershell
Get-Content $env:USERPROFILE\.tauri\vdi-solid.key
```

#### Windows (Git Bash)
```bash
cat ~/.tauri/vdi-solid.key
```

出力された内容を**すべてコピー**してください。

### 3-2. GitHubリポジトリにアクセス

https://github.com/JunseiOgawa/VDI-solid/settings/secrets/actions

### 3-3. 新しいSecretを作成（1つ目）

- **Name**: `TAURI_SIGNING_PRIVATE_KEY`
- **Value**: ステップ3-1でコピーした秘密鍵の内容を貼り付け
- 「Add secret」をクリック

### 3-4. 新しいSecretを作成（2つ目）

- **Name**: `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
- **Value**: ステップ1-2で設定したパスワード
- 「Add secret」をクリック

---

## ステップ4: GitHub Actionsワークフローの変更

### 4-1. `.github/workflows/release.yml`を開く

### 4-2. ビルドステップに環境変数を追加

**変更前（Line 85-87付近）:**
```yaml
# 9. Tauri アプリのビルド
- name: Build Tauri app
  run: npm run tauri build -- --target ${{ matrix.target }}
```

**変更後:**
```yaml
# 9. Tauri アプリのビルド
- name: Build Tauri app
  env:
    TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
    TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
  run: npm run tauri build -- --target ${{ matrix.target }}
```

### 4-3. Windows成果物アップロードステップを変更

**変更前（Line 119-129付近）:**
```yaml
# 12. Windows成果物のアップロード
- name: Upload Windows artifacts
  if: matrix.platform == 'windows-latest'
  shell: bash
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    gh release upload ${{ env.TAG }} \
      src-tauri/target/${{ matrix.target }}/release/bundle/msi/*.msi \
      src-tauri/target/${{ matrix.target }}/release/bundle/nsis/*-setup.exe \
      --clobber
```

**変更後:**
```yaml
# 12. Windows成果物のアップロード
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
```

### 4-4. Linux成果物アップロードステップを変更

**変更前（Line 131-141付近）:**
```yaml
# 13. Linux成果物のアップロード
- name: Upload Linux artifacts
  if: matrix.platform == 'ubuntu-22.04'
  shell: bash
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    gh release upload ${{ env.TAG }} \
      src-tauri/target/${{ matrix.target }}/release/bundle/appimage/*.AppImage \
      src-tauri/target/${{ matrix.target }}/release/bundle/deb/*.deb \
      --clobber
```

**変更後:**
```yaml
# 13. Linux成果物のアップロード
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
```

### 4-5. latest.json生成ステップを追加（ファイルの最後に追加）

```yaml
# 14. latest.jsonの生成とアップロード
- name: Generate and upload latest.json
  if: matrix.platform == 'ubuntu-22.04'
  shell: bash
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    # 最初にビルド成果物を確認
    echo "=== Windows artifacts ==="
    find src-tauri/target/x86_64-pc-windows-msvc/release/bundle/ -name "*.sig" 2>/dev/null || echo "Windows署名ファイルが見つかりません"

    echo "=== Linux artifacts ==="
    find src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/ -name "*.sig" 2>/dev/null || echo "Linux署名ファイルが見つかりません"

    # Windows MSIの署名ファイルを取得
    WINDOWS_SIG=$(cat src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi/*.msi.zip.sig 2>/dev/null | head -n 1)
    WINDOWS_FILE=$(basename src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi/*.msi.zip 2>/dev/null | head -n 1)

    # Linux AppImageの署名ファイルを取得
    LINUX_SIG=$(cat src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/appimage/*.AppImage.tar.gz.sig 2>/dev/null | head -n 1)
    LINUX_FILE=$(basename src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/appimage/*.AppImage.tar.gz 2>/dev/null | head -n 1)

    # latest.jsonを生成
    cat > latest.json << EOF
    {
      "version": "${{ env.TAG }}",
      "notes": "VDI-solid ${{ env.TAG }} がリリースされました",
      "pub_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
      "platforms": {
        "windows-x86_64": {
          "signature": "${WINDOWS_SIG}",
          "url": "https://github.com/${{ github.repository }}/releases/download/${{ env.TAG }}/${WINDOWS_FILE}"
        },
        "linux-x86_64": {
          "signature": "${LINUX_SIG}",
          "url": "https://github.com/${{ github.repository }}/releases/download/${{ env.TAG }}/${LINUX_FILE}"
        }
      }
    }
    EOF

    # latest.jsonの内容を確認
    echo "=== latest.json の内容 ==="
    cat latest.json

    # アップロード
    gh release upload ${{ env.TAG }} latest.json --clobber
```

### 4-6. ファイルを保存してコミット

```bash
git add .github/workflows/release.yml
git commit -m "feat: enable Tauri Updater with signing"
git push origin main
```

---

## ステップ5: 変更をコミット

```bash
# すべての変更をステージング
git add .

# コミット
git commit -m "feat: enable Tauri Updater

- Generate signing keys
- Update tauri.conf.json with public key
- Configure GitHub Actions for signing
- Add updater artifacts to release workflow"

# プッシュ
git push origin main
```

---

## ステップ6: テストリリース

### 6-1. バージョンを上げる

以下の3つのファイルを同じバージョンに更新：

#### `package.json`
```json
{
  "version": "0.1.14"
}
```

#### `src-tauri/Cargo.toml`
```toml
[package]
version = "0.1.14"
```

#### `src-tauri/tauri.conf.json`
```json
{
  "version": "0.1.14"
}
```

### 6-2. コミットとタグ作成

```bash
# バージョンアップをコミット
git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json
git commit -m "chore: bump version to 0.1.14"
git push origin main

# タグを作成
git tag v0.1.14

# タグをプッシュ
git push origin v0.1.14
```

### 6-3. GitHub Actionsの実行を確認

1. https://github.com/JunseiOgawa/VDI-solid/actions にアクセス
2. 最新のワークフローが実行されていることを確認
3. 完了まで待機（10-20分程度）

### 6-4. リリースを確認

https://github.com/JunseiOgawa/VDI-solid/releases/latest

以下がアップロードされていることを確認：

**Windows:**
- [ ] `*.msi`
- [ ] `*.msi.zip`
- [ ] `*.msi.zip.sig`
- [ ] `*-setup.exe`
- [ ] `*-setup.nsis.zip`
- [ ] `*-setup.nsis.zip.sig`

**Linux:**
- [ ] `*.AppImage`
- [ ] `*.AppImage.tar.gz`
- [ ] `*.AppImage.tar.gz.sig`
- [ ] `*.deb`

**共通:**
- [ ] `latest.json`

---

## ステップ7: 動作確認

### 7-1. アプリをダウンロードしてインストール

リリースページから最新版をダウンロードしてインストール

### 7-2. アプリを起動

### 7-3. 設定メニューを開く

### 7-4. 「アップデートを確認」をクリック

### 7-5. 結果を確認

- **最新版の場合**: 「最新版です」と表示される
- **新バージョンがある場合**: アップデートダイアログが表示される

---

## トラブルシューティング

### エラー: "アップデートチェックに失敗しました"

**確認項目:**
1. `tauri.conf.json`の`plugins.updater.active`が`true`か
2. 公開鍵が正しく設定されているか
3. `latest.json`がリリースページに存在するか

### エラー: "署名検証に失敗しました"

**確認項目:**
1. 公開鍵と秘密鍵が一致しているか
2. GitHub Secretsの秘密鍵が正しいか
3. `.sig`ファイルが正しく生成されているか

### latest.jsonが生成されない

**確認項目:**
1. GitHub Actionsのログを確認
2. 署名ファイル（`.sig`）が存在するか確認
3. ファイルパスが正しいか確認

---

## 完了！

これでTauri Updaterの設定は完了です。次回以降のリリースでは、ユーザーは自動的にアップデートを受け取れます。

## 重要: 鍵のバックアップを忘れずに

- [ ] 秘密鍵を2箇所以上にバックアップ済み
- [ ] パスワードを安全に保管済み
- [ ] 鍵の保存場所をドキュメント化済み

---

**詳細なドキュメント**: `docs/setup/TAURI_UPDATER_SETUP.md`を参照してください。
