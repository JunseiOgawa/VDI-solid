# Ticket #005: AppStateContext拡張

## メタ情報
- **優先度**: High
- **見積**: 1.5時間
- **依存チケット**: #003, #004
- **ブロックするチケット**: #006, #008

## 目的
AppStateContextにピーキング関連の状態とロジックを追加し、グローバルな状態管理を実現します。

## 対象ファイル

### 変更
- `src/context/AppStateContext.tsx`

### 影響範囲
- ImageViewer/index.tsx（状態を参照）
- ImageManager.tsx（状態を参照）
- SettingsMenu/index.tsx（将来、設定UIで使用）

## 実装手順

### 1. 型定義の拡張
```typescript
// AppState interfaceに追加
export interface AppState {
  // 既存のプロパティ...
  currentImagePath: () => string;
  // ... 省略 ...
  
  // ピーキング関連（新規追加）
  /** ピーキング機能の有効/無効 */
  peakingEnabled: () => boolean;
  /** ピーキング機能の有効/無効を設定 */
  setPeakingEnabled: (enabled: boolean) => void;
  
  /** エッジ検出閾値 (0-255) */
  peakingIntensity: () => number;
  /** エッジ検出閾値を設定 */
  setPeakingIntensity: (intensity: number) => void;
  
  /** ピーキング表示色 */
  peakingColor: () => string;
  /** ピーキング表示色を設定 */
  setPeakingColor: (color: string) => void;
  
  /** ピーキング不透明度 (0.0-1.0) */
  peakingOpacity: () => number;
  /** ピーキング不透明度を設定 */
  setPeakingOpacity: (opacity: number) => void;
}
```

### 2. AppProviderにSignal追加
```typescript
export const AppProvider: Component<{ children: any }> = (props) => {
  // 既存のSignal...
  const [currentImagePath, _setCurrentImagePath] = createSignal<string>('');
  // ... 省略 ...
  
  // ピーキング関連Signal（新規追加）
  const [peakingEnabled, setPeakingEnabled] = createSignal<boolean>(false);
  const [peakingIntensity, setPeakingIntensity] = createSignal<number>(60);
  const [peakingColor, setPeakingColor] = createSignal<string>('lime');
  const [peakingOpacity, setPeakingOpacity] = createSignal<number>(0.5);
  
  // ... 既存のロジック ...
};
```

### 3. appState オブジェクトに追加
```typescript
const appState: AppState = {
  // 既存のプロパティ...
  currentImagePath,
  setCurrentImagePath,
  zoomScale,
  setZoomScale,
  // ... 省略 ...
  
  // ピーキング関連（新規追加）
  peakingEnabled,
  setPeakingEnabled,
  peakingIntensity,
  setPeakingIntensity,
  peakingColor,
  setPeakingColor,
  peakingOpacity,
  setPeakingOpacity,
};
```

### 4. localStorageへの永続化（オプション）
```typescript
// ピーキング設定をlocalStorageに保存
createEffect(() => {
  const config = {
    enabled: peakingEnabled(),
    intensity: peakingIntensity(),
    color: peakingColor(),
    opacity: peakingOpacity(),
  };
  localStorage.setItem('peaking-config', JSON.stringify(config));
});

// 初期化時にlocalStorageから復元
onMount(() => {
  const saved = localStorage.getItem('peaking-config');
  if (saved) {
    try {
      const config = JSON.parse(saved);
      setPeakingEnabled(config.enabled ?? false);
      setPeakingIntensity(config.intensity ?? 60);
      setPeakingColor(config.color ?? 'lime');
      setPeakingOpacity(config.opacity ?? 0.5);
    } catch (e) {
      console.error('[AppState] Failed to restore peaking config:', e);
    }
  }
});
```

### 5. バリデーション追加
```typescript
import { clampIntensity, clampOpacity } from '../lib/peakingUtils';

// Setterにバリデーションを追加
const _setPeakingIntensity = (intensity: number) => {
  setPeakingIntensity(clampIntensity(intensity));
};

const _setPeakingOpacity = (opacity: number) => {
  setPeakingOpacity(clampOpacity(opacity));
};

// appStateオブジェクトでは_setPeakingIntensityを公開
const appState: AppState = {
  // ...
  peakingIntensity,
  setPeakingIntensity: _setPeakingIntensity,
  peakingOpacity,
  setPeakingOpacity: _setPeakingOpacity,
};
```

## 技術的詳細

### デフォルト値の設計
- **peakingEnabled**: `false`（デフォルトOFF）
- **peakingIntensity**: `60`（中程度の感度）
- **peakingColor**: `'lime'`（視認性が高い緑色）
- **peakingOpacity**: `0.5`（半透明）

### localStorageキー
```
'peaking-config'
```
JSON形式で保存:
```json
{
  "enabled": false,
  "intensity": 60,
  "color": "lime",
  "opacity": 0.5
}
```

### createEffectの配置
- 各Signalの変更を監視し、localStorageに保存
- debounce不要（設定変更頻度は低い）

### バリデーション
- `peakingIntensity`: 0-255にクランプ
- `peakingOpacity`: 0.0-1.0にクランプ
- `peakingColor`: CSS色文字列（バリデーションなし、ブラウザに委譲）

### エッジケース
1. **localStorage読み込み失敗**: デフォルト値を使用
2. **不正なJSON**: catchしてデフォルト値
3. **範囲外の値**: clamp関数で補正

## 完了条件

### 機能チェックリスト
- [ ] AppState型定義拡張
- [ ] Signal追加（4つ）
- [ ] appStateオブジェクトに追加
- [ ] バリデーション実装
- [ ] localStorage永続化実装（オプション）
- [ ] 初期化時の復元実装（オプション）

### 品質チェックリスト
- [ ] TypeScript型エラーなし
- [ ] 既存機能に影響なし
- [ ] JSDocコメント記述
- [ ] eslint警告なし

## テスト項目

### 単体テスト（手動）
1. **Signal動作確認**
   - `setPeakingEnabled(true)` → `peakingEnabled()` が `true`
   - `setPeakingIntensity(100)` → `peakingIntensity()` が `100`

2. **バリデーション確認**
   - `setPeakingIntensity(-10)` → `0` にクランプ
   - `setPeakingIntensity(300)` → `255` にクランプ
   - `setPeakingOpacity(1.5)` → `1.0` にクランプ

3. **localStorage確認**
   - 設定変更後、ブラウザDevToolsでlocalStorageを確認
   - リロード後、設定が復元されるか

4. **Context提供確認**
   - 子コンポーネントで `useAppState()` 呼び出し
   - ピーキング関連の値が取得できるか

### 統合テスト
1. ImageViewer/index.tsx から状態を参照
2. 設定変更時にPeakingLayerが再レンダリングされるか
3. 既存のグリッド機能が正常動作するか

## 参考資料
- [SolidJS createSignal](https://www.solidjs.com/docs/latest/api#createsignal)
- [SolidJS Context](https://www.solidjs.com/docs/latest/api#createcontext)
- [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
