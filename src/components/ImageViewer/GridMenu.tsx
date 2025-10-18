import type { Component } from "solid-js";
import { For } from "solid-js";
import type { GridPattern } from "../../context/AppStateContext";

interface GridMenuProps {
  /** 現在選択されているグリッドパターン */
  currentPattern: GridPattern;
  /** グリッドパターン変更時のコールバック */
  onPatternChange: (pattern: GridPattern) => void;
  /** 現在のグリッド線不透明度 */
  currentOpacity: number;
  /** グリッド線不透明度変更時のコールバック */
  onOpacityChange: (opacity: number) => void;
}

/** グリッドパターンの選択肢リスト */
const GRID_OPTIONS: Array<{
  value: GridPattern;
  label: string;
  description: string;
}> = [
  { value: "off", label: "グリッドなし", description: "グリッド線を非表示" },
  {
    value: "3x3",
    label: "3×3グリッド",
    description: "三分割法（写真構図の基本）",
  },
  { value: "5x3", label: "5×3グリッド", description: "黄金比グリッド" },
  { value: "4x4", label: "4×4グリッド", description: "四分割グリッド" },
];

/**
 * GridMenu コンポーネント
 *
 * グリッド表示パターンを選択するためのドロップダウンメニュー。
 * Titlebar の gridBtn から呼び出され、SettingsMenu と同様の UI スタイルで表示されます。
 *
 * 各グリッドパターンの説明：
 * - off: グリッド線を表示しない
 * - 3x3: 三分割法（写真の基本構図）
 * - 5x3: 黄金比に基づくグリッド
 * - 4x4: 均等な四分割
 */
const GridMenu: Component<GridMenuProps> = (props) => {
  const handleSelect = (pattern: GridPattern) => {
    props.onPatternChange(pattern);
  };

  const handleOpacityChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    props.onOpacityChange(parseFloat(target.value));
  };

  return (
    <div class="min-w-[220px] rounded-lg bg-[var(--glass-bg-primary)] backdrop-blur-xl border border-[var(--glass-border-subtle)]">
      <div class="border-b border-[var(--glass-border-emphasis)] px-4 py-2">
        <h3 class="text-label font-semibold text-[var(--glass-text-primary)]">
          グリッド表示
        </h3>
      </div>
      <div class="py-1">
        <For each={GRID_OPTIONS}>
          {(option) => (
            <button
              class="flex w-full flex-col items-start px-4 py-2 text-left transition-all duration-200 hover:bg-white/[0.08] hover:backdrop-blur-sm rounded"
              classList={{
                "bg-blue-500/20 border border-blue-500/50 font-semibold text-[var(--glass-text-primary)]":
                  props.currentPattern === option.value,
                "text-[var(--glass-text-primary)]":
                  props.currentPattern !== option.value,
              }}
              onClick={() => handleSelect(option.value)}
              aria-label={option.label}
            >
              <span class="font-medium text-label">{option.label}</span>
              <span class="text-caption text-[var(--glass-text-muted)]">
                {option.description}
              </span>
            </button>
          )}
        </For>
      </div>
      <div class="border-t border-[var(--glass-border-emphasis)] px-4 py-3">
        <label class="flex flex-col gap-2">
          <span class="text-label font-medium text-[var(--glass-text-primary)] text-tabular">
            不透明度: {Math.round(props.currentOpacity * 100)}%
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={props.currentOpacity}
            onInput={handleOpacityChange}
            class="w-full cursor-pointer accent-white/80"
          />
        </label>
      </div>
    </div>
  );
};

export default GridMenu;
