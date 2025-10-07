# Ticket #004: PeakingLayerに点滅ロジック実装

**日付**: 2025-01-07  
**担当**: Agent  
**優先度**: High  
**見積時間**: 1時間  
**依存**: Ticket #001

---

## 概要

`PeakingLayer`コンポーネントに点滅ロジックを実装し、ピーキング表示を500ms間隔で点滅させます。

---

## 目的

- ピーキング表示を500ms間隔で点滅させる
- `AppState.peakingBlink()`がtrueの時のみ点滅
- メモリリークを防止（タイマーの適切なクリーンアップ）
- パフォーマンスへの影響を最小化

---

## 技術仕様

### 変更ファイル
- `src/components/ImageViewer/PeakingLayer.tsx`

### 点滅実装方式
```typescript
// setIntervalで500ms間隔で不透明度を切り替え
const [blinkVisible, setBlinkVisible] = createSignal(true);

createEffect(() => {
  if (appState.peakingBlink()) {
    const timer = setInterval(() => {
      setBlinkVisible(prev => !prev);
    }, 500);
    
    onCleanup(() => clearInterval(timer));
  } else {
    setBlinkVisible(true); // 点滅OFFの時は常に表示
  }
});
```

### 不透明度計算
```typescript
const finalOpacity = () => {
  const baseOpacity = appState.peakingOpacity();
  return appState.peakingBlink() && !blinkVisible() ? 0 : baseOpacity;
};
```

---

## 実装手順

### ステップ1: 点滅状態シグナル追加（10分）

`PeakingLayer`コンポーネント内に追加:
```typescript
const [blinkVisible, setBlinkVisible] = createSignal(true);
```

### ステップ2: 点滅エフェクト実装（20分）

```typescript
createEffect(() => {
  if (!appState.peakingEnabled()) {
    // ピーキング無効時は何もしない
    return;
  }
  
  if (appState.peakingBlink()) {
    // 点滅モード
    console.log('[PeakingLayer] Blink mode activated');
    
    const timer = setInterval(() => {
      setBlinkVisible(prev => {
        const next = !prev;
        console.log('[PeakingLayer] Blink toggle:', next);
        return next;
      });
    }, 500);
    
    // クリーンアップ（重要！）
    onCleanup(() => {
      console.log('[PeakingLayer] Clearing blink timer');
      clearInterval(timer);
    });
  } else {
    // 通常モード（常に表示）
    setBlinkVisible(true);
  }
});
```

### ステップ3: 不透明度計算の修正（15分）

既存のSVG要素の`opacity`属性を修正:
```tsx
<svg
  // ... 既存の属性 ...
  opacity={finalOpacity()}
>
  {/* エッジ描画 */}
</svg>
```

不透明度計算関数:
```typescript
const finalOpacity = () => {
  const baseOpacity = appState.peakingOpacity();
  
  // 点滅モードで非表示状態の場合は0
  if (appState.peakingBlink() && !blinkVisible()) {
    return 0;
  }
  
  return baseOpacity;
};
```

### ステップ4: デバッグログ追加（5分）

```typescript
createEffect(() => {
  console.log('[PeakingLayer] Blink enabled:', appState.peakingBlink());
  console.log('[PeakingLayer] Blink visible:', blinkVisible());
  console.log('[PeakingLayer] Final opacity:', finalOpacity());
});
```

### ステップ5: 動作確認（10分）

1. ピーキング有効化
2. 点滅チェックボックスをON
3. 500ms間隔で点滅することを確認
4. 点滅チェックボックスをOFF
5. 点滅が停止し、常に表示されることを確認
6. ブラウザコンソールでログを確認

---

## テスト計画

### 手動テスト

#### テストケース1: 点滅有効化
1. アプリケーション起動
2. 画像を開く
3. ピーキングを有効化
4. 点滅チェックボックスをON
5. **期待**: ピーキング表示が500ms間隔で点滅
6. コンソールログで`Blink toggle: true/false`が交互に表示されることを確認

#### テストケース2: 点滅無効化
1. 点滅チェックボックスをOFF
2. **期待**: ピーキング表示が常に表示される（点滅停止）
3. コンソールログでタイマークリアが確認できる

#### テストケース3: ピーキング無効化
1. 点滅チェックボックスをON（点滅中）
2. ピーキング有効チェックボックスをOFF
3. **期待**: タイマーが正しくクリーンアップされる
4. ピーキングを再度有効化
5. **期待**: 点滅が再開される（メモリリークなし）

#### テストケース4: 画像切り替え
1. 点滅チェックボックスをON
2. 別の画像に切り替え
3. **期待**: タイマーが正しくクリーンアップされ、新しい画像でも点滅が動作

#### テストケース5: 不透明度との連携
1. 点滅チェックボックスをON
2. 不透明度を0.3に設定
3. **期待**: 表示時の不透明度が0.3、非表示時が0

### パフォーマンステスト
- ブラウザの開発者ツールで`Performance`タブを確認
- 点滅中のCPU使用率が過度に上昇しないこと
- メモリリークがないこと（長時間動作させても増加しない）

---

## 完了条件

- ✅ `blinkVisible`シグナルが実装されている
- ✅ 点滅エフェクトが500ms間隔で動作
- ✅ `appState.peakingBlink()`に応じて点滅が切り替わる
- ✅ タイマーが`onCleanup`で正しくクリアされる
- ✅ 不透明度計算が正しく実装されている
- ✅ ピーキング無効時にタイマーがクリアされる
- ✅ メモリリークがない
- ✅ TypeScriptコンパイルエラーなし
- ✅ 既存のピーキング表示機能に影響なし

---

## 注意事項

### メモリリーク防止（重要！）
```typescript
// ✅ 正しい実装
createEffect(() => {
  if (condition) {
    const timer = setInterval(...);
    onCleanup(() => clearInterval(timer));
  }
});

// ❌ 間違った実装
createEffect(() => {
  if (condition) {
    setInterval(...); // クリーンアップされない！
  }
});
```

### パフォーマンス考慮
- `setInterval`は軽量（500msは十分長い）
- 不透明度変更のみなので再レンダリングコストは最小
- エッジ再計算は発生しない（不透明度のみ変更）

### SolidJSのリアクティブシステム
- `createEffect`は依存関係が変更されたときに再実行
- 再実行時、前回のエフェクトは自動的にクリーンアップされる
- `onCleanup`でタイマーを確実にクリア

### デバッグ
- コンソールログで点滅状態を追跡
- 実装完了後は不要なログを削除（またはコメントアウト）

---

## 次のステップ

このチケット完了後:
- **Ticket #005**: 統合テストで全機能を確認

---

## 参考情報

### SolidJS createEffect
```typescript
createEffect(() => {
  // 依存する signal/store を参照すると自動的に追跡される
  const value = someSignal();
  
  // 副作用（タイマー、イベントリスナー等）
  const timer = setInterval(...);
  
  // クリーンアップ
  onCleanup(() => {
    clearInterval(timer);
  });
});
```

### JavaScript setInterval
```typescript
const timer = setInterval(() => {
  // 500ms間隔で実行
}, 500);

// クリーンアップ
clearInterval(timer);
```

### 不透明度の例
```
baseOpacity = 0.5

点滅OFF: finalOpacity = 0.5（常に）
点滅ON + 表示: finalOpacity = 0.5
点滅ON + 非表示: finalOpacity = 0
```
