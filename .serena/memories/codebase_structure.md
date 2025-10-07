# コードベース構造

## ディレクトリ構成
```
src/
  ├── components/         # UIコンポーネント
  │   ├── Footer/         # フッター（画像パス、ズーム率表示）
  │   ├── ImageViewer/    # 画像表示領域
  │   │   ├── GridMenu.tsx      # グリッド形式選択メニュー
  │   │   ├── GridOverlay.tsx   # グリッド線描画（Canvas）
  │   │   └── index.tsx         # メイン画像ビューアコンポーネント
  │   ├── SettingsMenu/   # 設定メニュー
  │   └── Titlebar/       # カスタムタイトルバー
  ├── context/            # 状態管理
  │   └── AppStateContext.tsx  # グローバル状態管理
  ├── hooks/              # カスタムフック
  │   └── useBoundaryConstraint.ts
  ├── lib/                # ユーティリティ関数
  │   ├── boundaryUtils.ts
  │   ├── fileUtils.ts
  │   ├── imageViewerApi.ts
  │   ├── screenfit.ts
  │   ├── tauri.ts
  │   └── theme.ts
  ├── config/             # アプリケーション設定
  │   └── config.ts
  ├── assets/             # 静的ファイル（SVGアイコン等）
  ├── App.tsx             # ルートコンポーネント
  └── index.tsx           # エントリーポイント

src-tauri/              # Rustバックエンド
  ├── src/
  │   ├── main.rs
  │   ├── lib.rs
  │   └── img.rs
  └── Cargo.toml

docs/                   # ドキュメント、チケット管理
```

## 重要なファイル
- `src/context/AppStateContext.tsx`: グローバル状態（画像パス、ズーム、回転、テーマ、グリッドパターン）を管理
- `src/components/ImageViewer/index.tsx`: メイン画像表示ロジック
- `src/components/ImageViewer/GridOverlay.tsx`: Canvas でグリッド線を描画
- `src/config/config.ts`: アプリケーション設定（ズーム範囲、UI寸法等）
