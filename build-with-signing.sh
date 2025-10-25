#!/bin/bash
# Git Bash用のビルドスクリプト

# .envファイルから環境変数を読み込む
export $(cat .env | xargs)

# ビルド実行
npm run tauri build
