import type { Component } from "solid-js";
import { createSignal, For } from "solid-js";
import { AVAILABLE_THEMES, type ThemeKey } from "../../lib/theme";
import { CONFIG } from "../../config/config";

interface SettingsMenuProps {
  theme: ThemeKey;
  onThemeChange: (theme: ThemeKey) => void;
  wheelSensitivity: number;
  onWheelSensitivityChange: (sensitivity: number) => void;
  showFullPath: boolean;
  onShowFullPathChange: (show: boolean) => void;
  controlPanelPosition: 'top' | 'bottom';
  onControlPanelPositionChange: (position: 'top' | 'bottom') => void;
}

const SettingsMenu: Component<SettingsMenuProps> = (props) => {
  const [showThemeSubmenu, setShowThemeSubmenu] = createSignal(false);

  const toggleThemeSubmenu = () => {
    setShowThemeSubmenu(!showThemeSubmenu());
  };

  const handleWheelSensitivityChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    props.onWheelSensitivityChange(parseFloat(target.value));
  };

  const handleShowFullPathChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    props.onShowFullPathChange(target.checked);
  };

  const handleControlPanelPositionChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    props.onControlPanelPositionChange(target.value as 'top' | 'bottom');
  };

  return (
    <div class="min-w-[160px] rounded-lg bg-[var(--glass-bg-primary)] backdrop-blur-xl border border-[var(--glass-border-subtle)] p-1 text-sm text-[var(--glass-text-secondary)] transition-colors duration-150">
      <div class="py-1">
        {/* テーマ設定 */}
        <button
          class="flex w-full items-center justify-between px-3 py-2 text-left transition-all duration-200 hover:bg-white/[0.08] hover:backdrop-blur-sm hover:text-[var(--glass-text-primary)] rounded"
          onClick={toggleThemeSubmenu}
        >
          <span>テーマ設定</span>
          <span class="text-xs text-white/60">
            {showThemeSubmenu() ? "▾" : "▸"}
          </span>
        </button>

        {/* サブメニュー: テーマ選択 */}
        {showThemeSubmenu() && (
          <div class="ml-3 mt-1">
            <For each={AVAILABLE_THEMES}>
              {(themeDef) => (
                <button
                  type="button"
                  class="aria-[checked=true]:bg-blue-500/20 aria-[checked=true]:border aria-[checked=true]:border-blue-500/50 aria-[checked=true]:text-[var(--glass-text-primary)] w-full px-3 py-2 text-left transition-all duration-200 hover:bg-white/[0.08] hover:backdrop-blur-sm hover:text-[var(--glass-text-primary)] rounded"
                  role="menuitemradio"
                  aria-checked={props.theme === themeDef.key}
                  onClick={() => props.onThemeChange(themeDef.key)}
                >
                  <div class="flex flex-col gap-0.5">
                    <span class="font-medium text-label">
                      {themeDef.label} {props.theme === themeDef.key ? "✓" : ""}
                    </span>
                    <span class="text-caption text-[var(--glass-text-muted)]">
                      {themeDef.description}
                    </span>
                  </div>
                </button>
              )}
            </For>
          </div>
        )}

        <hr class="my-1 border-t border-[var(--glass-border-subtle)]" />

        {/* ホイール感度設定 */}
        <div class="px-3 py-2">
          <label class="flex flex-col gap-2">
            <span class="text-label font-medium text-[var(--glass-text-primary)] text-tabular">
              ホイール感度: {props.wheelSensitivity.toFixed(1)}x
            </span>
            <input
              type="range"
              min={CONFIG.zoom.minWheelSensitivity}
              max={CONFIG.zoom.maxWheelSensitivity}
              step="0.01"
              value={props.wheelSensitivity}
              onInput={handleWheelSensitivityChange}
              class="w-full cursor-pointer accent-white/80"
            />
            <span class="text-caption text-[var(--glass-text-muted)]">
              VRコントローラー使用時は低めに設定推奨
            </span>
          </label>
        </div>

        <hr class="my-1 border-t border-[var(--glass-border-subtle)]" />

        {/* ファイルパス表示形式設定 */}
        <div class="px-3 py-2">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={props.showFullPath}
              onChange={handleShowFullPathChange}
              class="cursor-pointer accent-white/80"
            />
            <span class="text-label font-medium text-[var(--glass-text-primary)]">
              フルパスで表示
            </span>
          </label>
          <span class="mt-1 text-caption text-[var(--glass-text-muted)] block">
            オフの場合はファイル名のみ表示
          </span>
        </div>

        <hr class="my-1 border-t border-[var(--glass-border-subtle)]" />

        {/* コントロールパネル位置設定 */}
        <div class="px-3 py-2">
          <label class="flex flex-col gap-2">
            <span class="text-label font-medium text-[var(--glass-text-primary)]">
              コントロールパネル位置
            </span>
            <select
              value={props.controlPanelPosition}
              onChange={handleControlPanelPositionChange}
              class="w-full rounded border border-[var(--glass-border-emphasis)] bg-white/[0.1] px-2 py-1 text-label text-[var(--glass-text-primary)] cursor-pointer transition-colors hover:bg-white/[0.15]"
            >
              <option value="top">上（中央）</option>
              <option value="bottom">下（中央）</option>
            </select>
          </label>
        </div>

      </div>
    </div>
  );
};

export default SettingsMenu;
