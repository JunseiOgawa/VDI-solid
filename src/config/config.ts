// VDI Application Configuration

export interface AppConfig {
  zoom: {
    /** 最小ズーム倍率 */
    minScale: number;
    /** 最大ズーム倍率 */
    maxScale: number;
    /** ズームイン/アウトの刻み幅 */
    step: number;
    /** マウスホイールの感度 */
    wheelSensitivity: number;
    /** マウスホイールの最小感度 */
    minWheelSensitivity: number;
    /** マウスホイールの最大感度 */
    maxWheelSensitivity: number;
  };
  ui: {
    /** ヘッダーとフッターの合計高さ (px) */
    headerFooterHeight: number;
    /** 画像ナビゲーションのホバー範囲幅（パーセント） */
    navigationHoverWidthPercent: number;
  };
  rotation: {
    /** 回転の角度 (度) */
    step: number;
  };
  grid: {
    /** グリッドのデフォルト不透明度 */
    defaultOpacity: number;
    /** グリッドの最小不透明度 */
    minOpacity: number;
    /** グリッドの最大不透明度 */
    maxOpacity: number;
  };
  histogram: {
    /** ヒストグラムの有効/無効 */
    enabled: boolean;
    /** ヒストグラムの表示タイプ (RGBまたは輝度) */
    displayType: 'rgb' | 'luminance';
    /** ヒストグラムの表示位置 */
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    /** ヒストグラムの表示サイズ倍率 */
    size: number;
    /** ヒストグラムの不透明度 */
    opacity: number;
    /** ヒストグラムの最小サイズ倍率 */
    minSize: number;
    /** ヒストグラムの最大サイズ倍率 */
    maxSize: number;
    /** ヒストグラムの最小不透明度 */
    minOpacity: number;
    /** ヒストグラムの最大不透明度 */
    maxOpacity: number;
    /** ヒストグラムデータのキャッシュサイズ */
    cacheSize: number;
  };
}

export const CONFIG: AppConfig = {
  zoom: {
    minScale: 0.1, // 最小ズーム倍率
    maxScale: 10, // 最大ズーム倍率
    step: 0.1, // ズームイン/アウトの刻み幅
    wheelSensitivity: 1.0, // マウスホイールの感度
    minWheelSensitivity: 0.05, // マウスホイールの最小感度
    maxWheelSensitivity: 2.0, // マウスホイールの最大感度
  },
  ui: {
    headerFooterHeight: 120, // ヘッダーとフッターの合計高さ (px)
    navigationHoverWidthPercent: 5, // 画像ナビゲーションのホバー範囲幅（パーセント）
  },
  rotation: {
    step: 90, // 回転の角度 (度)
  },
  grid: {
    defaultOpacity: 0.5, // グリッドのデフォルト不透明度
    minOpacity: 0.1, // グリッドの最小不透明度
    maxOpacity: 1.0, // グリッドの最大不透明度
  },
  histogram: {
    enabled: false, // ヒストグラムの有効/無効
    displayType: 'rgb', // ヒストグラムの表示タイプ (RGBまたは輝度)
    position: 'top-right', // ヒストグラムの表示位置
    size: 1.0, // ヒストグラムの表示サイズ倍率
    opacity: 0.8, // ヒストグラムの不透明度
    minSize: 0.5, // ヒストグラムの最小サイズ倍率
    maxSize: 2.0, // ヒストグラムの最大サイズ倍率
    minOpacity: 0.0, // ヒストグラムの最小不透明度
    maxOpacity: 1.0, // ヒストグラムの最大不透明度
    cacheSize: 5, // ヒストグラムデータのキャッシュサイズ
  },
};
