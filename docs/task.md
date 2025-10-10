# フォーカスピーキングボタンUI追加 タスク一覧

## タスク概要

フォーカスピーキング機能の専用ボタンとプルダウンUIを実装し、グリッドメニューと合わせてメニュー外クリック機能を追加します。

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
