# Windows専用リリースワークフローへの変更

## 変更内容

GitHub Actionsのリリースワークフロー(`release.yml`)をWindows専用に変更しました。

### 変更前

- Windows + Linuxの2つのジョブを並列実行
- Linuxジョブが`latest.json`を生成
- Windowsの`.nsis.zip`を待ってから生成（最大2分待機）

### 変更後

- **Windowsジョブのみ**
- Windowsジョブで直接`latest.json`を生成
- 待機時間なし、より確実に生成

## 削除された機能

### Linuxビルド

以下のLinux関連ステップを削除:
- Linuxシステム依存関係のインストール
- Linux成果物のアップロード（AppImage, .deb）
- Linux向けのupdater情報

### 理由

1. **シンプル化**: Windows専用アプリのため、Linuxビルドは不要
2. **確実性**: Windowsジョブで完結するため、より確実に`latest.json`が生成される
3. **ビルド時間短縮**: 1つのジョブのみなので、ビルド時間が短縮

## 新しいワークフロー

```yaml
jobs:
  release:
    runs-on: windows-latest
    steps:
      1. リポジトリチェックアウト
      2. バージョン情報取得
      3. Node.jsセットアップ
      4. Rustセットアップ
      5. Rustキャッシュ
      6. npm依存関係インストール
      7. フロントエンドビルド
      8. Tauriアプリビルド（署名付き）
      9. ビルド成果物確認
      10. リリース作成
      11. Windows成果物アップロード
          - .msi
          - -setup.exe
          - -setup.nsis.zip（updater用）
          - -setup.nsis.zip.sig（署名）
      12. latest.json生成とアップロード
```

## latest.json生成処理

```bash
# Windows NSIS の署名とファイル名を取得
NSIS_DIR="src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis"

# 署名ファイルから内容を読み込み
WINDOWS_SIG=$(cat "$NSIS_DIR"/*-setup.nsis.zip.sig | head -n 1)
WINDOWS_FILE=$(basename "$NSIS_DIR"/*-setup.nsis.zip)

# latest.json を生成
cat > latest.json << EOF
{
  "version": "v0.2.4",
  "notes": "VDI-solid v0.2.4 がリリースされました",
  "pub_date": "2025-10-25T12:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "${WINDOWS_SIG}",
      "url": "https://github.com/JunseiOgawa/VDI-solid/releases/download/v0.2.4/${WINDOWS_FILE}"
    }
  }
}
EOF

# GitHub Releaseにアップロード
gh release upload v0.2.4 latest.json --clobber
```

## 生成されるファイル

### GitHub Releaseにアップロードされるファイル

```
v0.2.4/
├── vdi-solid_0.2.4_x64-setup.exe             # 通常のインストーラー
├── vdi-solid_0.2.4_x64_en-US.msi             # MSIインストーラー
├── vdi-solid_0.2.4_x64-setup.nsis.zip        # Updater用
├── vdi-solid_0.2.4_x64-setup.nsis.zip.sig    # 署名
└── latest.json                               # アップデート情報（Windows専用）
```

## latest.jsonの構造（Windows専用）

```json
{
  "version": "v0.2.4",
  "notes": "VDI-solid v0.2.4 がリリースされました",
  "pub_date": "2025-10-25T12:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6...",
      "url": "https://github.com/JunseiOgawa/VDI-solid/releases/download/v0.2.4/vdi-solid_0.2.4_x64-setup.nsis.zip"
    }
  }
}
```

**注意**: `linux-x86_64`エントリは含まれません。

## メリット

1. **シンプル**: 1つのジョブで完結
2. **高速**: 並列ビルドなし、待機時間なし
3. **確実**: Windowsビルドが成功すれば、必ず`latest.json`が生成される
4. **デバッグしやすい**: 1つのジョブのみなので、ログが見やすい

## デメリット

- Linuxビルドが不要
- 将来Linuxをサポートする場合、ワークフローの変更が必要

## 検証方法

v0.2.4リリース後、以下を確認:

```bash
# 1. リリースページを確認
# https://github.com/JunseiOgawa/VDI-solid/releases/latest

# 2. latest.jsonが存在するか確認
curl https://github.com/JunseiOgawa/VDI-solid/releases/latest/download/latest.json

# 3. 内容を確認
curl -s https://github.com/JunseiOgawa/VDI-solid/releases/latest/download/latest.json | jq

# 期待される出力:
# {
#   "version": "v0.2.4",
#   "platforms": {
#     "windows-x86_64": { ... }
#   }
# }
```

## トラブルシューティング

### エラー: "NSIS signature file not found"

**原因**: `.nsis.zip.sig`が生成されていない

**確認**:
1. `updater.active: true`になっているか
2. 環境変数`TAURI_SIGNING_PRIVATE_KEY`が設定されているか
3. ビルドログで署名処理が実行されているか

### latest.jsonがアップロードされない

**原因**: ファイルパスが間違っている

**確認**:
1. ビルド成果物確認ステップのログを見る
2. `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/`にファイルが存在するか

## 今後の拡張

Linuxをサポートする場合:

1. matrixにLinuxを追加
2. latest.json生成を最後の専用ジョブに移動
3. 両プラットフォームの情報を含むように変更

```yaml
generate-manifest:
  needs: [release]
  runs-on: ubuntu-latest
  steps:
    - name: Generate latest.json
      # Windows と Linux の両方の情報を取得して生成
```
