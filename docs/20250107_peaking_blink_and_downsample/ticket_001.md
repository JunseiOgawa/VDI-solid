# Ticket #001: AppStateContextに点滅設定を追加

**日付**: 2025-01-07  
**担当**: Agent  
**優先度**: High  
**見積時間**: 0.5時間  
**依存**: なし

---

## 概要

`AppStateContext`にピーキング点滅のON/OFF状態を管理するための状態とメソッドを追加します。

---

## 目的

- ピーキング点滅機能のグローバル状態を追加
- 他のコンポーネントから状態を読み取り・変更できるようにする
- 既存のピーキング状態管理パターンに従う

---

## 技術仕様

### 変更ファイル
- `src/context/AppStateContext.tsx`

### 追加する状態
```typescript
// 新規シグナル
const [peakingBlink, setPeakingBlink] = createSignal<boolean>(false);
```

### AppStateインターフェース拡張
```typescript
export interface AppState {
  // ... 既存のプロパティ ...
  
  // 新規追加
  peakingBlink: () => boolean;
  setPeakingBlink: (enabled: boolean) => void;
}
```

### storeオブジェクト拡張
```typescript
const store: AppState = {
  // ... 既存のプロパティ ...
  
  // 新規追加
  peakingBlink,
  setPeakingBlink,
};
```

---

## 実装手順

### ステップ1: シグナル追加（5分）
`AppStateProvider`関数内に以下を追加:
```typescript
const [peakingBlink, setPeakingBlink] = createSignal<boolean>(false);
```

配置位置: 既存のピーキング関連シグナル（`peakingEnabled`, `peakingIntensity`等）の直後

### ステップ2: インターフェース拡張（5分）
`AppState`インターフェースに以下を追加:
```typescript
peakingBlink: () => boolean;
setPeakingBlink: (enabled: boolean) => void;
```

配置位置: 既存のピーキングメソッド（`peakingOpacity`等）の直後

### ステップ3: storeオブジェクト拡張（5分）
`store`オブジェクトに以下を追加:
```typescript
peakingBlink,
setPeakingBlink,
```

配置位置: 既存のピーキングプロパティの直後

### ステップ4: 動作確認（15分）
1. TypeScriptコンパイルエラーがないことを確認
2. ブラウザコンソールで状態が正しく作成されていることを確認
3. Dev Toolsで`AppStateContext`が正しく提供されていることを確認

---

## テスト計画

### 手動テスト
1. アプリケーション起動
2. ブラウザのReact Dev Tools（SolidJS Dev Tools）で`AppStateContext`を確認
3. `peakingBlink`プロパティが存在することを確認
4. デフォルト値が`false`であることを確認

### 予期される結果
- コンパイルエラーなし
- ランタイムエラーなし
- `peakingBlink`と`setPeakingBlink`が正しく動作

---

## 完了条件

- ✅ `peakingBlink`シグナルが作成されている
- ✅ `AppState`インターフェースに型定義が追加されている
- ✅ `store`オブジェクトに公開されている
- ✅ TypeScriptコンパイルエラーなし
- ✅ デフォルト値が`false`
- ✅ 他のコンポーネントから状態が読み取れる

---

## 注意事項

### 既存コードへの影響
- **最小限**: 新規プロパティの追加のみ
- 既存のピーキング関連機能には影響なし
- 他のコンポーネントは変更不要（まだ使用しないため）

### 命名規則
- 既存のパターンに従う: `peakingXxx`, `setPeakingXxx`
- 一貫性を保つ

### TypeScript型安全性
- インターフェース定義により型チェックが有効
- 誤った型の代入を防ぐ

---

## 次のステップ

このチケット完了後:
- **Ticket #003**: SettingsMenuにチェックボックス追加（この状態を使用）
- **Ticket #004**: PeakingLayerで点滅ロジック実装（この状態を参照）

---

## 参考情報

### 既存の類似実装
```typescript
// 既存のピーキング状態（参考）
const [peakingEnabled, setPeakingEnabled] = createSignal<boolean>(false);
const [peakingIntensity, setPeakingIntensity] = createSignal<number>(150);
const [peakingColor, setPeakingColor] = createSignal<string>("#00ff00");
const [peakingOpacity, setPeakingOpacity] = createSignal<number>(0.5);
```

### SolidJS Signal API
- `createSignal<T>(initialValue)`: リアクティブな状態を作成
- 返り値: `[getter, setter]`タプル
- getter: `() => T`
- setter: `(value: T) => void`
