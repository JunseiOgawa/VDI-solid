# 推奨コマンド

## 開発コマンド
```bash
# 開発サーバー起動（Tauri Dev）
npm run dev

# 通常の Vite 開発サーバー
npm run start

# ビルド
npm run build

# プレビュー
npm run serve

# Tauri コマンド直接実行
npm run tauri [command]
```

## 型チェック・テスト
```bash
# TypeScript 型チェック
npx tsc --noEmit

# もし lint コマンドがあれば
npm run lint
```

## ビルド・リリース
```bash
# プロダクションビルド
npm run build

# Tauri アプリケーションのビルド
npm run tauri build
```

## Windows 固有（Git Bash）
```bash
# ディレクトリ一覧
ls -la

# ファイル検索
find . -name "*.tsx"

# 文字列検索
grep -r "GridOverlay" src/
```

## よく使うコマンド
- `npm install`: 依存関係のインストール
- `npm run dev`: 開発環境でアプリケーションを起動（最も頻繁に使用）
- `npx tsc --noEmit`: 型エラーチェック（コミット前推奨）
