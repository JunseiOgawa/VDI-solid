import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useAppState } from '../../App';
import SettingsMenu from '../SettingsMenu';

const Titlebar: Component = () => {
  const [showSettings, setShowSettings] = createSignal(false);
  const { zoomScale, setZoomScale, rotationAngle, setRotationAngle, theme, setTheme, currentImagePath } = useAppState();

  const handleMinimize = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.minimize();
  };

  const handleMaximize = async () => {
    const appWindow = getCurrentWindow();
    const isMaximized = await appWindow.isMaximized();
    if (isMaximized) {
      await appWindow.unmaximize();
    } else {
      await appWindow.maximize();
    }
  };

  const handleClose = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.close();
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings());
  };

  return (
    <div class="custom-titlebar flex items-center justify-between bg-gray-100 px-2 py-3 border-b border-gray-300 relative" data-tauri-drag-region>
      {/* 左側: ズームボタン群 */}
      <div class="flex items-center">
        <button id="zoomOutBtn" class="btn btn-outline px-2 py-0.9 rounded-lg border border-gray-300 hover:bg-gray-200" onClick={() => setZoomScale(zoomScale() / 1.2)} aria-label="縮小 (−)">−</button>

        <button id="zoomResetBtn" class="btn btn-outline px-2 py-0.9 rounded-lg border border-gray-300 hover:bg-gray-200 flex items-center gap-1" onClick={() => setZoomScale(1)} aria-label="リセット">
          <img class="icon" src="/reload_hoso.svg" alt="リセットアイコン" />
          <span>{Math.round(zoomScale() * 100)}%</span>
        </button>

        <button id="zoomInBtn" class="btn btn-primary px-2 py-0.9 rounded-lg bg-blue-600 text-white hover:bg-blue-700" onClick={() => setZoomScale(zoomScale() * 1.2)} aria-label="拡大 (+)">＋</button>

        <button id="screenFitBtn" class="btn btn-outline px-2 py-0.9 rounded-lg border border-gray-300 hover:bg-gray-200" aria-label="画面フィット">
          <img class="icon" src="/focus_ca_h.svg" alt="画面フィット" />
        </button>

        <button id="rotateBtn" class="btn btn-outline px-2 py-0.9 pl-2 rounded-lg border border-gray-300 hover:bg-gray-200" onClick={() => setRotationAngle((rotationAngle() + 90) % 360)} aria-label="回転">
          <img class="icon" src="/reload_hoso.svg" alt="回転アイコン" />
        </button>
      </div>

      {/* 右側: 設定ボタンとウィンドウコントロールボタン */}
      <div class="flex items-center relative">
        <button id="settingBtn" class="window-btn hover:bg-gray-200 p-1 rounded-lg mr-5" onClick={toggleSettings} aria-label="設定" title="設定">
          <img class="icon" src="/setting_ge_h.svg" alt="設定アイコン" />
        </button>

        {/* 設定ドロップダウンメニュー - 左側に展開 */}
        {showSettings() && (
          <div class="absolute top-full left-0 mt-1 z-50 transform -translate-x-full">
            <SettingsMenu
              theme={theme()}
              onThemeChange={(newTheme) => {
                setTheme(newTheme);
                setShowSettings(false);
              }}
              currentImagePath={currentImagePath()}
            />
          </div>
        )}

        <button id="minimizeBtn" class="window-btn hover:bg-gray-200 p-1 rounded-lg" onClick={handleMinimize} aria-label="最小化">
          <svg width="20" height="20" viewBox="0 1 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 7h8v1H2V7z" fill="currentColor"/>
          </svg>
        </button>
        <button id="maximizeBtn" class="window-btn hover:bg-gray-200 p-1 rounded-lg" onClick={handleMaximize} aria-label="最大化">
          <svg width="20" height="20" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 2v8h8V2H2zm1 1h6v6H3V3z" fill="currentColor"/>
          </svg>
        </button>
        <button id="closeBtn" class="window-btn hover:bg-red-500 hover:text-white p-1 rounded-lg" onClick={handleClose} aria-label="閉じる">
          <svg width="12" height="20" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Titlebar;
