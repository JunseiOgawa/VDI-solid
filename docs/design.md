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

---

# ホイール感度設定機能の追加

## 概要

VRゴーグルのコントローラーや高速なマウスホイール操作に対応するため、ホイールによるズーム操作の感度を調整可能にする機能を追加します。

## 背景

### 現在の実装状況

- ImageViewerのhandleWheelZoom関数でホイールイベントを処理
- `event.deltaY`の値に関係なく、一定のステップ幅（CONFIG.zoom.step = 0.1）でズームを変更
- VRコントローラーの大きなdeltaY値が連続的に発生すると、ズーム操作が非常に速くなり制御が困難

### 問題点

```typescript
const handleWheelZoom = (event: WheelEvent) => {
  event.preventDefault();
  const previousScale = zoomScale();
  const delta = event.deltaY > 0 ? -CONFIG.zoom.step : CONFIG.zoom.step;
  const newScale = Math.max(CONFIG.zoom.minScale, Math.min(CONFIG.zoom.maxScale, previousScale + delta));
  // ...
};
```

現在の実装では、deltaYの値が100でも10000でも同じステップ幅（0.1）で処理されるため、VRコントローラーのような大きなdeltaY値を連続的に送るデバイスでは、ズーム操作が非常に速くなります。

### 要件

1. ホイール操作の感度を設定可能にする
2. 設定メニュー（SettingsMenu）にスライダーを追加してユーザーが調整できるようにする
3. 設定値をlocalStorageに永続化する
4. VRコントローラーなどの高速なホイール操作でも細かくズーム制御できるようにする

## 設計

### 1. configファイルの更新

**ファイルパス**: `src/config/config.ts`

**変更内容**:
```typescript
export interface AppConfig {
  zoom: {
    minScale: number;
    maxScale: number;
    step: number;
    wheelSensitivity: number; // 新規追加: デフォルト感度
    minWheelSensitivity: number; // 新規追加: 最小感度
    maxWheelSensitivity: number; // 新規追加: 最大感度
  };
  // ...
}

export const CONFIG: AppConfig = {
  zoom: {
    minScale: 0.1,
    maxScale: 10,
    step: 0.1,
    wheelSensitivity: 1.0, // デフォルト値（従来の動作）
    minWheelSensitivity: 0.1, // 最小感度（10倍遅い）
    maxWheelSensitivity: 5.0, // 最大感度（5倍速い）
  },
  // ...
};
```

### 2. AppStateContextの更新

**ファイルパス**: `src/context/AppStateContext.tsx`

**変更内容**:

```typescript
export interface AppState {
  // 既存の定義...

  // ホイール感度関連
  wheelSensitivity: () => number;
  setWheelSensitivity: (sensitivity: number) => void;
}

export const AppProvider: ParentComponent = (props) => {
  // 既存のSignal定義...

  const [wheelSensitivity, setWheelSensitivity] = createSignal<number>(CONFIG.zoom.wheelSensitivity);

  // localStorageから復元
  onMount(() => {
    // 既存の復元処理...

    const savedWheelSensitivity = localStorage.getItem('vdi-wheel-sensitivity');
    if (savedWheelSensitivity) {
      const sensitivity = parseFloat(savedWheelSensitivity);
      if (!isNaN(sensitivity)) {
        setWheelSensitivity(Math.max(CONFIG.zoom.minWheelSensitivity, Math.min(CONFIG.zoom.maxWheelSensitivity, sensitivity)));
      }
    }
  });

  // 永続化処理
  const handleWheelSensitivityChange = (sensitivity: number) => {
    const clampedSensitivity = Math.max(CONFIG.zoom.minWheelSensitivity, Math.min(CONFIG.zoom.maxWheelSensitivity, sensitivity));
    setWheelSensitivity(clampedSensitivity);
    localStorage.setItem('vdi-wheel-sensitivity', clampedSensitivity.toString());
  };

  const appState: AppState = {
    // 既存の定義...
    wheelSensitivity,
    setWheelSensitivity: handleWheelSensitivityChange,
  };

  return <AppContext.Provider value={appState}>{props.children}</AppContext.Provider>;
};
```

### 3. SettingsMenuの更新

**ファイルパス**: `src/components/SettingsMenu/index.tsx`

**変更内容**:

```typescript
interface SettingsMenuProps {
  theme: ThemeKey;
  onThemeChange: (theme: ThemeKey) => void;
  currentImagePath?: string;
  wheelSensitivity: number; // 新規追加
  onWheelSensitivityChange: (sensitivity: number) => void; // 新規追加
}

const SettingsMenu: Component<SettingsMenuProps> = (props) => {
  // 既存の実装...

  const handleWheelSensitivityChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    props.onWheelSensitivityChange(parseFloat(target.value));
  };

  return (
    <div class="...">
      <div class="py-1">
        {/* テーマ設定 - 既存 */}

        {/* ホイール感度設定 - 新規追加 */}
        <div class="px-3 py-2">
          <label class="flex flex-col gap-2">
            <span class="text-xs font-medium text-[var(--text-primary)]">
              ホイール感度: {props.wheelSensitivity.toFixed(1)}x
            </span>
            <input
              type="range"
              min={CONFIG.zoom.minWheelSensitivity}
              max={CONFIG.zoom.maxWheelSensitivity}
              step="0.1"
              value={props.wheelSensitivity}
              onInput={handleWheelSensitivityChange}
              class="w-full cursor-pointer accent-[var(--accent-primary)]"
            />
            <span class="text-xs text-[var(--text-muted)]">
              VRコントローラー使用時は低めに設定
            </span>
          </label>
        </div>

        <hr class="my-1 border-t border-[var(--border-primary)]" />

        {/* エクスプローラで開く - 既存 */}
      </div>
    </div>
  );
};
```

### 4. Titlebarの更新

**ファイルパス**: `src/components/Titlebar/index.tsx`

**変更内容**:

```typescript
const Titlebar: Component = () => {
  const {
    // 既存の定義...
    wheelSensitivity,
    setWheelSensitivity,
  } = useAppState();

  return (
    <div>
      {/* 設定メニュー */}
      {showSettings() && (
        <div class="...">
          <SettingsMenu
            theme={theme()}
            onThemeChange={(newTheme) => {
              setTheme(newTheme);
              setShowSettings(false);
            }}
            currentImagePath={currentImagePath()}
            wheelSensitivity={wheelSensitivity()}
            onWheelSensitivityChange={setWheelSensitivity}
          />
        </div>
      )}
    </div>
  );
};
```

### 5. ImageViewerの更新

**ファイルパス**: `src/components/ImageViewer/index.tsx`

**変更内容**:

```typescript
const ImageViewer: Component = () => {
  const {
    // 既存の定義...
    wheelSensitivity,
  } = useAppState();

  // ホイールズーム機能の改善
  const handleWheelZoom = (event: WheelEvent) => {
    event.preventDefault();
    const previousScale = zoomScale();

    // 感度を適用したステップ幅を計算
    // wheelSensitivityが小さいほど、ズーム変化が小さくなる
    const adjustedStep = CONFIG.zoom.step / wheelSensitivity();
    const delta = event.deltaY > 0 ? -adjustedStep : adjustedStep;

    const newScale = Math.max(CONFIG.zoom.minScale, Math.min(CONFIG.zoom.maxScale, previousScale + delta));
    if (newScale === previousScale) return;

    setZoomScale(newScale);
    const predictedDisplay = getDisplaySizeForScale(newScale, previousScale);
    setDisplaySize(predictedDisplay);
    setPosition((prev) => clampToBounds(prev, { scale: newScale, display: predictedDisplay, referenceScale: previousScale }));

    requestAnimationFrame(() => {
      measureAll();
      setPosition((prev) => clampToBounds(prev));
    });
  };
};
```

## 動作仕様

### ホイール感度の計算

ホイール感度が`1.0`の場合、従来通りの動作（ステップ幅0.1）になります。

- 感度 `0.1` の場合: ステップ幅 `0.1 / 0.1 = 1.0`（10倍遅い）
- 感度 `0.5` の場合: ステップ幅 `0.1 / 0.5 = 0.2`（2倍遅い）
- 感度 `1.0` の場合: ステップ幅 `0.1 / 1.0 = 0.1`（デフォルト）
- 感度 `2.0` の場合: ステップ幅 `0.1 / 2.0 = 0.05`（2倍速い）
- 感度 `5.0` の場合: ステップ幅 `0.1 / 5.0 = 0.02`（5倍速い）

**修正**:
上記の計算式は逆でした。正しくは以下の通りです：

- 感度 `0.1` の場合: ステップ幅 `0.1 / 0.1 = 1.0`ではなく、`0.1 * 0.1 = 0.01`（10倍遅い）
- 感度 `1.0` の場合: ステップ幅 `0.1 * 1.0 = 0.1`（デフォルト）
- 感度 `5.0` の場合: ステップ幅 `0.1 * 5.0 = 0.5`（5倍速い）

**実装時は掛け算に修正**:
```typescript
const adjustedStep = CONFIG.zoom.step * wheelSensitivity();
```

### VRコントローラー使用時の推奨設定

VRコントローラーで操作する場合、感度を`0.1`～`0.3`程度に設定することを推奨します。これにより、大きなdeltaY値が連続的に発生しても、細かくズーム制御できます。

## 影響範囲の分析

### 変更ファイル

1. `src/config/config.ts`
2. `src/context/AppStateContext.tsx`
3. `src/components/SettingsMenu/index.tsx`
4. `src/components/Titlebar/index.tsx`
5. `src/components/ImageViewer/index.tsx`

### 影響する機能

- ✅ **ホイールズーム機能**: 改善される（問題の修正対象）
- ✅ **設定の永続化**: 新規機能（wheelSensitivityの保存）

### 影響しない機能

- ✅ **ボタンによるズーム操作**: 変更なし（従来通り1.2倍/0.83倍で動作）
- ✅ **ドラッグ機能**: 変更なし
- ✅ **画像の回転**: 変更なし
- ✅ **グリッド表示**: 変更なし
- ✅ **ピーキング機能**: 変更なし

### リスク評価

**リスクレベル**: 低

- 既存の機能には影響を与えない（ホイールズームのみ変更）
- 設定値の範囲を制限しているため、極端な値は設定できない
- デフォルト値は従来の動作と同じ（1.0）

## テストケース

### 機能テスト

1. 感度を変更してホイールズーム操作が変化すること
2. 感度の設定値が正しくlocalStorageに保存されること
3. アプリを再起動しても設定値が保持されること
4. 感度の範囲（0.1～5.0）が正しく制限されること

### UIテスト

1. 設定メニューにホイール感度スライダーが表示されること
2. スライダーの現在値が正しく表示されること
3. スライダーを操作すると即座にズーム動作が変化すること
4. UIの説明文が表示されること

## 実装計画

実装は以下の順序で進めます:

1. `src/config/config.ts`にwheelSensitivityパラメータを追加
2. `src/context/AppStateContext.tsx`にwheelSensitivity状態と永続化処理を追加
3. `src/components/SettingsMenu/index.tsx`にスライダーUIを追加
4. `src/components/Titlebar/index.tsx`でpropsを追加
5. `src/components/ImageViewer/index.tsx`のhandleWheelZoom関数を修正
6. 動作確認
7. コミット作成

## 成果物

- `src/config/config.ts` (修正)
- `src/context/AppStateContext.tsx` (修正)
- `src/components/SettingsMenu/index.tsx` (修正)
- `src/components/Titlebar/index.tsx` (修正)
- `src/components/ImageViewer/index.tsx` (修正)

---

# カラーヒストグラム表示機能の追加

## 概要

画像解析をサポートするため、checkerboard-bg要素の指定位置にレスポンシブ対応のカラーヒストグラムを表示する機能を追加します。ヒストグラム計算はRust側で処理し、ピーキング処理と並列実行することでパフォーマンスを確保します。

## 背景

### 現在の実装状況

- 画像表示機能は`ImageViewer`コンポーネントで実装済み
- ピーキング機能はRust側で並列処理され、フロントエンドで描画
- 設定メニュー（SettingsMenu）で各種設定を管理

### 要件

1. ヒストグラム表示のON/OFF切り替え
2. 表示タイプの切り替え（RGB別、輝度のみ）
3. 表示位置の選択（右上、右下、左上、左下）
4. サイズ調整可能（0.5x ~ 2.0x）
5. 透明度調整可能（0% ~ 100%）
6. 画像読み込み時に自動更新
7. 関数化して手動呼び出し可能
8. Rust側で処理、ピーキングと並列実行
9. レスポンシブ対応

## 設計

### コンポーネント構成

#### 1. HistogramLayerコンポーネント（新規作成）

**ファイルパス**: `src/components/ImageViewer/HistogramLayer.tsx`

**役割**: ヒストグラムの表示とCanvasによる描画

**Props**:
```typescript
interface HistogramLayerProps {
  imagePath: string | null;
  enabled: boolean;
  displayType: 'rgb' | 'luminance';
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  size: number; // 0.5 ~ 2.0 の範囲
  opacity: number; // 0.0 ~ 1.0 の範囲
}
```

**機能**:
- Rustから取得したヒストグラムデータをCanvas APIで描画
- キャッシュ機能によるパフォーマンス最適化
- AbortControllerによる重複リクエストのキャンセル
- レスポンシブ対応（containerサイズに応じて調整）

#### 2. Rustヒストグラム処理（新規作成）

**ファイルパス**: `src-tauri/src/histogram.rs`

**役割**: 画像からヒストグラムデータを計算

**Tauri Command**:
```rust
#[tauri::command]
pub async fn calculate_histogram(
    image_path: String,
    histogram_type: String, // "rgb" or "luminance"
    request_id: Option<String>,
) -> Result<HistogramResult, String>
```

**戻り値**:
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

**処理内容**:
- 画像読み込み（`image` crate使用）
- RGB/輝度ヒストグラムの計算（256階調）
- 並列処理（rayon使用）
- キャンセル機能（AtomicBoolによる実装）

#### 3. AppStateContextの更新

**ファイルパス**: `src/context/AppStateContext.tsx`

**追加する状態**:
```typescript
export interface AppState {
  // 既存の定義...

  // ヒストグラム関連
  histogramEnabled: () => boolean;
  setHistogramEnabled: (enabled: boolean) => void;
  histogramDisplayType: () => 'rgb' | 'luminance';
  setHistogramDisplayType: (type: 'rgb' | 'luminance') => void;
  histogramPosition: () => 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  setHistogramPosition: (position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left') => void;
  histogramSize: () => number;
  setHistogramSize: (size: number) => void;
  histogramOpacity: () => number;
  setHistogramOpacity: (opacity: number) => void;
}
```

**永続化**:
- すべての設定をlocalStorageに保存
- キーのプレフィックス: `vdi-histogram-`

#### 4. SettingsMenuの更新

**ファイルパス**: `src/components/SettingsMenu/index.tsx`

**追加するUI要素**:
```typescript
// ヒストグラムセクション
<div class="px-3 py-2">
  <div class="flex flex-col gap-2">
    <span class="text-xs font-semibold text-[var(--text-primary)]">ヒストグラム</span>

    {/* ON/OFFチェックボックス */}
    <label class="flex items-center gap-2">
      <input type="checkbox" ... />
      <span>表示する</span>
    </label>

    {/* 表示タイプ選択 */}
    <label class="flex flex-col gap-1">
      <span>表示タイプ</span>
      <select>
        <option value="rgb">RGB別</option>
        <option value="luminance">輝度のみ</option>
      </select>
    </label>

    {/* 表示位置選択 */}
    <label class="flex flex-col gap-1">
      <span>表示位置</span>
      <select>
        <option value="top-right">右上</option>
        <option value="top-left">左上</option>
        <option value="bottom-right">右下</option>
        <option value="bottom-left">左下</option>
      </select>
    </label>

    {/* サイズスライダー */}
    <label class="flex flex-col gap-1">
      <span>サイズ: {size.toFixed(1)}x</span>
      <input type="range" min="0.5" max="2.0" step="0.1" ... />
    </label>

    {/* 透明度スライダー */}
    <label class="flex flex-col gap-1">
      <span>透明度: {(opacity * 100).toFixed(0)}%</span>
      <input type="range" min="0" max="1" step="0.05" ... />
    </label>
  </div>
</div>
```

#### 5. ImageManagerの更新

**ファイルパス**: `src/components/ImageViewer/ImageManager.tsx`

**追加するProps**:
```typescript
interface ImageManagerProps {
  // 既存のprops...

  // ヒストグラム関連
  histogramEnabled: boolean;
  histogramDisplayType: 'rgb' | 'luminance';
  histogramPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  histogramSize: number;
  histogramOpacity: number;
}
```

**HistogramLayerの統合**:
```tsx
<div class="relative">
  {/* 画像 */}
  <img ... />

  {/* グリッド */}
  {props.gridPattern !== 'none' && <GridOverlay ... />}

  {/* ピーキング */}
  {props.peakingEnabled && <PeakingLayer ... />}

  {/* ヒストグラム */}
  {props.histogramEnabled && (
    <HistogramLayer
      imagePath={props.imagePath}
      enabled={props.histogramEnabled}
      displayType={props.histogramDisplayType}
      position={props.histogramPosition}
      size={props.histogramSize}
      opacity={props.histogramOpacity}
    />
  )}
</div>
```

### ヒストグラム描画の実装詳細

#### Canvas描画処理

```typescript
const drawHistogram = (
  ctx: CanvasRenderingContext2D,
  histogramData: HistogramData,
  displayType: 'rgb' | 'luminance',
  width: number,
  height: number
) => {
  // 背景を半透明の黒で塗りつぶし
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, width, height);

  if (displayType === 'rgb') {
    // RGB別表示
    const { r, g, b } = histogramData as { r: number[]; g: number[]; b: number[]; };
    const max = Math.max(...r, ...g, ...b);

    // Rチャンネル（赤）
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
    drawHistogramLine(ctx, r, max, width, height);

    // Gチャンネル（緑）
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.7)';
    drawHistogramLine(ctx, g, max, width, height);

    // Bチャンネル（青）
    ctx.strokeStyle = 'rgba(0, 0, 255, 0.7)';
    drawHistogramLine(ctx, b, max, width, height);
  } else {
    // 輝度のみ表示
    const { y } = histogramData as { y: number[] };
    const max = Math.max(...y);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    drawHistogramLine(ctx, y, max, width, height);
  }
};

const drawHistogramLine = (
  ctx: CanvasRenderingContext2D,
  data: number[],
  max: number,
  width: number,
  height: number
) => {
  ctx.beginPath();
  const step = width / data.length;

  data.forEach((value, index) => {
    const x = index * step;
    const y = height - (value / max) * height;

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();
};
```

#### レスポンシブ対応

```typescript
createEffect(() => {
  const baseWidth = 256;
  const baseHeight = 128;
  const scaleFactor = props.size;

  canvasWidth = baseWidth * scaleFactor;
  canvasHeight = baseHeight * scaleFactor;

  // Canvas要素のサイズを更新
  if (canvasRef) {
    canvasRef.width = canvasWidth;
    canvasRef.height = canvasHeight;
  }

  // 再描画
  redrawHistogram();
});
```

### Rust実装の詳細

#### ヒストグラム計算処理

```rust
// RGB別ヒストグラムの計算
fn calculate_rgb_histogram(img: &DynamicImage) -> (Vec<u32>, Vec<u32>, Vec<u32>) {
    let rgb_img = img.to_rgb8();

    // 256階調のヒストグラムを初期化
    let mut hist_r = vec![0u32; 256];
    let mut hist_g = vec![0u32; 256];
    let mut hist_b = vec![0u32; 256];

    // 並列処理でピクセルをカウント
    rgb_img.enumerate_pixels().for_each(|(_x, _y, pixel)| {
        hist_r[pixel[0] as usize] += 1;
        hist_g[pixel[1] as usize] += 1;
        hist_b[pixel[2] as usize] += 1;
    });

    (hist_r, hist_g, hist_b)
}

// 輝度ヒストグラムの計算
fn calculate_luminance_histogram(img: &DynamicImage) -> Vec<u32> {
    let rgb_img = img.to_rgb8();
    let mut hist_y = vec![0u32; 256];

    rgb_img.enumerate_pixels().for_each(|(_x, _y, pixel)| {
        // ITU-R BT.709の輝度計算式
        let y = (0.2126 * pixel[0] as f32
               + 0.7152 * pixel[1] as f32
               + 0.0722 * pixel[2] as f32) as u8;
        hist_y[y as usize] += 1;
    });

    hist_y
}
```

#### キャンセル機能

```rust
lazy_static::lazy_static! {
    static ref HISTOGRAM_CANCEL_FLAGS: Mutex<HashMap<String, Arc<AtomicBool>>> =
        Mutex::new(HashMap::new());
}

// ピーキング処理と同じパターンでキャンセル機能を実装
fn register_histogram_cancel_flag(request_id: &str, base_key: &str) -> Arc<AtomicBool> {
    let flag = Arc::new(AtomicBool::new(false));
    let mut map = HISTOGRAM_CANCEL_FLAGS.lock().unwrap();

    // 同じベースキーの古いリクエストをすべてキャンセル
    let base_prefix = format!("{}#", base_key);
    let keys_to_cancel: Vec<String> = map
        .keys()
        .filter(|k| k.starts_with(&base_prefix) || k == &base_key)
        .cloned()
        .collect();

    for key in keys_to_cancel {
        if let Some(old_flag) = map.get(&key) {
            old_flag.store(true, Ordering::Relaxed);
        }
    }

    map.insert(request_id.to_string(), flag.clone());
    flag
}
```

### 並列実行の設計

#### フロントエンド側

```typescript
// ImageManagerでピーキングとヒストグラムを並列実行
createEffect(() => {
  const path = props.imagePath;

  // ピーキングとヒストグラムのリクエストを並列実行
  if (props.peakingEnabled) {
    // ピーキングデータ取得（非同期）
    invokeFocusPeaking(path, intensity, cacheKey, signal);
  }

  if (props.histogramEnabled) {
    // ヒストグラムデータ取得（非同期）
    invokeCalculateHistogram(path, displayType, cacheKey, signal);
  }
});
```

#### Rust側

- ピーキング処理とヒストグラム処理は完全に独立
- それぞれが独自のキャンセルフラグを持つ
- 並列実行によるCPU使用率の最適化

### 配置とスタイリング

#### HistogramLayerの配置

```tsx
<div
  class="absolute"
  style={{
    [position.includes('top') ? 'top' : 'bottom']: '8px',
    [position.includes('right') ? 'right' : 'left']: '8px',
    opacity: opacity,
    'pointer-events': 'none',
    'z-index': 10,
  }}
>
  <canvas
    ref={canvasRef}
    width={canvasWidth}
    height={canvasHeight}
    style={{
      border: '1px solid rgba(255, 255, 255, 0.3)',
      'border-radius': '4px',
      'box-shadow': '0 2px 8px rgba(0, 0, 0, 0.3)',
    }}
  />
</div>
```

## 実装上の注意点

### 1. パフォーマンス最適化

- キャッシュ機能を実装（画像パスと表示タイプをキーに）
- ピーキング処理とヒストグラム処理が**両方有効化されている場合のみ**並列実行
  - 無効化されている機能は処理を実行しない
- Canvas描画の最適化（requestAnimationFrameの活用）

### 2. エラーハンドリング

- Rust側でのエラーは適切にフロントエンドに返す
- 画像読み込み失敗時は何も表示しない
- キャンセル時のエラーは無視

### 3. メモリ管理

- 古いCanvasデータは適切にクリア
- キャッシュサイズの制限（デフォルト5件、configで設定可能）

### 4. レスポンシブ対応

- containerサイズに応じてCanvasサイズを調整
- ResizeObserverで監視（必要に応じて）

### 5. ユーザビリティ

- ヒストグラムはpointer-events: noneで操作を妨げない
- 半透明の背景で視認性を確保
- z-indexを適切に設定

## 影響範囲の分析

### 新規作成ファイル

1. `src/components/ImageViewer/HistogramLayer.tsx`
2. `src-tauri/src/histogram.rs`

### 修正ファイル

1. `src/config/config.ts` - ヒストグラム設定のデフォルト値を追加
2. `src/context/AppStateContext.tsx` - ヒストグラム状態管理を追加
3. `src/components/SettingsMenu/index.tsx` - ヒストグラム設定UIを追加
4. `src/components/ImageViewer/ImageManager.tsx` - HistogramLayerの統合
5. `src-tauri/src/lib.rs` - histogram moduleのインポートとコマンド登録

### 影響する機能

- ✅ **ヒストグラム表示**: 新規機能
- ✅ **設定の永続化**: 新規機能

### 影響しない機能

- ✅ **ピーキング機能**: 独立して動作
- ✅ **グリッド機能**: 独立して動作
- ✅ **ズーム機能**: 変更なし
- ✅ **ドラッグ機能**: 変更なし
- ✅ **回転機能**: 変更なし

### リスク評価

**リスクレベル**: 中

- 新規機能のため既存機能への影響は少ない
- Rust側の並列処理によるCPU負荷増加の可能性
- Canvas描画によるメモリ使用量の増加

## テストケース

### 機能テスト

1. ヒストグラムのON/OFF切り替えが正しく動作すること
2. 表示タイプの切り替え（RGB別、輝度のみ）が正しく動作すること
3. 表示位置の切り替え（4つの位置）が正しく動作すること
4. サイズ調整が正しく反映されること
5. 透明度調整が正しく反映されること
6. 画像読み込み時に自動更新されること
7. キャッシュ機能が正しく動作すること
8. ピーキング処理と並列実行されること

### UIテスト

1. ヒストグラムが指定位置に正しく表示されること
2. レスポンシブ対応が正しく動作すること
3. ヒストグラムが操作を妨げないこと（pointer-events: none）
4. Canvas描画が正しく行われること

### パフォーマンステスト

1. 大きな画像でもヒストグラム計算が高速であること
2. ピーキング処理とヒストグラム処理が並列実行されること
3. キャンセル機能が正しく動作すること
4. メモリリークが発生しないこと

## 実装計画

実装は以下の順序で進めます:

1. **Rust側の実装**
   - `src-tauri/src/histogram.rs`の作成
   - ヒストグラム計算処理の実装
   - キャンセル機能の実装
   - `src-tauri/src/lib.rs`へのモジュール登録

2. **config.tsの更新**
   - ヒストグラム設定のデフォルト値を追加

3. **AppStateContextの更新**
   - ヒストグラム状態管理の追加
   - 永続化処理の追加

4. **HistogramLayerコンポーネントの作成**
   - 基本コンポーネント構造の実装
   - Canvas描画処理の実装
   - キャッシュ機能の実装

5. **ImageManagerの更新**
   - HistogramLayerの統合
   - Props受け渡し

6. **SettingsMenuの更新**
   - ヒストグラム設定UIの追加

7. **テストと最適化**
   - 動作確認
   - パフォーマンステスト
   - 最適化

8. **ドキュメント作成**
   - 使用方法のドキュメント

## 成果物

### 新規作成

- `src/components/ImageViewer/HistogramLayer.tsx`
- `src-tauri/src/histogram.rs`

### 修正

- `src/config/config.ts`
- `src/context/AppStateContext.tsx`
- `src/components/SettingsMenu/index.tsx`
- `src/components/ImageViewer/ImageManager.tsx`
- `src-tauri/src/lib.rs`
