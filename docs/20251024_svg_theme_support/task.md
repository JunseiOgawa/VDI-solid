# SVGアイコンのテーマ対応 - タスクリスト

## タスク一覧

### 1. SVGファイルの修正

- [x] `public/setting_ge_h.svg`を修正
  - `stroke: #231815;`を`stroke: currentColor;`に変更
- [x] `public/全画面表示ボタン5.svg`を修正
  - `.st0{fill:#4B4B4B;}`を`.st0{fill:currentColor;}`に変更
- [x] `public/reload_hoso.svg`の確認
  - 既に`currentColor`を使用していることを確認（変更不要）

### 2. コンポーネントの修正

- [x] `src/components/Titlebar/index.tsx`を修正
  - フルスクリーンボタンのCSSクラスを変更（Line 258付近）
  - 回転ボタンのCSSクラスを変更（Line 272付近）
  - 設定ボタンのCSSクラスを変更（Line 318付近）
- [x] `src/components/Footer/index.tsx`を修正
  - 設定ボタンのCSSクラスを変更（Line 195付近）

### 3. テストと確認

- [ ] ライトモードでの表示確認
- [ ] ダークモードでの表示確認
- [ ] テーマ切り替え時の動作確認
- [x] ビルドの実行と成功確認

### 4. コードフォーマット

- [x] 変更したファイルにフォーマッターを適用

## 進捗状況

- [x] 設計ドキュメント作成
- [x] タスクリスト作成
- [x] 実装作業（CSSフィルター方式に変更）
- [ ] テスト（ユーザーによる動作確認が必要）
- [ ] 完了

## 実装の変更点

当初は`text-*`クラスで色制御を試みましたが、`<img>`タグで読み込まれたSVGには効果がないため、CSSフィルター方式に変更しました。

- ライトモード: フィルターなし（黒いアイコン）
- ダークモード: `dark:brightness-0 dark:invert`（白いアイコン）
