# Ticket #001: タイトルバーからグリッド表示を切り替える
**優先度**: High

## 対象ファイル
- 新規: `src/components/ImageViewer/GridOverlay.tsx` - 画像サイズに追従するグリッド描画コンポーネント
- 新規: `src/components/ImageViewer/GridMenu.tsx` - グリッド形式選択用ドロップダウンメニュー
- 変更: `src/context/AppStateContext.tsx` - グリッド表示状態のシグナルと更新関数を追加
- 変更: `src/components/ImageViewer/index.tsx` - グリッド表示ロジックの組み込みとコメント追加
- 変更: `src/components/Titlebar/index.tsx` - Gridボタンとメニュー開閉処理を追加
- 変更（必要に応じて）: `src/App.css` - グリッド線のスタイル調整

## 影響範囲
- `src/components/Titlebar/index.tsx` - UIボタンのレイアウトとイベントハンドリング
- `src/components/ImageViewer/index.tsx` - 画像レンダリング挙動とDOM構造
- `src/context/AppStateContext.tsx` - グローバルステート契約 (利用側での型依存箇所)
- `src/components/SettingsMenu/index.tsx` など `useAppState` を利用するコンポーネント (型追加の影響確認)

## 実装手順
1. `AppState` に `gridPattern`（'off' | '3x3' | '5x3' | '4x4' など）と `setGridPattern` を追加し、`AppProvider` 内で `createSignal` を定義。初期値は `'off'` とし、JSDoc コメントで役割を明記。
2. `src/components/ImageViewer/GridOverlay.tsx` を作成し、`displaySize`・`gridPattern` を受け取って線数に応じた CSS グリッド背景を返すコンポーネントを実装。transform に合わせるために `style` で幅・高さと `pointer-events: none` を設定し、可読性向上のコメントを挿入。
3. `src/components/ImageViewer/GridMenu.tsx` を作成し、`GridPattern` 一覧と選択ハンドラを props で受け取るシンプルなリスト UI を実装。Titlebar から使えるように export し、各項目に説明コメントを添える。
4. `src/components/ImageViewer/index.tsx` で `gridPattern` を取得し、画像表示ブロックをラップして `GridOverlay` を条件描画。画像の `onLoad` やズーム処理後に `displaySize` を更新する既存ロジックを活用し、コメントで関連性を説明。
5. `src/components/Titlebar/index.tsx` に `gridBtn` を追加。`createSignal` でメニュー表示状態を管理し、設定メニュー同様の絶対配置で `GridMenu` を表示。ボタンのARIAラベル・タイトルを設定し、操作意図をコメントに記す。
6. 必要なら `src/App.css` にグリッド線の色・透過調整クラスを追加し、`GridOverlay` のクラス名から参照できるようコメントする。
7. 型エラー解消と動作確認のため `tsc --noEmit` と `npm run lint`（存在する場合）を実行し、UI表示を簡易確認。必要に応じて `README.md` にグリッド機能のメモを追加検討。

## 完了条件
- [x] グリッドボタンから 3x3 / 5x3 / 4x4 / OFF を選択でき、選択状況が AppState に反映される
- [x] 選択したグリッド線が画像の表示サイズと回転・ズームに追従して正しく重なる
- [x] 新設コンポーネントや主要ロジックに説明コメントが付与されている
- [x] `tsc --noEmit` と利用可能なリンターが警告なく完了
- [ ] 既存の設定メニュー挙動や他ボタン動作に退行がないことを手動確認
