# Ticket #006: TypeScript側AbortController統合

**作成日**: 2025-01-07  
**優先度**: High  
**見積時間**: 1時間  
**担当**: TypeScript  
**依存関係**: Ticket #005（Rustキャンセルチェック）  

---

## 目的

TypeScript側でAbortControllerを使用し、
連続操作時に古いリクエストをキャンセルする。

ユーザーがスライダーを連続で変更した場合、
最後のリクエストのみがRust側で処理される。

---

## 背景

現在の`PeakingLayer.tsx`では、強度変更のたびに
`invokeFocusPeaking`を呼び出しているが、キャンセル機構がない。

```typescript
createEffect(() => {
  const path = props.imagePath;
  const intensity = props.intensity;
  
  invokeFocusPeaking(path, intensity).then(result => {
    setPeakingData(result);
  });
});
```

この実装では、連続操作時にすべてのリクエストが完了してしまう。

---

## 実装方針

### 1. PeakingLayer.tsxにAbortController追加

```typescript
import { createEffect, createSignal, onCleanup } from 'solid-js';
import { invokeFocusPeaking } from '../../lib/peakingUtils';

export function PeakingLayer(props: PeakingLayerProps) {
  const [peakingData, setPeakingData] = createSignal<PeakingResult | null>(null);
  let abortController: AbortController | null = null;

  createEffect(() => {
    const path = props.imagePath;
    const intensity = props.intensity;
    
    // 前回のリクエストをキャンセル
    if (abortController) {
      abortController.abort();
      console.log('[PeakingLayer] 前回のリクエストをキャンセル');
    }
    
    // 新しいAbortControllerを作成
    abortController = new AbortController();
    const signal = abortController.signal;
    
    // リクエストIDを生成（キャッシュキーと同じ）
    const requestId = `${path}:${intensity}`;
    
    invokeFocusPeaking(path, intensity, requestId, signal)
      .then(result => {
        // キャンセルされていなければ結果を設定
        if (!signal.aborted) {
          setPeakingData(result);
          console.log('[PeakingLayer] ピーキングデータ更新完了');
        }
      })
      .catch(error => {
        if (signal.aborted) {
          console.log('[PeakingLayer] リクエストがキャンセルされました');
        } else {
          console.error('[PeakingLayer] エラー:', error);
        }
      });
  });

  // クリーンアップ
  onCleanup(() => {
    if (abortController) {
      abortController.abort();
      console.log('[PeakingLayer] クリーンアップでキャンセル');
    }
  });

  return (
    // ... 既存のSVGレンダリング ...
  );
}
```

### 2. peakingUtils.tsの拡張

`invokeFocusPeaking`にAbortSignalサポートを追加:

```typescript
export async function invokeFocusPeaking(
  imagePath: string,
  threshold: number,
  requestId?: string,
  signal?: AbortSignal
): Promise<PeakingResult> {
  // AbortSignalがすでにキャンセルされている場合
  if (signal?.aborted) {
    throw new Error('Request was aborted before execution');
  }

  // Tauriコマンド呼び出し
  const result = await invoke<PeakingResult>('focus_peaking', {
    imagePath,
    threshold,
    requestId: requestId || `${imagePath}:${threshold}`,
  });

  // 処理完了後にキャンセルされていた場合
  if (signal?.aborted) {
    throw new Error('Request was aborted after execution');
  }

  return result;
}
```

### 3. キャッシュとの統合

既存のキャッシュ機構を維持しつつ、AbortControllerを統合:

```typescript
const cacheKey = `${path}:${intensity}`;

// キャッシュヒットならAbortControllerは不要
if (cache.has(cacheKey)) {
  setPeakingData(cache.get(cacheKey)!);
  return;
}

// キャッシュミスなら新規リクエスト
abortController = new AbortController();
const signal = abortController.signal;

invokeFocusPeaking(path, intensity, cacheKey, signal)
  .then(result => {
    if (!signal.aborted) {
      cache.set(cacheKey, result);
      if (cache.size > 10) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      setPeakingData(result);
    }
  })
  .catch(/* ... */);
```

---

## タスク

### 1. `PeakingLayer.tsx`の修正

**ファイル**: `src/components/ImageViewer/PeakingLayer.tsx`

- [ ] AbortControllerの追加
- [ ] createEffect内でAbortController管理
- [ ] onCleanupでキャンセル処理
- [ ] エラーハンドリングの追加

### 2. `peakingUtils.ts`の拡張

**ファイル**: `src/lib/peakingUtils.ts`

- [ ] `invokeFocusPeaking`にrequestId, signalパラメータ追加
- [ ] AbortSignalのチェック処理
- [ ] 型定義の更新

### 3. 動作確認

```bash
npm run tauri dev
```

- スライダーを連続変更（150→155→200）
- ターミナルにキャンセルログが出る
- 最後の値（200）のみが処理される
- キャッシュヒット時はキャンセル不要

### 4. デバッグログの確認

期待されるログ出力:
```
[PeakingLayer] 前回のリクエストをキャンセル
[Rust] Cancelled
[PeakingLayer] リクエストがキャンセルされました
[PeakingLayer] ピーキングデータ更新完了
```

---

## 完了条件

- ✅ `PeakingLayer.tsx`にAbortControllerが実装されている
- ✅ `peakingUtils.ts`がAbortSignalをサポート
- ✅ TypeScriptコンパイルエラーなし
- ✅ 連続操作時に古いリクエストがキャンセルされる
- ✅ 最後のリクエストのみが処理される
- ✅ キャッシュ機構が正常に動作
- ✅ エラーハンドリングが適切

---

## リスク

### リスク1: キャンセルタイミングの競合
Rust側で処理完了とキャンセルが同時に発生する可能性。

**対策**: Rust側のキャンセルチェックを定期的に行い、
早期に検出する（Ticket #005で実装済み）。

### リスク2: AbortControllerの参照管理
SolidJSのリアクティブシステムとの相互作用。

**対策**: `let`変数でAbortControllerを保持し、
createEffect外でアクセスしない。

---

## 次のステップ

このチケット完了後、以下に進む:
- Ticket #007: パフォーマンステストと調整

---

## 参考情報

### AbortController API
```typescript
// AbortControllerの作成
const controller = new AbortController();
const signal = controller.signal;

// リクエストのキャンセル
controller.abort();

// キャンセルされたかチェック
if (signal.aborted) {
  console.log('Aborted!');
}

// キャンセルイベントのリスニング
signal.addEventListener('abort', () => {
  console.log('Request was aborted');
});
```

### SolidJS onCleanup
```typescript
createEffect(() => {
  // エフェクト内の処理
  
  onCleanup(() => {
    // エフェクトが再実行される前、またはコンポーネントがアンマウントされる前に実行
    console.log('Cleanup!');
  });
});
```

### Promise + AbortSignal
```typescript
async function fetchWithAbort(signal: AbortSignal) {
  if (signal.aborted) {
    throw new Error('Already aborted');
  }
  
  const result = await someAsyncOperation();
  
  if (signal.aborted) {
    throw new Error('Aborted during operation');
  }
  
  return result;
}
```
