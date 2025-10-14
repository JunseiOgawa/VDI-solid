# 右側縦型コントロールパネル統合UI 設計書

## 概要

カスタムタイトルバーの右側にズーム、回転、マルチメニュー、設定などの全コントロールを縦に配置し、backdrop-filterを使用したガラス表現で統一された美しいUIを実装します。

## 背景

### 現在の実装状況

- **左側**: ズームイン/アウト、リセット、画面フィット、回転ボタンが横に並んでいる
- **右側**: マルチメニューボタン、設定ボタン、ウィンドウコントロールボタン(最小化、最大化、閉じる)
- **問題点**: 
  - ボタンが横に長く並び、レイアウトが分散している
  - 背景画像が見えにくい
  - 統一感のあるガラス表現が実装されていない

### 要件

1. 右側に全てのコントロールを縦に配置する新しいパネルを作成
2. パネルに含める機能:
   - ズームイン(+アイコン)
   - ズームアウト(-アイコン)
   - ズームリセット(フォーカスアイコン)
   - 画面フィット(全画面アイコン)
   - 回転(回転アイコン)
   - マルチメニュー(グリッドアイコン)
   - 設定(歯車アイコン)
3. backdrop-filterを使用したガラス表現でUIを統一
4. 背景画像が透けて見える美しいデザイン
5. 左側のタイトルバーはウィンドウドラッグ領域とウィンドウコントロールのみ保持

## 設計

### コンポーネント構成

#### 1. RightControlPanel コンポーネント(新規作成)

**ファイルパス**: `src/components/RightControls/index.tsx`

**役割**: 右側に配置される縦型コントロールパネル

**Props**:
```typescript
interface RightControlPanelProps {
  // ズーム関連
  zoomScale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  
  // 画面フィット・回転
  onScreenFit: () => void;
  onRotate: () => void;
  
  // メニュー表示状態
  showMultiMenu: boolean;
  onToggleMultiMenu: () => void;
  showSettings: boolean;
  onToggleSettings: () => void;
  
  // マルチメニュー用のprops(既存のものを引き継ぐ)
  gridPattern: string;
  onGridPatternChange: (pattern: string) => void;
  gridOpacity: number;
  onGridOpacityChange: (opacity: number) => void;
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
  histogramEnabled: boolean;
  onHistogramEnabledChange: (enabled: boolean) => void;
  histogramDisplayType: string;
  onHistogramDisplayTypeChange: (type: string) => void;
  histogramPosition: string;
  onHistogramPositionChange: (position: string) => void;
  histogramSize: string;
  onHistogramSizeChange: (size: string) => void;
  histogramOpacity: number;
  onHistogramOpacityChange: (opacity: number) => void;
  
  // 設定用のprops
  theme: string;
  onThemeChange: (theme: string) => void;
  wheelSensitivity: number;
  onWheelSensitivityChange: (sensitivity: number) => void;
  showFullPath: boolean;
  onShowFullPathChange: (show: boolean) => void;
}
```

**UIレイアウト**:
```tsx
<div class="fixed right-2 top-16 z-50 flex flex-col gap-2">
  {/* ガラス表現のコンテナ */}
  <div class="rounded-xl bg-black/20 p-2 backdrop-blur-md border border-white/10 shadow-lg">
    {/* ズームイン */}
    <button class="glass-button">
      <img src="/icon-zoom-in.svg" />
    </button>
    
    {/* ズームアウト */}
    <button class="glass-button">
      <img src="/icon-zoom-out.svg" />
    </button>
    
    {/* ズームリセット + パーセント表示 */}
    <button class="glass-button">
      <img src="/focus_ca_h.svg" />
      <span>{Math.round(zoomScale * 100)}%</span>
    </button>
    
    {/* 区切り線 */}
    <div class="h-px bg-white/10 my-2" />
    
    {/* 画面フィット */}
    <button class="glass-button">
      <img src="/全画面表示ボタン5.svg" />
    </button>
    
    {/* 回転 */}
    <button class="glass-button">
      <img src="/reload_hoso.svg" />
    </button>
    
    {/* 区切り線 */}
    <div class="h-px bg-white/10 my-2" />
    
    {/* マルチメニュー */}
    <button class="glass-button" classList={{ "bg-white/20": gridPattern !== "off" || peakingEnabled || histogramEnabled }}>
      <svg>...</svg>
    </button>
    
    {/* 設定 */}
    <button class="glass-button">
      <img src="/setting_ge_h.svg" />
    </button>
  </div>
  
  {/* MultiMenu - 左側に展開 */}
  {showMultiMenu && (
    <div class="absolute right-full mr-2 top-0">
      <MultiMenu {...multiMenuProps} />
    </div>
  )}
  
  {/* SettingsMenu - 左側に展開 */}
  {showSettings && (
    <div class="absolute right-full mr-2 top-0">
      <SettingsMenu {...settingsProps} />
    </div>
  )}
</div>
```

**CSSスタイル**:
```css
.glass-button {
  @apply w-12 h-12 flex items-center justify-center rounded-lg;
  @apply bg-white/5 backdrop-blur-sm;
  @apply border border-white/10;
  @apply text-white/90;
  @apply transition-all duration-200;
  @apply hover:bg-white/15 hover:border-white/20;
  @apply active:scale-95;
}

.glass-button img {
  @apply w-5 h-5 brightness-0 invert opacity-90;
}

.glass-button span {
  @apply text-xs font-medium text-white/90 ml-1;
}
```

#### 2. Titlebar コンポーネント(既存を大幅修正)

**ファイルパス**: `src/components/Titlebar/index.tsx`

**変更内容**:

1. **レイアウト変更**:
   - 左側のズーム・回転ボタン群を削除
   - 中央にドラッグ領域を確保
   - 右側にウィンドウコントロールボタンのみ残す

2. **削除する要素**:
   - ズームイン/アウト/リセットボタン
   - 画面フィットボタン
   - 回転ボタン
   - マルチメニューボタン
   - 設定ボタン

3. **新しいレイアウト**:
   ```tsx
   <div class="drag-region flex h-8 items-center justify-between ...">
     {/* 左側: 空(または将来的にアプリ名など) */}
     <div class="flex items-center px-2">
       {/* 必要に応じてアプリ名やアイコンを配置 */}
     </div>
     
     {/* 中央: ドラッグ可能領域 */}
     <div class="flex-1" data-tauri-drag-region />
     
     {/* 右側: ウィンドウコントロールのみ */}
     <div class="flex items-center gap-1 px-2">
       <button id="minimizeBtn" ...>最小化</button>
       <button id="maximizeBtn" ...>最大化</button>
       <button id="closeBtn" ...>閉じる</button>
     </div>
   </div>
   ```

#### 3. App コンポーネント(既存を修正)

**ファイルパス**: `src/App.tsx`

**変更内容**:

1. **RightControlPanelの追加**:
   ```tsx
   <AppProvider>
     <div class="flex h-screen flex-col ...">
       <Titlebar />
       <main class="relative flex flex-1 flex-col overflow-hidden min-h-0">
         <ImageViewer />
         {/* 右側コントロールパネルを追加 */}
         <RightControlPanel {...controlProps} />
       </main>
       <Footer />
     </div>
   </AppProvider>
   ```

### ガラス表現の実装詳細

**backdrop-filter の使用**:
```css
/* メインコンテナ */
.glass-container {
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);
}

/* ボタン */
.glass-button {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-button:hover {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* アクティブ状態 */
.glass-button.active {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
```

### メニュー外クリック機能の実装詳細

RightControlPanel内で実装:

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
### メニュー外クリック機能の実装詳細

RightControlPanel内で実装:

```typescript
onMount(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    
    // コントロールパネル、メニューボタン、メニュー内のクリックは無視
    if (
      target.closest('.right-control-panel') ||
      target.closest('[data-menu="multi"]') ||
      target.closest('[data-menu="settings"]')
    ) {
      return;
    }
    
    // メニュー外のクリックは全メニューを閉じる
    props.onToggleMultiMenu(false);
    props.onToggleSettings(false);
  };
  
  document.addEventListener('click', handleClickOutside);
  
  onCleanup(() => {
    document.removeEventListener('click', handleClickOutside);
  });
});
```

## 実装手順

### フェーズ1: RightControlPanelコンポーネントの作成

1. `src/components/RightControls/index.tsx`を新規作成
2. 基本的なレイアウトとガラス表現のスタイルを実装
3. 全ボタンのアイコンと機能を実装
4. MultiMenuとSettingsMenuの表示制御を実装

### フェーズ2: Titlebarの簡素化

1. 左側のボタン群を削除
2. レイアウトをシンプルに変更
3. ウィンドウコントロールのみ残す
4. メニュー関連の状態管理と関数を削除

### フェーズ3: Appコンポーネントの統合

1. RightControlPanelをインポート
2. 必要なpropsをAppStateContextから取得
3. RightControlPanelをImageViewer内に配置
4. 動作確認

### フェーズ4: スタイル調整と最適化

1. ガラス表現の微調整(透明度、ブラー量など)
2. アニメーション効果の追加
3. レスポンシブ対応
4. パフォーマンス最適化

## テスト項目

### 機能テスト

- [ ] 各ボタンが正しく動作するか
  - [ ] ズームイン
  - [ ] ズームアウト
  - [ ] ズームリセット
  - [ ] 画面フィット
  - [ ] 回転
  - [ ] マルチメニュー表示
  - [ ] 設定メニュー表示
- [ ] メニュー外クリックで全メニューが閉じるか
- [ ] ズーム倍率が正しく表示されるか
- [ ] アクティブ状態のハイライトが正しく表示されるか

### UI/UXテスト

- [ ] ガラス表現が美しく表示されるか
- [ ] 背景画像が適切に透けて見えるか
- [ ] ボタンのホバー効果が滑らかか
- [ ] ボタンのサイズが適切か(タッチ操作も考慮)
- [ ] メニューの展開位置が適切か

### パフォーマンステスト

- [ ] backdrop-filterによるパフォーマンス低下がないか
- [ ] 画像の拡大縮小時にUIが重くならないか
- [ ] メモリリークがないか

## 注意事項

1. **backdrop-filter のブラウザ互換性**:
   - 現代のブラウザではサポートされていますが、古いブラウザではフォールバック表示を考慮
   
2. **パフォーマンス**:
   - backdrop-filterは重い処理なので、適用範囲を最小限に
   - 必要に応じてwill-changeプロパティを使用

3. **アクセシビリティ**:
   - 各ボタンに適切なaria-labelを設定
   - キーボード操作にも対応

4. **レスポンシブ対応**:
   - 画面サイズに応じてパネルの位置やサイズを調整
   - 小さい画面では一部機能を折りたたむことも検討

## 参考資料

- [CSS backdrop-filter - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter)
- [Glassmorphism design trend](https://uxdesign.cc/glassmorphism-in-user-interfaces-1f39bb1308c9)

---

以下は既存の設計書の内容です。

---
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

---

# フォーカスピーキング・グリッド線・ヒストグラム機能のMultiMenu統合

## 概要

現在独立して配置されているフォーカスピーキングボタン、グリッドボタン、および設定メニュー内のヒストグラム機能を、1つのMultiMenuボタンに統合します。セグメントコントロール型のUIを採用し、UIUX重視の設計で実装します。

## 背景

### 現在の実装状況

- **グリッド機能**: Titlebarにグリッドボタンが存在し、クリックでGridMenuプルダウンが表示
- **フォーカスピーキング機能**: Titlebarにピーキングボタンが存在し、クリックでPeakingMenuプルダウンが表示
- **ヒストグラム機能**: SettingsMenuの中に設定項目が存在

### 問題点

- ボタンが増えすぎてTitlebarが煩雑になっている
- 関連する機能（画像解析補助機能）が分散している
- 視覚的に統一感がない

### 要件

1. グリッド、ピーキング、ヒストグラムの3機能を1つのMultiMenuボタンに統合
2. セグメントコントロール型のUIでタブ切り替え
3. 統合ボタンには有効化されている機能数をバッジ表示
4. 各セグメントでON/OFF状態を視覚的に表現
5. トランジション効果でスムーズな切り替え
6. メニュー外クリックで自動的に閉じる

## 設計

### コンポーネント構成

#### 1. MultiMenuコンポーネント（新規作成）

**ファイルパス**: `src/components/ImageViewer/MultiMenu.tsx`

**役割**: グリッド、ピーキング、ヒストグラムの統合メニュー

**Props**:
```typescript
interface MultiMenuProps {
  // グリッド関連
  gridPattern: GridPattern;
  onGridPatternChange: (pattern: GridPattern) => void;
  gridOpacity: number;
  onGridOpacityChange: (opacity: number) => void;

  // ピーキング関連
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

  // ヒストグラム関連
  histogramEnabled: boolean;
  onHistogramEnabledChange: (enabled: boolean) => void;
  histogramDisplayType: 'rgb' | 'luminance';
  onHistogramDisplayTypeChange: (type: 'rgb' | 'luminance') => void;
  histogramPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  onHistogramPositionChange: (position: ...) => void;
  histogramSize: number;
  onHistogramSizeChange: (size: number) => void;
  histogramOpacity: number;
  onHistogramOpacityChange: (opacity: number) => void;
}
```

**UIレイアウト**:
```tsx
<div class="multi-menu">
  {/* セグメントコントロール */}
  <div class="segment-control">
    <button class="segment" data-active={activeSegment === 'grid'}>
      グリッド {gridPattern !== 'off' && <span class="dot" />}
    </button>
    <button class="segment" data-active={activeSegment === 'peaking'}>
      ピーキング {peakingEnabled && <span class="dot" />}
    </button>
    <button class="segment" data-active={activeSegment === 'histogram'}>
      ヒストグラム {histogramEnabled && <span class="dot" />}
    </button>
  </div>

  {/* コンテンツエリア */}
  <div class="content-area">
    {/* アクティブなセグメントに応じて表示 */}
    <Show when={activeSegment === 'grid'}>
      <GridMenuContent {...gridProps} />
    </Show>
    <Show when={activeSegment === 'peaking'}>
      <PeakingMenuContent {...peakingProps} />
    </Show>
    <Show when={activeSegment === 'histogram'}>
      <HistogramMenuContent {...histogramProps} />
    </Show>
  </div>
</div>
```

**デザイン仕様**:
- 最小幅: 280px
- セグメントコントロール高さ: 36px
- コンテンツエリア: 最大高さ70vh、縦スクロール対応
- トランジション: 200msのイージング
- セグメント選択時: アクセントカラー背景
- 機能ON時: セグメント上部に小さいドット表示

#### 2. GridMenuContent / PeakingMenuContent / HistogramMenuContentコンポーネント（新規作成）

**役割**: 既存のGridMenu、PeakingMenuの内容をコンテンツ部分として切り出し、新規でHistogramMenuContentを作成

**ファイルパス**:
- `src/components/ImageViewer/GridMenuContent.tsx`
- `src/components/ImageViewer/PeakingMenuContent.tsx`
- `src/components/ImageViewer/HistogramMenuContent.tsx`

#### 3. Titlebarコンポーネント（修正）

**ファイルパス**: `src/components/Titlebar/index.tsx`

**変更内容**:
1. グリッドボタンとピーキングボタンを削除
2. MultiMenuボタンを追加
3. アクティブな機能数をバッジ表示

```tsx
<button
  id="multiMenuBtn"
  class="relative ml-2 inline-flex h-7 items-center justify-center rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] px-2 text-sm text-[var(--text-primary)] transition-colors duration-150 hover:bg-[var(--bg-secondary)]"
  classList={{
    'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)]': activeFeaturesCount > 0,
  }}
  onClick={toggleMultiMenu}
  aria-label="画像解析機能"
  title="画像解析機能"
>
  <svg>{/* 統合アイコン: グリッド＋ピーキングの組み合わせ */}</svg>
  {activeFeaturesCount > 0 && (
    <span class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent-primary)] text-[10px] font-bold text-white">
      {activeFeaturesCount}
    </span>
  )}
</button>
```

#### 4. SettingsMenuコンポーネント（修正）

**ファイルパス**: `src/components/SettingsMenu/index.tsx`

**変更内容**:
- ヒストグラム関連のUI要素を削除（MultiMenuに統合されるため）
- ヒストグラムのpropsは引き続き受け取り、MultiMenuに渡す

### 統合ボタンアイコンのデザイン

```svg
<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- グリッド線（左半分） -->
  <g opacity="0.8">
    <path d="M1 2h6v6H1V2z" stroke="currentColor" stroke-width="1.5" fill="none"/>
    <path d="M1 4.5h6M4 2v6" stroke="currentColor" stroke-width="0.8"/>
  </g>

  <!-- ピーキング波形（右半分） -->
  <g opacity="0.8">
    <path d="M10 4L11.5 6.5L13 4L14.5 8" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  </g>

  <!-- ヒストグラム（下部） -->
  <g opacity="0.6">
    <rect x="9" y="11" width="1" height="3" fill="currentColor"/>
    <rect x="11" y="10" width="1" height="4" fill="currentColor"/>
    <rect x="13" y="12" width="1" height="2" fill="currentColor"/>
    <rect x="15" y="11" width="1" height="3" fill="currentColor"/>
  </g>
</svg>
```

### アクティブ機能数の計算ロジック

```typescript
const activeFeaturesCount = computed(() => {
  let count = 0;
  if (gridPattern() !== 'off') count++;
  if (peakingEnabled()) count++;
  if (histogramEnabled()) count++;
  return count;
});
```

### セグメント切り替えのトランジション

```css
.content-area {
  overflow: hidden;
  max-height: 70vh;
  overflow-y: auto;
}

.segment-content {
  animation: slideIn 200ms ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

## 実装上の注意点

### 1. 既存コンポーネントの再利用

- GridMenuとPeakingMenuのロジックを可能な限り再利用
- コンテンツ部分のみを切り出してMultiMenuに統合

### 2. 状態管理

- すべてAppStateContextで管理（変更なし）
- MultiMenuは純粋にプレゼンテーション層として機能

### 3. アクセシビリティ

- キーボードナビゲーション対応（左右矢印キーでセグメント切り替え）
- 適切なaria属性の設定
- フォーカス管理

### 4. パフォーマンス

- Show コンポーネントで非表示時はDOM削除
- デバウンス処理は既存の実装を維持

## 影響範囲の分析

### 新規作成ファイル

1. `src/components/ImageViewer/MultiMenu.tsx`
2. `src/components/ImageViewer/GridMenuContent.tsx`
3. `src/components/ImageViewer/PeakingMenuContent.tsx`
4. `src/components/ImageViewer/HistogramMenuContent.tsx`

### 修正ファイル

1. `src/components/Titlebar/index.tsx` - MultiMenuボタンの追加、既存ボタンの削除
2. `src/components/SettingsMenu/index.tsx` - ヒストグラムUIの削除

### 削除予定ファイル（オプション）

- `src/components/ImageViewer/GridMenu.tsx` - GridMenuContentに置き換え
- `src/components/ImageViewer/PeakingMenu.tsx` - PeakingMenuContentに置き換え

### 影響する機能

- ✅ **UIレイアウト**: 統合メニューへの変更
- ✅ **ボタン配置**: Titlebar左側のボタン数が減少

### 影響しない機能

- ✅ **グリッド機能**: ロジックは変更なし
- ✅ **ピーキング機能**: ロジックは変更なし
- ✅ **ヒストグラム機能**: ロジックは変更なし
- ✅ **設定の永続化**: 変更なし

### リスク評価

**リスクレベル**: 中

- UI構造の大幅な変更
- 既存コンポーネントのリファクタリングが必要
- ユーザーの慣れ親しんだUIが変わる可能性

## テストケース

### 機能テスト

1. MultiMenuボタンのクリックでメニューが開閉すること
2. セグメントクリックで適切なコンテンツが表示されること
3. 各機能のON/OFF切り替えが正しく動作すること
4. バッジ表示が正しく更新されること
5. メニュー外クリックで自動的に閉じること

### UIテスト

1. セグメントコントロールが正しく表示されること
2. アクティブなセグメントが視覚的に区別されること
3. 機能ON時のドット表示が正しく機能すること
4. トランジション効果が滑らかであること
5. 縦スクロールが正しく動作すること

### アクセシビリティテスト

1. キーボードナビゲーションが正しく機能すること
2. スクリーンリーダーで適切に読み上げられること

## 実装計画

実装は以下の順序で進めます:

1. **コンテンツコンポーネントの作成**
   - GridMenuContent.tsx
   - PeakingMenuContent.tsx
   - HistogramMenuContent.tsx

2. **MultiMenuコンポーネントの作成**
   - 基本構造の実装
   - セグメントコントロールの実装
   - コンテンツ切り替えロジックの実装

3. **Titlebarの更新**
   - MultiMenuボタンの追加
   - 既存ボタンの削除
   - バッジ表示の実装

4. **SettingsMenuの更新**
   - ヒストグラムUIの削除

5. **スタイリング**
   - セグメントコントロールのスタイル
   - トランジション効果

6. **テストと最適化**
   - 動作確認
   - UIテスト
   - 最適化

## 成果物

### 新規作成

- `src/components/ImageViewer/MultiMenu.tsx`
- `src/components/ImageViewer/GridMenuContent.tsx`
- `src/components/ImageViewer/PeakingMenuContent.tsx`
- `src/components/ImageViewer/HistogramMenuContent.tsx`

### 修正

- `src/components/Titlebar/index.tsx`
- `src/components/SettingsMenu/index.tsx`

---

# VirtualDesktop & Questコントローラー対応 設計書

## 概要

VRゴーグル(Meta Quest)でVirtualDesktopを使用してデスクトップ操作を行う際、このアプリケーションがVirtualDesktop環境を検知し、Questコントローラーでの操作に対応する機能を実装します。

## 背景

### 課題

VR環境でデスクトップアプリを操作する際、マウスやキーボードが使いにくいため、Questコントローラーで画像ビューワーアプリを快適に操作できるようにする必要があります。

### 解決策

1. VirtualDesktopモードの手動ON/OFF設定
2. Virtual Desktopのゲームパッドエミュレーション経由でコントローラー入力を取得
3. デフォルトキーバインドの実装とカスタマイズ機能の提供
4. 自動セットアップガイドの実装

## 設計

### 1. VirtualDesktopモードの状態管理

#### AppStateContextの更新

**ファイル**: `src/context/AppStateContext.tsx`

**追加する状態**:
```typescript
export interface AppState {
  // 既存の定義...

  // VirtualDesktopモード関連
  virtualdesktopMode: () => boolean;
  setVirtualDesktopMode: (enabled: boolean) => void;
}
```

**実装内容**:
```typescript
export const AppProvider: ParentComponent = (props) => {
  // 既存のSignal定義...

  const [virtualdesktopMode, setVirtualdesktopModeSignal] = createSignal<boolean>(false);

  // 永続化付きセッター
  const setVirtualdesktopMode = (enabled: boolean) => {
    setVirtualdesktopModeSignal(enabled);
    localStorage.setItem('vdi-virtualdesktop-mode', enabled ? 'true' : 'false');
  };

  // localStorageから復元
  onMount(() => {
    const savedVDMode = localStorage.getItem('vdi-virtualdesktop-mode');
    if (savedVDMode !== null) {
      setVirtualdesktopMode(savedVDMode === 'true');
    }
  });

  const appState: AppState = {
    // 既存の定義...
    virtualdesktopMode,
    setVirtualdesktopMode,
  };

  return <AppContext.Provider value={appState}>{props.children}</AppContext.Provider>;
};
```

#### SettingsMenuの更新

**ファイル**: `src/components/SettingsMenu/index.tsx`

**UI表示**:
```tsx
<div class="px-3 py-2">
  <label class="flex items-center gap-2">
    <input
      type="checkbox"
      checked={virtualdesktopMode()}
      onChange={(e) => setVirtualdesktopMode(e.currentTarget.checked)}
    />
    <span>VirtualDesktopモード</span>
  </label>
</div>
```

### 2. コントローラー入力の取得

#### Rustコントローラーモジュールの作成

**ファイル**: `src-tauri/src/controller.rs`

**実装内容**:
```rust
use gilrs::{Gilrs, Event, Button, Axis};
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ControllerState {
    pub connected: bool,
    pub device_name: String,
    pub buttons: ButtonState,
    pub axes: AxesState,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ButtonState {
    pub a: bool,
    pub b: bool,
    pub x: bool,
    pub y: bool,
    pub lb: bool,
    pub rb: bool,
    pub lt: f32,
    pub rt: f32,
    pub start: bool,
    pub back: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AxesState {
    pub left_stick_x: f32,
    pub left_stick_y: f32,
    pub right_stick_x: f32,
    pub right_stick_y: f32,
}

#[tauri::command]
pub fn poll_controller_input() -> Result<ControllerState, String> {
    let mut gilrs = Gilrs::new().map_err(|e| e.to_string())?;

    // 最初に接続されているゲームパッドを取得
    let gamepad = gilrs.gamepads().next();

    if let Some((id, gamepad)) = gamepad {
        let name = gamepad.name().to_string();

        let buttons = ButtonState {
            a: gamepad.is_pressed(Button::South),
            b: gamepad.is_pressed(Button::East),
            x: gamepad.is_pressed(Button::West),
            y: gamepad.is_pressed(Button::North),
            lb: gamepad.is_pressed(Button::LeftTrigger),
            rb: gamepad.is_pressed(Button::RightTrigger),
            lt: gamepad.value(Axis::LeftZ),
            rt: gamepad.value(Axis::RightZ),
            start: gamepad.is_pressed(Button::Start),
            back: gamepad.is_pressed(Button::Select),
        };

        let axes = AxesState {
            left_stick_x: gamepad.value(Axis::LeftStickX),
            left_stick_y: gamepad.value(Axis::LeftStickY),
            right_stick_x: gamepad.value(Axis::RightStickX),
            right_stick_y: gamepad.value(Axis::RightStickY),
        };

        Ok(ControllerState {
            connected: true,
            device_name: name,
            buttons,
            axes,
        })
    } else {
        Ok(ControllerState {
            connected: false,
            device_name: String::from("None"),
            buttons: ButtonState {
                a: false,
                b: false,
                x: false,
                y: false,
                lb: false,
                rb: false,
                lt: 0.0,
                rt: 0.0,
                start: false,
                back: false,
            },
            axes: AxesState {
                left_stick_x: 0.0,
                left_stick_y: 0.0,
                right_stick_x: 0.0,
                right_stick_y: 0.0,
            },
        })
    }
}

#[tauri::command]
pub fn check_vd_streamer() -> Result<bool, String> {
    use sysinfo::{System, SystemExt, ProcessExt};

    let mut sys = System::new_all();
    sys.refresh_all();

    // VirtualDesktop.Streamer.exeプロセスを検索
    let found = sys.processes().iter().any(|(_, process)| {
        process.name().to_lowercase().contains("virtualdesktop.streamer")
    });

    Ok(found)
}
```

#### lib.rsへの統合

**ファイル**: `src-tauri/src/lib.rs`

```rust
mod controller;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // 既存のコマンド...
            controller::poll_controller_input,
            controller::check_vd_streamer,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 3. コントローラー入力のマッピング

#### configファイルの更新

**ファイル**: `src/config/config.ts`

```typescript
export interface ControllerBinding {
  action: string;
  input: string;
}

export interface AppConfig {
  // 既存の定義...

  controller: {
    enabled: boolean;
    defaultBindings: ControllerBinding[];
    deadzone: number;
    pollingInterval: number;
  };
}

export const CONFIG: AppConfig = {
  // 既存の設定...

  controller: {
    enabled: false,
    deadzone: 0.15,
    pollingInterval: 16, // 60Hz
    defaultBindings: [
      { action: 'pan_left', input: 'AxisLeftX-' },
      { action: 'pan_right', input: 'AxisLeftX+' },
      { action: 'pan_up', input: 'AxisLeftY-' },
      { action: 'pan_down', input: 'AxisLeftY+' },
      { action: 'zoom_in', input: 'AxisRightY-' },
      { action: 'zoom_out', input: 'AxisRightY+' },
      { action: 'next_image', input: 'ButtonA' },
      { action: 'prev_image', input: 'ButtonB' },
      { action: 'fit_to_screen', input: 'ButtonX' },
      { action: 'zoom_reset', input: 'ButtonY' },
      { action: 'rotate_left', input: 'ButtonLB' },
      { action: 'rotate_right', input: 'ButtonRB' },
      { action: 'toggle_grid', input: 'TriggerLT' },
      { action: 'toggle_peaking', input: 'TriggerRT' },
      { action: 'open_settings', input: 'ButtonStart' },
    ],
  },
};
```

#### controllerMapping.tsの作成

**ファイル**: `src/lib/controllerMapping.ts`

```typescript
import { CONFIG } from '../config/config';
import type { AppState } from '../context/AppStateContext';

export interface ControllerState {
  connected: boolean;
  device_name: string;
  buttons: {
    a: boolean;
    b: boolean;
    x: boolean;
    y: boolean;
    lb: boolean;
    rb: boolean;
    lt: number;
    rt: number;
    start: boolean;
    back: boolean;
  };
  axes: {
    left_stick_x: number;
    left_stick_y: number;
    right_stick_x: number;
    right_stick_y: number;
  };
}

export class ControllerMapper {
  private deadzone: number;
  private previousState: ControllerState | null = null;

  constructor(deadzone: number = CONFIG.controller.deadzone) {
    this.deadzone = deadzone;
  }

  applyDeadzone(value: number): number {
    return Math.abs(value) < this.deadzone ? 0 : value;
  }

  mapInputToActions(
    currentState: ControllerState,
    appState: AppState
  ): void {
    if (!currentState.connected) return;

    const { buttons, axes } = currentState;
    const prev = this.previousState;

    // ボタン入力の処理（エッジ検出 - 押した瞬間のみ）
    if (prev) {
      if (buttons.a && !prev.buttons.a) {
        appState.loadNextImage();
      }
      if (buttons.b && !prev.buttons.b) {
        appState.loadPreviousImage();
      }
      if (buttons.x && !prev.buttons.x) {
        // fitToScreen処理
      }
      if (buttons.y && !prev.buttons.y) {
        appState.setZoomScale(1);
      }
      if (buttons.lb && !prev.buttons.lb) {
        appState.enqueueRotation(-90);
      }
      if (buttons.rb && !prev.buttons.rb) {
        appState.enqueueRotation(90);
      }
      // トリガーのエッジ検出
      if (buttons.lt > 0.5 && prev.buttons.lt <= 0.5) {
        const currentPattern = appState.gridPattern();
        const patterns: Array<'off' | '3x3' | '5x3' | '4x4'> = ['off', '3x3', '5x3', '4x4'];
        const index = patterns.indexOf(currentPattern);
        appState.setGridPattern(patterns[(index + 1) % patterns.length]);
      }
      if (buttons.rt > 0.5 && prev.buttons.rt <= 0.5) {
        appState.setPeakingEnabled(!appState.peakingEnabled());
      }
    }

    // スティック入力の処理（連続値）
    const leftX = this.applyDeadzone(axes.left_stick_x);
    const leftY = this.applyDeadzone(axes.left_stick_y);
    const rightY = this.applyDeadzone(axes.right_stick_y);

    // パン操作（左スティック）
    if (leftX !== 0 || leftY !== 0) {
      // position更新処理をここに実装
      // 実装例: appState.updatePosition(leftX * panSpeed, leftY * panSpeed)
    }

    // ズーム操作（右スティック上下）
    if (rightY !== 0) {
      const currentZoom = appState.zoomScale();
      const zoomDelta = rightY * 0.01;
      appState.setZoomScale(Math.max(0.1, Math.min(10, currentZoom + zoomDelta)));
    }

    this.previousState = currentState;
  }
}
```

### 4. ControllerContextの作成

**ファイル**: `src/context/ControllerContext.tsx`

```typescript
import type { ParentComponent } from 'solid-js';
import { createContext, createSignal, onMount, onCleanup, useContext } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import { ControllerMapper, type ControllerState } from '../lib/controllerMapping';
import { useAppState } from './AppStateContext';
import { CONFIG } from '../config/config';

export interface ControllerContextType {
  connected: () => boolean;
  deviceName: () => string;
}

const ControllerContext = createContext<ControllerContextType>();

export const ControllerProvider: ParentComponent = (props) => {
  const [connected, setConnected] = createSignal<boolean>(false);
  const [deviceName, setDeviceName] = createSignal<string>('None');
  const appState = useAppState();
  const mapper = new ControllerMapper();

  let pollingInterval: number | undefined;

  const pollController = async () => {
    try {
      const state = await invoke<ControllerState>('poll_controller_input');
      setConnected(state.connected);
      setDeviceName(state.device_name);

      if (state.connected && appState.virtualdesktopMode()) {
        mapper.mapInputToActions(state, appState);
      }
    } catch (error) {
      console.error('[Controller] ポーリングエラー:', error);
    }
  };

  onMount(() => {
    // ポーリング開始
    pollingInterval = window.setInterval(pollController, CONFIG.controller.pollingInterval);
  });

  onCleanup(() => {
    if (pollingInterval !== undefined) {
      clearInterval(pollingInterval);
    }
  });

  const contextValue: ControllerContextType = {
    connected,
    deviceName,
  };

  return (
    <ControllerContext.Provider value={contextValue}>
      {props.children}
    </ControllerContext.Provider>
  );
};

export const useController = () => {
  const context = useContext(ControllerContext);
  if (!context) {
    throw new Error('useController must be used within a ControllerProvider');
  }
  return context;
};
```

### 5. 自動セットアップガイドの実装

#### SetupGuideコンポーネントの作成

**ファイル**: `src/components/SettingsMenu/ControllerSetupGuide.tsx`

```typescript
import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';

interface SetupGuideProps {
  onComplete: () => void;
}

const ControllerSetupGuide: Component<SetupGuideProps> = (props) => {
  const [step, setStep] = createSignal<'vd_check' | 'controller_check' | 'completed'>('vd_check');
  const [vdStreamerDetected, setVdStreamerDetected] = createSignal<boolean>(false);
  const [controllerDetected, setControllerDetected] = createSignal<boolean>(false);
  const [checking, setChecking] = createSignal<boolean>(false);
  const [dontShowAgain, setDontShowAgain] = createSignal<boolean>(false);

  const checkVDStreamer = async () => {
    setChecking(true);
    try {
      const detected = await invoke<boolean>('check_vd_streamer');
      setVdStreamerDetected(detected);
      if (detected) {
        setStep('controller_check');
      }
    } catch (error) {
      console.error('[SetupGuide] VDストリーマー検知エラー:', error);
    } finally {
      setChecking(false);
    }
  };

  const checkController = async () => {
    setChecking(true);
    try {
      const state = await invoke<any>('poll_controller_input');
      setControllerDetected(state.connected);
      if (state.connected) {
        setStep('completed');
        if (dontShowAgain()) {
          localStorage.setItem('vdi-controller-setup-completed', 'true');
        }
        setTimeout(() => props.onComplete(), 2000);
      }
    } catch (error) {
      console.error('[SetupGuide] コントローラー検知エラー:', error);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="w-full max-w-md rounded-lg bg-[var(--bg-primary)] p-6 shadow-lg">
        <h2 class="mb-4 text-lg font-bold text-[var(--text-primary)]">
          コントローラーセットアップガイド
        </h2>

        {step() === 'vd_check' && (
          <div>
            <p class="mb-4 text-sm text-[var(--text-secondary)]">
              Virtual Desktopストリーマーを検知しています...
            </p>
            {!vdStreamerDetected() && (
              <div class="mb-4">
                <p class="mb-2 text-sm text-[var(--text-secondary)]">
                  Virtual Desktopストリーマーが見つかりません。
                  Virtual Desktopが起動していることを確認してください。
                </p>
                <button
                  class="rounded bg-[var(--accent-primary)] px-4 py-2 text-sm text-white"
                  onClick={checkVDStreamer}
                  disabled={checking()}
                >
                  {checking() ? '確認中...' : '再検出'}
                </button>
              </div>
            )}
          </div>
        )}

        {step() === 'controller_check' && (
          <div>
            <p class="mb-4 text-sm text-[var(--text-secondary)]">
              Quest内で以下の手順を実行してください：
            </p>
            <ol class="mb-4 list-decimal pl-5 text-sm text-[var(--text-secondary)]">
              <li>Virtual Desktopメニューを開く</li>
              <li>Settings → Controllers へ移動</li>
              <li>「Use controllers as gamepad」をONにする</li>
            </ol>
            <button
              class="rounded bg-[var(--accent-primary)] px-4 py-2 text-sm text-white"
              onClick={checkController}
              disabled={checking()}
            >
              {checking() ? '確認中...' : 'コントローラーを検出'}
            </button>
          </div>
        )}

        {step() === 'completed' && (
          <div>
            <p class="mb-4 text-sm text-green-500">
              ✓ セットアップが完了しました！
            </p>
            <p class="text-sm text-[var(--text-secondary)]">
              コントローラー: {controllerDetected() ? '検出されました' : '未検出'}
            </p>
          </div>
        )}

        <div class="mt-4">
          <label class="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={dontShowAgain()}
              onChange={(e) => setDontShowAgain(e.currentTarget.checked)}
            />
            <span>次回から表示しない</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default ControllerSetupGuide;
```

#### SettingsMenuへの統合

**ファイル**: `src/components/SettingsMenu/index.tsx`

```tsx
import ControllerSetupGuide from './ControllerSetupGuide';

const SettingsMenu: Component<SettingsMenuProps> = (props) => {
  const [showSetupGuide, setShowSetupGuide] = createSignal<boolean>(false);

  const handleVirtualDesktopModeChange = (enabled: boolean) => {
    props.onVirtualDesktopModeChange(enabled);

    if (enabled) {
      const setupCompleted = localStorage.getItem('vdi-controller-setup-completed');
      if (!setupCompleted) {
        setShowSetupGuide(true);
      }
    }
  };

  return (
    <div>
      {/* 既存のUI... */}

      <div class="px-3 py-2">
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            checked={props.virtualdesktopMode}
            onChange={(e) => handleVirtualDesktopModeChange(e.currentTarget.checked)}
          />
          <span>VirtualDesktopモード</span>
        </label>

        <button
          class="mt-2 text-xs text-[var(--accent-primary)]"
          onClick={() => setShowSetupGuide(true)}
        >
          セットアップガイドを再表示
        </button>
      </div>

      {showSetupGuide() && (
        <ControllerSetupGuide
          onComplete={() => setShowSetupGuide(false)}
        />
      )}
    </div>
  );
};
```

## 実装上の注意点

### 1. gilrsクレートの追加

**ファイル**: `src-tauri/Cargo.toml`

```toml
[dependencies]
gilrs = "0.10"
sysinfo = "0.30"
```

### 2. パフォーマンス最適化

- コントローラーポーリングは60Hz（16ms間隔）で実行
- デッドゾーン処理でノイズを除去
- エッジ検出でボタンの連続発火を防止

### 3. エラーハンドリング

- コントローラー接続エラーの適切な処理
- VDストリーマー検知失敗時のフォールバック

### 4. ユーザビリティ

- セットアップガイドで初回設定をサポート
- 設定メニューから再度ガイドを表示可能
- 「次回から表示しない」オプションの提供

---

# フッターに解像度とファイルパス表示機能の追加

## 概要

ユーザビリティ向上のため、フッター表示を改善し、画像の解像度とファイルパスを適切な位置に表示する機能を追加します。

## 背景

### 現在の実装状況

- **Footer**: 画面中央に画像のURL(アセットパス)とズーム率を表示
- **問題点**:
  - 実際のファイルパスが表示されていない
  - 画像の解像度情報が表示されていない
  - レイアウトが中央寄せで情報が見にくい

### 要件

1. フッター左下に現在の画像の解像度を表示(例: 1920×1080)
2. フッター中央にPCの正しいファイルパス(currentImageFilePath)を表示
3. フッター右下にズーム率を表示
4. 画像が読み込まれていない場合は適切な表示を行う

## 設計

### 1. AppStateContextの更新

**ファイルパス**: `src/context/AppStateContext.tsx`

**追加する状態**:
```typescript
export interface AppState {
  // 既存の定義...

  // 画像解像度関連
  imageResolution: () => { width: number; height: number } | null;
  setImageResolution: (resolution: { width: number; height: number } | null) => void;
}
```

**実装内容**:
```typescript
export const AppProvider: ParentComponent = (props) => {
  // 既存のSignal定義...

  const [imageResolution, setImageResolution] = createSignal<{ width: number; height: number } | null>(null);

  const appState: AppState = {
    // 既存の定義...
    imageResolution,
    setImageResolution,
  };

  return <AppContext.Provider value={appState}>{props.children}</AppContext.Provider>;
};
```

### 2. ImageManagerの更新

**ファイルパス**: `src/components/ImageViewer/ImageManager.tsx`

**変更内容**:

```typescript
interface ImageManagerProps {
  // 既存のprops...

  // 解像度設定用コールバック
  onResolutionChange?: (resolution: { width: number; height: number } | null) => void;
}

const ImageManager: Component<ImageManagerProps> = (props) => {
  const handleLoad = () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[ImageManager] 画像読み込み完了');

    if (imgRef) {
      const rect = imgRef.getBoundingClientRect();
      console.log('[ImageManager] img.naturalWidth:', imgRef.naturalWidth);
      console.log('[ImageManager] img.naturalHeight:', imgRef.naturalHeight);

      // 解像度をAppStateContextに設定
      if (props.onResolutionChange) {
        props.onResolutionChange({
          width: imgRef.naturalWidth,
          height: imgRef.naturalHeight
        });
      }

      // 既存のログ処理...
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (props.onLoad) {
      props.onLoad();
    }
  };

  return (
    <div>
      <img
        ref={handleImgRef}
        src={props.src}
        alt="Displayed Image"
        onLoad={handleLoad}
        // 既存のprops...
      />
      {/* 既存のレイヤー... */}
    </div>
  );
};
```

### 3. ImageViewerの更新

**ファイルパス**: `src/components/ImageViewer/index.tsx`

**変更内容**:

```typescript
const ImageViewer: Component = () => {
  const {
    // 既存の定義...
    setImageResolution,
  } = useAppState();

  return (
    <div>
      {/* 既存のコンポーネント... */}

      <ImageManager
        // 既存のprops...
        onResolutionChange={setImageResolution}
      />
    </div>
  );
};
```

### 4. Footerコンポーネントの更新

**ファイルパス**: `src/components/Footer/index.tsx`

**変更内容**:

```typescript
import type { Component } from 'solid-js';
import { useAppState } from '../../context/AppStateContext';

const Footer: Component = () => {
  const { currentImagePath, currentImageFilePath, zoomScale, imageResolution } = useAppState();

  return (
    <footer class="border-t border-[var(--border-primary)] bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)] transition-colors duration-300">
      <div class="mx-auto flex h-8 max-w-full items-center justify-between px-4">
        {/* 左下: 解像度 */}
        <div class="flex-shrink-0 overflow-hidden text-ellipsis whitespace-nowrap">
          {imageResolution() ? `${imageResolution()!.width}×${imageResolution()!.height}` : 'No resolution'}
        </div>

        {/* 中央: ファイルパス */}
        <div class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-center px-4">
          {currentImageFilePath() || currentImagePath() || 'No image loaded'}
        </div>

        {/* 右下: ズーム率 */}
        <div class="flex-shrink-0 overflow-hidden text-ellipsis whitespace-nowrap">
          Zoom: {Math.round(zoomScale() * 100)}%
        </div>
      </div>
    </footer>
  );
};

export default Footer;
```

## UIレイアウト詳細

### フッターの構造

```
+------------------------------------------+
| 解像度     |  ファイルパス  |  ズーム率  |
| 1920×1080  | C:\...\image.png | Zoom: 100% |
+------------------------------------------+
```

- **左下**: 解像度(例: 1920×1080) - flex-shrink-0で固定幅
- **中央**: ファイルパス(currentImageFilePath優先、なければcurrentImagePath) - flex-1で残りの幅を占有
- **右下**: ズーム率(例: Zoom: 100%) - flex-shrink-0で固定幅

### スタイリング方針

- `justify-between`で3つの要素を均等配置
- `text-ellipsis`でテキストがオーバーフローした場合は省略記号(...)を表示
- `whitespace-nowrap`で改行を防ぐ
- `px-4`で左右にパディングを追加
- 中央要素には`px-4`を追加して左右の要素と適切な間隔を確保

## 実装上の注意点

### 1. 解像度の初期化

- 画像が読み込まれていない場合は`null`を設定
- 新しい画像が読み込まれる際に自動的に更新される

### 2. ファイルパスの優先順位

1. `currentImageFilePath()` - 実際のファイルパス(優先)
2. `currentImagePath()` - アセットURL(フォールバック)
3. `'No image loaded'` - 画像がない場合

### 3. レスポンシブ対応

- 中央のファイルパスは`flex-1`で可変幅
- 左右の要素は`flex-shrink-0`で固定幅を維持
- オーバーフローした場合は省略記号で対応

### 4. パフォーマンス

- 解像度はonLoad時に一度だけ取得
- Signalを使用して効率的に状態管理

## 影響範囲の分析

### 変更ファイル

1. `src/context/AppStateContext.tsx` - 画像解像度状態の追加
2. `src/components/ImageViewer/ImageManager.tsx` - 解像度取得処理の追加
3. `src/components/ImageViewer/index.tsx` - onResolutionChangeの追加
4. `src/components/Footer/index.tsx` - レイアウト変更

### 影響する機能

- ✅ **フッター表示**: 改善される(問題の修正対象)

### 影響しない機能

- ✅ **画像表示**: 変更なし
- ✅ **ズーム機能**: 変更なし
- ✅ **ドラッグ機能**: 変更なし
- ✅ **回転機能**: 変更なし
- ✅ **グリッド機能**: 変更なし
- ✅ **ピーキング機能**: 変更なし
- ✅ **ヒストグラム機能**: 変更なし

### リスク評価

**リスクレベル**: 極めて低

- 変更箇所が明確で少ない
- 既存の機能に影響を与えない
- 解像度取得は既存のonLoad処理を活用

## テストケース

### 機能テスト

1. 画像読み込み時に解像度が正しく表示されること
2. ファイルパスが正しく表示されること(currentImageFilePathが優先)
3. ズーム率が正しく表示されること
4. 画像がない場合に適切な表示がされること

### UIテスト

1. フッターのレイアウトが正しく表示されること
   - 左下: 解像度
   - 中央: ファイルパス
   - 右下: ズーム率
2. テキストがオーバーフローした場合に省略記号が表示されること
3. レスポンシブ対応が正しく動作すること

### エッジケース

1. 非常に長いファイルパスでも正しく表示されること
2. 異なる解像度の画像で正しく表示されること
3. 画像を切り替えた時に解像度が更新されること

## 実装計画

実装は以下の順序で進めます:

1. `src/context/AppStateContext.tsx`に画像解像度の状態を追加
2. `src/components/ImageViewer/ImageManager.tsx`で解像度取得処理を追加
3. `src/components/ImageViewer/index.tsx`でonResolutionChangeを追加
4. `src/components/Footer/index.tsx`のレイアウトを変更
5. ローカルで動作確認
6. 各機能との組み合わせテスト
7. コミット作成

## 成果物

### 修正

- `src/context/AppStateContext.tsx`
- `src/components/ImageViewer/ImageManager.tsx`
- `src/components/ImageViewer/index.tsx`
- `src/components/Footer/index.tsx`

---

# サイドバーギャラリービュー機能 設計書

## 概要

タイトルバーの左上にサイドバー展開ボタンを配置し、クリックすると縦1列の画像サムネイルが表示されるギャラリービュー機能を実装します。

## 背景

### 現在の実装状況

- **画像ナビゲーション**: img.rsにget_folder_images、get_next_image、get_previous_imageが実装されている
- **タイトルバー**: ウィンドウコントロールボタンのみで左側は空いている
- **問題点**:
  - フォルダ内の画像一覧を視覚的に確認できない
  - 特定の画像に直接ジャンプできない
  - 画像ナビゲーション機能がimg.rsに全て詰まっている

### 要件

1. **第1段階: Rustコードのリファクタリング**
   - img.rsから画像ナビゲーション関連の機能を分離
   - 新しいモジュール(navigation.rs)を作成
   - 分離対象の関数:
     - get_folder_images
     - get_next_image
     - get_previous_image
   - lib.rsのモジュール宣言とコマンド登録を更新
   - 影響範囲を完全に確認してビルドが通ることを確認

2. **第2段階: ギャラリービュー機能の実装**
   - タイトルバーの左上にサイドバー展開ボタンを追加
   - サイドバーコンポーネントを作成
   - フォルダ内の画像一覧をサムネイル付きで縦に表示
   - 画像クリックで表示を切り替える
   - 現在表示中の画像をハイライト

## 設計

### 第1段階: Rustコードのリファクタリング

#### 1. navigation.rsモジュールの作成

**ファイルパス**: `src-tauri/src/navigation.rs`

**役割**: フォルダ内の画像ナビゲーション機能を提供

**移動する関数**:

```rust
/// フォルダ内の画像ファイル一覧を作成日時順で取得する
#[tauri::command]
pub fn get_folder_images(folder_path: String) -> Option<Vec<String>> {
    // img.rsの実装をそのまま移動
}

/// 指定された画像の次の画像パスを取得
#[tauri::command]
pub fn get_next_image(current_path: String, folder_navigation_enabled: bool) -> Option<String> {
    // img.rsの実装をそのまま移動
}

/// 指定された画像の前の画像パスを取得
#[tauri::command]
pub fn get_previous_image(current_path: String, folder_navigation_enabled: bool) -> Option<String> {
    // img.rsの実装をそのまま移動
}
```

**注意事項**:
- 関数のシグネチャは変更しない
- JSDocコメントもそのまま移動
- get_folder_imagesは他の2つの関数から内部的に呼び出されるため、pubのまま維持

#### 2. img.rsの修正

**変更内容**:
- get_folder_images、get_next_image、get_previous_imageの3つの関数を削除
- それ以外の関数はそのまま維持:
  - create_image_backup
  - restore_image_from_backup
  - cleanup_image_backup
  - rotate_image
  - get_launch_image_path
  - get_launch_window_mode

#### 3. lib.rsの修正

**変更内容**:

```rust
// モジュール宣言に追加
mod navigation;

// コマンド登録を修正
.invoke_handler(tauri::generate_handler![
    img::get_launch_image_path,
    img::get_launch_window_mode,
    navigation::get_folder_images,    // img::から navigation::に変更
    navigation::get_next_image,       // img::から navigation::に変更
    navigation::get_previous_image,   // img::から navigation::に変更
    get_system_theme,
    show_window,
    img::rotate_image,
    img::create_image_backup,
    img::restore_image_from_backup,
    img::cleanup_image_backup,
    peaking::focus_peaking,
    histogram::calculate_histogram
])
```

### 第2段階: ギャラリービュー機能の実装

#### 1. ImageGallery コンポーネント(新規作成)

**ファイルパス**: `src/components/ImageGallery/index.tsx`

**役割**: サイドバーで画像サムネイル一覧を表示

**Props**:
```typescript
interface ImageGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  currentImagePath: string;
  onImageSelect: (imagePath: string) => void;
}
```

**UIレイアウト**:
```tsx
<div class={`fixed left-0 top-8 bottom-0 w-64 bg-black/80 backdrop-blur-md border-r border-white/10 transform transition-transform duration-300 ${isOpen() ? 'translate-x-0' : '-translate-x-full'}`}>
  {/* ヘッダー */}
  <div class="flex items-center justify-between p-2 border-b border-white/10">
    <span class="text-white/90 text-sm">画像一覧</span>
    <button onClick={onClose} class="text-white/70 hover:text-white">
      <CloseIcon />
    </button>
  </div>
  
  {/* 画像リスト */}
  <div class="overflow-y-auto h-full p-2 space-y-2">
    <For each={folderImages()}>
      {(imagePath) => (
        <div
          class={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
            imagePath === currentImagePath
              ? 'border-blue-500'
              : 'border-transparent hover:border-white/30'
          }`}
          onClick={() => onImageSelect(imagePath)}
        >
          {/* サムネイル */}
          <img
            src={convertFileSrc(imagePath)}
            class="w-full aspect-video object-cover"
            alt={getFileName(imagePath)}
          />
          {/* ファイル名 */}
          <div class="p-1 bg-black/50 text-white/80 text-xs truncate">
            {getFileName(imagePath)}
          </div>
        </div>
      )}
    </For>
  </div>
</div>
```

**主要機能**:
1. フォルダ内の画像一覧を取得(Tauriコマンド: get_folder_images)
2. 各画像のサムネイルを表示(convertFileSrcで変換)
3. 現在表示中の画像をハイライト
4. 画像クリックで表示を切り替え
5. スクロール可能な縦リスト

#### 2. Titlebar コンポーネント(既存を修正)

**ファイルパス**: `src/components/Titlebar/index.tsx`

**変更内容**:

1. **サイドバー展開ボタンの追加**:
   ```tsx
   <div class="flex items-center px-2">
     <button
       id="galleryBtn"
       class="no-drag flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
       onClick={toggleGallery}
       aria-label="ギャラリー表示"
     >
       <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
         {/* ハンバーガーメニューアイコン */}
         <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
       </svg>
     </button>
   </div>
   ```

2. **状態管理の追加**:
   - showGallery Signalを追加
   - toggleGallery関数を追加

#### 3. App コンポーネント(既存を修正)

**ファイルパス**: `src/App.tsx`

**変更内容**:

1. **ImageGalleryコンポーネントの追加**:
   ```tsx
   <AppProvider>
     <div class="flex h-screen flex-col ...">
       <Titlebar showGallery={showGallery()} onToggleGallery={setShowGallery} />
       <main class="relative flex flex-1 flex-col overflow-hidden min-h-0">
         <ImageGallery
           isOpen={showGallery()}
           onClose={() => setShowGallery(false)}
           currentImagePath={currentImageFilePath()}
           onImageSelect={handleImageSelect}
         />
         <ImageViewer />
         <RightControlPanel {...controlProps} />
       </main>
       <Footer />
     </div>
   </AppProvider>
   ```

2. **handleImageSelectの実装**:
   ```tsx
   const handleImageSelect = (imagePath: string) => {
     setCurrentImageFilePath(imagePath);
     setShowGallery(false); // サイドバーを閉じる
   };
   ```

#### 4. AppStateContext(既存を修正)

**ファイルパス**: `src/context/AppStateContext.tsx`

**追加要素**:
- showGallery: Accessor<boolean>
- setShowGallery: Setter<boolean>

## 実装手順

### 第1段階: Rustコードのリファクタリング

1. `src-tauri/src/navigation.rs`を新規作成
2. img.rsから3つの関数を移動
3. img.rsから移動した関数を削除
4. lib.rsのモジュール宣言とコマンド登録を更新
5. ビルドが通ることを確認(`npm run build`)

### 第2段階: ギャラリービュー機能の実装

1. ImageGalleryコンポーネントを作成
2. Titlebarにサイドバー展開ボタンを追加
3. AppStateContextに状態を追加
4. Appコンポーネントで統合
5. スタイル調整
6. 動作確認

## テスト項目

### 第1段階のテスト

- [ ] ビルドが成功すること
- [ ] 既存の画像ナビゲーション機能が正しく動作すること
  - [ ] 次の画像へ移動
  - [ ] 前の画像へ移動
  - [ ] フォルダ内の画像一覧取得

### 第2段階のテスト

#### 機能テスト

- [ ] サイドバー展開ボタンが表示されること
- [ ] ボタンクリックでサイドバーが開閉すること
- [ ] フォルダ内の画像一覧が表示されること
- [ ] 各画像のサムネイルが正しく表示されること
- [ ] 現在表示中の画像がハイライトされること
- [ ] 画像クリックで表示が切り替わること
- [ ] サイドバー外クリックで閉じること

#### UI/UXテスト

- [ ] サイドバーのアニメーションが滑らかか
- [ ] サムネイルのサイズが適切か
- [ ] スクロールが正しく動作するか
- [ ] ガラス表現が美しく表示されるか

## 注意事項

1. **第1段階を必ず完了させてから第2段階に進む**
   - ビルドが通ることを確認
   - 既存機能が壊れていないことを確認

2. **パフォーマンス**
   - サムネイル読み込みは遅延読み込みを検討
   - 大量の画像がある場合は仮想スクロールを検討

3. **エラーハンドリング**
   - フォルダが存在しない場合
   - 画像が1枚もない場合
   - サムネイル読み込みに失敗した場合

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
