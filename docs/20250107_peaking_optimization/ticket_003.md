# Ticket #003: スライダーDebounce統合

**優先度**: High  
**見積時間**: 1時間  
**依存チケット**: #001

---

## 目的

ピーキング設定の強度・不透明度スライダーにDebounceを適用し、
即座のUI更新と遅延処理実行を両立させる。

---

## 対象ファイル

### 変更
- `src/components/SettingsMenu/index.tsx`

---

## 影響範囲

- SettingsMenuコンポーネント内のスライダー処理
- AppStateContextのsetter呼び出しタイミング（内部のみ）
- 外部コンポーネントへの影響なし

---

## 実装手順

### 1. 一時表示用Signalの追加

強度と不透明度用の一時表示Signalを作成:

```typescript
const SettingsMenu: Component<SettingsMenuProps> = (props) => {
  const [showThemeSubmenu, setShowThemeSubmenu] = createSignal(false);
  const [showPeakingSubmenu, setShowPeakingSubmenu] = createSignal(false);
  
  // 一時表示用Signal（追加）
  const [tempIntensity, setTempIntensity] = createSignal(props.peakingIntensity);
  const [tempOpacity, setTempOpacity] = createSignal(props.peakingOpacity);
  
  // 既存のcolorPresets...
```

### 2. Debounced関数の作成

Ticket #001で実装したcreateDebounce関数を使用:

```typescript
// 強度変更のDebounced版
const [debouncedIntensityChange, cleanupIntensity] = createDebounce(
  (value: number) => {
    props.onPeakingIntensityChange(value);
  },
  500 // 500ms遅延
);

// 不透明度変更のDebounced版
const [debouncedOpacityChange, cleanupOpacity] = createDebounce(
  (value: number) => {
    props.onPeakingOpacityChange(value);
  },
  500
);
```

### 3. onCleanupの設定

コンポーネントアンマウント時のクリーンアップ:

```typescript
onCleanup(() => {
  cleanupIntensity();
  cleanupOpacity();
});
```

### 4. 強度スライダーの更新

既存のonInputを2段階処理に変更:

```typescript
<input
  type="range"
  min="0"
  max="255"
  step="5"
  value={tempIntensity()}  // ← 一時表示用Signalから取得
  onInput={(e) => {
    const value = Number(e.currentTarget.value);
    setTempIntensity(value);        // ← 即座に表示更新
    debouncedIntensityChange(value); // ← 遅延実行
  }}
  class="w-full"
  disabled={!props.peakingEnabled}
/>
```

### 5. 不透明度スライダーの更新

同様の処理を適用:

```typescript
<input
  type="range"
  min="0"
  max="1"
  step="0.05"
  value={tempOpacity()}  // ← 一時表示用Signalから取得
  onInput={(e) => {
    const value = Number(e.currentTarget.value);
    setTempOpacity(value);        // ← 即座に表示更新
    debouncedOpacityChange(value); // ← 遅延実行
  }}
  class="w-full"
  disabled={!props.peakingEnabled}
/>
```

### 6. 数値表示の更新

表示値を一時Signalから取得:

```typescript
// 強度の表示
<span class="text-[var(--text-muted)]">{tempIntensity()}</span>

// 不透明度の表示
<span class="text-[var(--text-muted)]">{(tempOpacity() * 100).toFixed(0)}%</span>
```

### 7. propsの変更を反映

外部からpropsが変更された場合の同期:

```typescript
createEffect(() => {
  setTempIntensity(props.peakingIntensity);
  setTempOpacity(props.peakingOpacity);
});
```

---

## 技術的詳細

### 動作フロー

```
ユーザー操作
  ↓
onInput発火
  ↓
├─ setTempIntensity(value)  ← 即座に実行（UI更新）
└─ debouncedChange(value)   ← 500ms後に実行（処理実行）
  ↓
500ms経過
  ↓
props.onPeakingIntensityChange(value)
  ↓
AppStateContext.setPeakingIntensity(value)
  ↓
PeakingLayer.createEffect → Rust処理
```

### 状態管理の分離

1. **一時表示用**: `tempIntensity`, `tempOpacity`
   - ローカルSignal
   - スライダー移動ごとに即座に更新
   - 画面表示のみに使用

2. **実際の処理用**: `props.peakingIntensity`, `props.peakingOpacity`
   - AppStateContextから来るprops
   - Debounce後に更新
   - Rust処理のトリガー

### Debounce遅延時間の根拠

- **500ms**: 一般的なユーザー操作完了時間
- **短すぎる場合**: 処理が複数回実行される
- **長すぎる場合**: レスポンスが悪く感じる

---

## エッジケース

### ケース1: 高速な連続スライダー移動
- **動作**: 表示は即座に更新、処理は最後の1回のみ
- **期待**: UIの反応性を保ちつつ処理回数削減

### ケース2: スライダー移動中にコンポーネントが閉じる
- **動作**: onCleanupでタイマークリア
- **期待**: 保留中の処理がキャンセルされる

### ケース3: 外部からpropsが変更される
- **動作**: createEffectで一時Signalに反映
- **期待**: 表示と実態の整合性維持

### ケース4: 無効状態でスライダーを操作
- **動作**: disabled属性で操作不可
- **期待**: 変更イベントが発火しない

---

## 完了条件

- [x] tempIntensity/tempOpacity Signalが実装されている
- [x] Debounced関数が作成されている
- [x] onCleanupでタイマークリアしている
- [x] スライダーのvalueが一時Signalから取得されている
- [x] onInputで即座の表示更新と遅延処理を両立している
- [x] createEffectでprops変更を反映している
- [x] TypeScriptの型エラーがない
- [x] ESLint警告がない

---

## テスト項目

### 機能テスト

1. **基本動作**
   - スライダーを1回移動
   - 数値表示が即座に更新されることを確認
   - 500ms後にピーキングが再計算されることを確認

2. **連続移動**
   - スライダーを素早く10回移動
   - 処理が1回のみ実行されることを確認（コンソールログで確認）

3. **遅延中の移動**
   - スライダーを移動
   - 500ms待たずに再度移動
   - タイマーがリセットされることを確認

4. **コンポーネントクローズ**
   - スライダーを移動
   - 500ms待たずに設定メニューを閉じる
   - メモリリークがないことを確認

### UI確認

1. **即座のフィードバック**
   - スライダー移動中、数値表示がリアルタイムで更新される
   - ユーザーが「重い」と感じない

2. **処理実行の遅延**
   - スライダー停止後、500ms経過時にピーキングが更新される
   - ローディング表示が適切に動作する

3. **無効状態**
   - ピーキング無効時、スライダーが操作不可
   - 数値表示がグレーアウトされる

---

## パフォーマンス測定

### Before（現状）
```
スライダー10回移動 → Rust処理10回実行
処理時間: 約10秒
```

### After（実装後）
```
スライダー10回移動 → Rust処理1回実行
処理時間: 約1秒 + 0.5秒遅延 = 1.5秒
```

**改善率**: 約85%の処理時間削減

---

## 参考資料

### Debounceパターン
- [React Debounce解説](https://dmitripavlutin.com/react-throttle-debounce/)
- [SolidJS: createEffect](https://www.solidjs.com/docs/latest/api#createeffect)

### UXベストプラクティス
- [Form Input Debouncing](https://css-tricks.com/debouncing-throttling-explained-examples/)
- [Responsive UI Patterns](https://web.dev/responsive-web-design-basics/)

---

## 実装後の確認

```bash
# ビルド
npm run build

# 開発サーバー起動
npm run dev
```

ブラウザで以下を確認:
1. 設定メニューを開く
2. フォーカスピーキングを有効化
3. 強度スライダーを素早く10回移動
4. コンソールで処理回数を確認（1回のみであること）
5. 数値表示が即座に更新されることを確認
