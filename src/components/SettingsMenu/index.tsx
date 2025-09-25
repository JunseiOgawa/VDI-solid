import type { Component } from 'solid-js';
import { createSignal, For } from 'solid-js';
import { revealItemInDir } from '@tauri-apps/plugin-opener';
import { AVAILABLE_THEMES, type ThemeKey } from '../../lib/theme';

interface SettingsMenuProps {
  theme: ThemeKey;
  onThemeChange: (theme: ThemeKey) => void;
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
        <button class="settings-item w-full text-left px-3 py-2 flex items-center justify-between" onClick={toggleThemeSubmenu}>
          <span>テーマ設定</span>
          <span class="chevron">{showThemeSubmenu() ? '▾' : '▸'}</span>
        </button>

        {/* サブメニュー: テーマ選択 */}
        {showThemeSubmenu() && (
          <div class="ml-3 mt-1">
            <For each={AVAILABLE_THEMES}>
              {(themeDef) => (
                <button
                  type="button"
                  class="settings-item w-full text-left px-3 py-2"
                  role="menuitemradio"
                  aria-checked={props.theme === themeDef.key}
                  onClick={() => props.onThemeChange(themeDef.key)}
                >
                  <div class="flex flex-col gap-0.5">
                    <span class="font-medium">
                      {themeDef.label} {props.theme === themeDef.key ? '✓' : ''}
                    </span>
                    <span class="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {themeDef.description}
                    </span>
                  </div>
                </button>
              )}
            </For>
          </div>
        )}

  <hr class="my-1" style={{ 'border-color': 'var(--border-primary)' }} />

        {/* エクスプローラで開く */}
        <button class="settings-item w-full text-left px-3 py-2" onClick={handleRevealInExplorer}>
          エクスプローラで開く
        </button>
      </div>
    </div>
  );
};

export default SettingsMenu;
