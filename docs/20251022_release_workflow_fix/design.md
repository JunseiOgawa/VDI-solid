# リリースワークフロー修正

## 背景

現在のリリースワークフローで以下の問題が発生：
1. LinuxビルドでGitHub Releasesへのアップロードが404エラーで失敗
2. macOSビルドが不要（削除要求）

## 問題の原因

`files: ./src-tauri/target/${{ matrix.target }}/release/bundle/**/*`により、bundleディレクトリ内のすべてのファイルが個別にアップロードされている。これには：
- AppImageファイルの内部ファイル（.so、.desktop等）
- Debパッケージの内部ファイル
- RPMパッケージの内部ファイル

が含まれ、同じファイル名が複数回アップロードされようとして404エラーが発生。

## 要件

1. **macOSビルドの削除**
   - リリースワークフローからmacOSのビルドジョブを削除
   - READMEからmacOS関連の記載を削除

2. **ファイルアップロードパスの修正**
   - Windows: `.msi`と`.exe`ファイルのみをアップロード
   - Linux: `.AppImage`、`.deb`、`.rpm`ファイルのみをアップロード
   - パッケージ内部のファイルは除外

3. **リリースノートの修正**
   - macOS関連の記載を削除
   - WindowsとLinuxのみの説明に更新

## 実装方針

### ファイルパスの指定方法

各プラットフォームで以下のパスを指定：

**Windows (`x86_64-pc-windows-msvc`):**
```
./src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi/*.msi
./src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/*.exe
```

**Linux (`x86_64-unknown-linux-gnu`):**
```
./src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/appimage/*.AppImage
./src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/deb/*.deb
./src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/rpm/*.rpm
```

## 影響範囲

- `.github/workflows/release.yml`: リリースワークフロー
- `README.md`: インストール方法の説明
