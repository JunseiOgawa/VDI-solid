# フォーカスピーキングボタンUI追加機能 設計書

## 概要

フォーカスピーキング機能の操作性を向上させるため、専用ボタンをTitlebarに追加し、グリッドボタンと同様のプルダウンUIを実装します。

## 背景

### 現在の実装状況

- **グリッド機能**: Titlebarにグリッドボタンが存在し、クリックでGridMenuプルダウンが表示される
- **フォーカスピーキング機能**: SettingsMenuの中にサブメニューとして実装されている
- **問題点**: フォーカスピーキングは撮影現場で頻繁に使用する機能だが、設定メニュー内に埋もれており、アクセスが不便

### 要件

1. フォーカスピーキング専用ボタンをグリッドボタンの右隣に配置
2. ボタンクリックでプルダウンメニューを表示
3. プルダウンメニューには以下の設定項目を含む:
   - ON/OFF切り替え
   - 強度調整スライダー
   - 色選択(ライム、レッド、シアン、イエロー、マゼンタ)
   - 不透明度調整スライダー
   - 点滅ON/OFF
4. メニュー外クリックで自動的に閉じる機能(グリッド、フォーカスピーキング両方)

## 設計

### コンポーネント構成

#### 1. PeakingMenu コンポーネント(新規作成)

**ファイルパス**: `src/components/ImageViewer/PeakingMenu.tsx`

**役割**: フォーカスピーキング設定を行うプルダウンメニュー

**Props**:
```typescript
interface PeakingMenuProps {
  peakingEnabled: boolean;
  onPeakingEnabledChange: (enabled: boolean) => void;
  peakingIntensity: number;
  onPeakingIntensityChange: (intensity: number) => void;
  peakingColor: string;
  onPeakingColorChange: (color: string) => void;
  peakingOpacity: number;
  onPeakingOpacityChange: (opacity: number) => void;
  peakingBlink: boolean;
  onPeakingBlinkChange: (enabled: boolean) => void;
}
```

**UIレイアウト**:
- GridMenuと同様のスタイル(min-w-[220px])
- ヘッダー: "フォーカスピーキング"
- ON/OFFチェックボックス
- 強度スライダー(0-255、ステップ5)
- 色選択ボタン(5色のプリセット)
- 不透明度スライダー(0-1、ステップ0.05)
- 点滅チェックボックス

**デバウンス処理**:
- スライダー操作時はリアルタイム更新を避けるため500msのデバウンス処理を実装

#### 2. Titlebar コンポーネント(既存を修正)

**ファイルパス**: `src/components/Titlebar/index.tsx`

**追加要素**:

1. **状態管理**:
   ```typescript
   const [showPeakingMenu, setShowPeakingMenu] = createSignal(false);
   ```

2. **フォーカスピーキングボタン**:
   - グリッドボタンの直後に配置
   - アイコン: focus_ca_h.svgを使用
   - ピーキング有効時は`bg-[var(--accent-primary)]`でハイライト
   - クリックで`togglePeakingMenu()`を呼び出し

3. **PeakingMenu表示**:
   ```tsx
   {showPeakingMenu() && (
     <div class="no-drag absolute left-0 top-full z-50 mt-1">
       <PeakingMenu {...props} />
     </div>
   )}
   ```

4. **メニュー外クリック処理**:
   - `onMount`でグローバルクリックイベントリスナーを追加
   - クリック時にメニュー要素外であれば全メニューを閉じる
   - `onCleanup`でリスナーを削除

### メニュー外クリック機能の実装詳細

```typescript
onMount(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    // メニューボタンまたはメニュー内のクリックは無視
    if (
      target.closest('#gridBtn') ||
      target.closest('#peakingBtn') ||
      target.closest('[data-menu="grid"]') ||
      target.closest('[data-menu="peaking"]')
    ) {
      return;
    }

    // メニュー外のクリックは全メニューを閉じる
    setShowGridMenu(false);
    setShowPeakingMenu(false);
  };

  document.addEventListener('click', handleClickOutside);

  onCleanup(() => {
    document.removeEventListener('click', handleClickOutside);
  });
});
```

### ボタン配置順序

Titlebar左側のボタン配置順:
1. ズームアウト
2. ズームリセット
3. ズームイン
4. 画面フィット
5. 回転
6. **グリッド** ← 既存
7. **フォーカスピーキング** ← 新規追加

### スタイリング方針

- GridMenuと統一されたデザインパターンを使用
- TailwindCSSのカスタムプロパティ(CSSカスタムプロパティ)でテーマ対応
- トランジション効果で滑らかなUI
- ホバー時のビジュアルフィードバック

## 実装上の注意点

### 1. SettingsMenuとの重複

- SettingsMenu内のフォーカスピーキング設定は引き続き残す
- 両方のUIが同じAppStateContextの状態を参照するため、どちらから変更しても同期される

### 2. デバウンス処理

- PeakingMenu内でスライダー操作時のデバウンス処理を実装
- SettingsMenuと同じパターン(500ms)を使用
- リアルタイム表示用の一時Signalとデバウンス後の確定処理を分離

### 3. アクセシビリティ

- ボタンに適切な`aria-label`を設定
- キーボード操作でもメニューを閉じられるようにする
- フォーカス管理を適切に実装

### 4. z-index管理

- プルダウンメニューは`z-50`で表示
- 他のUI要素との重なり順序を確認

## テストケース

### 機能テスト

1. フォーカスピーキングボタンのクリックでメニューが開閉すること
2. メニュー内の各設定項目が正しく動作すること
3. メニュー外クリックで自動的に閉じること
4. グリッドメニューとフォーカスピーキングメニューが独立して動作すること
5. SettingsMenu内のフォーカスピーキング設定と同期すること

### UIテスト

1. ボタンがグリッドボタンの右隣に正しく配置されること
2. ピーキング有効時にボタンがハイライトされること
3. メニューのスタイルがGridMenuと統一されていること
4. デバウンス処理が正しく機能すること

## 成果物

- `src/components/ImageViewer/PeakingMenu.tsx` (新規)
- `src/components/Titlebar/index.tsx` (修正)

---

# 画像回転時の中心軸問題の改善

## 要件定義

### 背景

現在の実装では、画像を回転させる際に左上を軸として回転しているように見える問題が発生しています。ユーザーは画像が中央を軸として回転し、回転後も画像が画面中央に配置されることを期待しています。

### 問題の詳細

1. **回転軸の問題**: 画像が左上を軸として回転しているように見える
2. **視覚的な違和感**: 回転処理中も含めて、画像が常に中央に表示されるべき

### 制約条件

- 他の既存機能(ドラッグ、ズーム、screen fit、グリッド、ピーキング等)に影響を与えないこと
- 最小限のコード変更で実現すること

## 技術的な分析

### 根本原因

`src/components/ImageViewer/index.tsx` の535行目で、CSS transformの適用順序が不適切です:

```typescript
// 現在の実装（問題あり）
transform: `translate(${centerX}px, ${centerY}px) scale(${scale}) rotate(${rotation()}deg)`
```

CSS transformは**右から左**の順序で適用されるため、実際の処理順序は:

1. `rotate(${rotation()}deg)` - 原点(0, 0)を基準に回転
2. `scale(${scale})` - スケール変換を適用
3. `translate(${centerX}px, ${centerY}px)` - 最後に中央に移動

この順序では、回転が最初に原点(0, 0)で行われ、その後スケールが適用されるため、回転軸が画像の中心からずれて見えます。

### 既存の実装状況

- **AppStateContext**: 回転ボタンをクリックすると`enqueueRotation(90)`が呼ばれ、`rotation()`シグナルが即座に更新される
- **ImageViewer**: `rotation()`の値がCSS transformに即座に反映される
- **Rust処理**: 3秒後にRust側で実際のファイル回転が実行される（バックグラウンド処理）

つまり、視覚的なフィードバックは既に実装されているが、回転軸の問題により不自然な動きになっています。

## 解決策

### 変更内容

transformの順序を変更し、scaleとrotateの適用順序を入れ替えます:

```typescript
// 修正後の実装
transform: `translate(${centerX}px, ${centerY}px) rotate(${rotation()}deg) scale(${scale})`
```

この変更により、実際の処理順序は:

1. `scale(${scale})` - **最初に**スケール変換を適用
2. `rotate(${rotation()}deg)` - スケール後に回転（画像の中心を軸に回転）
3. `translate(${centerX}px, ${centerY}px)` - 最後に中央に移動

### なぜこれで解決するのか

- スケールが最初に適用されるため、画像の座標系が確定する
- その後の回転が、スケール済みの画像の中心を軸に行われる
- 最後のtranslateで画像全体が画面中央に配置される

### 代替案の検討

1. **transform-originを使用する方法**:
   ```typescript
   'transform-origin': 'center center',
   transform: `translate(...) scale(...) rotate(...)`
   ```
   - 却下理由: 現在の実装は`transform-origin: '0 0'`を基準に複雑な計算を行っているため、変更の影響範囲が大きい

2. **translateを複数使用する方法**:
   ```typescript
   transform: `translate(targetX, targetY) rotate(...) scale(...) translate(-centerX, -centerY)`
   ```
   - 却下理由: 計算が複雑になり、他の機能への影響が大きい

**選択した方法**: scaleとrotateの順序を入れ替えるだけ
- 理由: 最小限の変更で済み、他の機能への影響がほぼない

## 影響範囲の分析

### 変更ファイル

- `src/components/ImageViewer/index.tsx` (1ファイルのみ、1行の変更)

### 影響する機能

- ✅ **画像の回転表示**: 改善される（問題の修正対象）

### 影響しない機能

以下の機能は、scaleとrotateの相対的な順序には依存していないため、影響を受けません:

- ✅ **ドラッグ機能**: position()の値は変更されず、translateの計算方法も同じ
- ✅ **ズーム機能**: scaleの値は変更されず、適用順序が変わるだけ
- ✅ **Screen Fit機能**: fitToScreen()の計算ロジックは変更されない
- ✅ **グリッド表示**: GridOverlayは別の要素で実装されているため無関係
- ✅ **ピーキング機能**: PeakingLayerは別の要素で実装されているため無関係
- ✅ **画像ナビゲーション**: 画像の読み込み処理には影響しない

### リスク評価

**リスクレベル**: 低

- 変更が1行のみ
- 変更内容がCSS transformの順序のみ
- 他の計算ロジックには一切触れない
- transform-originの値は変更しない

## 設計の詳細

### 変更箇所

**ファイル**: `src/components/ImageViewer/index.tsx`

**行番号**: 535行目

**変更前**:
```typescript
return `translate(${centerX}px, ${centerY}px) scale(${scale}) rotate(${rotation()}deg)`;
```

**変更後**:
```typescript
return `translate(${centerX}px, ${centerY}px) rotate(${rotation()}deg) scale(${scale})`;
```

### 動作確認項目

1. **回転の動作確認**
   - 回転ボタンをクリックしたときに、画像が中心を軸に回転すること
   - 回転後も画像が画面中央に表示されること
   - 複数回回転しても正しく動作すること

2. **他機能との組み合わせ確認**
   - ズーム中に回転しても正しく動作すること
   - ドラッグで移動後に回転しても正しく動作すること
   - Screen Fit後に回転しても正しく動作すること

3. **エッジケース**
   - 縦画像と横画像の両方で確認すること
   - 異なるサイズの画像で確認すること

## 実装計画

実装は以下の順序で進めます:

1. `src/components/ImageViewer/index.tsx`のtransform計算部分を修正
2. ローカルで動作確認
3. 各機能との組み合わせテスト
4. コミット作成

## 参考情報

### CSS Transform の適用順序

CSS transformプロパティでは、複数の変換関数が右から左の順序で適用されます。

例: `transform: A B C` の場合、実際の適用順序は `C → B → A`

### transform-origin について

現在の実装では`transform-origin: '0 0'`を使用しており、すべての変換は左上(0, 0)を基準に行われます。今回の修正では、この値は変更せず、transform関数の順序のみを変更します。

---

# GridOverlayとPeakingLayerの再描画タイミング検証と改善

## 概要

GridOverlayとPeakingLayerの再描画タイミングに漏れがないか確認し、新しい画像を取り込んだ際にPeakingLayerの古いデータが残る問題を解決します。

## 背景

### 現在の実装状況

#### GridOverlay (GridOverlay.tsx)
- `onMount`で初回描画とResizeObserverによる親要素のリサイズ監視
- `createEffect`でgridPatternとgridOpacityの変更を監視して再描画
- 親要素のサイズが変わればResizeObserverが自動的に反応

#### PeakingLayer (PeakingLayer.tsx)
- `createEffect`でimagePathとintensityの変更を監視してデータ取得
- キャッシュ機能とAbortControllerによる重複リクエストのキャンセル
- **問題点**: 新しい画像のimagePathが設定された時、古いpeakingDataが残ったまま新しいデータの取得が始まる

### 問題の詳細

1. **GridOverlayの再描画タイミング**:
   - ✅ gridPattern変更時（createEffect）
   - ✅ gridOpacity変更時（createEffect）
   - ✅ 親要素のリサイズ時（ResizeObserver）
   - ✅ 画像変更時（ImageManagerのsrc変更により親要素サイズが変わり、ResizeObserverが反応）
   - **結論**: 現在の実装で問題なし

2. **PeakingLayerの再描画タイミング**:
   - ✅ imagePath変更時（createEffect）
   - ✅ intensity変更時（createEffect）
   - ❌ **問題**: 新しい画像読み込み時、古いピーキングデータが表示され続ける
   - ❌ **原因**: createEffect内でキャッシュミス時に古いデータをクリアしていない

### 具体的な問題

PeakingLayer.tsx の59-114行目のcreateEffect内で:
```typescript
createEffect(() => {
  const path = props.imagePath;
  const intensity = props.intensity;

  if (!path) {
    setPeakingData(null);
    return;
  }

  const cacheKey = generatePeakingCacheKey(path, intensity);

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

  // 新しいAbortControllerを作成
  abortController = new AbortController();
  const signal = abortController.signal;

  // Rust処理呼び出し
  setIsLoading(true);
  setError(null);

  invokeFocusPeaking(path, intensity, cacheKey, signal)
    .then((result) => {
      // ...
    });
});
```

**問題点**:
- キャッシュミス時、古いデータをクリアせずに新しいデータの取得を開始している
- そのため、新しい画像のピーキングデータが読み込まれるまで、古い画像のピーキングが表示され続ける

## 解決策

### 変更内容

PeakingLayer.tsx のcreateEffect内で、キャッシュミス時に古いデータをクリアする処理を追加します:

```typescript
createEffect(() => {
  const path = props.imagePath;
  const intensity = props.intensity;

  if (!path) {
    setPeakingData(null);
    return;
  }

  const cacheKey = generatePeakingCacheKey(path, intensity);

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

  // ... 残りの処理
});
```

### なぜこれで解決するのか

- キャッシュヒット時: すぐに新しいデータを表示（古いデータは即座に上書きされる）
- キャッシュミス時: 古いデータをクリアしてから新しいデータを取得（古いピーキングが表示されない）
- ローディング表示: `setIsLoading(true)`によってローディング中であることをユーザーに明示

## 影響範囲の分析

### 変更ファイル

- `src/components/ImageViewer/PeakingLayer.tsx` (1ファイルのみ、1行の追加)

### 影響する機能

- ✅ **画像切り替え時のピーキング表示**: 改善される（問題の修正対象）
- ✅ **ピーキングのキャッシュ機能**: 影響なし（キャッシュヒット時は従来通り即座に表示）

### リスク評価

**リスクレベル**: 極めて低

- 変更が1行の追加のみ
- ロジックの追加位置が明確（キャッシュミス時のみ実行）
- 既存のキャッシュ機能やAbortController機能には一切影響しない

## 設計の詳細

### 変更箇所

**ファイル**: `src/components/ImageViewer/PeakingLayer.tsx`

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

### 動作確認項目

1. **画像切り替え時の動作確認**
   - 新しい画像を読み込んだ時、古いピーキングデータが表示されないこと
   - キャッシュヒット時は即座に新しいデータが表示されること
   - キャッシュミス時はローディング表示が出ること

2. **既存機能との組み合わせ確認**
   - ピーキングのON/OFF切り替えが正しく動作すること
   - 強度・色・不透明度の変更が正しく反映されること
   - AbortController機能が正しく動作すること（高速切り替え時）

3. **パフォーマンス確認**
   - キャッシュ機能が正しく動作すること
   - メモリリークが発生しないこと

## 実装計画

実装は以下の順序で進めます:

1. `src/components/ImageViewer/PeakingLayer.tsx`のcreateEffect内に`setPeakingData(null)`を追加
2. ローカルで動作確認
3. 各機能との組み合わせテスト
4. コミット作成

## 参考情報

### Solid.jsのcreateEffectについて

createEffectは依存する値（この場合はprops.imagePathとprops.intensity）が変更されるたびに実行されます。新しい画像に切り替わると、imagePathが変わるため、createEffectが再実行され、新しいピーキングデータの取得が開始されます。
