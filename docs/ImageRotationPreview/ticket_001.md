# Ticket #001: img要素回転プレビュー実装
**優先度**: High

## 対象ファイル
- 変更: `src/features/rotate/ClickManager.ts` - 累積回転角の参照API追加
- 変更: `src/features/rotate/RotateController.ts` - 回転プレビュー制御とリセット処理の導入
- 変更: `src/features/zoom/ZoomController.ts` - transform生成へ回転要素を統合
- 変更: `src/styles.css` - 回転トランジション調整
- 変更: `src/main.ts` - プレビュー初期化呼び出しの追加（必要に応じて）
- 変更: `src/features/imageViewer/ImageLoader.ts` - プレビューリセット連携（必要に応じて）

## 影響範囲
- ビューア画像表示挙動（回転・ズーム・ナビゲーション）
- 回転完了後のズーム/フィット処理
- 回転処理時の安全管理およびエラーハンドリングログ

## 実装手順
1. `ClickManager`に現在の累積回転角度を返すメソッドを追加し、既存のタイマー/リセット挙動に影響しないことを確認する。
2. `RotateController`で回転プレビュー角度を状態管理し、ボタン押下直後に `viewerEl` へ即時反映、完了・キャンセル・エラー時にクリアする処理を追加する。
3. `ZoomController.applyTransform`で回転角をズーム・平行移動と合成し、transform文字列を生成するよう更新する。
4. 画像読み込みイベントおよび回転完了フローと連携してプレビュー角度を初期化する仕組みを組み込む（`RotateController`と`ImageLoader`/`main.ts`を調整）。
5. `styles.css`で `#viewer` のtransformにスムーズなトランジションを付与し、回転時の視認性を向上させる。
6. 新挙動のテストとログを確認し、回転プレビューがズーム・ナビゲーションと共存できることを検証する。

## 完了条件
- [ ] rotateボタン押下直後に `#viewer` が累積角度分だけ回転表示される。
- [ ] 回転処理完了後の画像再読込で追加の回転が残らない。
- [ ] ズーム・ドラッグなど既存のtransform挙動と回転プレビューが干渉しない。
- [ ] 回転エラー/キャンセル時に `#viewer` の回転表示が初期化される。
- [ ] npm run build（または同等のビルド）が成功する。