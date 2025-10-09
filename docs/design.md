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
