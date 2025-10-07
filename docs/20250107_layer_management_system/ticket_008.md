# Ticket #008: 設定UI追加

## メタ情報
- **優先度**: Medium
- **見積**: 2時間
- **依存チケット**: #005, #006
- **ブロックするチケット**: なし

## 目的
SettingsMenu（設定メニュー）にピーキング機能の設定UIを追加し、ユーザーがON/OFF、強度、色、不透明度を調整できるようにします。

## 対象ファイル

### 変更
- `src/components/SettingsMenu/index.tsx`

### 影響範囲
- 設定メニューのUI（新規セクション追加）

## 実装手順

### 1. AppStateからピーキング状態を取得
```tsx
import { useAppState } from '../../context/AppStateContext';

const SettingsMenu: Component = () => {
  const {
    theme,
    setTheme,
    gridPattern,
    setGridPattern,
    gridOpacity,
    setGridOpacity,
    // ピーキング関連を追加
    peakingEnabled,
    setPeakingEnabled,
    peakingIntensity,
    setPeakingIntensity,
    peakingColor,
    setPeakingColor,
    peakingOpacity,
    setPeakingOpacity,
  } = useAppState();
  
  // ...
};
```

### 2. ピーキングセクションの追加
```tsx
{/* ピーキング設定セクション */}
<div class="settings-section">
  <h3 class="settings-section-title">Focus Peaking</h3>
  
  {/* ON/OFFトグル */}
  <div class="settings-item">
    <label class="settings-label">
      <input
        type="checkbox"
        checked={peakingEnabled()}
        onChange={(e) => setPeakingEnabled(e.currentTarget.checked)}
        class="settings-checkbox"
      />
      <span>Enable Focus Peaking</span>
    </label>
  </div>
  
  {/* 強度スライダー */}
  <Show when={peakingEnabled()}>
    <div class="settings-item">
      <label class="settings-label">
        Intensity: {peakingIntensity()}
      </label>
      <input
        type="range"
        min="0"
        max="255"
        step="5"
        value={peakingIntensity()}
        onInput={(e) => setPeakingIntensity(Number(e.currentTarget.value))}
        class="settings-slider"
      />
      <div class="settings-hint">
        Lower = more edges, Higher = fewer edges
      </div>
    </div>
    
    {/* 色選択 */}
    <div class="settings-item">
      <label class="settings-label">Color</label>
      <div class="color-picker-group">
        {['lime', 'red', 'cyan', 'yellow', 'magenta'].map((color) => (
          <button
            type="button"
            class="color-picker-button"
            classList={{ active: peakingColor() === color }}
            style={{ 'background-color': color }}
            onClick={() => setPeakingColor(color)}
            aria-label={`Set color to ${color}`}
          />
        ))}
      </div>
    </div>
    
    {/* 不透明度スライダー */}
    <div class="settings-item">
      <label class="settings-label">
        Opacity: {(peakingOpacity() * 100).toFixed(0)}%
      </label>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={peakingOpacity()}
        onInput={(e) => setPeakingOpacity(Number(e.currentTarget.value))}
        class="settings-slider"
      />
    </div>
  </Show>
</div>
```

### 3. スタイリング追加
```css
/* src/App.css または SettingsMenu.module.css */

.settings-section {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-primary);
}

.settings-section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.settings-item {
  margin-bottom: 12px;
}

.settings-label {
  display: block;
  font-size: 14px;
  margin-bottom: 6px;
  color: var(--text-secondary);
}

.settings-checkbox {
  margin-right: 8px;
  cursor: pointer;
}

.settings-slider {
  width: 100%;
  cursor: pointer;
}

.settings-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 4px;
}

.color-picker-group {
  display: flex;
  gap: 8px;
}

.color-picker-button {
  width: 32px;
  height: 32px;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.color-picker-button.active {
  border-color: var(--text-primary);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
}

.color-picker-button:hover {
  border-color: var(--text-secondary);
}
```

### 4. カスタム色入力（オプション）
```tsx
{/* カスタム色入力 */}
<div class="settings-item">
  <label class="settings-label">Custom Color</label>
  <input
    type="color"
    value={peakingColor()}
    onInput={(e) => setPeakingColor(e.currentTarget.value)}
    class="settings-color-input"
  />
</div>
```

### 5. プリセット機能（オプション）
```tsx
const PEAKING_PRESETS = [
  { name: 'Subtle', intensity: 80, opacity: 0.3 },
  { name: 'Normal', intensity: 60, opacity: 0.5 },
  { name: 'Strong', intensity: 40, opacity: 0.7 },
];

{/* プリセットボタン */}
<div class="settings-item">
  <label class="settings-label">Presets</label>
  <div class="preset-buttons">
    {PEAKING_PRESETS.map((preset) => (
      <button
        type="button"
        class="preset-button"
        onClick={() => {
          setPeakingIntensity(preset.intensity);
          setPeakingOpacity(preset.opacity);
        }}
      >
        {preset.name}
      </button>
    ))}
  </div>
</div>
```

## 技術的詳細

### スライダーの挙動
- **Intensity**: 0-255、ステップ5（細かすぎず調整しやすい）
- **Opacity**: 0.0-1.0、ステップ0.05（5%刻み）

### リアルタイムプレビュー
- スライダーを動かすと即座にピーキング表示が更新
- SolidJSのリアクティビティで自動反映

### 色選択UI
- プリセット色ボタン（lime, red, cyan, yellow, magenta）
- アクティブな色にborder表示
- カスタム色入力（type="color"）もオプションで追加可能

### アクセシビリティ
- `aria-label` 追加
- キーボード操作対応（スライダー、チェックボックス）
- コントラスト比確保

### エッジケース
1. **ピーキング無効時**: スライダー等を非表示（`<Show when={peakingEnabled()}>`）
2. **不正な値**: AppStateContextのバリデーションで対応済み
3. **色文字列の検証**: ブラウザに委譲

## 完了条件

### 機能チェックリスト
- [ ] ピーキングセクション追加
- [ ] ON/OFFチェックボックス実装
- [ ] 強度スライダー実装
- [ ] 色選択UI実装
- [ ] 不透明度スライダー実装
- [ ] スタイリング完了
- [ ] リアルタイムプレビュー動作確認

### オプション機能（実装した場合）
- [ ] カスタム色入力
- [ ] プリセットボタン
- [ ] アニメーションスタイル選択（Ticket #007と連携）

### 品質チェックリスト
- [ ] TypeScript型エラーなし
- [ ] UIが直感的で使いやすい
- [ ] アクセシビリティ確保
- [ ] eslint警告なし

## テスト項目

### UIテスト
1. **ON/OFF切り替え**
   - チェックボックスON → ピーキング表示
   - チェックボックスOFF → ピーキング非表示

2. **強度スライダー**
   - 左端（0）→ 全エッジ表示
   - 右端（255）→ エッジなし
   - 中央（60）→ 適度なエッジ表示

3. **色選択**
   - limeボタン → 緑色
   - redボタン → 赤色
   - アクティブボタンにborder表示

4. **不透明度スライダー**
   - 0% → 完全透明（見えない）
   - 100% → 完全不透明
   - 50% → 半透明

5. **プレビュー**
   - スライダー操作中もリアルタイムで反映
   - 遅延なし

### 統合テスト
1. 設定変更後にリロード → localStorageから復元
2. 複数画像で設定が維持される
3. 既存のグリッド設定と干渉しない

## 参考資料
- [HTML input range](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/range)
- [HTML input color](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/color)
- [SolidJS Show component](https://www.solidjs.com/docs/latest/api#show)
- [WCAG Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
