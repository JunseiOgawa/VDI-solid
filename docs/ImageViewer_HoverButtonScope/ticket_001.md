# Ticket #001: ImageViewer — 前/次ボタンの表示スコープをホバー要素に限定
**優先度**: Medium

## 概要
`src/components/ImageViewer/index.tsx` において、checkerboard 背景（`.checkerboard-bg`）にマウスをホバーすると、左右両方のナビゲーションボタン（「前の画像」「次の画像」）が同時に表示されてしまう不具合があります。

目的は、ボタン要素自体の上にマウスが来たときのみそのボタンを表示・有効化（opacity と pointer-events）するように振る舞いを変更することです。加えて、キーボードフォーカスやタッチデバイスの挙動にも配慮します。

## 対象ファイル
- 変更: `src/components/ImageViewer/index.tsx` — ボタンの classList / イベント処理を変更
- 変更（必要に応じて）: `src/App.css` またはグローバルスタイル（Tailwind 設定を使用している場合は不要） — ホバー・フォーカス時のユーティリティが不足している場合に調整

## 影響範囲
- `src/components/ImageViewer/index.tsx` の左/右ナビゲーションボタンの表示・操作タイミング
- ボタンのアクセシビリティ（キーボードフォーカスで表示されるべきか）
- タッチデバイスでの操作（hover が利用できない環境）

## 実装手順（差分思考・最小コスト）
1. 変更方針の決定（前提）
   - 既存の実装は `group` と `group-hover:*` を使い、親要素（checkerboard-bg）にホバーすると両ボタンが表示される仕組みになっている。
   - 最小変更で解決する選択肢は、各ボタン自身の hover / focus（および touch）で表示を切り替える実装に変えること。
   - 追加でステートを導入して制御する（Solid の createSignal）か、CSS の `:hover` / `:focus` ヘルパーで対処するかを選ぶ。最も確実で拡張性があるのは「小さなローカル状態（isHoverPrev/isHoverNext）を追加して JSX の classList を切り替える」方法。

2. `src/components/ImageViewer/index.tsx` の編集
   - 新規に以下のローカルシグナルを導入する（コンポーネント内上部）
     - `const [isHoverPrev, setIsHoverPrev] = createSignal(false);`
     - `const [isHoverNext, setIsHoverNext] = createSignal(false);`
   - 左ボタンに対して以下のハンドラを追加／変更
     - JSX props: `onMouseEnter={() => setIsHoverPrev(true)}`, `onMouseLeave={() => setIsHoverPrev(false)}`
     - 追加でキーボードアクセシビリティのために `onFocus` / `onBlur` を同様に追加
     - classList の条件を `group-hover:*` から `isHoverPrev()` に置き換え（表示用の opacity と pointer-events の制御）
   - 右ボタンに対しても同様に `isHoverNext` を追加して施す
   - 既存の `disabled` ロジック（`!canNavigate() || isNavigating()`）は維持しつつ、hover/ focus による表示は `canNavigate()` が true の場合にのみ有効になるようにする
   - 可能なら `onTouchStart` のフォールバックを追加して、タッチデバイスでも操作可能にする（例: `onTouchStart={() => setIsHoverPrev(true)}` と `onTouchEnd`／`onTouchCancel` で解除）。ただしタッチは指移動で誤検知しやすいため簡潔に扱うこと。

3. CSS/Tailwind クラスの最小調整
   - 既存の `opacity-0` / `transition-opacity` / `pointer-events-none` の組み合わせは維持し、`classList` で `opacity-100` と `pointer-events-auto` を制御する。
   - もしプロジェクトが Tailwind をフル活用していれば追加の CSS は不要。プロジェクト固有のユーティリティが無ければ最小の CSS を `src/App.css` に追加する（ただしこの変更は最小に留める）。

4. アクセシビリティの追加（推奨だが最小実装ではオプション）
   - ボタンに `aria-hidden` をホバー状態に応じて切り替える
   - キーボードフォーカスで表示するため `onFocus` / `onBlur` を実装

5. テスト/確認手順
   - デスクトップ（マウス）で、checkerboard 上にカーソルを置いてもボタンは表示されないこと
   - 左ボタンの上にマウスを動かすと左ボタンのみが表示・クリック可能になること
   - 右ボタン上にマウスを動かすと右ボタンのみが表示・クリック可能になること
   - キーボード Tab によるフォーカスでボタンが表示され、Enter/Space で動作すること
   - タッチデバイスで必要最低限操作できること（必要ならタッチフォールバックの実装を微調整）

## 完了条件
- [ ] マウスで左側領域にホバーしても右ボタンが表示されなくなっている
- [ ] 左右ボタンはそれぞれ自身の上にマウスが来たときのみ表示・pointer-events が有効になる
- [ ] 既存の `disabled`（ナビゲーション不可 / 処理中）状態は保持される
- [ ] キーボードフォーカスでボタンが表示され操作できる
- [ ] 主要なビルドで型エラーが発生しない（TypeScript の型チェック）
- [ ] 目視による動作確認が完了している（スクリーンショットや短い動画があれば添付推奨）

## 実装における注意点 / エッジケース
- 現実装では `group-hover` によるインタラクションが他のスタイルにも影響している可能性があるため、切り替え時に CSS の副作用を確認すること
- タッチデバイスは hover を持たないため、タッチ操作での代替 UX（ボタン常時表示、あるいはタッチ開始で表示）を検討する必要がある。今回のチケットでは最小実装として「タッチでは既存の canNavigate による常時表示を許容」する選択肢を提示する
- 画面リサイズやスクロールでの表示崩れがないかを確認

## 実装担当者への補足（推奨コード片は示しません）
- Solid の `createSignal` を用いてローカルステートを追加する案が最も扱いやすく、将来的な機能追加（ホットキー表示・アニメーション制御）にも拡張しやすい
- CSS のみで完結させたい場合は、ボタン要素自体に `hover:opacity-100 hover:pointer-events-auto focus:opacity-100 focus:pointer-events-auto` を付与する方法でも対応可能だが、キーボードフォーカスの取り扱いを確実にするために `onFocus`/`onBlur` を追加することを推奨します

---

## 次のアクション
1. このチケットの内容で着手して良いか確認してください（問題なければ実装に移ります）
2. 実装後、PR を作成してください。PR には変更点の要約とスクリーンショット（before/after）を添付してください

---

`#serena` `#Context7`
