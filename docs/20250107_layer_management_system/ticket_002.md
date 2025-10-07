# Ticket #002: TypeScript型定義とユーティリティ作成

## メタ情報
- **優先度**: Medium
- **見積**: 1時間
- **依存チケット**: なし
- **ブロックするチケット**: #003, #004

## 目的
Rustから返却されるピーキングデータの型定義と、フロントエンドで使用するユーティリティ関数を作成します。

## 対象ファイル

### 新規作成
- `src/lib/peakingUtils.ts`

### 影響範囲
- PeakingLayer.tsx（このファイルで型を使用）
- ImageManager.tsx（このファイルで型を参照）

## 実装手順

### 1. TypeScript型定義作成
```typescript
// src/lib/peakingUtils.ts

/**
 * エッジ上の1点の座標
 */
export interface EdgePoint {
  x: number;
  y: number;
}

/**
 * Rustから返却されるピーキング結果
 */
export interface PeakingResult {
  /** 元画像の幅 */
  width: number;
  /** 元画像の高さ */
  height: number;
  /** エッジの座標リスト（各配列が1つの連続エッジ） */
  edges: EdgePoint[][];
}

/**
 * ピーキングレイヤーの設定
 */
export interface PeakingConfig {
  /** 有効/無効 */
  enabled: boolean;
  /** エッジ検出閾値 (0-255) */
  intensity: number;
  /** 表示色（CSS色文字列） */
  color: string;
  /** 不透明度 (0.0-1.0) */
  opacity: number;
}

/**
 * デフォルトのピーキング設定
 */
export const DEFAULT_PEAKING_CONFIG: PeakingConfig = {
  enabled: false,
  intensity: 60,
  color: 'lime',
  opacity: 0.5,
};
```

### 2. ユーティリティ関数実装

#### 2-1. エッジ座標をSVG polyline文字列に変換
```typescript
/**
 * エッジ座標配列をSVG polylineのpoints属性文字列に変換
 * @param edge - エッジの座標配列
 * @returns "x1,y1 x2,y2 x3,y3" 形式の文字列
 */
export function edgeToPolylinePoints(edge: EdgePoint[]): string {
  return edge.map(point => `${point.x},${point.y}`).join(' ');
}
```

#### 2-2. ピーキング結果のキャッシュキー生成
```typescript
/**
 * ピーキング結果のキャッシュキーを生成
 * @param imagePath - 画像ファイルパス
 * @param intensity - エッジ検出閾値
 * @returns キャッシュキー文字列
 */
export function generatePeakingCacheKey(imagePath: string, intensity: number): string {
  return `${imagePath}:${intensity}`;
}
```

#### 2-3. エッジ数のカウント
```typescript
/**
 * 総エッジポイント数をカウント
 * @param result - ピーキング結果
 * @returns 総ポイント数
 */
export function countTotalEdgePoints(result: PeakingResult): number {
  return result.edges.reduce((sum, edge) => sum + edge.length, 0);
}
```

### 3. Tauri Command呼び出しヘルパー
```typescript
import { invoke } from '@tauri-apps/api/core';

/**
 * Rustのfocus_peakingコマンドを呼び出す
 * @param imagePath - 画像ファイルパス
 * @param threshold - エッジ検出閾値 (0-255)
 * @returns ピーキング結果
 * @throws エラーメッセージ（Rustから返却）
 */
export async function invokeFocusPeaking(
  imagePath: string,
  threshold: number
): Promise<PeakingResult> {
  try {
    const result = await invoke<PeakingResult>('focus_peaking', {
      imagePath,
      threshold,
    });
    return result;
  } catch (error) {
    console.error('[PeakingUtils] Failed to invoke focus_peaking:', error);
    throw error;
  }
}
```

### 4. バリデーション関数
```typescript
/**
 * intensity値を0-255の範囲にクランプ
 */
export function clampIntensity(value: number): number {
  return Math.max(0, Math.min(255, Math.floor(value)));
}

/**
 * opacity値を0.0-1.0の範囲にクランプ
 */
export function clampOpacity(value: number): number {
  return Math.max(0, Math.min(1, value));
}
```

## 技術的詳細

### 型安全性
- Rust側の `PeakingResult` 構造体と完全一致
- TypeScriptの型推論を活用
- null/undefinedチェックは不要（Rustが保証）

### SVG座標文字列フォーマット
```
"0,0 10,5 20,3"
→ (0,0), (10,5), (20,3) の3点を結ぶ
```

### キャッシュ戦略
- キャッシュキーは `画像パス:閾値` の形式
- 同じ画像・同じ閾値なら再利用
- 画像変更時はキャッシュクリア

### エッジケース
1. **空のエッジ配列**: `edges: []` → polyline描画なし
2. **1点のみのエッジ**: `[{x:0, y:0}]` → 描画されない（polylineは2点以上必要）
3. **intensity範囲外**: clampIntensityで補正

## 完了条件

### 機能チェックリスト
- [ ] 型定義ファイル作成完了
- [ ] EdgePoint, PeakingResult 型定義
- [ ] PeakingConfig 型定義
- [ ] DEFAULT_PEAKING_CONFIG 定義
- [ ] edgeToPolylinePoints 実装
- [ ] generatePeakingCacheKey 実装
- [ ] countTotalEdgePoints 実装
- [ ] invokeFocusPeaking 実装
- [ ] clampIntensity, clampOpacity 実装

### 品質チェックリスト
- [ ] TypeScript型エラーなし
- [ ] JSDocコメント記述
- [ ] eslint警告なし
- [ ] 命名規則に準拠

## テスト項目

### 単体テスト（手動）
1. `edgeToPolylinePoints` の出力形式確認
   - 入力: `[{x:0,y:0}, {x:10,y:5}]`
   - 期待: `"0,0 10,5"`

2. `clampIntensity` の動作確認
   - 入力: `-10` → 期待: `0`
   - 入力: `300` → 期待: `255`
   - 入力: `128.7` → 期待: `128`

3. `generatePeakingCacheKey` の一意性確認
   - 異なる画像・同じ閾値 → 異なるキー
   - 同じ画像・異なる閾値 → 異なるキー

### 型チェック
```bash
npm run typecheck
# または
tsc --noEmit
```

## 参考資料
- [TypeScript Handbook - Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces.html)
- [SVG polyline element](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/polyline)
- [Tauri invoke documentation](https://tauri.app/v1/api/js/modules/tauri/#invoke)
