# GitHub Actions の latest.json 生成問題

## 現状の問題

### 1. latest.json の生成タイミング

現在の`release.yml`では、`latest.json`の生成が**Linuxジョブでのみ**実行されます:

```yaml
- name: Generate and upload latest.json
  if: matrix.platform == 'ubuntu-22.04'  # ← Linuxジョブのみ
```

### 2. 問題点

1. **Linuxビルドへの依存**
   - Linuxジョブが失敗すると、`latest.json`が生成されない
   - Windows専用アプリでも、Linuxビルドが必要になる

2. **タイミングの問題**
   - WindowsとLinuxは並列実行される
   - Linuxジョブが先に完了すると、Windowsの`.nsis.zip`がまだアップロードされていない
   - 最大2分待機するが、それでも見つからない場合がある

3. **v0.2.3での失敗原因**
   - `updater.active: false`だったため、`.nsis.zip`が生成されなかった
   - Linuxジョブが2分待機したが、見つからなかった
   - Windows情報なしで`latest.json`を生成した（または失敗した）
   - 結果: `latest.json`がGitHub Releaseに存在しない

## 確認方法

### GitHub Actionsのログを確認

1. https://github.com/JunseiOgawa/VDI-solid/actions にアクセス
2. v0.2.3のWorkflow実行を選択
3. 各ジョブのログを確認:
   - Windowsジョブ: `.nsis.zip`が生成されたか
   - Linuxジョブ: `latest.json`生成ステップが成功したか

### 期待されるログ

**Windowsジョブ（成功時）**:
```
Running makensis to produce ...vdi-solid_0.2.4_x64-setup.exe
✓ Signing vdi-solid_0.2.4_x64-setup.nsis.zip
✓ Generated vdi-solid_0.2.4_x64-setup.nsis.zip.sig
```

**Linuxジョブ（成功時）**:
```
=== Wait for Windows NSIS assets to be available on the Release ===
Found Windows NSIS zip asset: vdi-solid_0.2.4_x64-setup.nsis.zip
=== latest.json の内容 ===
{
  "version": "v0.2.4",
  ...
}
✓ Uploaded latest.json
```

## 解決方法

### オプション1: 現在の設定を維持（推奨）

v0.2.4で`updater.active: true`になったため、以下が保証されます:
- Windowsジョブで`.nsis.zip`と`.sig`が生成される
- Linuxジョブがこれらを検出して`latest.json`を生成する

**メリット**:
- 既存の設定を変更しない
- WindowsとLinuxの両方のupdater情報を含む

**デメリット**:
- Linuxビルドに依存する
- Linuxビルドが失敗すると、`latest.json`も失敗する

### オプション2: Windowsジョブで latest.json を生成

Windowsジョブで`latest.json`を生成するように変更:

```yaml
# Windowsジョブに追加
- name: Generate and upload latest.json (Windows only)
  if: matrix.platform == 'windows-latest'
  shell: bash
  run: |
    WINDOWS_SIG=$(cat src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/*-setup.nsis.zip.sig | head -n 1)
    WINDOWS_FILE=$(basename src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/*-setup.nsis.zip)

    cat > latest.json << EOF
    {
      "version": "${{ env.TAG }}",
      "notes": "VDI-solid ${{ env.TAG }} がリリースされました",
      "pub_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
      "platforms": {
        "windows-x86_64": {
          "signature": "${WINDOWS_SIG}",
          "url": "https://github.com/${{ github.repository }}/releases/download/${{ env.TAG }}/${WINDOWS_FILE}"
        }
      }
    }
    EOF

    gh release upload ${{ env.TAG }} latest.json --clobber
```

**メリット**:
- Windowsビルドのみで完結
- Linuxビルドへの依存がない
- より確実に`latest.json`が生成される

**デメリット**:
- Linux向けのupdater情報が含まれない
- 将来Linuxビルドを追加する場合、変更が必要

### オプション3: 別ジョブで latest.json を生成

WindowsとLinuxの両方が完了した後に、専用ジョブで`latest.json`を生成:

```yaml
generate-update-manifest:
  needs: [release]  # releaseジョブの完了を待つ
  runs-on: ubuntu-latest
  steps:
    - name: Generate latest.json
      run: |
        # GitHub Releaseから両プラットフォームのファイルをダウンロード
        # latest.jsonを生成してアップロード
```

**メリット**:
- 両プラットフォームの情報を確実に含む
- releaseジョブの完了を待つため、タイミング問題がない

**デメリット**:
- 設定が複雑になる
- 実装の手間がかかる

## 推奨アクション

**短期的（v0.2.4）**:
1. 現在の設定を維持
2. v0.2.4をリリースして動作確認
3. GitHub Actionsのログを確認

**長期的（必要に応じて）**:
- Linuxビルドが不要な場合: オプション2を採用
- 両プラットフォームが必要な場合: 現在の設定を維持

## チェックリスト

v0.2.4リリース時に確認すべき項目:

- [ ] Windowsジョブが成功
- [ ] `.nsis.zip`が生成された
- [ ] `.nsis.zip.sig`が生成された
- [ ] Linuxジョブが成功
- [ ] `latest.json`が生成された
- [ ] `latest.json`がアップロードされた
- [ ] https://github.com/JunseiOgawa/VDI-solid/releases/latest/download/latest.json にアクセスできる
- [ ] アプリでアップデートチェックが成功する
