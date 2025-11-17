# Linux対応 設計書

## 概要

VDI-solidアプリケーションをLinuxプラットフォームでもビルド・実行できるようにする。

## 背景

### 現在の実装状況

- **対応プラットフォーム**: Windows、macOS
- **Tauri設定**: `tauri.conf.json`にLinux設定(deb)は存在
- **ビルドスクリプト**: `package.json`に`tauri:build:linux`が存在
- **GitHub Actions**: Windows向けのビルドジョブのみ実装

### 問題点

1. GitHub Actionsワークフローにはlinux向けのビルドジョブが存在しない
2. Linuxビルドのテストが行われていない
3. Linux固有の依存関係やシステム要件が明確化されていない
4. ドキュメントにLinux対応状況が記載されていない

## 要件

### 機能要件

1. **ビルド対応**
   - Linuxプラットフォーム(x86_64-unknown-linux-gnu)でのビルドが成功すること
   - DEBパッケージが正常に生成されること
   - AppImageフォーマットの追加も検討

2. **自動更新対応**
   - Linux向けの自動更新機能をサポート
   - `latest.json`にlinux-x86_64プラットフォーム情報を含める
   - 署名検証機能の実装

3. **GitHub Actions対応**
   - リリース時にLinux向けビルドを自動実行
   - Windows/macOSビルドと並行して実行
   - ビルド成果物を自動的にGitHub Releasesにアップロード

### 非機能要件

1. **互換性**
   - Ubuntu 20.04 LTS以降で動作すること
   - 主要なLinuxディストリビューション(Debian、Fedora、Archなど)での動作を想定

2. **パフォーマンス**
   - Windows/macOSと同等のパフォーマンスを維持

3. **保守性**
   - プラットフォーム固有のコードは最小限に
   - 既存のWindows/macOS実装に影響を与えない

## 設計

### 1. GitHub Actionsワークフローの拡張

#### ファイル: `.github/workflows/release.yml`

**変更内容**:
- `build-linux`ジョブを追加
- Linux環境(ubuntu-latest)でのビルドを実行
- 必要なシステム依存関係のインストール
- 生成された.deb、.AppImageファイルをリリースにアップロード

**必要なシステム依存関係**:
```bash
# Tauri Linux依存関係
- libwebkit2gtk-4.1-dev
- build-essential
- curl
- wget
- file
- libxdo-dev
- libssl-dev
- libayatana-appindicator3-dev
- librsvg2-dev
```

### 2. tauri.conf.jsonの拡張

**現在の設定**:
```json
"linux": {
  "deb": {
    "files": {
      "/usr/share/doc/vdi-solid/": "../licenses/EULA_EN.txt"
    }
  }
}
```

**追加する設定**:
```json
"linux": {
  "deb": {
    "files": {
      "/usr/share/doc/vdi-solid/": "../licenses/EULA_EN.txt"
    },
    "depends": []
  },
  "appimage": {
    "bundleMediaFramework": false
  }
}
```

### 3. アップデータ対応の拡張

#### ファイル: `.github/workflows/release.yml`

**latest.json生成の拡張**:
- Windowsに加えてLinuxプラットフォームの情報を追加
- Linux向けの署名ファイル(.AppImage.sig)を含める

**想定フォーマット**:
```json
{
  "version": "0.3.7",
  "notes": "Automatic update for v0.3.7",
  "pub_date": "2025-11-17T00:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "url": "https://github.com/.../vdi-solid_0.3.7_x64_en-US.exe",
      "signature": "..."
    },
    "linux-x86_64": {
      "url": "https://github.com/.../vdi-solid_0.3.7_amd64.AppImage",
      "signature": "..."
    }
  }
}
```

### 4. ドキュメントの更新

#### README.md

**追加する情報**:
- Linuxビルド手順
- Linux固有の前提条件
- Linuxでのインストール方法
- 動作確認済みディストリビューション一覧

## 実装計画

### Phase 1: 基本ビルド対応
1. GitHub ActionsにLinuxビルドジョブを追加
2. システム依存関係の設定
3. DEBパッケージの生成確認

### Phase 2: AppImageサポート
1. tauri.conf.jsonにappimage設定を追加
2. AppImage生成の確認
3. 署名ファイルの生成確認

### Phase 3: アップデータ対応
1. latest.json生成スクリプトの拡張
2. Linux向け署名検証の実装
3. アップデータ機能のテスト

### Phase 4: ドキュメント整備
1. README.mdの更新
2. CONTRIBUTING.mdへのLinux開発環境セットアップガイド追加
3. トラブルシューティング情報の追加

## 検証項目

### ビルド検証
- [ ] Ubuntu 22.04でのビルドが成功すること
- [ ] DEBパッケージが正常に生成されること
- [ ] AppImageが正常に生成されること
- [ ] 署名ファイル(.sig)が生成されること

### 実行検証
- [ ] Ubuntu 22.04でのアプリケーション起動
- [ ] 基本機能(画像表示、ズーム、回転など)の動作確認
- [ ] ファイルダイアログの動作確認
- [ ] 自動更新機能の動作確認

### リリース検証
- [ ] GitHub Actionsでのビルドが成功すること
- [ ] GitHub Releasesにファイルがアップロードされること
- [ ] latest.jsonが正しく生成されること
- [ ] 実際のアップデート処理が動作すること

## リスクと対応策

### リスク1: Linux固有の依存関係の問題
**対応策**:
- 各ディストリビューションごとの依存関係をドキュメント化
- Dockerを使用した再現可能なビルド環境の提供

### リスク2: 異なるディストリビューション間での互換性
**対応策**:
- AppImageフォーマットを主要配布形式とする
- 主要ディストリビューションでの動作確認を実施

### リスク3: 自動更新の署名検証の複雑さ
**対応策**:
- Tauri公式ドキュメントのベストプラクティスに従う
- 段階的にリリースして検証

## 参考資料

- [Tauri Linux Prerequisites](https://v2.tauri.app/start/prerequisites/#linux)
- [Tauri Bundle Configuration](https://v2.tauri.app/reference/config/#bundle)
- [Tauri Updater Plugin](https://v2.tauri.app/plugin/updater/)
