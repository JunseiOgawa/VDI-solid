import { CONFIG } from '../../config/config';
import { computeFitScale } from '../../lib/screenfit';
import { callCalculateAndSetScreenFit } from '../../lib/imageViewerApi';

/**
 * @param imgElement - フィットさせる画像要素
 * @returns 計算されたフィットスケール、または計算に失敗した場合はnull
 */
export const calculateScreenFitScale = (imgElement: HTMLImageElement): number | null => {
    // 画像の自然サイズを取得
    const imageWidth = imgElement.naturalWidth;
    const imageHeight = imgElement.naturalHeight;
    if (!imageWidth || !imageHeight) return null;

    // ウィンドウサイズを取得
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight - CONFIG.ui.headerFooterHeight;

    // Lib の純粋関数に委譲
    return computeFitScale(
        { width: imageWidth, height: imageHeight },
        { width: windowWidth, height: windowHeight }
    );
};

// グローバルにアクセス可能
export const handleScreenFit = (): void => {
    // ImageViewer 側の登録済みハンドラを呼ぶ（存在しない場合は無視）
    try {
        callCalculateAndSetScreenFit();
    } catch (e) {
        // ignore
    }
};