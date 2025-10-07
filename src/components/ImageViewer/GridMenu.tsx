import type { Component } from 'solid-js';
import { For } from 'solid-js';
import type { GridPattern } from '../../context/AppStateContext';
import { CONFIG } from '../../config/config';

interface GridMenuProps {
  /** 現在選択されているグリッドパターン */
  currentPattern: GridPattern;
  /** グリッドパターン変更時のコールバック */
  onPatternChange: (pattern: GridPattern) => void;
  /** グリッド永続化が有効かどうか */
  persistEnabled: boolean;
  /** グリッド永続化の有効/無効を切り替えるコールバック */
  onPersistChange: (enabled: boolean) => void;
}

/** グリッドパターンの選択肢リスト */
const GRID_OPTIONS: Array<{ value: GridPattern; label: string; description: string }> = [
  { value: 'off', label: 'グリッドなし', description: 'グリッド線を非表示' },
  { value: '3x3', label: '3×3グリッド', description: '三分割法（写真構図の基本）' },
  { value: '5x3', label: '5×3グリッド', description: '黄金比グリッド' },
  { value: '4x4', label: '4×4グリッド', description: '四分割グリッド' },
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

  return (
    <div class="min-w-[220px] rounded-lg border border-[var(--border-secondary)] bg-[var(--bg-secondary)] shadow-lg">
      <div class="border-b border-[var(--border-secondary)] px-4 py-2">
        <h3 class="text-sm font-semibold text-[var(--text-primary)]">グリッド表示</h3>
      </div>
      <div class="py-1">
        <For each={GRID_OPTIONS}>
          {(option) => (
            <button
              class="flex w-full flex-col items-start px-4 py-2 text-left text-sm transition-colors duration-150 hover:bg-[var(--bg-tertiary)]"
              classList={{
                'bg-[var(--bg-tertiary)] font-semibold text-[var(--accent-primary)]':
                  props.currentPattern === option.value,
                'text-[var(--text-primary)]': props.currentPattern !== option.value,
              }}
              onClick={() => handleSelect(option.value)}
              aria-label={option.label}
            >
              <span class="font-medium">{option.label}</span>
              <span class="text-xs text-[var(--text-secondary)]">{option.description}</span>
            </button>
          )}
        </For>
      </div>
    </div>
  );
};

export default GridMenu;
