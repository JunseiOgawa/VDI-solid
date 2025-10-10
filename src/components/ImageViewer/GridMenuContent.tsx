import type { Component } from "solid-js";
import { For } from "solid-js";
import type { GridPattern } from "../../context/AppStateContext";

interface GridMenuContentProps {
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
 * GridMenuContent コンポーネント
 *
 * グリッド表示パターンを選択するためのコンテンツ部分。
 * MultiMenuコンポーネント内で使用されます。
 */
const GridMenuContent: Component<GridMenuContentProps> = (props) => {
  const handleSelect = (pattern: GridPattern) => {
    props.onPatternChange(pattern);
  };

  const handleOpacityChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    props.onOpacityChange(parseFloat(target.value));
  };

  return (
    <>
      <div class="py-1">
        <For each={GRID_OPTIONS}>
          {(option) => (
            <button
              class="flex w-full flex-col items-start px-4 py-2 text-left text-sm transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
              classList={{
                "bg-[var(--bg-tertiary)] font-semibold text-[var(--accent-primary)]":
                  props.currentPattern === option.value,
                "text-[var(--text-primary)]":
                  props.currentPattern !== option.value,
              }}
              onClick={() => handleSelect(option.value)}
              aria-label={option.label}
            >
              <span class="font-medium">{option.label}</span>
              <span class="text-xs text-[var(--text-secondary)]">
                {option.description}
              </span>
            </button>
          )}
        </For>
      </div>
      <div class="border-t border-[var(--border-secondary)] px-4 py-3">
        <label class="flex flex-col gap-2">
          <span class="text-xs font-medium text-[var(--text-primary)]">
            不透明度: {Math.round(props.currentOpacity * 100)}%
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={props.currentOpacity}
            onInput={handleOpacityChange}
            class="w-full cursor-pointer accent-[var(--accent-primary)]"
          />
        </label>
      </div>
    </>
  );
};

export default GridMenuContent;
