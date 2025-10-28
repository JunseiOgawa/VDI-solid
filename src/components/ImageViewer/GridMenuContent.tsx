import type { Component } from "solid-js";
import { For } from "solid-js";
import type { GridPattern } from "../../context/AppStateContext";
import { useAppState } from "../../context/AppStateContext";

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

/**
 * GridMenuContent コンポーネント
 *
 * グリッド表示パターンを選択するためのコンテンツ部分。
 * MultiMenuコンポーネント内で使用されます。
 */
const GridMenuContent: Component<GridMenuContentProps> = (props) => {
  const { t } = useAppState();

  /** グリッドパターンの選択肢リスト */
  const GRID_OPTIONS: Array<{
    value: GridPattern;
  }> = [
    { value: "off" },
    { value: "3x3" },
    { value: "5x3" },
    { value: "4x4" },
  ];

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
              class="flex w-full flex-col items-start px-4 py-2 text-left transition-all duration-200 hover:bg-white/[0.08] hover:backdrop-blur-sm rounded"
              classList={{
                "bg-blue-500/20 border border-blue-500/50 font-semibold text-[var(--glass-text-primary)]":
                  props.currentPattern === option.value,
                "text-[var(--glass-text-primary)]":
                  props.currentPattern !== option.value,
              }}
              onClick={() => handleSelect(option.value)}
              aria-label={t(`grid.${option.value}`)}
            >
              <span class="font-medium text-label">
                {t(`grid.${option.value}`)}
              </span>
              <span class="text-caption text-[var(--glass-text-muted)]">
                {t(`grid.${option.value}Description`)}
              </span>
            </button>
          )}
        </For>
      </div>
      <div class="border-t border-[var(--glass-border-emphasis)] px-4 py-3">
        <label class="flex flex-col gap-2">
          <span class="text-label font-medium text-[var(--glass-text-primary)] text-tabular">
            {t("grid.opacity")}: {Math.round(props.currentOpacity * 100)}%
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
    </>
  );
};

export default GridMenuContent;
