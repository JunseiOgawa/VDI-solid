import { CONFIG } from '../../config/config';

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

    // 画像とウィンドウの縦横比を計算
    const imageAspectRatio = imageWidth / imageHeight;
    const windowAspectRatio = windowWidth / windowHeight;

    // フィットするスケールを計算
    if (imageAspectRatio > windowAspectRatio) {
        // 画像の方が横長 - 横幅に合わせる
        return windowWidth / imageWidth;
    } else {
        // 画像の方が縦長 - 縦幅に合わせる
        return windowHeight / imageHeight;
    }
};

/**
 * 適切なズームスケールを計算して設定することで、画面フィット機能を処理します
 * @param setZoomScale - ズームスケールを設定する関数
 */
export const handleScreenFit = (setZoomScale: (scale: number) => void) => {
    // 現在表示されている画像要素を取得
    const imgElement = document.querySelector('img') as HTMLImageElement;
    if (!imgElement) return;

    const fitScale = calculateScreenFitScale(imgElement);
    if (fitScale !== null) {
        setZoomScale(fitScale);
    }
};