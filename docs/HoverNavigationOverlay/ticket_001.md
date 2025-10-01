# Ticket #001: 左右ホバーオーバーレイによる画像ナビゲーション
**優先度**: High

## 対象ファイル
- 変更: `src/components/ImageViewer/index.tsx` - オーバーレイUIとホバー制御、ナビゲーションボタンのイベント連携を追加
- 変更: `src/context/AppStateContext.tsx` - 次/前画像取得時のファイルパス更新ロジックと公開APIを拡張
- 変更: `src/lib/tauri.ts` - `get_next_image`/`get_previous_image`呼び出し用のヘルパーを追加
- 変更: `src-tauri/src/img.rs` - フォルダ内画像の時系列ソートと次画像取得ロジックを確認・調整

## 影響範囲
- `ImageViewer`コンポーネントのユーザー操作（ドラッグ・ズーム・回転）との干渉
- フォルダ内画像ナビゲーション（Rustサイドの取得順序）
- アプリ全体の状態管理（`AppStateContext`で保持する画像パスとズーム状態）

## 実装手順
1. `src-tauri/src/img.rs`の`get_folder_images`で作成日時/更新日時を確認し、日付順で安定ソートされるように調整。必要に応じて`get_next_image`/`get_previous_image`の戻り値検証とエラーハンドリングを強化。
2. `src/lib/tauri.ts`にRustコマンド`get_next_image`/`get_previous_image`をラップする非同期関数を追加し、`invoke`利用時のエラー処理とnull保護を組み込む（参考: Tauri公式ドキュメントのinvoke API）。
3. `src/context/AppStateContext.tsx`に新しいナビゲーション関数（例: `loadNextImage`, `loadPreviousImage`）を追加し、取得したパスを`convertFileToAssetUrlWithCacheBust`でアセットURL化して`setCurrentImagePath`へ反映。ファイルパスが未設定の場合のスキップ処理を実装。
4. `src/components/ImageViewer/index.tsx`で左右30%幅のオーバーレイ`div`を絶対配置し、`group-hover`等でホバー時だけ可視化。オーバーレイ内にナビゲーションボタンを配置し、クリック時にコンテキストのナビゲーション関数を呼び出す。
5. オーバーレイのクリックが既存のドラッグ/ズーム操作と干渉しないようにイベント制御を行い、遷移成功時は位置・ズーム状態をリセット（既存の`setPosition`/`setZoomScale`処理を再利用）。
6. ネイティブ呼び出しが失敗した場合にユーザーへ通知（コンソール警告や今後のUI通知フック）を追加し、フォールバックとして現在画像を維持する。

## 完了条件
- [ ] 画像表示領域の左右30%にホバーするとナビゲーションオーバーレイが表示される
- [ ] ボタン操作で日付順に次/前の画像へ遷移し、Rust側のソート結果が反映される
- [ ] 画像遷移後もドラッグ・ズーム・回転機能が従来通り動作する
- [ ] Rust/フロントエンドのエラーハンドリングが実装され、失敗時にクラッシュや未処理例外が発生しない
