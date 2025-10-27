# GitHub Actions による Tauri アプリ自動ビルド・リリース設定 ✅ 完了

## 概要
GitHub Workflows を使用して、Tauri アプリの自動ビルドとリリースページへの公開を行う CI/CD パイプラインを構築しました。

## 目標
- メインブランチへのプッシュ時に自動ビルドテストを実行
- タグプッシュ時にリリースビルドと GitHub Release 作成
- Windows 向けのビルド対応（現時点）
- 自動アップデートのためのアーティファクト生成

## 実装内容

### 1. 作成したワークフローファイル

#### `.github/workflows/build.yml` (継続的インテグレーション) ✅
- **トリガー**: `push` (main/developブランチ), `pull_request` (mainブランチ)
- **プラットフォーム**: Ubuntu 22.04
- **内容**: 基本的なビルドテスト（リリース作成なし）
- **ステータス**: 作成済み・有効化

#### `.github/workflows/release.yml` (リリースビルド) ✅
- **トリガー**: `push` (v*.*.* タグ)
- **プラットフォーム**: Windows (x86_64-pc-windows-msvc) のみ
- **内容**: Windows向けビルド + GitHub Release 自動作成
- **ステータス**: 作成済み・Windows専用に修正

### 2. 使用した主要コンポーネント
- **tauri-action@v0**: Tauri 公式アクションでビルドとリリースを自動化
- **Rust ツールチェーン**: Windows向けビルド
- **Node.js**: フロントエンドビルド用
- **GitHub Token**: リリース作成権限

### 3. ワークフロー実行フロー
1. コードチェックアウト
2. Node.js/Rust 環境セットアップ
3. 依存関係インストール
4. フロントエンドビルド (`npm run build`)
5. Tauri アプリビルド (`tauri build`)
6. リリース作成とアーティファクトアップロード

### 4. 使用方法

#### 通常の開発時
- main/develop ブランチにプッシュすると自動ビルドテストが実行されます

#### リリース時
```bash
# 新しいバージョンリリースの場合
git tag v0.2.7
git push origin v0.2.7
```

### 5. 注意事項と今後の検討事項
- **コード署名**: Windows でのコード署名が必要な場合は別途設定が必要
- **クロスプラットフォーム**: 将来的に macOS/Linux 対応が必要な場合は matrix を拡張
- **ビルド時間**: 大きなバイナリの場合、GitHub Actions の時間/容量制限に注意
- **アップデーター**: 現在の設定では自動アップデート機能が有効

### 6. テスト方法
1. この変更をコミット・プッシュして build.yml が動作するか確認
2. テストタグを作成して release.yml をテスト（例: `v0.2.7-test`）

## 参考情報
- Tauri 公式ドキュメント: https://tauri.app/v1/guides/distribution/publish/github
- tauri-action: https://github.com/tauri-apps/tauri-action
