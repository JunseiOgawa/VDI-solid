import type { Component } from 'solid-js';
import { createSignal, createEffect, Show, onCleanup } from 'solid-js';
import {
  invokeFocusPeaking,
  edgeToPolylinePoints,
  generatePeakingCacheKey,
  countTotalEdgePoints,
} from '../../lib/peakingUtils';
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

// キャッシュ（モジュールスコープ）
const peakingCache = new Map<string, PeakingResult>();
const MAX_CACHE_SIZE = 10;

/**
 * PeakingLayer コンポーネント
 *
 * Rustから取得したエッジ座標をSVG polylineで描画します。
 * キャッシュ機能とローディング状態の管理も含みます。
 *
 * ズーム・回転時も自動的に追従し、ベクター形式なので荒れません。
 */
const PeakingLayer: Component<PeakingLayerProps> = (props) => {
  const [peakingData, setPeakingData] = createSignal<PeakingResult | null>(null);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  let abortController: AbortController | null = null;

  /**
   * キャッシュに追加（サイズ制限付き）
   */
  const addToCache = (key: string, data: PeakingResult) => {
    if (peakingCache.size >= MAX_CACHE_SIZE) {
      const firstKey = peakingCache.keys().next().value;
      if (firstKey) {
        peakingCache.delete(firstKey);
      }
    }
    peakingCache.set(key, data);
  };

  /**
   * ピーキングデータの取得（キャッシュ対応 + AbortController）
   */
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
      console.log(`[PeakingLayer] Cache hit: ${cacheKey}`);
      return;
    }

    // 前回のリクエストをキャンセル
    if (abortController) {
      abortController.abort();
      console.log('[PeakingLayer] 前回のリクエストをキャンセル');
    }

    // 新しいAbortControllerを作成
    abortController = new AbortController();
    const signal = abortController.signal;

    // Rust処理呼び出し
    setIsLoading(true);
    setError(null);

    invokeFocusPeaking(path, intensity, cacheKey, signal)
      .then((result) => {
        // キャンセルされていなければ結果を設定
        if (!signal.aborted) {
          addToCache(cacheKey, result);
          setPeakingData(result);
          console.log(
            `[PeakingLayer] Loaded ${countTotalEdgePoints(result)} edge points for ${cacheKey}`
          );
        }
      })
      .catch((err) => {
        if (signal.aborted) {
          console.log('[PeakingLayer] リクエストがキャンセルされました');
        } else {
          console.error('[PeakingLayer] Failed to load peaking data:', err);
          setError(String(err));
        }
      })
      .finally(() => {
        setIsLoading(false);
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
      {/* ローディング表示 */}
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
            'z-index': '1000',
          }}
        >
          Peaking processing...
        </div>
      </Show>

      {/* エラー表示 */}
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
            'z-index': '1000',
          }}
        >
          Error: {error()}
        </div>
      </Show>

      {/* SVG描画 roundで丸め込み */}
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
            {data().edges.map((edge) => (
              <polyline
                points={edgeToPolylinePoints(edge)}
                stroke={props.color}
                stroke-width="1.5"
                stroke-linejoin="round"
                stroke-linecap="round"
                fill="none"
                opacity={props.opacity}
                style={{
                  'vector-effect': 'non-scaling-stroke', // 線幅をズームで変えない
                }}
              />
            ))}
          </svg>
        )}
      </Show>
    </div>
  );
};

export default PeakingLayer;
