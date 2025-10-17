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
    <>
    <div class="min-w-[160px] rounded-lg glass-menu p-1 text-sm text-white/80 transition-colors duration-150">
      <div class="py-1">
        {/* テーマ設定 */}
        <button
          class="flex w-full items-center justify-between px-3 py-2 text-left transition-colors duration-150 hover:bg-white/10 hover:text-white rounded"
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
                  class="aria-[checked=true]:bg-white/15 aria-[checked=true]:text-white w-full px-3 py-2 text-left transition-colors duration-150 hover:bg-white/10 hover:text-white rounded"
                  role="menuitemradio"
                  aria-checked={props.theme === themeDef.key}
                  onClick={() => props.onThemeChange(themeDef.key)}
                >
                  <div class="flex flex-col gap-0.5">
                    <span class="font-medium">
                      {themeDef.label} {props.theme === themeDef.key ? "✓" : ""}
                    </span>
                    <span class="text-xs text-white/60">
                      {themeDef.description}
                    </span>
                  </div>
                </button>
              )}
            </For>
          </div>
        )}

        <hr class="my-1 border-t border-white/10" />

        {/* ホイール感度設定 */}
        <div class="px-3 py-2">
          <label class="flex flex-col gap-2">
            <span class="text-xs font-medium text-white">
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
            <span class="text-xs text-white/60">
              VRコントローラー使用時は低めに設定推奨
            </span>
          </label>
        </div>

        <hr class="my-1 border-t border-white/10" />

        {/* ファイルパス表示形式設定 */}
        <div class="px-3 py-2">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={props.showFullPath}
              onChange={handleShowFullPathChange}
              class="cursor-pointer accent-white/80"
            />
            <span class="text-xs font-medium text-white">
              フルパスで表示
            </span>
          </label>
          <span class="mt-1 text-xs text-white/60 block">
            オフの場合はファイル名のみ表示
          </span>
        </div>

        <hr class="my-1 border-t border-white/10" />

        {/* コントロールパネル位置設定 */}
        <div class="px-3 py-2">
          <label class="flex flex-col gap-2">
            <span class="text-xs font-medium text-white">
              コントロールパネル位置
            </span>
            <select
              value={props.controlPanelPosition}
              onChange={handleControlPanelPositionChange}
              class="w-full rounded border border-white/20 bg-white/10 px-2 py-1 text-xs text-white cursor-pointer transition-colors hover:bg-white/15"
            >
              <option value="top">上（中央）</option>
              <option value="bottom">下（中央）</option>
            </select>
          </label>
        </div>

      </div>
    </div>

    <style>
      {`
        .glass-menu {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow:
            0 8px 32px 0 rgba(0, 0, 0, 0.37),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
            0 0 0 1px rgba(0, 0, 0, 0.1);
        }
      `}
    </style>
    </>
  );
};

export default SettingsMenu;
