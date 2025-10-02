import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useAppState } from '../../context/AppStateContext';
import SettingsMenu from '../SettingsMenu';
import { handleScreenFit } from './screenfit';

const Titlebar: Component = () => {
  const [showSettings, setShowSettings] = createSignal(false);
  const { zoomScale, setZoomScale, theme, setTheme, currentImagePath, enqueueRotation } = useAppState();

  const baseZoomButtonClasses =
    'no-drag inline-flex h-7 items-center justify-center border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] px-2 text-sm text-[var(--text-primary)] shadow-[inset_0_1px_2px_var(--shadow)] transition-colors duration-150 hover:bg-[var(--bg-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]';
  const windowButtonClasses =
    'no-drag flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]';

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
    <div class="drag-region relative flex h-8 items-center justify-between border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] px-2 text-sm text-[var(--text-primary)] transition-colors duration-300" data-tauri-drag-region>
      {/* 左側: ズームボタン群 */}
      <div class="no-drag flex items-center gap-1">

        {/*ズームアウトボタン*/}
        
        <button
          id="zoomOutBtn"
          class={`${baseZoomButtonClasses} rounded-l-lg`}
          onClick={() => {
            setZoomScale(zoomScale() / 1.2);
          }}
          aria-label="縮小 (−)"
        >
          −
        </button>

        {/*ズームリセットボタン*/}

        <button
          id="zoomResetBtn"
          class={`${baseZoomButtonClasses} -ml-px rounded-none bg-[var(--bg-secondary)] px-3`}
          onClick={() => {
            // ズーム倍率と位置を既定状態に戻す
            setZoomScale(1);
            // ImageViewer 側で用意した位置リセット API があれば呼ぶ
            try {
              if ((window as any).resetImagePosition) (window as any).resetImagePosition();
            } catch (e) {
              // ignore
            }
          }}
          aria-label="リセット"
        >
          <img class="h-4 w-4" src="/focus_ca_h.svg" alt="リセット（フォーカス）" />
          <span class="ml-2 font-medium">{Math.round(zoomScale() * 100)}%</span>
        </button>

        {/*ズームインボタン*/}

        <button
          id="zoomInBtn"
          class={`${baseZoomButtonClasses} -ml-px rounded-r-lg bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)]`}
          onClick={() => {
            setZoomScale(zoomScale() * 1.2);
          }}
          aria-label="拡大 (+)"
        >
          ＋
        </button>

        {/*画面フィットボタン*/}

        <button
          id="screenFitBtn"
          class={`${baseZoomButtonClasses} ml-2 rounded-lg`}
          onClick={() => {
            try {
              handleScreenFit();
            } catch (e) {
              // ignore
            }
          }}
          aria-label="画面にフィット"
          title="画面にフィット"
        >
          <img class="h-4 w-4" src="/public/全画面表示ボタン5.svg" alt="画面フィット" />
        </button>

        {/*回転ボタン*/}
        
        <button
          id="rotateBtn"
          class="no-drag ml-2 inline-flex h-7 items-center justify-center rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] px-2 text-sm text-[var(--text-primary)] transition-colors duration-150 hover:bg-[var(--bg-secondary)]"
          aria-label="回転"
          onClick={() => enqueueRotation(90)}
        >
          <img class="h-4 w-4" src="/reload_hoso.svg" alt="回転アイコン" />
        </button>
      </div>

      {/* 右側: 設定ボタンとウィンドウコントロールボタン */}
      <div class="relative flex items-center gap-1">
        <button
          id="settingBtn"
          class="no-drag mr-4 flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors duration-150 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
          onClick={toggleSettings}
          aria-label="設定"
          title="設定"
        >
          <img class="h-4 w-4" src="/setting_ge_h.svg" alt="設定アイコン" />
        </button>

        {/* 設定ドロップダウンメニュー - 左側に展開 */}
        {showSettings() && (
          <div class="no-drag absolute left-0 top-full z-50 mt-1 -translate-x-full transform">
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

        <button id="minimizeBtn" class={windowButtonClasses} onClick={handleMinimize} aria-label="最小化">
          <svg width="20" height="20" viewBox="0 1 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 7h8v1H2V7z" fill="currentColor"/>
          </svg>
        </button>
        <button id="maximizeBtn" class={windowButtonClasses} onClick={handleMaximize} aria-label="最大化">
          <svg width="20" height="20" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 2v8h8V2H2zm1 1h6v6H3V3z" fill="currentColor"/>
          </svg>
        </button>
        <button id="closeBtn" class={`${windowButtonClasses} hover:bg-red-500 hover:text-white`} onClick={handleClose} aria-label="閉じる">
          <svg width="12" height="20" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Titlebar;
