import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';
import { revealItemInDir } from '@tauri-apps/plugin-opener';

interface SettingsMenuProps {
  theme: 'light' | 'dark' | 'auto';
  onThemeChange: (theme: 'light' | 'dark' | 'auto') => void;
  currentImagePath?: string;
}

const SettingsMenu: Component<SettingsMenuProps> = (props) => {
  const [showThemeSubmenu, setShowThemeSubmenu] = createSignal(false);

  const handleRevealInExplorer = async () => {
    if (props.currentImagePath) {
      try {
        await revealItemInDir(props.currentImagePath);
      } catch (error) {
        console.error('Failed to open in explorer:', error);
      }
    }
  };

  const toggleThemeSubmenu = () => {
    setShowThemeSubmenu(!showThemeSubmenu());
  };

  return (
    <div class="settings-menu">
      <div class="py-1">
        {/* テーマ設定 */}
        <button class="settings-item w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between" onClick={toggleThemeSubmenu}>
          <span>テーマ設定</span>
          <span class="chevron">{showThemeSubmenu() ? '▾' : '▸'}</span>
        </button>

        {/* サブメニュー: テーマ選択 */}
        {showThemeSubmenu() && (
          <div class="ml-3 mt-1">
            <button class="settings-item w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => props.onThemeChange('light')}>
              ライトモード {props.theme === 'light' ? '✓' : ''}
            </button>
            <button class="settings-item w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => props.onThemeChange('dark')}>
              ダークモード {props.theme === 'dark' ? '✓' : ''}
            </button>
            <button class="settings-item w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => props.onThemeChange('auto')}>
              OSの設定色で開く {props.theme === 'auto' ? '✓' : ''}
            </button>
          </div>
        )}

        <hr class="my-1 border-gray-200 dark:border-gray-700" />

        {/* エクスプローラで開く */}
        <button class="settings-item w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={handleRevealInExplorer}>
          エクスプローラで開く
        </button>
      </div>
    </div>
  );
};

export default SettingsMenu;
