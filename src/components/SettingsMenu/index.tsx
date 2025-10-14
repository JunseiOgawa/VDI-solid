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
  // VirtualDesktop & コントローラー関連
  virtualdesktopMode: boolean;
  onVirtualDesktopModeChange: (enabled: boolean) => void;
  controllerDetected: boolean;
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

  const handleVirtualDesktopModeChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    props.onVirtualDesktopModeChange(target.checked);
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
          <span class="text-xs text-[var(--text-muted)]">
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
                  class="aria-[checked=true]:bg-[var(--bg-tertiary)] aria-[checked=true]:text-[var(--text-primary)] w-full px-3 py-2 text-left transition-colors duration-150 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                  role="menuitemradio"
                  aria-checked={props.theme === themeDef.key}
                  onClick={() => props.onThemeChange(themeDef.key)}
                >
                  <div class="flex flex-col gap-0.5">
                    <span class="font-medium">
                      {themeDef.label} {props.theme === themeDef.key ? "✓" : ""}
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

        {/* ホイール感度設定 */}
        <div class="px-3 py-2">
          <label class="flex flex-col gap-2">
            <span class="text-xs font-medium text-[var(--text-primary)]">
              ホイール感度: {props.wheelSensitivity.toFixed(1)}x
            </span>
            <input
              type="range"
              min={CONFIG.zoom.minWheelSensitivity}
              max={CONFIG.zoom.maxWheelSensitivity}
              step="0.01"
              value={props.wheelSensitivity}
              onInput={handleWheelSensitivityChange}
              class="w-full cursor-pointer accent-[var(--accent-primary)]"
            />
            <span class="text-xs text-[var(--text-muted)]">
              VRコントローラー使用時は低めに設定推奨
            </span>
          </label>
        </div>

        <hr class="my-1 border-t border-[var(--border-primary)]" />

        {/* ファイルパス表示形式設定 */}
        <div class="px-3 py-2">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={props.showFullPath}
              onChange={handleShowFullPathChange}
              class="cursor-pointer accent-[var(--accent-primary)]"
            />
            <span class="text-xs font-medium text-[var(--text-primary)]">
              フルパスで表示
            </span>
          </label>
          <span class="mt-1 text-xs text-[var(--text-muted)] block">
            オフの場合はファイル名のみ表示
          </span>
        </div>

        <hr class="my-1 border-t border-[var(--border-primary)]" />

        {/* VirtualDesktopモード設定 */}
        <div class="px-3 py-2">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={props.virtualdesktopMode}
              onChange={handleVirtualDesktopModeChange}
              class="cursor-pointer accent-[var(--accent-primary)]"
            />
            <span class="text-xs font-medium text-[var(--text-primary)]">
              VirtualDesktopモード
            </span>
          </label>
          <span class="mt-1 text-xs text-[var(--text-muted)] block">
            VR環境でのコントローラー操作を有効化
          </span>
          
          {/* コントローラー検出状態表示 */}
          <div class="mt-2 flex items-center gap-2">
            <div class={`h-2 w-2 rounded-full ${props.controllerDetected ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span class="text-xs text-[var(--text-muted)]">
              コントローラー: {props.controllerDetected ? '検出済み' : '未検出'}
            </span>
          </div>
          
          {/* セットアップガイド（実装予定） */}
          {props.virtualdesktopMode && !props.controllerDetected && (
            <button
              class="mt-2 w-full rounded px-2 py-1 text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-quaternary)] transition-colors cursor-not-allowed opacity-50"
              disabled
            >
              セットアップガイド（実装予定）
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default SettingsMenu;
