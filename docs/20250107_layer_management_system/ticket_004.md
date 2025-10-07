# Ticket #004: PeakingLayer.tsx 実装

## メタ情報
- **優先度**: High
- **見積**: 2時間
- **依存チケット**: #001, #002
- **ブロックするチケット**: #005, #006

## 目的
Rustから取得したエッジ座標をSVG polylineで描画するコンポーネントを実装します。キャッシュ機能とローディング状態の管理も含みます。

## 対象ファイル

### 新規作成
- `src/components/ImageViewer/PeakingLayer.tsx`

### 影響範囲
- ImageManager.tsx（親コンポーネントから呼び出される）
- lib/peakingUtils.ts（ユーティリティ関数を使用）

## 実装手順

### 1. コンポーネント構造設計
```tsx
import type { Component } from 'solid-js';
import { createSignal, createEffect, onCleanup, Show } from 'solid-js';
import { invokeFocusPeaking, edgeToPolylinePoints, generatePeakingCacheKey } from '../../lib/peakingUtils';
import type { PeakingResult } from '../../lib/peakingUtils';

interface PeakingLayerProps {
  /** 画像ファイルパス */
  imagePath: string;
  /** エッジ検出閾値 (0-255) */
  intensity: number;
  /** 表示色 */
  color: string;
  /** 不透明度 (0.0-1.0) */
  opacity: number;
}

const PeakingLayer: Component<PeakingLayerProps> = (props) => {
  // 実装
};

export default PeakingLayer;
```

### 2. State管理
```tsx
const [peakingData, setPeakingData] = createSignal<PeakingResult | null>(null);
const [isLoading, setIsLoading] = createSignal(false);
const [error, setError] = createSignal<string | null>(null);

// キャッシュ（コンポーネント外のModuleスコープに配置）
const peakingCache = new Map<string, PeakingResult>();
```

### 3. ピーキングデータの取得
```tsx
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
    return;
  }
  
  // Rust処理呼び出し
  setIsLoading(true);
  setError(null);
  
  invokeFocusPeaking(path, intensity)
    .then((result) => {
      peakingCache.set(cacheKey, result);
      setPeakingData(result);
      console.log(`[PeakingLayer] Loaded ${countTotalEdgePoints(result)} edge points`);
    })
    .catch((err) => {
      console.error('[PeakingLayer] Failed to load peaking data:', err);
      setError(String(err));
    })
    .finally(() => {
      setIsLoading(false);
    });
});
```

### 4. SVG描画
```tsx
return (
  <div
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      'pointer-events': 'none', // クリック・ドラッグを下の画像に通す
      overflow: 'hidden',
    }}
  >
    <Show when={isLoading()}>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          padding: '8px 16px',
          'border-radius': '4px',
          'font-size': '14px',
        }}
      >
        Peaking processing...
      </div>
    </Show>
    
    <Show when={error()}>
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(255, 0, 0, 0.8)',
          color: 'white',
          padding: '8px',
          'border-radius': '4px',
          'font-size': '12px',
        }}
      >
        Error: {error()}
      </div>
    </Show>
    
    <Show when={peakingData()}>
      {(data) => (
        <svg
          viewBox={`0 0 ${data().width} ${data().height}`}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
          }}
        >
          {data().edges.map((edge, index) => (
            <polyline
              points={edgeToPolylinePoints(edge)}
              stroke={props.color}
              stroke-width="1.5"
              fill="none"
              opacity={props.opacity}
              // アニメーションは後のチケットで追加
            />
          ))}
        </svg>
      )}
    </Show>
  </div>
);
```

### 5. クリーンアップ
```tsx
onCleanup(() => {
  // 必要に応じてキャッシュクリア（メモリ管理）
  // 今回は永続キャッシュとする
});
```

### 6. キャッシュサイズ管理（オプション）
```tsx
// キャッシュが大きくなりすぎた場合の対策
const MAX_CACHE_SIZE = 10;

function addToCache(key: string, data: PeakingResult) {
  if (peakingCache.size >= MAX_CACHE_SIZE) {
    const firstKey = peakingCache.keys().next().value;
    peakingCache.delete(firstKey);
  }
  peakingCache.set(key, data);
}
```

## 技術的詳細

### SVG viewBox
```
viewBox="0 0 1920 1080"
```
- 元画像のピクセル座標系
- SVGが親要素にフィットするようwidth/height=100%
- ズームしても座標系は変わらない（親のtransformで拡大）

### pointer-events: none
レイヤーをクリックしても下の画像にイベントが通る。ドラッグ操作が正常動作する。

### createEffect依存関係
- `props.imagePath` 変更 → 再取得
- `props.intensity` 変更 → 再取得
- `props.color`, `props.opacity` 変更 → 再描画のみ（Rust処理不要）

### ローディング表示
- 1秒以内の処理でも表示（UX向上）
- 中央に半透明オーバーレイ

### エラーハンドリング
- Rust側エラー → エラーメッセージ表示
- ファイル読み込み失敗 → "Failed to load image"
- エッジが見つからない → 空のSVG（エラーではない）

### エッジケース
1. **imagePath が空文字/null**: peakingData=null、何も描画しない
2. **edges配列が空**: SVG要素は作られるが、polylineは0個
3. **1点のみのエッジ**: polylineは描画されない（2点以上必要）
4. **キャッシュヒット**: 即座に表示、ローディングなし

## 完了条件

### 機能チェックリスト
- [ ] PeakingLayer.tsx ファイル作成
- [ ] Props型定義完了
- [ ] State管理実装（peakingData, isLoading, error）
- [ ] createEffectでのデータ取得実装
- [ ] キャッシュ機能実装
- [ ] SVG描画実装
- [ ] ローディング表示実装
- [ ] エラー表示実装
- [ ] pointer-events: none 設定

### 品質チェックリスト
- [ ] TypeScript型エラーなし
- [ ] JSDocコメント記述
- [ ] console.log でデバッグ情報出力
- [ ] eslint警告なし

## テスト項目

### 単体テスト（手動）
1. **正常系: ピーキング表示**
   - sen19201080.png を表示
   - intensity=60 でエッジが緑色で表示される
   - ローディング表示が一瞬出る

2. **キャッシュ動作確認**
   - 同じ画像・同じintensityで再表示
   - ローディングなしで即座に表示される

3. **パラメータ変更**
   - intensity=100 → エッジが減る（強いエッジのみ）
   - intensity=30 → エッジが増える（細かいエッジも）
   - color='red' → 赤色で表示
   - opacity=0.8 → 濃く表示

4. **エラーハンドリング**
   - 存在しないファイルパス → エラー表示
   - 不正な画像ファイル → エラー表示

5. **ズーム追従**
   - 画像をズーム → エッジも追従、荒れない
   - 回転 → エッジも回転

### 統合テスト
1. ImageManager経由で呼び出し
2. GridOverlayと同時表示
3. ピーキングON/OFF切り替え

## 参考資料
- [SolidJS createEffect](https://www.solidjs.com/docs/latest/api#createeffect)
- [SVG polyline](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/polyline)
- [SVG viewBox](https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/viewBox)
- [CSS pointer-events](https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events)
