# VDI-solid (eGUI) リリースフロー

このプロジェクトは GitHub Actions を使用してリリースプロセスを自動化しています。

## リリース手順

1. **バージョン更新**
   `src-tauri/Cargo.toml` の `version` を更新します。

   ```toml
   [package]
   version = "0.4.1" # ここを更新
   ```

2. **コミット**
   変更をコミットします。

   ```bash
   git add .
   git commit -m "chore: bump version to v0.4.1"
   ```

3. **タグ作成**
   バージョン番号に対応するタグを作成します（`v` プレフィックス必須）。

   ```bash
   git tag v0.4.1
   ```

4. **プッシュ（リリース開始）**
   タグをリモートにプッシュすると、GitHub Actions (`.github/workflows/release-egui.yml`) がトリガーされ、自動的にビルドとリリース作成が行われます。

   ```bash
   git push origin main --tags
   ```

## ワークフロー詳細

- **定義ファイル**: `.github/workflows/release-egui.yml`
- **トリガー**: `v*` で始まるタグのプッシュ
- **実行内容**:
  - Rust環境のセットアップ (Windows)
  - `vdi-egui` バイナリのビルド (Releaseモード)
  - EXEファイルのアーティファクト化 (`vdi-solid_windows_x64.exe`)
  - GitHub Releaseの作成とアセットのアップロード

## パッチノート

リリース時にAIを使用して変更履歴からパッチノートを作成し、Releaseの本文に含めることを推奨します。
