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
    <div class="min-w-[160px] rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-1 text-sm text-[var(--text-secondary)] shadow-[0_4px_12px_var(--shadow)] transition-colors duration-150">
      <div class="py-1">
        {/* テーマ設定 */}
        <button
          class="flex w-full items-center justify-between px-3 py-2 text-left transition-colors duration-150 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
          onClick={toggleThemeSubmenu}
        >
          <span>テーマ設定</span>
          <span class="text-xs text-[var(--text-muted)]">{showThemeSubmenu() ? '▾' : '▸'}</span>
        </button>

        {/* サブメニュー: テーマ選択 */}
        {showThemeSubmenu() && (
          <div class="ml-3 mt-1">
            <For each={AVAILABLE_THEMES}>
              {(themeDef) => (
                <button
                  type="button"
                  class="aria-[checked=true]:bg-[var(--bg-tertiary)] aria-[checked=true]:text-[var(--text-primary)] w-full px-3 py-2 text-left transition-colors duration-150 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                  role="menuitemradio"
                  aria-checked={props.theme === themeDef.key}
                  onClick={() => props.onThemeChange(themeDef.key)}
                >
                  <div class="flex flex-col gap-0.5">
                    <span class="font-medium">
                      {themeDef.label} {props.theme === themeDef.key ? '✓' : ''}
                    </span>
                    <span class="text-xs text-[var(--text-muted)]">
                      {themeDef.description}
                    </span>
                  </div>
                </button>
              )}
            </For>
          </div>
        )}

        <hr class="my-1 border-t border-[var(--border-primary)]" />

        {/* エクスプローラで開く */}
        <button
          class="w-full px-3 py-2 text-left transition-colors duration-150 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
          onClick={handleRevealInExplorer}
        >
          エクスプローラで開く
        </button>
      </div>
    </div>
  );
};

export default SettingsMenu;
