# Ticket #003: SettingsMenuに点滅チェックボックス追加

**日付**: 2025-01-07  
**担当**: Agent  
**優先度**: Medium  
**見積時間**: 0.5時間  
**依存**: Ticket #001

---

## 概要

`SettingsMenu`コンポーネントにピーキング点滅のON/OFF切り替えチェックボックスを追加します。

---

## 目的

- ユーザーがピーキング点滅機能を有効/無効にできるUI提供
- 既存のピーキング設定UIと一貫性のあるデザイン
- AppStateContextの状態と双方向バインディング

---

## 技術仕様

### 変更ファイル
- `src/components/SettingsMenu/index.tsx`

### Props拡張
```typescript
interface SettingsMenuProps {
  // ... 既存のプロパティ ...
  
  // 新規追加
  peakingBlink: boolean;
  onPeakingBlinkChange: (enabled: boolean) => void;
}
```

### UI配置
既存のピーキング設定セクション内に追加:
```
ピーキング設定
├── [x] ピーキング有効
├── 強度: [スライダー] 150
├── 色: [カラーピッカー] #00ff00
├── 不透明度: [スライダー] 0.5
└── [新規] [x] ピーキング点滅  ← ここに追加
```

---

## 実装手順

### ステップ1: Props型定義拡張（5分）

`SettingsMenuProps`インターフェースに追加:
```typescript
interface SettingsMenuProps {
  // ... 既存のプロパティ ...
  
  peakingBlink: boolean;
  onPeakingBlinkChange: (enabled: boolean) => void;
}
```

### ステップ2: チェックボックスUI追加（15分）

既存のピーキング設定セクション内に追加:
```tsx
<div class="menu-item">
  <label class="checkbox-label">
    <input
      type="checkbox"
      checked={props.peakingBlink}
      onChange={(e) => props.onPeakingBlinkChange(e.currentTarget.checked)}
    />
    <span>ピーキング点滅</span>
  </label>
</div>
```

配置位置: `peakingOpacity`スライダーの直後

### ステップ3: スタイル調整（10分）

既存のチェックボックススタイルを使用（`.checkbox-label`クラス）

必要に応じて追加スタイル:
```css
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
}
```

### ステップ4: 親コンポーネント連携（10分）

`ImageViewer/index.tsx`で`SettingsMenu`を呼び出す箇所を修正:
```tsx
<SettingsMenu
  // ... 既存のプロパティ ...
  peakingBlink={appState.peakingBlink()}
  onPeakingBlinkChange={appState.setPeakingBlink}
/>
```

---

## テスト計画

### 手動テスト

#### テストケース1: チェックボックス表示
1. アプリケーション起動
2. 設定メニューを開く
3. ピーキング設定セクションに「ピーキング点滅」チェックボックスが表示されることを確認
4. デフォルトでチェックが外れていることを確認

#### テストケース2: チェックボックス操作
1. チェックボックスをクリック
2. チェックが入ることを確認
3. もう一度クリック
4. チェックが外れることを確認

#### テストケース3: 状態反映
1. チェックボックスをON
2. ブラウザコンソールで`appState.peakingBlink()`が`true`を返すことを確認
3. チェックボックスをOFF
4. `appState.peakingBlink()`が`false`を返すことを確認

#### テストケース4: UI一貫性
1. 他のピーキング設定UI（強度スライダー等）と見た目が統一されていることを確認
2. レスポンシブデザインが機能していることを確認

---

## 完了条件

- ✅ `SettingsMenuProps`にprops定義が追加されている
- ✅ チェックボックスUIが実装されている
- ✅ チェックボックスがピーキング設定セクション内に配置されている
- ✅ `onChange`ハンドラーが正しく呼び出される
- ✅ 親コンポーネント（ImageViewer）から正しくpropsが渡される
- ✅ TypeScriptコンパイルエラーなし
- ✅ 既存のピーキング設定UIと一貫性のあるデザイン
- ✅ 状態変更が正しく反映される

---

## 注意事項

### UI/UXデザイン
- 既存のチェックボックススタイルを踏襲
- ラベルは日本語で「ピーキング点滅」
- クリック可能領域を広く（ラベル全体）

### 既存コードへの影響
- **最小限**: propsの追加のみ
- 既存のピーキング設定には影響なし
- 他のコンポーネントは変更不要

### TypeScript型安全性
- Props型定義により、親コンポーネントから正しく値が渡されることを保証
- `onChange`ハンドラーの型も明示

### アクセシビリティ
- `<label>`要素でチェックボックスとテキストを関連付け
- キーボード操作可能（既存のチェックボックスと同様）

---

## 次のステップ

このチケット完了後:
- **Ticket #004**: PeakingLayerで点滅ロジック実装（この状態を参照）

---

## 参考情報

### 既存の類似UI（ピーキング有効チェックボックス）
```tsx
<div class="menu-item">
  <label class="checkbox-label">
    <input
      type="checkbox"
      checked={props.peakingEnabled}
      onChange={(e) => props.onPeakingEnabledChange(e.currentTarget.checked)}
    />
    <span>ピーキング有効</span>
  </label>
</div>
```

### SolidJSのイベントハンドリング
- `onChange`: チェックボックスの状態変化時に発火
- `e.currentTarget.checked`: チェック状態（boolean）
- Propsを通じて親コンポーネントのstateを更新

### CSS設計
- 既存の`.checkbox-label`クラスを使用
- 必要に応じてScopedスタイルで調整
