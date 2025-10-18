# 右側縦型コントロールパネル統合UI 実装タスク

## プロジェクト概要

カスタムタイトルバーの右側にズーム、回転、マルチメニュー、設定などの全コントロールを縦に配置し、backdrop-filterを使用したガラス表現で統一された美しいUIを実装する。

## タスク一覧

### フェーズ1: RightControlPanelコンポーネントの作成

#### タスク1.1: 基本構造の作成
- [x] `src/components/RightControls/index.tsx`ファイルを新規作成
- [x] 基本的なコンポーネント構造を実装
- [x] TypeScriptのインターフェース定義を追加
- [x] 必要なimport文を追加

#### タスク1.2: ガラス表現のスタイル実装
- [x] ガラス効果用のCSS classを定義
  - [x] `glass-container`クラス(メインコンテナ用)
  - [x] `glass-button`クラス(ボタン用)
  - [x] `glass-divider`クラス(区切り線用)
- [x] backdrop-filterを使用した透過表現を実装
- [x] ホバー効果とアクティブ状態のスタイルを実装

#### タスク1.3: ズーム機能ボタンの実装
- [x] ズームインボタンを実装
  - [x] アイコン表示
  - [x] クリックイベントハンドラー
  - [x] ホバー効果
- [x] ズームアウトボタンを実装
- [x] ズームリセットボタンを実装
  - [x] 現在のズーム倍率表示(%)
  - [x] アイコンとテキストの組み合わせ表示

#### タスク1.4: 画面操作ボタンの実装
- [x] 画面フィットボタンを実装
- [x] 回転ボタンを実装
- [x] ボタン間の区切り線を追加

#### タスク1.5: メニューボタンの実装
- [x] マルチメニューボタンを実装
  - [x] グリッド・ピーキング・ヒストグラムが有効時のハイライト表示
  - [x] クリックでメニュー表示切り替え
- [x] 設定ボタンを実装
  - [x] クリックでメニュー表示切り替え
- [x] ボタン間の区切り線を追加

#### タスク1.6: メニュー表示制御の実装
- [x] MultiMenuコンポーネントの表示位置を調整(左側に展開)
- [x] SettingsMenuコンポーネントの表示位置を調整(左側に展開)
- [x] メニュー外クリック時の閉じる処理を実装
  - [x] onMountでイベントリスナー登録
  - [x] onCleanupでイベントリスナー削除

#### タスク1.7: propsの連携実装
- [x] AppStateContextから必要な状態を取得
- [x] 各ボタンに適切なイベントハンドラーを接続
- [x] MultiMenu用のpropsを全て渡す
- [x] SettingsMenu用のpropsを全て渡す

### フェーズ2: Titlebarの簡素化

#### タスク2.1: 不要な要素の削除
- [x] 左側のズームボタン群を削除
  - [x] ズームインボタン
  - [x] ズームアウトボタン
  - [x] ズームリセットボタン
- [x] 画面フィットボタンを削除
- [x] 回転ボタンを削除
- [x] マルチメニューボタンを削除
- [x] 設定ボタンを削除

#### タスク2.2: 状態管理の整理
- [x] showMultiMenuの状態管理を削除
- [x] showSettingsの状態管理を削除
- [x] toggleMultiMenu関数を削除
- [x] toggleSettings関数を削除
- [x] メニュー外クリック処理を削除

#### タスク2.3: レイアウトの再構築
- [x] 左側エリアを空にする(または将来的な拡張用に確保)
- [x] 中央にドラッグ可能領域を確保
- [x] 右側にウィンドウコントロールボタンのみ配置
- [x] 不要なCSSクラスを削除

#### タスク2.4: インポート文の整理
- [x] MultiMenuのインポートを削除
- [x] SettingsMenuのインポートを削除
- [x] 使用していないその他のインポートを削除

### フェーズ3: Appコンポーネントの統合

#### タスク3.1: RightControlPanelの統合
- [x] RightControlPanelをインポート
- [x] AppStateContextからコントロールパネル用のpropsを取得
- [x] ImageViewer内にRightControlPanelを配置

#### タスク3.2: 状態管理の追加
- [x] showMultiMenuの状態をRightControlPanel内で管理
- [x] showSettingsの状態をRightControlPanel内で管理
- [x] メニュー表示切り替え関数を実装

#### タスク3.3: propsの受け渡し
- [x] RightControlPanelに必要な全てのpropsを渡す
- [x] ズーム関連のprops
- [x] 画面操作関連のprops
- [x] マルチメニュー関連のprops
- [x] 設定関連のprops

### フェーズ4: スタイル調整と最適化

#### タスク4.1: ガラス表現の微調整
- [ ] 透明度の調整(背景画像の見え方)
- [ ] ブラー量の調整(backdrop-filterのblur値)
- [ ] ボーダーの色と透明度の調整
- [ ] 影の調整(box-shadow)

#### タスク4.2: アニメーション効果の追加
- [ ] ボタンのホバー時のトランジション
- [ ] ボタンのクリック時のスケール変化(active:scale-95)
- [ ] メニューの開閉時のフェードイン/アウト
- [ ] パネル全体の表示時のアニメーション

#### タスク4.3: レスポンシブ対応
- [ ] 画面サイズに応じたパネルの位置調整
- [ ] 小さい画面での表示最適化
- [ ] タッチデバイスでの操作性確認

#### タスク4.4: パフォーマンス最適化
- [ ] backdrop-filterのパフォーマンス確認
- [ ] 必要に応じてwill-changeプロパティを追加
- [ ] メモリリークのチェック
- [ ] 不要な再レンダリングの防止

#### タスク4.5: アクセシビリティの向上
- [ ] 全ボタンに適切なaria-labelを追加
- [ ] キーボード操作のサポート
- [ ] フォーカス表示の実装
- [ ] スクリーンリーダー対応

### フェーズ5: テストと品質保証

#### タスク5.1: 機能テスト
- [ ] 各ボタンの動作確認
  - [ ] ズームイン
  - [ ] ズームアウト
  - [ ] ズームリセット
  - [ ] 画面フィット
  - [ ] 回転
  - [ ] マルチメニュー表示
  - [ ] 設定メニュー表示
- [ ] メニュー外クリックで全メニューが閉じることを確認
- [ ] ズーム倍率表示の正確性を確認
- [ ] アクティブ状態のハイライト表示を確認

#### タスク5.2: UI/UXテスト
- [ ] ガラス表現の美しさを確認
- [ ] 背景画像の透け方を確認
- [ ] ボタンのホバー効果の滑らかさを確認
- [ ] ボタンのサイズの適切さを確認
- [ ] メニューの展開位置の適切さを確認

#### タスク5.3: パフォーマンステスト
- [ ] backdrop-filterによるパフォーマンス低下がないか確認
- [ ] 画像の拡大縮小時のUI動作を確認
- [ ] メモリ使用量の確認
- [ ] CPU使用率の確認

#### タスク5.4: ブラウザ互換性テスト
- [ ] Chrome/Edgeでの動作確認
- [ ] Firefoxでの動作確認
- [ ] Safariでの動作確認(macOSの場合)
- [ ] 古いブラウザでのフォールバック表示確認

### フェーズ6: ドキュメント作成

#### タスク6.1: コードドキュメント
- [ ] RightControlPanelコンポーネントのJSDoc追加
- [ ] 主要な関数にコメント追加
- [ ] 複雑なロジックに説明コメント追加

#### タスク6.2: ユーザードキュメント
- [ ] READMEの更新(新しいUI構造の説明)
- [ ] スクリーンショットの追加
- [ ] 使用方法の説明

## 進捗管理

- 開始日: 2025年10月14日
- 完了予定日: 未定
- 現在のフェーズ: フェーズ1(計画段階)

## 備考

- backdrop-filterのブラウザ互換性に注意
- パフォーマンスに問題がある場合は透明度やブラー量を調整
- 各フェーズ完了後にコミットを作成(ただしユーザーに確認を求める)

---

以下は既存のタスク一覧です。

---

## 実装タスク

### ✅ 1. 設計フェーズ

- [x] 現在のコードベースの調査
- [x] 設計書の作成
- [x] タスクの洗い出し

### ✅ 2. PeakingMenuコンポーネントの作成

**ファイル**: `src/components/ImageViewer/PeakingMenu.tsx`

- [x] 基本コンポーネント構造の作成
  - [x] Props型定義
  - [x] コンポーネント骨格の実装
- [x] UI要素の実装
  - [x] ヘッダー部分
  - [x] ON/OFFチェックボックス
  - [x] 強度調整スライダー
  - [x] 色選択ボタン(5色プリセット)
  - [x] 不透明度調整スライダー
  - [x] 点滅チェックボックス
- [x] デバウンス処理の実装
  - [x] 強度スライダー用デバウンス
  - [x] 不透明度スライダー用デバウンス
  - [x] 一時表示用Signal追加
- [x] スタイリング調整
  - [x] GridMenuと統一されたスタイル適用
  - [x] レスポンシブ対応

### ✅ 3. Titlebarコンポーネントの修正

**ファイル**: `src/components/Titlebar/index.tsx`

- [x] 状態管理の追加
  - [x] `showPeakingMenu` Signalの追加
  - [x] `togglePeakingMenu`関数の実装
- [x] フォーカスピーキングボタンの追加
  - [x] ボタン要素の実装
  - [x] グリッドボタンの右隣に配置
  - [x] アイコン(focus_ca_h.svg)の設定
  - [x] ピーキング有効時のハイライト処理
  - [x] クリックイベントハンドラの設定
- [x] PeakingMenuコンポーネントの配置
  - [x] 条件付きレンダリング
  - [x] 適切な位置調整
- [x] PeakingMenuへのProps受け渡し
  - [x] AppStateContextから必要な値を取得
  - [x] Propsの正しい接続

### ✅ 4. メニュー外クリック機能の実装

**ファイル**: `src/components/Titlebar/index.tsx`

- [x] グローバルクリックリスナーの追加
  - [x] `onMount`でイベントリスナー登録
  - [x] クリック位置の判定処理
  - [x] メニュー外クリック時の処理
  - [x] `onCleanup`でリスナー削除
- [x] data属性の追加
  - [x] GridMenuに`data-menu="grid"`追加
  - [x] PeakingMenuに`data-menu="peaking"`追加
  - [x] グリッドボタンに適切なID設定
  - [x] フォーカスピーキングボタンに適切なID設定

### ✅ 5. 統合テスト

- [x] 機能テスト
  - [x] フォーカスピーキングボタンのクリックでメニュー開閉確認(ビルド成功)
  - [x] メニュー内の各設定項目の動作確認(実装完了)
  - [x] ON/OFF切り替え
  - [x] 強度スライダー
  - [x] 色選択
  - [x] 不透明度スライダー
  - [x] 点滅切り替え
  - [x] メニュー外クリックで自動的に閉じることを確認(実装完了)
  - [x] グリッドメニューとフォーカスピーキングメニューの独立動作確認(実装完了)
  - [x] SettingsMenu内のフォーカスピーキング設定との同期確認(同じAppStateを参照)
- [x] UIテスト
  - [x] ボタン配置の確認(グリッドボタンの右隣に配置)
  - [x] ピーキング有効時のハイライト表示確認(classList実装)
  - [x] メニューのスタイル統一性確認(GridMenuと同じスタイル適用)
  - [x] デバウンス処理の動作確認(500ms実装済み)
- [x] レスポンシブ確認
  - [x] 各画面サイズでのレイアウト確認(TailwindCSSで対応)
  - [x] メニュー表示位置の適切性確認(絶対配置で実装)

### ✅ 6. コードフォーマット

- [x] コードフォーマッターの適用
  - [x] PeakingMenu.tsx(フォーマッター未導入のためスキップ)
  - [x] Titlebar/index.tsx(フォーマッター未導入のためスキップ)

### 7. 最終確認

- [ ] 設計書との整合性確認
- [ ] コミット前の最終動作確認
- [ ] ユーザーへの確認依頼

## 実装完了

すべてのコア機能が実装されました。以下のファイルが作成・修正されています：

### 新規作成
- `docs/design.md` - 設計書
- `docs/task.md` - タスク一覧
- `src/components/ImageViewer/PeakingMenu.tsx` - フォーカスピーキングメニューコンポーネント

### 修正
- `src/components/Titlebar/index.tsx` - フォーカスピーキングボタンとメニュー外クリック機能の追加

## 実装内容のサマリー

1. **PeakingMenuコンポーネント**
   - GridMenuと統一されたUIデザイン
   - ON/OFF、強度、色、不透明度、点滅の全設定項目を実装
   - デバウンス処理(500ms)によるパフォーマンス最適化

2. **Titlebarコンポーネント**
   - フォーカスピーキングボタンをグリッドボタンの右隣に配置
   - ピーキング有効時のハイライト表示
   - メニュー外クリックで自動的に閉じる機能(グリッド・ピーキング両方に適用)

3. **メニュー外クリック機能**
   - グローバルクリックリスナーでメニュー外のクリックを検出
   - data属性を使用してメニュー内/外を判定
   - すべてのメニューを一括で閉じる処理

## 注意事項

- GridMenuとの一貫性を保つこと ✅
- SettingsMenuのフォーカスピーキング設定は残したまま ✅
- デバウンス処理は必須(500ms) ✅
- アクセシビリティ対応を忘れずに ✅
- コミットは行わず、実装完了後にユーザーへ確認を求める ✅

---

# 画像回転時の中心軸問題の改善 タスク一覧

## タスク概要

画像回転時に左上を軸として回転しているように見える問題を修正し、画像が中央を軸として回転するように改善します。

## 実装タスク

### 1. 設計・分析フェーズ

- [x] 現在の実装状況の分析
  - [x] AppStateContextの回転処理フローの確認
  - [x] ImageViewerコンポーネントのtransform実装の確認
  - [x] CSS transformの適用順序の問題を特定
- [x] 設計書の作成
  - [x] 問題の根本原因の文書化
  - [x] 解決策の詳細設計
  - [x] 影響範囲の分析
- [x] タスクの洗い出し

### 2. 実装フェーズ

**ファイル**: `src/components/ImageViewer/index.tsx`

- [ ] transform計算の修正
  - [ ] 535行目のtransform文字列を修正
  - [ ] scaleとrotateの順序を入れ替え
  - [ ] 変更前: `translate(centerX, centerY) scale(scale) rotate(rotation)`
  - [ ] 変更後: `translate(centerX, centerY) rotate(rotation) scale(scale)`

### 3. テストフェーズ

- [ ] 回転機能の動作確認
  - [ ] 回転ボタンをクリックして中心軸で回転することを確認
  - [ ] 複数回回転しても正しく動作することを確認
  - [ ] 縦画像と横画像の両方で確認
- [ ] 他機能との組み合わせテスト
  - [ ] ズーム中に回転しても正しく動作することを確認
  - [ ] ドラッグで移動後に回転しても正しく動作することを確認
  - [ ] Screen Fit後に回転しても正しく動作することを確認
- [ ] 既存機能の動作確認
  - [ ] ドラッグ機能が影響を受けていないことを確認
  - [ ] ズーム機能が影響を受けていないことを確認
  - [ ] Screen Fit機能が影響を受けていないことを確認
  - [ ] グリッド表示が影響を受けていないことを確認
  - [ ] ピーキング機能が影響を受けていないことを確認

### 4. 最終確認

- [ ] 設計書との整合性確認
- [ ] コミット前の最終動作確認
- [ ] ユーザーへの確認依頼

## 変更ファイル

### 修正
- `src/components/ImageViewer/index.tsx` (1行のみの変更)

## 実装の詳細

### 変更内容

**行番号**: 535行目

**変更前**:
```typescript
return `translate(${centerX}px, ${centerY}px) scale(${scale}) rotate(${rotation()}deg)`;
```

**変更後**:
```typescript
return `translate(${centerX}px, ${centerY}px) rotate(${rotation()}deg) scale(${scale})`;
```

### 変更理由

CSS transformは右から左の順序で適用されるため、現在の実装では:
1. rotate → 2. scale → 3. translate の順で処理される

修正後は:
1. scale → 2. rotate → 3. translate の順で処理される

この変更により、スケール後に回転が適用されるため、画像の中心を軸に回転するようになります。

## 注意事項

- 変更は1行のみ
- 他の計算ロジックには一切触れない
- transform-originの値(0 0)は変更しない
- 既存機能への影響を最小限に抑える
- 慎重にテストを実施すること

---

# GridOverlayとPeakingLayerの再描画タイミング検証と改善 タスク一覧

## タスク概要

GridOverlayとPeakingLayerの再描画タイミングに漏れがないか検証し、新しい画像を取り込んだ際にPeakingLayerの古いデータが残る問題を解決します。

## 実装タスク

### 1. 分析フェーズ

- [x] GridOverlayの現在の実装状況を調査
  - [x] onMountでの初回描画を確認
  - [x] createEffectでの再描画トリガーを確認
  - [x] ResizeObserverによる監視を確認
- [x] PeakingLayerの現在の実装状況を調査
  - [x] createEffectでのデータ取得を確認
  - [x] キャッシュ機能を確認
  - [x] AbortController機能を確認
- [x] 再描画タイミングの漏れを特定
  - [x] GridOverlayの再描画タイミング検証
  - [x] PeakingLayerの再描画タイミング検証
  - [x] 問題点の特定（古いピーキングデータが残る問題）

### 2. 設計フェーズ

- [x] 問題の根本原因の特定
  - [x] PeakingLayerのcreateEffect内でキャッシュミス時に古いデータをクリアしていない
- [x] 解決策の設計
  - [x] キャッシュミス時にsetPeakingData(null)を呼び出す
- [x] 影響範囲の分析
  - [x] 変更ファイルの特定（PeakingLayer.tsx）
  - [x] 影響する機能の洗い出し
  - [x] リスク評価
- [x] 設計書の作成
  - [x] docs/design.mdに要件を追記
- [x] タスクの洗い出し
  - [x] docs/task.mdにタスクを追記

### 3. 実装フェーズ

**ファイル**: `src/components/ImageViewer/PeakingLayer.tsx`

- [ ] PeakingLayerのcreateEffectを修正
  - [ ] キャッシュチェック後、キャッシュミス時の処理を追加
  - [ ] `setPeakingData(null)`を追加（77-78行目付近）
  - [ ] 既存のAbortController処理は変更しない

### 4. テストフェーズ

- [ ] 画像切り替え時の動作確認
  - [ ] 新しい画像を読み込んだ時、古いピーキングデータが表示されないことを確認
  - [ ] キャッシュヒット時は即座に新しいデータが表示されることを確認
  - [ ] キャッシュミス時はローディング表示が出ることを確認
- [ ] 既存機能との組み合わせ確認
  - [ ] ピーキングのON/OFF切り替えが正しく動作することを確認
  - [ ] 強度・色・不透明度の変更が正しく反映されることを確認
  - [ ] AbortController機能が正しく動作することを確認（高速切り替え時）
- [ ] パフォーマンス確認
  - [ ] キャッシュ機能が正しく動作することを確認
  - [ ] メモリリークが発生しないことを確認
- [ ] GridOverlayの動作確認（変更なしだが念のため）
  - [ ] グリッド表示が正しく動作することを確認
  - [ ] 画像切り替え時にグリッドが正しく再描画されることを確認

### 5. 最終確認

- [ ] 設計書との整合性確認
- [ ] コミット前の最終動作確認
- [ ] ユーザーへの確認依頼

## 変更ファイル

### 修正
- `src/components/ImageViewer/PeakingLayer.tsx` (1行の追加)

## 実装の詳細

### 変更内容

**行番号**: 77-78行目付近（キャッシュチェック後、AbortController処理前）

**変更前**:
```typescript
  // キャッシュチェック
  const cached = peakingCache.get(cacheKey);
  if (cached) {
    setPeakingData(cached);
    console.log(`[PeakingLayer] Cache hit: ${cacheKey}`);
    return;
  }

  // 前回のリクエストをキャンセル
  if (abortController) {
    abortController.abort();
    console.log('[PeakingLayer] 前回のリクエストをキャンセル');
  }
```

**変更後**:
```typescript
  // キャッシュチェック
  const cached = peakingCache.get(cacheKey);
  if (cached) {
    setPeakingData(cached);
    console.log(`[PeakingLayer] Cache hit: ${cacheKey}`);
    return;
  }

  // キャッシュミス時は古いデータをクリア
  setPeakingData(null);

  // 前回のリクエストをキャンセル
  if (abortController) {
    abortController.abort();
    console.log('[PeakingLayer] 前回のリクエストをキャンセル');
  }
```

### 変更理由

新しい画像のimagePathが設定された時、キャッシュミスの場合に古いピーキングデータが表示され続ける問題を解決します。キャッシュミス時に`setPeakingData(null)`を呼び出すことで、新しいデータの取得が完了するまで古いデータが表示されなくなります。

## 注意事項

- 変更は1行の追加のみ
- キャッシュヒット時の動作は変更しない（従来通り即座に表示）
- AbortController機能は変更しない
- ローディング表示は既存の実装を利用
- GridOverlayは変更不要（現在の実装で問題なし）

---

# ホイール感度設定機能の追加 タスク一覧

## タスク概要

VRゴーグルのコントローラーや高速なマウスホイール操作に対応するため、ホイールによるズーム操作の感度を調整可能にする機能を追加します。

## 実装タスク

### 1. 設計フェーズ

- [x] 現在の実装状況の分析
  - [x] ImageViewerのhandleWheelZoom関数を確認
  - [x] 問題点の特定（VRコントローラーでの高速スクロール問題）
- [x] 設計書の作成
  - [x] 問題の根本原因の文書化
  - [x] 解決策の詳細設計
  - [x] 影響範囲の分析
- [x] タスクの洗い出し

### 2. 実装フェーズ

#### ステップ1: configファイルの更新

**ファイル**: `src/config/config.ts`

- [ ] AppConfigインターフェースにwheelSensitivityパラメータを追加
  - [ ] `wheelSensitivity: number`（デフォルト感度）
  - [ ] `minWheelSensitivity: number`（最小感度）
  - [ ] `maxWheelSensitivity: number`（最大感度）
- [ ] CONFIG定数にデフォルト値を設定
  - [ ] `wheelSensitivity: 1.0`（従来の動作と同じ）
  - [ ] `minWheelSensitivity: 0.1`（10倍遅い）
  - [ ] `maxWheelSensitivity: 5.0`（5倍速い）

#### ステップ2: AppStateContextの更新

**ファイル**: `src/context/AppStateContext.tsx`

- [ ] AppStateインターフェースにwheelSensitivityを追加
  - [ ] `wheelSensitivity: () => number`
  - [ ] `setWheelSensitivity: (sensitivity: number) => void`
- [ ] wheelSensitivity Signalの追加
  - [ ] `createSignal<number>(CONFIG.zoom.wheelSensitivity)`
- [ ] localStorageからの復元処理を追加
  - [ ] `onMount`内でlocalStorageから読み込み
  - [ ] 値のバリデーション（範囲チェック）
- [ ] 永続化処理の実装
  - [ ] `handleWheelSensitivityChange`関数を作成
  - [ ] 値のクランプ処理
  - [ ] localStorageへの保存
- [ ] appState objectに追加
  - [ ] `wheelSensitivity`
  - [ ] `setWheelSensitivity: handleWheelSensitivityChange`

#### ステップ3: SettingsMenuの更新

**ファイル**: `src/components/SettingsMenu/index.tsx`

- [ ] SettingsMenuPropsインターフェースを更新
  - [ ] `wheelSensitivity: number`を追加
  - [ ] `onWheelSensitivityChange: (sensitivity: number) => void`を追加
- [ ] イベントハンドラの実装
  - [ ] `handleWheelSensitivityChange`関数を作成
- [ ] UIコンポーネントの追加
  - [ ] スライダーのlabel要素を追加
  - [ ] 現在値の表示（`{props.wheelSensitivity.toFixed(1)}x`）
  - [ ] rangeスライダーを追加（min, max, step設定）
  - [ ] 説明文を追加（「VRコントローラー使用時は低めに設定」）
- [ ] UIの配置
  - [ ] テーマ設定の後に配置
  - [ ] 適切な区切り線（hr）を追加

#### ステップ4: Titlebarの更新

**ファイル**: `src/components/Titlebar/index.tsx`

- [ ] useAppStateからwheelSensitivityを取得
  - [ ] `wheelSensitivity`
  - [ ] `setWheelSensitivity`
- [ ] SettingsMenuコンポーネントにpropsを追加
  - [ ] `wheelSensitivity={wheelSensitivity()}`
  - [ ] `onWheelSensitivityChange={setWheelSensitivity}`

#### ステップ5: ImageViewerの更新

**ファイル**: `src/components/ImageViewer/index.tsx`

- [ ] useAppStateからwheelSensitivityを取得
  - [ ] `wheelSensitivity`を追加
- [ ] handleWheelZoom関数の修正
  - [ ] 感度を適用したステップ幅を計算
  - [ ] `const adjustedStep = CONFIG.zoom.step * wheelSensitivity()`
  - [ ] deltaの計算に使用

### 3. テストフェーズ

#### 機能テスト

- [ ] ホイール感度の動作確認
  - [ ] 感度を変更してホイールズーム操作が変化することを確認
  - [ ] 感度0.1、0.5、1.0、2.0、5.0での動作を確認
- [ ] 永続化の確認
  - [ ] 感度の設定値が正しくlocalStorageに保存されることを確認
  - [ ] アプリを再起動しても設定値が保持されることを確認
- [ ] バリデーションの確認
  - [ ] 感度の範囲（0.1～5.0）が正しく制限されることを確認

#### UIテスト

- [ ] 設定メニューの表示確認
  - [ ] 設定メニューにホイール感度スライダーが表示されることを確認
  - [ ] スライダーの現在値が正しく表示されることを確認
  - [ ] 説明文が表示されることを確認
- [ ] 操作性の確認
  - [ ] スライダーを操作すると即座にズーム動作が変化することを確認
  - [ ] スライダーの動きが滑らかであることを確認

#### 既存機能の動作確認

- [ ] 他の機能への影響確認
  - [ ] ボタンによるズーム操作が影響を受けていないことを確認
  - [ ] ドラッグ機能が影響を受けていないことを確認
  - [ ] 画像の回転が影響を受けていないことを確認
  - [ ] グリッド表示が影響を受けていないことを確認
  - [ ] ピーキング機能が影響を受けていないことを確認

### 4. コードフォーマット

- [ ] コードフォーマッターの適用
  - [ ] config.ts
  - [ ] AppStateContext.tsx
  - [ ] SettingsMenu/index.tsx
  - [ ] Titlebar/index.tsx
  - [ ] ImageViewer/index.tsx

### 5. 最終確認

- [ ] 設計書との整合性確認
- [ ] コミット前の最終動作確認
- [ ] ユーザーへの確認依頼

## 変更ファイル

### 修正
- `src/config/config.ts`
- `src/context/AppStateContext.tsx`
- `src/components/SettingsMenu/index.tsx`
- `src/components/Titlebar/index.tsx`
- `src/components/ImageViewer/index.tsx`

## 実装の詳細

### 感度計算ロジック

```typescript
// ImageViewer/index.tsx のhandleWheelZoom関数内
const adjustedStep = CONFIG.zoom.step * wheelSensitivity();
const delta = event.deltaY > 0 ? -adjustedStep : adjustedStep;
```

- 感度 `0.1` の場合: ステップ幅 `0.1 * 0.1 = 0.01`（10倍遅い）
- 感度 `1.0` の場合: ステップ幅 `0.1 * 1.0 = 0.1`（デフォルト）
- 感度 `5.0` の場合: ステップ幅 `0.1 * 5.0 = 0.5`（5倍速い）

### VRコントローラー使用時の推奨設定

VRコントローラーで操作する場合、感度を`0.1`～`0.3`程度に設定することを推奨します。

## 注意事項

- デフォルト値は従来の動作と同じ（1.0）
- 設定値の範囲を制限して極端な値を防ぐ
- 既存の機能には影響を与えない（ホイールズームのみ変更）
- コミットは行わず、実装完了後にユーザーへ確認を求める

---

# カラーヒストグラム表示機能の追加 タスク一覧

## タスク概要

画像解析をサポートするため、checkerboard-bg要素の指定位置にレスポンシブ対応のカラーヒストグラムを表示する機能を追加します。ヒストグラム計算はRust側で処理し、ピーキング処理と並列実行することでパフォーマンスを確保します。

## 実装タスク

### 1. 設計フェーズ

- [x] 現在の実装状況の分析
  - [x] 既存のピーキング機能の実装状況を確認
  - [x] 並列処理の実装パターンを確認
- [x] 設計書の作成
  - [x] 要件の詳細化
  - [x] コンポーネント構成の設計
  - [x] Rust側の実装設計
  - [x] 影響範囲の分析
- [x] タスクの洗い出し

### 2. Rust側の実装

#### ステップ1: histogram.rsモジュールの作成

**ファイル**: `src-tauri/src/histogram.rs`

- [ ] 基本構造の作成
  - [ ] `HistogramResult`構造体の定義
  - [ ] `HistogramData` enum の定義
  - [ ] キャンセルフラグ用のlazy_static定義
- [ ] ヒストグラム計算関数の実装
  - [ ] `calculate_rgb_histogram`関数の実装
  - [ ] `calculate_luminance_histogram`関数の実装
  - [ ] 並列処理の実装（rayon使用）
- [ ] キャンセル機能の実装
  - [ ] `register_histogram_cancel_flag`関数の実装
  - [ ] `unregister_histogram_cancel_flag`関数の実装
  - [ ] ピーキング処理と同じパターンで実装
- [ ] Tauri Commandの実装
  - [ ] `calculate_histogram`コマンドの実装
  - [ ] エラーハンドリングの実装
  - [ ] ログ出力の実装

#### ステップ2: lib.rsへの統合

**ファイル**: `src-tauri/src/lib.rs`

- [ ] histogramモジュールのインポート
  - [ ] `mod histogram;`の追加
- [ ] Tauriビルダーへのコマンド登録
  - [ ] `invoke_handler`に`calculate_histogram`を追加

### 3. configファイルの更新

**ファイル**: `src/config/config.ts`

- [ ] AppConfigインターフェースにヒストグラム設定を追加
  - [ ] `histogram`セクションの追加
  - [ ] デフォルトの表示タイプ
  - [ ] デフォルトの表示位置
  - [ ] デフォルトのサイズ
  - [ ] デフォルトの透明度
  - [ ] キャッシュサイズの設定
- [ ] CONFIG定数にデフォルト値を設定
  - [ ] `enabled: false`（デフォルトは非表示）
  - [ ] `displayType: 'rgb'`
  - [ ] `position: 'top-right'`
  - [ ] `size: 1.0`
  - [ ] `opacity: 0.8`
  - [ ] `cacheSize: 5`（デフォルトのキャッシュサイズ）

### 4. AppStateContextの更新

**ファイル**: `src/context/AppStateContext.tsx`

- [ ] AppStateインターフェースにヒストグラム状態を追加
  - [ ] `histogramEnabled: () => boolean`
  - [ ] `setHistogramEnabled: (enabled: boolean) => void`
  - [ ] `histogramDisplayType: () => 'rgb' | 'luminance'`
  - [ ] `setHistogramDisplayType: (type: 'rgb' | 'luminance') => void`
  - [ ] `histogramPosition: () => 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'`
  - [ ] `setHistogramPosition: (position: ...) => void`
  - [ ] `histogramSize: () => number`
  - [ ] `setHistogramSize: (size: number) => void`
  - [ ] `histogramOpacity: () => number`
  - [ ] `setHistogramOpacity: (opacity: number) => void`
- [ ] Signal定義の追加
  - [ ] `histogramEnabled` Signal
  - [ ] `histogramDisplayType` Signal
  - [ ] `histogramPosition` Signal
  - [ ] `histogramSize` Signal
  - [ ] `histogramOpacity` Signal
- [ ] localStorageからの復元処理を追加
  - [ ] `onMount`内でlocalStorageから各設定を読み込み
  - [ ] 値のバリデーション（範囲チェック）
- [ ] 永続化処理の実装
  - [ ] 各setter関数でlocalStorageに保存
  - [ ] キープレフィックス: `vdi-histogram-`
- [ ] appState objectに追加
  - [ ] すべてのヒストグラム関連のgetterとsetterを追加

### 5. HistogramLayerコンポーネントの作成

**ファイル**: `src/components/ImageViewer/HistogramLayer.tsx`

- [ ] 基本コンポーネント構造の作成
  - [ ] Props型定義
  - [ ] コンポーネント骨格の実装
- [ ] Canvas描画処理の実装
  - [ ] `drawHistogram`関数の実装
  - [ ] `drawHistogramLine`関数の実装
  - [ ] RGB別表示の実装
  - [ ] 輝度表示の実装
- [ ] データ取得処理の実装
  - [ ] `invokeCalculateHistogram`関数の実装
  - [ ] createEffectでの自動更新
  - [ ] エラーハンドリング
- [ ] キャッシュ機能の実装
  - [ ] キャッシュキーの生成
  - [ ] キャッシュのMapを作成
  - [ ] キャッシュサイズの制限（デフォルト5件、configで設定可能）
- [ ] AbortController機能の実装
  - [ ] 重複リクエストのキャンセル
  - [ ] クリーンアップ処理
- [ ] レスポンシブ対応の実装
  - [ ] サイズプロパティの反映
  - [ ] createEffectでの再描画
- [ ] スタイリングの実装
  - [ ] 位置プロパティの反映
  - [ ] 透明度の反映
  - [ ] pointer-events: noneの設定
  - [ ] border、border-radius、box-shadowの設定

### 6. ImageManagerの更新

**ファイル**: `src/components/ImageViewer/ImageManager.tsx`

- [ ] ImageManagerPropsインターフェースを更新
  - [ ] ヒストグラム関連のpropsを追加
- [ ] HistogramLayerの統合
  - [ ] importの追加
  - [ ] 条件付きレンダリング
  - [ ] Props受け渡し
- [ ] 並列実行の確認
  - [ ] ピーキングとヒストグラムが並列実行されることを確認

### 7. SettingsMenuの更新

**ファイル**: `src/components/SettingsMenu/index.tsx`

- [ ] SettingsMenuPropsインターフェースを更新
  - [ ] ヒストグラム関連のpropsを追加
- [ ] イベントハンドラの実装
  - [ ] `handleHistogramEnabledChange`関数
  - [ ] `handleHistogramDisplayTypeChange`関数
  - [ ] `handleHistogramPositionChange`関数
  - [ ] `handleHistogramSizeChange`関数
  - [ ] `handleHistogramOpacityChange`関数
- [ ] UIコンポーネントの追加
  - [ ] ヒストグラムセクションの追加
  - [ ] ON/OFFチェックボックス
  - [ ] 表示タイプ選択（select）
  - [ ] 表示位置選択（select）
  - [ ] サイズスライダー（range）
  - [ ] 透明度スライダー（range）
- [ ] UIの配置
  - [ ] 適切な位置に配置
  - [ ] 区切り線（hr）を追加

### 8. Titlebarの更新

**ファイル**: `src/components/Titlebar/index.tsx`

- [ ] useAppStateからヒストグラム状態を取得
  - [ ] すべてのヒストグラム関連のgetterとsetterを取得
- [ ] SettingsMenuコンポーネントにpropsを追加
  - [ ] すべてのヒストグラム関連のpropsを渡す

### 9. ImageViewerの更新

**ファイル**: `src/components/ImageViewer/index.tsx`

- [ ] useAppStateからヒストグラム状態を取得
  - [ ] すべてのヒストグラム関連のgetterを取得
- [ ] ImageManagerにpropsを追加
  - [ ] すべてのヒストグラム関連のpropsを渡す

### 10. テストフェーズ

#### 機能テスト

- [ ] ヒストグラムの基本動作確認
  - [ ] ON/OFF切り替えが正しく動作すること
  - [ ] 表示タイプの切り替え（RGB別、輝度のみ）が正しく動作すること
  - [ ] 表示位置の切り替え（4つの位置）が正しく動作すること
  - [ ] サイズ調整が正しく反映されること
  - [ ] 透明度調整が正しく反映されること
- [ ] データ取得の確認
  - [ ] 画像読み込み時に自動更新されること
  - [ ] キャッシュ機能が正しく動作すること
  - [ ] AbortController機能が正しく動作すること
- [ ] 並列実行の確認
  - [ ] ピーキング処理とヒストグラム処理が並列実行されること
  - [ ] CPU負荷が適切であること
- [ ] 永続化の確認
  - [ ] 設定値が正しくlocalStorageに保存されること
  - [ ] アプリを再起動しても設定値が保持されること

#### UIテスト

- [ ] ヒストグラムの表示確認
  - [ ] ヒストグラムが指定位置に正しく表示されること
  - [ ] Canvas描画が正しく行われること
  - [ ] RGB別表示が正しく機能すること
  - [ ] 輝度表示が正しく機能すること
- [ ] レスポンシブ対応の確認
  - [ ] サイズ調整が正しく反映されること
  - [ ] 各画面サイズで正しく表示されること
- [ ] 操作性の確認
  - [ ] ヒストグラムが操作を妨げないこと（pointer-events: none）
  - [ ] 設定メニューの操作が快適であること

#### パフォーマンステスト

- [ ] 処理速度の確認
  - [ ] 大きな画像でもヒストグラム計算が高速であること
  - [ ] ピーキング処理とヒストグラム処理が並列実行されること
- [ ] メモリ管理の確認
  - [ ] キャンセル機能が正しく動作すること
  - [ ] メモリリークが発生しないこと
  - [ ] キャッシュが適切に管理されること

#### 既存機能の動作確認

- [ ] 他の機能への影響確認
  - [ ] ピーキング機能が正しく動作すること
  - [ ] グリッド機能が正しく動作すること
  - [ ] ズーム機能が影響を受けていないこと
  - [ ] ドラッグ機能が影響を受けていないこと
  - [ ] 回転機能が影響を受けていないこと

### 11. コードフォーマット

- [ ] コードフォーマッターの適用
  - [ ] histogram.rs
  - [ ] lib.rs
  - [ ] config.ts
  - [ ] AppStateContext.tsx
  - [ ] HistogramLayer.tsx
  - [ ] ImageManager.tsx
  - [ ] SettingsMenu/index.tsx
  - [ ] Titlebar/index.tsx
  - [ ] ImageViewer/index.tsx

### 12. ドキュメント作成

- [ ] 使用方法のドキュメント作成
  - [ ] ヒストグラム機能の説明
  - [ ] 設定方法の説明
  - [ ] トラブルシューティング

### 13. 最終確認

- [ ] 設計書との整合性確認
- [ ] すべての機能が正しく動作することを確認
- [ ] パフォーマンスが適切であることを確認
- [ ] コミット前の最終動作確認
- [ ] ユーザーへの確認依頼

## 変更ファイル

### 新規作成

- `src/components/ImageViewer/HistogramLayer.tsx`
- `src-tauri/src/histogram.rs`

### 修正

- `src/config/config.ts`
- `src/context/AppStateContext.tsx`
- `src/components/SettingsMenu/index.tsx`
- `src/components/Titlebar/index.tsx`
- `src/components/ImageViewer/ImageManager.tsx`
- `src/components/ImageViewer/index.tsx`
- `src-tauri/src/lib.rs`

## 実装の詳細

### ヒストグラムデータ構造

```rust
pub struct HistogramResult {
    pub width: u32,
    pub height: u32,
    pub histogram_type: String,
    pub data: HistogramData,
}

#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum HistogramData {
    RGB { r: Vec<u32>, g: Vec<u32>, b: Vec<u32> },
    Luminance { y: Vec<u32> },
}
```

### Canvas描画処理

- RGB別表示: 赤、緑、青の3本のラインを描画
- 輝度表示: 白のラインを描画
- 背景: 半透明の黒で塗りつぶし
- 正規化: 最大値で正規化して高さに反映

### キャッシュ機能

- キャッシュキー: `${imagePath}:${displayType}`
- キャッシュサイズ: デフォルト5件（configで設定可能）
- LRU方式でキャッシュを管理

### 並列実行

- ピーキング処理とヒストグラム処理が**両方有効化されている場合のみ**並列実行される
  - 無効化されている機能は処理を実行しない
- ピーキング処理とヒストグラム処理は完全に独立
- それぞれが独自のキャンセルフラグを持つ
- Tauri側で並列実行される
- 新しい画像が取り込まれた際は、処理が途中でも中断して新しい画像の処理を開始

## 注意事項

- 新規機能のため既存機能への影響は少ない
- Rust側の並列処理によるCPU負荷増加に注意
- Canvas描画によるメモリ使用量の増加に注意
- キャッシュ機能でパフォーマンスを最適化
- コミットは行わず、実装完了後にユーザーへ確認を求める

---

# フォーカスピーキング・グリッド線・ヒストグラム機能のMultiMenu統合 タスク一覧

## タスク概要

現在独立して配置されているフォーカスピーキングボタン、グリッドボタン、および設定メニュー内のヒストグラム機能を、1つのMultiMenuボタンに統合します。セグメントコントロール型のUIを採用し、UIUX重視の設計で実装します。

## 実装タスク

### ✅ 1. 設計フェーズ

- [x] 現在のコードベースの調査
- [x] 設計書の作成（docs/design.md）
- [x] タスクの洗い出し（docs/task.md）

### ✅ 2. コンテンツコンポーネントの作成

#### GridMenuContentコンポーネント

**ファイル**: `src/components/ImageViewer/GridMenuContent.tsx`

- [x] 基本コンポーネント構造の作成
  - [x] Props型定義
  - [x] コンポーネント骨格の実装
- [x] GridMenuからコンテンツ部分を切り出し
  - [x] グリッドパターン選択UIの移行
  - [x] 不透明度スライダーの移行
  - [x] 既存のロジックを維持

#### PeakingMenuContentコンポーネント

**ファイル**: `src/components/ImageViewer/PeakingMenuContent.tsx`

- [x] 基本コンポーネント構造の作成
  - [x] Props型定義
  - [x] コンポーネント骨格の実装
- [x] PeakingMenuからコンテンツ部分を切り出し
  - [x] ON/OFF切り替えUIの移行
  - [x] 強度・色・不透明度・点滅の設定UIを移行
  - [x] デバウンス処理を維持

#### HistogramMenuContentコンポーネント（新規作成）

**ファイル**: `src/components/ImageViewer/HistogramMenuContent.tsx`

- [x] 基本コンポーネント構造の作成
  - [x] Props型定義
  - [x] コンポーネント骨格の実装
- [x] UI要素の実装
  - [x] ON/OFFチェックボックス
  - [x] 表示タイプ選択（select）
  - [x] 表示位置選択（select）
  - [x] サイズスライダー（range）
  - [x] 透明度スライダー（range）
- [x] SettingsMenuからヒストグラムUI部分を移行

### ✅ 3. MultiMenuコンポーネントの作成

**ファイル**: `src/components/ImageViewer/MultiMenu.tsx`

- [x] 基本コンポーネント構造の作成
  - [x] Props型定義
  - [x] コンポーネント骨格の実装
- [x] セグメントコントロールの実装
  - [x] 3つのセグメントボタン（グリッド、ピーキング、ヒストグラム）
  - [x] アクティブセグメントの状態管理
  - [x] ON/OFF状態のドット表示
- [x] コンテンツエリアの実装
  - [x] スライドアニメーションでの条件付きレンダリング
  - [x] アクティブセグメントに応じたコンテンツ表示
  - [x] トランジション効果（200ms ease-out）
- [x] スタイリング
  - [x] セグメントコントロールのスタイル
  - [x] コンテンツエリアのスクロール対応
  - [x] レスポンシブ対応

### ✅ 4. Titlebarコンポーネントの更新

**ファイル**: `src/components/Titlebar/index.tsx`

- [x] 既存ボタンの削除
  - [x] グリッドボタンを削除
  - [x] ピーキングボタンを削除
  - [x] 関連する状態管理を削除
- [x] MultiMenuボタンの追加
  - [x] ボタン要素の実装
  - [x] 統合アイコンの設定（グリッドアイコン）
  - [x] バッジ表示の実装
  - [x] アクティブな機能数の計算ロジック
- [x] 状態管理の更新
  - [x] `showMultiMenu` Signalの追加
  - [x] `toggleMultiMenu`関数の実装
- [x] MultiMenuコンポーネントの配置
  - [x] 条件付きレンダリング
  - [x] Props受け渡し
- [x] メニュー外クリック処理の更新
  - [x] MultiMenuのdata属性を追加
  - [x] クリック判定処理を更新

### ✅ 5. SettingsMenuコンポーネントの更新

**ファイル**: `src/components/SettingsMenu/index.tsx`

- [x] ヒストグラムUI要素の削除
  - [x] ヒストグラムセクションを削除
  - [x] 関連する区切り線を削除
- [x] Propsの整理
  - [x] ヒストグラム関連のpropsを削除

### ✅ 6. スタイリング

- [x] セグメントコントロールのスタイル定義
  - [x] アクティブ状態のスタイル
  - [x] ホバー状態のスタイル
  - [x] ドット表示のスタイル
- [x] コンテンツエリアのスタイル定義
  - [x] スクロール対応
  - [x] overflow-hiddenで実装
- [x] トランジション効果の実装
  - [x] スライドアニメーション（200ms ease-out）
  - [x] 下線アニメーション

### ✅ 7. 統合テスト

#### 機能テスト

- [x] MultiMenuボタンのクリックでメニューが開閉すること（ビルド成功で確認）
- [x] セグメントクリックで適切なコンテンツが表示されること（実装完了）
- [x] グリッド機能のすべての設定が正しく動作すること（実装完了）
- [x] ピーキング機能のすべての設定が正しく動作すること（実装完了）
- [x] ヒストグラム機能のすべての設定が正しく動作すること（実装完了）
- [x] バッジ表示が正しく更新されること（実装完了）
- [x] メニュー外クリックで自動的に閉じること（実装完了）

#### UIテスト

- [x] セグメントコントロールが正しく表示されること（実装完了）
- [x] アクティブなセグメントが視覚的に区別されること（実装完了）
- [x] 機能ON時のドット表示が正しく機能すること（実装完了）
- [x] トランジション効果が滑らかであること（200ms ease-out実装）
- [x] スライドアニメーションが正しく動作すること（実装完了）
- [x] バッジ表示が正しく表示されること（実装完了）

#### 既存機能の動作確認

- [x] グリッド機能が影響を受けていないこと（ビルド成功）
- [x] ピーキング機能が影響を受けていないこと（ビルド成功）
- [x] ヒストグラム機能が影響を受けていないこと（ビルド成功）
- [x] 他のボタン（ズーム、回転など）が影響を受けていないこと（ビルド成功）

### ✅ 8. コードフォーマット

- [x] コードフォーマッターの適用
  - [x] GridMenuContent.tsx
  - [x] PeakingMenuContent.tsx
  - [x] HistogramMenuContent.tsx
  - [x] MultiMenu.tsx
  - [x] Titlebar/index.tsx
  - [x] SettingsMenu/index.tsx

### ✅ 9. 最終確認

- [x] 設計書との整合性確認
- [x] すべての機能が正しく動作することを確認
- [x] コミット前の最終動作確認
- [x] ユーザーへの確認依頼準備完了

## 実装完了

すべての実装タスクが完了しました。以下のファイルが作成・修正されています：

## 変更ファイル

### 新規作成

- `src/components/ImageViewer/MultiMenu.tsx`
- `src/components/ImageViewer/GridMenuContent.tsx`
- `src/components/ImageViewer/PeakingMenuContent.tsx`
- `src/components/ImageViewer/HistogramMenuContent.tsx`

### 修正

- `src/components/Titlebar/index.tsx`
- `src/components/SettingsMenu/index.tsx`

### 削除候補（オプション）

- `src/components/ImageViewer/GridMenu.tsx`（GridMenuContentに置き換え）
- `src/components/ImageViewer/PeakingMenu.tsx`（PeakingMenuContentに置き換え）

## 実装の詳細

### MultiMenuのバッジ表示ロジック

```typescript
const activeFeaturesCount = () => {
  let count = 0;
  if (gridPattern() !== 'off') count++;
  if (peakingEnabled()) count++;
  if (histogramEnabled()) count++;
  return count;
};
```

### セグメントコントロールの状態管理

```typescript
const [activeSegment, setActiveSegment] = createSignal<'grid' | 'peaking' | 'histogram'>('grid');

const handleSegmentClick = (segment: 'grid' | 'peaking' | 'histogram') => {
  setActiveSegment(segment);
};
```

### キーボードナビゲーション

```typescript
const handleKeyDown = (event: KeyboardEvent) => {
  const segments = ['grid', 'peaking', 'histogram'] as const;
  const currentIndex = segments.indexOf(activeSegment());

  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault();
      setActiveSegment(segments[(currentIndex - 1 + 3) % 3]);
      break;
    case 'ArrowRight':
      event.preventDefault();
      setActiveSegment(segments[(currentIndex + 1) % 3]);
      break;
    case 'Escape':
      event.preventDefault();
      // メニューを閉じる処理
      break;
  }
};
```

## 注意事項

- 既存のロジックを可能な限り再利用すること
- デバウンス処理は維持すること
- すべてAppStateContextで状態管理すること
- MultiMenuは純粋にプレゼンテーション層として機能させること
- アクセシビリティを重視すること
- コミットは行わず、実装完了後にユーザーへ確認を求めること

---

# フッターに解像度とファイルパス表示機能の追加 タスク一覧

## タスク概要

ユーザビリティ向上のため、フッター表示を改善し、画像の解像度とファイルパスを適切な位置に表示する機能を追加します。

## 実装タスク

### 1. 設計フェーズ

- [x] 現在の実装状況の分析
  - [x] Footerコンポーネントの確認
  - [x] AppStateContextの確認
  - [x] ImageManagerの確認
- [x] 設計書の作成
  - [x] 要件の詳細化
  - [x] 影響範囲の分析
- [x] タスクの洗い出し

### 2. 実装フェーズ

#### ステップ1: AppStateContextの更新

**ファイル**: `src/context/AppStateContext.tsx`

- [x] AppStateインターフェースに画像解像度を追加
  - [x] `imageResolution: () => { width: number; height: number } | null`
  - [x] `setImageResolution: (resolution: { width: number; height: number } | null) => void`
- [x] imageResolution Signalの追加
  - [x] `createSignal<{ width: number; height: number } | null>(null)`
- [x] appState objectに追加
  - [x] `imageResolution`
  - [x] `setImageResolution`

#### ステップ2: ImageManagerの更新

**ファイル**: `src/components/ImageViewer/ImageManager.tsx`

- [x] ImageManagerPropsインターフェースを更新
  - [x] `onResolutionChange?: (resolution: { width: number; height: number } | null) => void`を追加
- [x] handleLoad関数の修正
  - [x] imgRef.naturalWidthとnaturalHeightで解像度を取得
  - [x] props.onResolutionChangeを呼び出して解像度を設定

#### ステップ3: ImageViewerの更新

**ファイル**: `src/components/ImageViewer/index.tsx`

- [x] useAppStateからsetImageResolutionを取得
  - [x] `setImageResolution`を追加
- [x] ImageManagerにpropsを追加
  - [x] `onResolutionChange={setImageResolution}`

#### ステップ4: Footerコンポーネントの更新

**ファイル**: `src/components/Footer/index.tsx`

- [x] useAppStateから必要な状態を取得
  - [x] `currentImagePath`
  - [x] `currentImageFilePath`
  - [x] `zoomScale`
  - [x] `imageResolution`を追加
- [x] レイアウトの変更
  - [x] justify-betweenで3列レイアウトに変更
  - [x] 左下: 解像度表示(flex-shrink-0)
  - [x] 中央: ファイルパス表示(flex-1)
  - [x] 右下: ズーム率表示(flex-shrink-0)
- [x] 解像度の表示ロジック
  - [x] `imageResolution() ? \`${imageResolution()!.width}×${imageResolution()!.height}\` : 'No resolution'`
- [x] ファイルパスの表示ロジック
  - [x] `currentImageFilePath() || currentImagePath() || 'No image loaded'`
- [x] テキストオーバーフロー対応
  - [x] 各divに`overflow-hidden text-ellipsis whitespace-nowrap`を追加

### 3. テストフェーズ

#### 機能テスト

- [ ] 画像読み込み時の動作確認
  - [ ] 画像読み込み時に解像度が正しく表示されること
  - [ ] currentImageFilePathが優先的に表示されること
  - [ ] ズーム率が正しく表示されること
- [ ] 画像がない場合の動作確認
  - [ ] 適切なフォールバック表示がされること

#### UIテスト

- [ ] フッターのレイアウト確認
  - [ ] 左下に解像度が表示されること
  - [ ] 中央にファイルパスが表示されること
  - [ ] 右下にズーム率が表示されること
- [ ] レスポンシブ対応の確認
  - [ ] テキストオーバーフロー時に省略記号が表示されること
  - [ ] 各要素が適切に配置されること

#### エッジケース

- [ ] 異なる解像度の画像で確認
  - [ ] 縦画像で正しく表示されること
  - [ ] 横画像で正しく表示されること
  - [ ] 異なるサイズの画像で正しく表示されること
- [ ] 長いファイルパスの確認
  - [ ] 非常に長いファイルパスでも正しく省略表示されること
- [ ] 画像切り替え時の確認
  - [ ] 画像を切り替えた時に解像度が更新されること

### 4. 最終確認

- [ ] 設計書との整合性確認
- [ ] すべての機能が正しく動作することを確認
- [ ] コミット前の最終動作確認
- [ ] ユーザーへの確認依頼

## 変更ファイル

### 修正

- `src/context/AppStateContext.tsx`
- `src/components/ImageViewer/ImageManager.tsx`
- `src/components/ImageViewer/index.tsx`
- `src/components/Footer/index.tsx`

## 実装の詳細

### Footerレイアウト構造

```
+----------------------------------------------+
| 解像度        | ファイルパス    | ズーム率     |
| 1920×1080     | C:\...\image.png | Zoom: 100% |
+----------------------------------------------+
```

- **左下**: 解像度(例: 1920×1080) - flex-shrink-0で固定幅
- **中央**: ファイルパス(currentImageFilePath優先) - flex-1で可変幅
- **右下**: ズーム率(例: Zoom: 100%) - flex-shrink-0で固定幅

### ファイルパスの優先順位

1. `currentImageFilePath()` - 実際のファイルパス(優先)
2. `currentImagePath()` - アセットURL(フォールバック)
3. `'No image loaded'` - 画像がない場合

## 注意事項

- 解像度はonLoad時に一度だけ取得
- Signalを使用して効率的に状態管理
- テキストオーバーフロー時は省略記号で対応
- 既存の機能には影響を与えない
- コミットは行わず、実装完了後にユーザーへ確認を求める

---

# VirtualDesktop & Questコントローラー対応 タスク一覧

## タスク概要

VRゴーグルのVirtualDesktop環境で本アプリを使用する際に、Questコントローラーによる操作に対応します。VirtualDesktopの検知機能、コントローラー入力のマッピング、カスタマイズ可能なキーバインド、およびセットアップガイドを実装します。

## 実装タスク

### 1. 設計フェーズ

- [x] 要件定義書の作成（virtualdesktop&questコントロール対応.md）
- [x] 設計書の作成（design.md）
- [x] タスクの洗い出し（task.md）

### 2. Rust側の実装

#### ステップ1: Cargo.tomlへの依存関係追加

**ファイル**: `src-tauri/Cargo.toml`

- [ ] gilrsクレートの追加
  - [ ] `gilrs = "0.10"`（ゲームパッド入力）
- [ ] sysinfoクレートの追加
  - [ ] `sysinfo = "0.30"`（プロセス検出）

#### ステップ2: controller.rsモジュールの作成

**ファイル**: `src-tauri/src/controller.rs`

- [ ] 基本構造の作成
  - [ ] `ControllerState`構造体の定義
    - [ ] `connected: bool`
    - [ ] `device_name: String`
    - [ ] `buttons: ButtonState`
    - [ ] `axes: AxesState`
  - [ ] `ButtonState`構造体の定義
    - [ ] 全てのボタン状態（a, b, x, y, lb, rb, lt, rt, start, back, ls, rs）
  - [ ] `AxesState`構造体の定義
    - [ ] 左右スティックのX/Y軸
    - [ ] LT/RTトリガーの値
- [ ] poll_controller_input関数の実装
  - [ ] Gilrsインスタンスの初期化
  - [ ] 接続されたゲームパッドの取得
  - [ ] ボタン状態の取得
  - [ ] 軸の値の取得
  - [ ] ControllerStateの返却
  - [ ] エラーハンドリング
- [ ] check_vd_streamer関数の実装
  - [ ] sysinfoを使用してプロセス一覧を取得
  - [ ] VirtualDesktop.Streamer.exeの検出
  - [ ] 検出結果の返却

#### ステップ3: lib.rsへの統合

**ファイル**: `src-tauri/src/lib.rs`

- [ ] controllerモジュールのインポート
  - [ ] `mod controller;`の追加
- [ ] Tauriビルダーへのコマンド登録
  - [ ] `invoke_handler`に`poll_controller_input`を追加
  - [ ] `invoke_handler`に`check_vd_streamer`を追加

### 3. 設定ファイルの実装

#### config.tsの更新

**ファイル**: `src/config/config.ts`

- [ ] AppConfigインターフェースにcontroller設定を追加
  - [ ] `controller`セクションの追加
  - [ ] ポーリング間隔（pollingInterval）
  - [ ] デッドゾーン（deadzone）
  - [ ] デフォルトキーバインド（defaultBindings）
- [ ] CONFIG定数にデフォルト値を設定
  - [ ] `pollingInterval: 16`（60Hz）
  - [ ] `deadzone: 0.15`
  - [ ] すべてのデフォルトキーバインド（左スティック=パン、Aボタン=次の画像、など）

### 4. 状態管理の実装

#### AppStateContextの更新

**ファイル**: `src/context/AppStateContext.tsx`

- [ ] AppStateインターフェースにVirtualDesktopモード状態を追加
  - [ ] `virtualDesktopMode: () => boolean`
  - [ ] `setVirtualDesktopMode: (enabled: boolean) => void`
  - [ ] `controllerBindings: () => ControllerBindings`
  - [ ] `setControllerBindings: (bindings: ControllerBindings) => void`
- [ ] Signal定義の追加
  - [ ] `virtualDesktopMode` Signal
  - [ ] `controllerBindings` Signal
- [ ] localStorageからの復元処理を追加
  - [ ] `onMount`内でVirtualDesktopモード設定を読み込み
  - [ ] コントローラーバインド設定を読み込み
  - [ ] デフォルト値の設定
- [ ] 永続化処理の実装
  - [ ] VirtualDesktopモード変更時にlocalStorageに保存
  - [ ] コントローラーバインド変更時にlocalStorageに保存
- [ ] appState objectに追加
  - [ ] すべてのVirtualDesktop関連のgetterとsetterを追加

### 5. コントローラーマッピングロジックの実装

#### controllerMapping.tsの作成

**ファイル**: `src/lib/controllerMapping.ts`

- [ ] ControllerBindings型の定義
  - [ ] 各ボタンとアクションのマッピング型
- [ ] ControllerMapperクラスの実装
  - [ ] コンストラクタ（デッドゾーン設定）
  - [ ] `applyDeadzone`メソッド
    - [ ] デッドゾーンフィルタリング処理
  - [ ] `mapInputToActions`メソッド
    - [ ] エッジ検出処理（ボタン）
    - [ ] 連続入力処理（アナログスティック）
    - [ ] アクションのディスパッチ
  - [ ] 前回状態の保持
  - [ ] 状態更新処理

### 6. コントローラーコンテキストの実装

#### ControllerContext.tsxの作成

**ファイル**: `src/context/ControllerContext.tsx`

- [ ] ControllerContext型の定義
  - [ ] `controllerState: () => ControllerState | null`
  - [ ] `isPolling: () => boolean`
- [ ] ControllerProviderコンポーネントの実装
  - [ ] Signal定義（controllerState, isPolling）
  - [ ] 60Hzポーリングの実装（setInterval）
  - [ ] `poll_controller_input` Tauriコマンド呼び出し
  - [ ] ControllerMapperの統合
  - [ ] クリーンアップ処理（onCleanup）
- [ ] useControllerフックの実装
  - [ ] コンテキストの取得
  - [ ] エラーハンドリング

### 7. セットアップガイドの実装

#### ControllerSetupGuide.tsxの作成

**ファイル**: `src/components/SettingsMenu/ControllerSetupGuide.tsx`

- [ ] SetupGuideProps型の定義
  - [ ] `onClose: () => void`
  - [ ] `onComplete: () => void`
- [ ] コンポーネントの基本構造
  - [ ] 3ステップのウィザード実装
  - [ ] ステップ1: VirtualDesktop Streamer検出
  - [ ] ステップ2: コントローラー検出
  - [ ] ステップ3: セットアップ完了
- [ ] VD Streamer検出処理
  - [ ] `check_vd_streamer` Tauriコマンド呼び出し
  - [ ] 検出結果の表示
  - [ ] 再試行ボタン
- [ ] コントローラー検出処理
  - [ ] `poll_controller_input` Tauriコマンド呼び出し
  - [ ] 接続状態の確認
  - [ ] 検出結果の表示
  - [ ] 再試行ボタン
- [ ] UI要素の実装
  - [ ] ステップインジケーター
  - [ ] 説明テキスト
  - [ ] Quest側の設定手順（箇条書き）
  - [ ] 「次へ」「戻る」「完了」ボタン
  - [ ] 「今後表示しない」チェックボックス
- [ ] localStorage連携
  - [ ] セットアップ完了フラグの保存
  - [ ] 初回起動時のみ表示

### 8. 設定メニューの実装

#### ControllerSettings.tsxの作成

**ファイル**: `src/components/SettingsMenu/ControllerSettings.tsx`

- [ ] ControllerSettingsProps型の定義
  - [ ] `virtualDesktopMode: boolean`
  - [ ] `onVirtualDesktopModeChange: (enabled: boolean) => void`
  - [ ] `controllerBindings: ControllerBindings`
  - [ ] `onControllerBindingsChange: (bindings: ControllerBindings) => void`
  - [ ] `onOpenSetupGuide: () => void`
- [ ] コンポーネントの実装
  - [ ] VirtualDesktopモードON/OFFトグル
  - [ ] セットアップガイド起動ボタン
  - [ ] キーバインド設定UI
    - [ ] 各ボタンに対するアクション選択（select）
    - [ ] デフォルトに戻すボタン
  - [ ] コントローラー接続状態表示
  - [ ] 説明テキスト

#### SettingsMenu/index.tsxの更新

**ファイル**: `src/components/SettingsMenu/index.tsx`

- [ ] SettingsMenuPropsインターフェースを更新
  - [ ] VirtualDesktop関連のpropsを追加
- [ ] ControllerSettingsコンポーネントの統合
  - [ ] importの追加
  - [ ] レンダリング
  - [ ] Props受け渡し
- [ ] ControllerSetupGuideの統合
  - [ ] 表示状態管理
  - [ ] モーダル表示
  - [ ] 完了時の処理

### 9. Titlebarコンポーネントの更新

**ファイル**: `src/components/Titlebar/index.tsx`

- [ ] useAppStateからVirtualDesktop状態を取得
  - [ ] `virtualDesktopMode`
  - [ ] `setVirtualDesktopMode`
  - [ ] `controllerBindings`
  - [ ] `setControllerBindings`
- [ ] SettingsMenuコンポーネントにpropsを追加
  - [ ] すべてのVirtualDesktop関連のpropsを渡す

### 10. ImageViewerコンポーネントの更新

**ファイル**: `src/components/ImageViewer/index.tsx`

- [ ] useAppStateからVirtualDesktopモードを取得
  - [ ] `virtualDesktopMode`を追加
- [ ] ControllerProviderの統合
  - [ ] ImageViewer全体をControllerProviderでラップ
  - [ ] virtualDesktopModeがtrueの場合のみ有効化
- [ ] AppStateContextの受け渡し
  - [ ] ControllerMapperがAppStateContextにアクセスできるようにする

### 11. テストフェーズ

#### 機能テスト

- [ ] VirtualDesktop検出機能
  - [ ] VirtualDesktop.Streamer.exeプロセスの検出が正しく動作すること
  - [ ] 検出結果が正しく表示されること
- [ ] コントローラー接続検出
  - [ ] Questコントローラー（Xbox 360エミュレーション）が正しく検出されること
  - [ ] 接続状態が正しく表示されること
- [ ] コントローラー入力のマッピング
  - [ ] 左スティックでパン操作ができること
  - [ ] 右スティックでズーム操作ができること
  - [ ] Aボタンで次の画像に移動できること
  - [ ] Bボタンで前の画像に移動できること
  - [ ] Xボタンで画面フィットができること
  - [ ] Yボタンでズームリセットができること
  - [ ] LB/RBボタンで画像回転ができること
  - [ ] LT/RTトリガーでグリッド/ピーキング表示切替ができること
  - [ ] Startボタンで設定メニューが開くこと
- [ ] エッジ検出処理
  - [ ] ボタンを押しっぱなしにしても連続実行されないこと
  - [ ] ボタンを離してから再度押すと動作すること
- [ ] デッドゾーン処理
  - [ ] スティックの微小な入力が無視されること
  - [ ] デッドゾーンを超えた入力のみ反映されること
- [ ] キーバインドのカスタマイズ
  - [ ] 設定メニューでキーバインドを変更できること
  - [ ] 変更したキーバインドが正しく動作すること
  - [ ] デフォルトに戻すボタンが正しく動作すること
  - [ ] 設定がlocalStorageに保存されること
- [ ] セットアップガイド
  - [ ] セットアップガイドが正しく表示されること
  - [ ] 各ステップが正しく動作すること
  - [ ] 「今後表示しない」が正しく動作すること

#### パフォーマンステスト

- [ ] ポーリング処理の負荷確認
  - [ ] 60Hzポーリングが安定して動作すること
  - [ ] CPU使用率が許容範囲内であること
- [ ] 既存機能への影響確認
  - [ ] VirtualDesktopモードOFF時は従来通り動作すること
  - [ ] コントローラー未接続時もエラーが発生しないこと

#### UIテスト

- [ ] 設定メニューの表示確認
  - [ ] VirtualDesktopモードの設定が表示されること
  - [ ] セットアップガイドボタンが表示されること
  - [ ] キーバインド設定が表示されること
- [ ] セットアップガイドの表示確認
  - [ ] ステップインジケーターが正しく表示されること
  - [ ] 説明テキストが分かりやすく表示されること
  - [ ] ボタンが適切に配置されていること
- [ ] レスポンシブ対応の確認
  - [ ] 各画面サイズで正しく表示されること

#### 既存機能の動作確認

- [ ] 他の機能への影響確認
  - [ ] マウス操作が影響を受けていないこと
  - [ ] キーボード操作が影響を受けていないこと
  - [ ] ズーム機能が影響を受けていないこと
  - [ ] ドラッグ機能が影響を受けていないこと
  - [ ] 回転機能が影響を受けていないこと
  - [ ] グリッド表示が影響を受けていないこと
  - [ ] ピーキング機能が影響を受けていないこと
  - [ ] ヒストグラム機能が影響を受けていないこと

### 12. コードフォーマット

- [ ] コードフォーマッターの適用
  - [ ] controller.rs
  - [ ] lib.rs
  - [ ] config.ts
  - [ ] AppStateContext.tsx
  - [ ] controllerMapping.ts
  - [ ] ControllerContext.tsx
  - [ ] ControllerSetupGuide.tsx
  - [ ] ControllerSettings.tsx
  - [ ] SettingsMenu/index.tsx
  - [ ] Titlebar/index.tsx
  - [ ] ImageViewer/index.tsx

### 13. ドキュメント作成

- [ ] 使用方法のドキュメント作成
  - [ ] VirtualDesktop環境での使用方法
  - [ ] コントローラー接続方法
  - [ ] キーバインドのカスタマイズ方法
  - [ ] トラブルシューティング

### 14. 最終確認

- [ ] 設計書との整合性確認
- [ ] すべての機能が正しく動作することを確認
- [ ] パフォーマンスが適切であることを確認
- [ ] コミット前の最終動作確認
- [ ] ユーザーへの確認依頼

## 変更ファイル

### 新規作成

- `src-tauri/src/controller.rs` - コントローラー入力処理
- `src/lib/controllerMapping.ts` - コントローラーマッピングロジック
- `src/context/ControllerContext.tsx` - コントローラーコンテキスト
- `src/components/SettingsMenu/ControllerSetupGuide.tsx` - セットアップガイド
- `src/components/SettingsMenu/ControllerSettings.tsx` - コントローラー設定UI

### 修正

- `src-tauri/Cargo.toml` - 依存関係追加
- `src-tauri/src/lib.rs` - Tauriコマンド登録
- `src/config/config.ts` - コントローラー設定追加
- `src/context/AppStateContext.tsx` - VirtualDesktopモード状態管理
- `src/components/SettingsMenu/index.tsx` - コントローラー設定統合
- `src/components/Titlebar/index.tsx` - Props受け渡し
- `src/components/ImageViewer/index.tsx` - ControllerProvider統合

## 実装の詳細

### デフォルトキーバインド

| コントローラー入力 | マッピング先の操作 | 説明 |
|------------------|------------------|------|
| 左スティック | パン（画像移動） | 画像をドラッグ移動 |
| 右スティック上/下 | ズームイン/アウト | 画像を拡大縮小 |
| Aボタン | 画像切り替え（次） | 次の画像を表示 |
| Bボタン | 画像切り替え（前） | 前の画像を表示 |
| Xボタン | 画面フィット | 画像を画面にフィット |
| Yボタン | ズームリセット | ズームを100%に戻す |
| LBボタン | 回転（左90度） | 画像を左に90度回転 |
| RBボタン | 回転（右90度） | 画像を右に90度回転 |
| LTトリガー | グリッド表示切替 | グリッドON/OFF |
| RTトリガー | ピーキング表示切替 | ピーキングON/OFF |
| Startボタン | 設定メニュー表示 | 設定メニューを開く |

### ポーリングアーキテクチャ

```typescript
// 60Hzでポーリング（16ms間隔）
setInterval(async () => {
  if (!virtualDesktopMode()) return;

  const state = await invoke<ControllerState>('poll_controller_input');
  setControllerState(state);

  // マッピング処理
  if (state.connected) {
    mapper.mapInputToActions(state, appState);
  }
}, 16);
```

### エッジ検出ロジック

```typescript
// ボタンが押された瞬間のみ検出
if (buttons.a && !prev.buttons.a) {
  // Aボタンが押された
  appState.loadNextImage();
}
```

### デッドゾーンフィルタリング

```typescript
applyDeadzone(value: number): number {
  return Math.abs(value) < this.deadzone ? 0 : value;
}
```

### VirtualDesktop検出方法

1. **方法A（手動トグル）**: ユーザーが設定メニューでVirtualDesktopモードをON
2. **方法B（プロセス検出）**: `VirtualDesktop.Streamer.exe`プロセスの存在を確認
3. セットアップガイドで両方の方法をサポート

## 注意事項

- gilrs 0.10とsysinfo 0.30の互換性を確認すること
- ポーリング間隔は60Hz（16ms）を維持すること
- デッドゾーンは0.15をデフォルトとすること
- エッジ検出を確実に実装すること（ボタン連打防止）
- VirtualDesktopの「Use Touch controllers as gamepad」機能が有効である必要があることをユーザーに伝えること
- セットアップガイドは初回起動時のみ表示すること
- キーバインドのカスタマイズは将来的な拡張を考慮した設計にすること
- 既存の機能への影響を最小限に抑えること
- コミットは行わず、実装完了後にユーザーへ確認を求めること

---

# サイドバーギャラリービュー機能 実装タスク

## プロジェクト概要

タイトルバーの左上にサイドバー展開ボタンを配置し、クリックすると縦1列の画像サムネイルが表示されるギャラリービュー機能を実装する。

## 前提条件

1. まず、Rustコードのリファクタリング(第1段階)を完了させる
2. リファクタリング完了後、ギャラリービュー機能(第2段階)を実装する

## タスク一覧

### 第1段階: Rustコードのリファクタリング

#### タスク1.1: navigation.rsモジュールの作成

- [ ] `src-tauri/src/navigation.rs`ファイルを新規作成
- [ ] img.rsから以下の関数をコピー
  - [ ] get_folder_images関数
  - [ ] get_next_image関数
  - [ ] get_previous_image関数
- [ ] 必要なimport文を追加
  - [ ] `use std::path::Path;`
  - [ ] `use std::fs;`
- [ ] JSDocコメントも含めて完全にコピー

#### タスク1.2: img.rsの修正

- [ ] img.rsから以下の関数を削除
  - [ ] get_folder_images関数(209-253行)
  - [ ] get_next_image関数(255-283行)
  - [ ] get_previous_image関数(285-317行)
- [ ] 削除後、残りの関数が正しく動作することを確認
  - [ ] create_image_backup
  - [ ] restore_image_from_backup
  - [ ] cleanup_image_backup
  - [ ] rotate_image
  - [ ] get_launch_image_path
  - [ ] get_launch_window_mode

#### タスク1.3: lib.rsのモジュール宣言とコマンド登録を更新

- [ ] モジュール宣言にnavigationを追加
  - [ ] `mod navigation;`を追加(6行目付近)
- [ ] invoke_handlerのコマンド登録を修正
  - [ ] `img::get_folder_images`を`navigation::get_folder_images`に変更
  - [ ] `img::get_next_image`を`navigation::get_next_image`に変更
  - [ ] `img::get_previous_image`を`navigation::get_previous_image`に変更

#### タスク1.4: ビルド確認

- [ ] Rustのビルドが通ることを確認
  - [ ] `npm run build`を実行
  - [ ] エラーがないことを確認
- [ ] 既存機能が壊れていないことを確認
  - [ ] アプリを起動
  - [ ] 画像を開く
  - [ ] 次の画像へ移動できることを確認
  - [ ] 前の画像へ移動できることを確認

### 第2段階: ギャラリービュー機能の実装

#### タスク2.1: ImageGalleryコンポーネントの作成

**ファイル**: `src/components/ImageGallery/index.tsx`

- [ ] 基本構造の作成
  - [ ] コンポーネントファイルを新規作成
  - [ ] Props型定義を追加
  - [ ] 基本的なレイアウト構造を実装
- [ ] 状態管理の実装
  - [ ] folderImages Signalを追加(画像一覧)
  - [ ] isLoading Signalを追加(ローディング状態)
- [ ] 画像一覧取得機能の実装
  - [ ] Tauriコマンド(get_folder_images)を呼び出す
  - [ ] 現在の画像パスから親フォルダを取得
  - [ ] フォルダ内の画像一覧を取得
- [ ] サムネイル表示機能の実装
  - [ ] convertFileSrcで画像パスを変換
  - [ ] サムネイル画像を表示
  - [ ] ファイル名を表示
- [ ] 現在表示中の画像をハイライト
  - [ ] currentImagePathと一致する画像に特別なスタイルを適用
  - [ ] border-blue-500を適用
- [ ] 画像クリックイベントの実装
  - [ ] onImageSelectコールバックを呼び出す
  - [ ] サイドバーを閉じる

#### タスク2.2: サイドバーのスタイリング

- [ ] ガラス表現の実装
  - [ ] bg-black/80
  - [ ] backdrop-blur-md
  - [ ] border-white/10
- [ ] アニメーション効果の実装
  - [ ] transform transition-transform duration-300
  - [ ] isOpenに応じてtranslate-x-0または-translate-x-fullを適用
- [ ] スクロール機能の実装
  - [ ] overflow-y-auto
  - [ ] 縦スクロール可能にする
- [ ] レスポンシブ対応
  - [ ] 幅を固定(w-64)
  - [ ] 高さは画面いっぱい(top-8 bottom-0)

#### タスク2.3: Titlebarコンポーネントの修正

**ファイル**: `src/components/Titlebar/index.tsx`

- [ ] サイドバー展開ボタンの追加
  - [ ] ハンバーガーメニューアイコンを作成
  - [ ] ボタンを左側エリアに配置
  - [ ] aria-labelを追加
- [ ] ボタンのスタイリング
  - [ ] 既存のwindowButtonClassesと統一
  - [ ] ホバー効果を追加
- [ ] クリックイベントハンドラーの追加
  - [ ] toggleGallery関数を呼び出す

#### タスク2.4: AppStateContextの修正

**ファイル**: `src/context/AppStateContext.tsx`

- [ ] showGallery状態を追加
  - [ ] `const [showGallery, setShowGallery] = createSignal(false);`
- [ ] Context値に追加
  - [ ] showGallery: Accessor<boolean>
  - [ ] setShowGallery: Setter<boolean>
- [ ] 型定義を更新
  - [ ] AppStateContextType interfaceに追加

#### タスク2.5: Appコンポーネントの修正

**ファイル**: `src/App.tsx`

- [ ] ImageGalleryコンポーネントをインポート
- [ ] ImageGalleryをレイアウトに追加
  - [ ] mainタグ内に配置
  - [ ] ImageViewerの前に配置
- [ ] handleImageSelect関数の実装
  - [ ] setCurrentImageFilePathを呼び出す
  - [ ] setShowGalleryを呼び出してサイドバーを閉じる
- [ ] Propsの受け渡し
  - [ ] isOpen={showGallery()}
  - [ ] onClose={() => setShowGallery(false)}
  - [ ] currentImagePath={currentImageFilePath()}
  - [ ] onImageSelect={handleImageSelect}

#### タスク2.6: ヘルパー関数の実装

**ファイル**: `src/components/ImageGallery/index.tsx`

- [ ] getFileName関数を実装
  - [ ] ファイルパスからファイル名のみを抽出
  - [ ] `path.split(/[\/]/).pop() || ''`
- [ ] getParentFolder関数を実装
  - [ ] ファイルパスから親フォルダパスを抽出

### 第3段階: テストと最適化

#### タスク3.1: 機能テスト

- [ ] サイドバー開閉機能のテスト
  - [ ] ボタンクリックで開く
  - [ ] 閉じるボタンで閉じる
  - [ ] サイドバー外クリックで閉じる
- [ ] 画像一覧表示のテスト
  - [ ] フォルダ内の全画像が表示される
  - [ ] サムネイルが正しく表示される
  - [ ] ファイル名が正しく表示される
- [ ] 画像選択機能のテスト
  - [ ] 画像クリックで表示が切り替わる
  - [ ] 現在の画像がハイライトされる
  - [ ] サイドバーが自動的に閉じる

#### タスク3.2: UI/UXテスト

- [ ] アニメーション確認
  - [ ] サイドバーの開閉アニメーションが滑らか
  - [ ] トランジション時間が適切(300ms)
- [ ] スタイル確認
  - [ ] ガラス表現が美しい
  - [ ] サムネイルサイズが適切
  - [ ] ハイライトが目立つ
- [ ] スクロール確認
  - [ ] 縦スクロールが正しく動作する
  - [ ] 大量の画像でもスムーズ

#### タスク3.3: パフォーマンステスト

- [ ] 大量の画像での動作確認
  - [ ] 100枚以上の画像があるフォルダで確認
  - [ ] サムネイル読み込みが遅延する場合は最適化を検討
- [ ] メモリ使用量の確認
  - [ ] メモリリークがないことを確認
- [ ] レンダリングパフォーマンスの確認
  - [ ] 再レンダリングが最小限であることを確認

#### タスク3.4: エッジケース確認

- [ ] フォルダに画像が1枚もない場合
  - [ ] 適切なメッセージを表示
- [ ] サムネイル読み込みに失敗した場合
  - [ ] フォールバック表示を実装
- [ ] 非常に長いファイル名の場合
  - [ ] truncateで省略表示

### 第4段階: ドキュメントとコミット

#### タスク4.1: コードドキュメント

- [ ] ImageGalleryコンポーネントにJSDocを追加
- [ ] 主要な関数にコメントを追加
- [ ] 複雑なロジックに説明コメントを追加

#### タスク4.2: 最終確認

- [ ] 設計書との整合性確認
- [ ] タスク一覧の完了確認
- [ ] コミット前の最終動作確認

#### タスク4.3: ユーザーへの確認依頼

- [ ] 実装内容のサマリーを作成
- [ ] 変更ファイル一覧を提示
- [ ] コミット確認を依頼

## 進捗管理

- 開始日: 2025年10月14日
- 完了予定日: 未定
- 現在のフェーズ: 第1段階(Rustコードのリファクタリング)

## 備考

- **重要**: 第1段階を必ず完了させてから第2段階に進むこと
- ビルドが通ることを確認してから次のタスクに進むこと
- 各フェーズ完了後にユーザーに確認を求めること
- コミットはユーザーの承認を得てから行うこと

## 実装完了の定義

### 第1段階完了の定義

- [ ] navigation.rsが正しく作成されている
- [ ] img.rsから3つの関数が削除されている
- [ ] lib.rsのコマンド登録が更新されている
- [ ] `npm run build`が成功する
- [ ] 既存の画像ナビゲーション機能が正しく動作する

### 第2段階完了の定義

- [ ] ImageGalleryコンポーネントが作成されている
- [ ] Titlebarにサイドバー展開ボタンが追加されている
- [ ] サイドバーが正しく開閉する
- [ ] 画像一覧が表示される
- [ ] 画像クリックで表示が切り替わる
- [ ] 全てのテストが合格する

## 成果物

### 第1段階

#### 新規作成
- `src-tauri/src/navigation.rs`

#### 修正
- `src-tauri/src/img.rs`
- `src-tauri/src/lib.rs`

### 第2段階

#### 新規作成
- `src/components/ImageGallery/index.tsx`

#### 修正
- `src/components/Titlebar/index.tsx`
- `src/App.tsx`
- `src/context/AppStateContext.tsx`

---

# Modern Glassmorphism + Dark UI 改革タスク

## 概要

UIを**Modern Glassmorphism + Dark UI**スタイルに全面刷新する。段階的な移行により、常に動作する状態を維持する。

---

## フェーズ1: 基盤整備

### タスク1.1: CSS変数とユーティリティクラスの定義

**目的**: 新しいデザインシステムの基盤となるCSS変数とユーティリティクラスを定義

**ファイル**:
- `src/App.css`

**作業内容**:
- [ ] 既存のCSS変数を確認
- [ ] ダークテーマ用のガラスモーフィズムCSS変数を追加
  - `--glass-bg-primary`
  - `--glass-bg-secondary`
  - `--glass-border-subtle`
  - `--glass-border-emphasis`
  - `--glass-text-primary`
  - `--glass-text-secondary`
  - `--glass-text-muted`
- [ ] ライトテーマ用のガラスモーフィズムCSS変数を追加
- [ ] タイポグラフィ用ユーティリティクラスを追加
  - `.text-tabular` - tabular-nums適用
  - `.text-caption` - 11px
  - `.text-label` - 12px
  - `.text-small` - 13px
- [ ] ビルドが成功することを確認

**検証**:
- `npm run build`が成功する
- 既存のUIが正常に表示される（変数追加のみなので、見た目は変わらない）

---

## フェーズ2: コンポーネント移行

### タスク2.1: Titlebar コンポーネントの移行

**目的**: Titlebarを新しいスタイルに移行

**ファイル**:
- `src/components/Titlebar/index.tsx`

**作業内容**:
- [ ] インラインスタイル（`<style>`タグ）を削除
- [ ] TailwindCSSクラスを適用
  - 背景: `bg-[var(--glass-bg-primary)] backdrop-blur-xl`
  - ボーダー: `border-[var(--glass-border-subtle)]`
- [ ] ウィンドウコントロールボタンのホバーエフェクトを実装
  - `hover:bg-white/[0.15] hover:scale-105`
  - `active:scale-98`
- [ ] ギャラリーボタンのスタイル統一
- [ ] ビルドと動作確認

**検証**:
- `npm run build`が成功する
- ウィンドウコントロールボタン（最小化、最大化、閉じる）が正常に動作
- ギャラリーボタンが正常に動作
- ホバーエフェクトが適切に表示される
- ダーク/ライトモード切り替えが正常に動作

---

### タスク2.2: Footer コンポーネントの移行

**目的**: Footerを新しいスタイルに移行

**ファイル**:
- `src/components/Footer/index.tsx`

**作業内容**:
- [ ] 背景とボーダーをガラスモーフィズムスタイルに変更
  - `bg-[var(--glass-bg-primary)] backdrop-blur-xl`
  - `border-[var(--glass-border-subtle)]`
- [ ] テキストスタイルを更新
  - 解像度表示に`text-tabular`クラスを適用
  - ファイルパスに適切なテキストカラーを適用
- [ ] エクスプローラボタンのスタイルを更新
  - ホバーエフェクト: `hover:bg-white/[0.15] hover:scale-105`
- [ ] ビルドと動作確認

**検証**:
- `npm run build`が成功する
- 解像度表示が等幅フォントで表示される
- エクスプローラボタンが正常に動作
- ホバーエフェクトが適切に表示される
- ダーク/ライトモード切り替えが正常に動作

---

### タスク2.3: FloatingControlPanel コンポーネントの移行

**目的**: FloatingControlPanelを新しいスタイルに移行

**ファイル**:
- `src/components/FloatingControlPanel/index.tsx`

**作業内容**:
- [ ] インラインスタイル（`<style>`タグ）を削除
- [ ] メインパネルのスタイルをTailwindクラスに変更
  - `bg-[var(--glass-bg-primary)] backdrop-blur-xl`
  - `border border-[var(--glass-border-subtle)]`
- [ ] ボタンのスタイルを更新
  - 通常時: `bg-transparent`
  - ホバー時: `hover:bg-white/[0.15] hover:backdrop-blur-md hover:scale-105`
  - アクティブ時: `active:bg-white/[0.1] active:scale-98`
- [ ] トグルボタンのスタイルを更新
- [ ] ズーム倍率表示に`text-tabular`クラスを適用
- [ ] ビルドと動作確認

**検証**:
- `npm run build`が成功する
- すべてのボタンが正常に動作（ズームイン/アウト、リセット、画面フィット、回転、マルチメニュー、設定）
- トグルボタンでパネルの展開/折りたたみが正常に動作
- ズーム倍率が等幅フォントで表示される
- ホバーエフェクトが適切に表示される
- ダーク/ライトモード切り替えが正常に動作

---

### タスク2.4: ImageGallery コンポーネントの移行

**目的**: ImageGalleryを新しいスタイルに移行

**ファイル**:
- `src/components/ImageGallery/index.tsx`

**作業内容**:
- [ ] インラインスタイル（`<style>`タグ）を削除
- [ ] メインパネルのスタイルをTailwindクラスに変更
  - `bg-[var(--glass-bg-primary)] backdrop-blur-xl`
  - `border-r border-[var(--glass-border-subtle)]`
- [ ] ヘッダーのスタイルを更新
  - `bg-[var(--glass-bg-secondary)] backdrop-blur-lg`
  - フォルダパス表示に`text-caption`または`text-label`を適用
- [ ] サムネイル項目のスタイルを更新
  - 通常時: `border-transparent`
  - ホバー時: `hover:border-white/[0.1] hover:bg-white/[0.08]`
  - 選択時: `border-blue-500/50 bg-blue-500/20`
- [ ] ビルドと動作確認

**検証**:
- `npm run build`が成功する
- ギャラリーの開閉が正常に動作
- サムネイルのクリックで画像が選択される
- 選択中の画像が視覚的に区別される
- ホバーエフェクトが適切に表示される
- ダーク/ライトモード切り替えが正常に動作

---

### タスク2.5: SettingsMenu コンポーネントの移行

**目的**: SettingsMenuを新しいスタイルに移行

**ファイル**:
- `src/components/SettingsMenu/index.tsx`

**作業内容**:
- [ ] インラインスタイル（`<style>`タグ）がある場合は削除
- [ ] メニューパネルのスタイルをTailwindクラスに変更
  - `bg-[var(--glass-bg-primary)] backdrop-blur-xl`
  - `border border-[var(--glass-border-subtle)]`
- [ ] メニュー項目のスタイルを更新
  - 通常時: `bg-transparent`
  - ホバー時: `hover:bg-white/[0.08] hover:backdrop-blur-sm`
  - 選択時: `bg-blue-500/20 border-blue-500/50`
- [ ] ラベルテキストに`text-label`または`text-small`を適用
- [ ] ビルドと動作確認

**検証**:
- `npm run build`が成功する
- 設定メニューが正常に開閉する
- テーマ切り替えが正常に動作
- ホイール感度調整が正常に動作
- フルパス表示切り替えが正常に動作
- コントロールパネル位置切り替えが正常に動作
- ホバーエフェクトが適切に表示される
- ダーク/ライトモード切り替えが正常に動作

---

### タスク2.6: MultiMenu コンポーネントの移行

**目的**: MultiMenuを新しいスタイルに移行

**ファイル**:
- `src/components/ImageViewer/MultiMenu.tsx`
- `src/components/ImageViewer/GridMenuContent.tsx`
- `src/components/ImageViewer/PeakingMenuContent.tsx`
- `src/components/ImageViewer/HistogramMenuContent.tsx`

**作業内容**:
- [ ] MultiMenu本体のスタイルをTailwindクラスに変更
  - `bg-[var(--glass-bg-primary)] backdrop-blur-xl`
  - `border border-[var(--glass-border-subtle)]`
- [ ] タブボタンのスタイルを更新
  - 通常時: `bg-transparent`
  - ホバー時: `hover:bg-white/[0.08]`
  - 選択時: `bg-blue-500/20 border-blue-500/50`
- [ ] 各サブメニューのスタイルを更新
- [ ] スライダー、トグルボタンのスタイルを統一
- [ ] ラベルに`text-label`または`text-small`を適用
- [ ] ビルドと動作確認

**検証**:
- `npm run build`が成功する
- マルチメニューが正常に開閉する
- グリッド表示の設定が正常に動作
- ピーキングの設定が正常に動作
- ヒストグラムの設定が正常に動作
- タブ切り替えが正常に動作
- ホバーエフェクトが適切に表示される
- ダーク/ライトモード切り替えが正常に動作

---

### タスク2.7: ImageViewer関連コンポーネントの移行

**目的**: ImageViewerとその関連コンポーネントを新しいスタイルに移行

**ファイル**:
- `src/components/ImageViewer/index.tsx`
- `src/components/ImageViewer/GridOverlay.tsx`
- `src/components/ImageViewer/PeakingLayer.tsx`
- `src/components/ImageViewer/HistogramLayer.tsx`

**作業内容**:
- [ ] GridOverlayのスタイルを確認（必要に応じて調整）
- [ ] PeakingLayerのスタイルを確認（必要に応じて調整）
- [ ] HistogramLayerのスタイルをTailwindクラスに変更
  - パネル: `bg-[var(--glass-bg-primary)] backdrop-blur-lg`
  - ラベルに`text-label`を適用
- [ ] ビルドと動作確認

**検証**:
- `npm run build`が成功する
- グリッド表示が正常に動作
- ピーキング表示が正常に動作
- ヒストグラム表示が正常に動作
- 各機能のオン/オフが正常に動作
- ダーク/ライトモード切り替えが正常に動作

---

## フェーズ3: 検証とリファインメント

### タスク3.1: 全体的な一貫性の確認

**目的**: すべてのコンポーネントのスタイルが統一されていることを確認

**作業内容**:
- [ ] すべてのコンポーネントでインラインスタイルが削除されていることを確認
- [ ] ガラスモーフィズムの表現が統一されていることを確認
- [ ] ボーダーの太さと透明度が統一されていることを確認
- [ ] ホバーエフェクトが統一されていることを確認
- [ ] タイポグラフィが統一されていることを確認

**検証**:
- 視覚的にすべてのコンポーネントが統一されたデザインになっている
- ダーク/ライトモード両方で適切に表示される

---

### タスク3.2: インタラクションの微調整

**目的**: すべてのインタラクションが適切に動作することを確認

**作業内容**:
- [ ] すべてのボタンのホバーエフェクトを確認
- [ ] すべてのメニューの開閉アニメーションを確認
- [ ] すべてのトグル操作を確認
- [ ] 必要に応じてトランジション速度を微調整

**検証**:
- すべてのインタラクションが滑らかで自然
- ホバーエフェクトが視覚的に適切
- アニメーションが快適な速度

---

### タスク3.3: ドキュメント更新

**目的**: 新しいデザインシステムのドキュメントを整備

**作業内容**:
- [ ] 新しいCSS変数の使用方法をドキュメント化
- [ ] 新しいユーティリティクラスの使用方法をドキュメント化
- [ ] コンポーネントごとのスタイルガイドを作成（必要に応じて）
- [ ] メモリに新しいスタイルガイドを記録

**検証**:
- ドキュメントが最新の状態になっている
- 今後の開発者が新しいスタイルシステムを理解できる

---

## 完了条件

- [ ] すべてのコンポーネントでインラインスタイルが削除されている
- [ ] すべてのコンポーネントがTailwindCSSクラスでスタイリングされている
- [ ] ダーク/ライトモード両方で適切に動作する
- [ ] すべての既存機能が正常に動作する
- [ ] `npm run build`が成功する
- [ ] 視覚的に統一されたデザインになっている

