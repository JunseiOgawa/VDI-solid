# 手動ビルド・リリース方式への変更

## 概要

GitHub Actionsのリリースワークフローを、`tauri-apps/tauri-action@v0`を使用する方式から、手動ビルド・`gh CLI`を使用したリリース方式に変更する。

## 背景

`tauri-apps/tauri-action@v0`を使用した際に以下のエラーが発生：

```
Warn Tauri dir ("D:\\a\\VDI-solid\\VDI-solid\\src-tauri") not empty. Run `init --force` to overwrite.
Failed to resolve Tauri path
```

tauri-actionが既存のTauriプロジェクト構造を正しく認識できず、`tauri init`を実行しようとして失敗している。

## 要件

### 機能要件

1. **手動ビルド**
   - `npm run tauri build`を直接実行してアプリをビルド
   - tauri-actionを使用しない

2. **リリース作成**
   - `gh CLI`を使用してGitHub Releaseを作成
   - WindowsとLinuxのビルド成果物を自動アップロード

3. **並列ビルド**
   - WindowsとLinuxのビルドを並列実行（既存の仕組みを維持）

### 非機能要件

1. ビルド時間は約10分程度を維持
2. 既存のタグベーストリガーを維持
3. リリースページの形式を維持

## 設計

### ワークフローの構造

```yaml
jobs:
  release:
    strategy:
      matrix:
        - Windows (windows-latest)
        - Linux (ubuntu-22.04)

    steps:
      1. チェックアウト
      2. バージョン取得
      3. Node.js/Rustセットアップ
      4. 依存関係インストール
      5. フロントエンドビルド
      6. Tauriアプリビルド（手動）
      7. 成果物確認
      8. リリース作成（Windowsジョブのみ）
      9. 成果物アップロード（各プラットフォーム）
```

### 変更箇所

**ファイル**: `.github/workflows/release.yml`

#### 1. Tauriアプリのビルド（L85-L87）

```yaml
# 変更前
- name: Build and Release Tauri app
  uses: tauri-apps/tauri-action@v0
  with:
    tagName: ${{ env.TAG }}
    # ...

# 変更後
- name: Build Tauri app
  run: npm run tauri build -- --target ${{ matrix.target }}
```

#### 2. ビルド成果物の確認（L89-L99）

プラットフォームごとのビルド成果物の場所を確認するステップを追加：

```yaml
- name: List build artifacts
  run: |
    if [ "${{ matrix.platform }}" == "windows-latest" ]; then
      ls -la src-tauri/target/${{ matrix.target }}/release/bundle/msi/
      ls -la src-tauri/target/${{ matrix.target }}/release/bundle/nsis/
    else
      ls -la src-tauri/target/${{ matrix.target }}/release/bundle/appimage/
      ls -la src-tauri/target/${{ matrix.target }}/release/bundle/deb/
    fi
```

#### 3. リリースの作成（L101-L116）

`gh CLI`を使用してリリースを作成（Windowsジョブのみ実行）：

```yaml
- name: Create Release
  if: matrix.platform == 'windows-latest'
  run: |
    gh release create ${{ env.TAG }} \
      --title "VDI-solid ${{ env.TAG }}" \
      --notes "..." \
      || echo "Release already exists"
```

#### 4. 成果物のアップロード（L118-L138）

各プラットフォームで成果物をアップロード：

```yaml
# Windows
- name: Upload Windows artifacts
  if: matrix.platform == 'windows-latest'
  run: |
    gh release upload ${{ env.TAG }} \
      src-tauri/target/${{ matrix.target }}/release/bundle/msi/*.msi \
      src-tauri/target/${{ matrix.target }}/release/bundle/nsis/*-setup.exe \
      --clobber

# Linux
- name: Upload Linux artifacts
  if: matrix.platform == 'ubuntu-22.04'
  run: |
    gh release upload ${{ env.TAG }} \
      src-tauri/target/${{ matrix.target }}/release/bundle/appimage/*.AppImage \
      src-tauri/target/${{ matrix.target }}/release/bundle/deb/*.deb \
      --clobber
```

## 実装方針

1. `.github/workflows/release.yml`を修正
2. 変更内容をコミット
3. タグをプッシュしてテスト

## 成果物の場所

### Windows (x86_64-pc-windows-msvc)
- MSIインストーラー: `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi/*.msi`
- セットアップ実行ファイル: `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/*-setup.exe`

### Linux (x86_64-unknown-linux-gnu)
- AppImage: `src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/appimage/*.AppImage`
- DEBパッケージ: `src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/deb/*.deb`

## テスト計画

1. タグ`v0.1.7`をプッシュ
2. WindowsとLinuxのビルドが並列実行されることを確認
3. リリースが正常に作成されることを確認
4. すべての成果物がアップロードされることを確認

## 利点

1. **シンプル**: tauri-actionの複雑な設定が不要
2. **透明性**: ビルドプロセスが明確
3. **柔軟性**: ビルドコマンドを直接制御可能
4. **信頼性**: tauri-actionのバグや制限に依存しない
