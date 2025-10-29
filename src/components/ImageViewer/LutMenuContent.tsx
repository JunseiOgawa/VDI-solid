import type { Component } from "solid-js";
import { createSignal, onCleanup, Show, For } from "solid-js";
import type { LutHistoryEntry } from "../../context/AppStateContext";

interface LutMenuContentProps {
  /** LUT有効フラグ */
  lutEnabled: boolean;
  /** LUT有効状態変更ハンドラー */
  onLutEnabledChange: (enabled: boolean) => void;
  /** LUT不透明度 */
  lutOpacity: number;
  /** LUT不透明度変更ハンドラー */
  onLutOpacityChange: (opacity: number) => void;
  /** 現在のLUTファイル名 */
  lutFileName: string | null;
  /** 現在のLUTファイルパス */
  currentLutPath: string | null;
  /** LUTファイル履歴 */
  lutHistory: LutHistoryEntry[];
  /** LUTファイル選択ハンドラー */
  onLutFileSelect: () => void;
  /** LUT履歴からロード */
  onLutLoadFromHistory: (filePath: string) => void;
  /** LUT履歴から削除 */
  onLutRemoveFromHistory: (filePath: string) => void;
}

/**
 * LutMenuContent コンポーネント
 *
 * LUT設定を行うためのコンテンツ部分。
 * MultiMenuコンポーネント内で使用されます。
 *
 * 設定項目：
 * - ON/OFF切り替え
 * - LUTファイル選択
 * - 不透明度調整 (0-1)
 */
const LutMenuContent: Component<LutMenuContentProps> = (props) => {
  // 一時表示用のSignal（リアルタイム表示用）
  const [tempOpacity, setTempOpacity] = createSignal(props.lutOpacity);

  // デバウンスユーティリティ関数
  function createDebounce<T extends (...args: any[]) => void>(
    fn: T,
    delay: number,
  ): [(...args: Parameters<T>) => void, () => void] {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const debouncedFn = (...args: Parameters<T>) => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        fn(...args);
        timeoutId = undefined;
      }, delay);
    };

    const cleanup = () => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    };

    return [debouncedFn, cleanup];
  }

  // デバウンス処理の作成
  const [debouncedOpacityChange, cleanupOpacity] = createDebounce(
    (value: number) => {
      console.log(`[LutMenuContent Debounce] Opacity changed to ${value}`);
      props.onLutOpacityChange(value);
    },
    300,
  );

  // クリーンアップ
  onCleanup(() => {
    cleanupOpacity();
  });

  // ハンドラー関数
  const handleToggleLut = () => {
    const newValue = !props.lutEnabled;
    console.log(`[LutMenuContent] LUT enabled: ${newValue}`);
    props.onLutEnabledChange(newValue);
  };

  const handleOpacityChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const value = parseFloat(target.value);
    setTempOpacity(value);
    debouncedOpacityChange(value);
  };

  const handleFileSelect = () => {
    console.log("[LutMenuContent] File select button clicked");
    void props.onLutFileSelect();
  };

  const handleHistorySelect = (filePath: string) => {
    console.log(`[LutMenuContent] History LUT selected: ${filePath}`);
    void props.onLutLoadFromHistory(filePath);
  };

  const handleHistoryRemove = (filePath: string, e: Event) => {
    e.stopPropagation();
    console.log(`[LutMenuContent] Removing LUT from history: ${filePath}`);
    props.onLutRemoveFromHistory(filePath);
  };

  // 履歴を名前順でソート
  const sortedHistory = () => {
    return [...props.lutHistory].sort((a, b) =>
      a.fileName.localeCompare(b.fileName),
    );
  };

  return (
    <div class="flex flex-col gap-4 p-4">
      {/* LUT適用トグル */}
      <div class="flex items-center justify-between">
        <label
          for="lut-enabled"
          class="text-label font-medium text-[var(--glass-text-primary)] cursor-pointer"
        >
          LUT適用
        </label>
        <input
          id="lut-enabled"
          type="checkbox"
          checked={props.lutEnabled}
          onChange={handleToggleLut}
          class="h-4 w-4 cursor-pointer accent-blue-500"
        />
      </div>

      {/* LUTファイル選択 */}
      <div class="flex flex-col gap-2">
        <label class="text-label font-medium text-[var(--glass-text-primary)]">
          新規LUTファイル
        </label>
        <button
          type="button"
          onClick={handleFileSelect}
          class="rounded-md bg-[var(--glass-bg-secondary)] px-3 py-2 text-label text-[var(--glass-text-primary)] hover:bg-[var(--glass-bg-tertiary)] transition-colors duration-200 border border-[var(--glass-border)] truncate text-left"
        >
          LUTファイルを選択...
        </button>
      </div>

      {/* LUT履歴リスト */}
      <Show when={props.lutHistory.length > 0}>
        <div class="flex flex-col gap-2">
          <label class="text-label font-medium text-[var(--glass-text-primary)]">
            LUT履歴（名前順）
          </label>
          <div class="flex items-center gap-2">
            <select
              class="flex-1 rounded-md bg-[var(--glass-bg-secondary)] px-3 py-2 text-label text-[var(--glass-text-primary)] border border-[var(--glass-border)] hover:bg-[var(--glass-bg-tertiary)] transition-colors duration-200 cursor-pointer"
              value={props.currentLutPath || ""}
              onChange={(e) => {
                const selectedPath = e.target.value;
                if (selectedPath) {
                  handleHistorySelect(selectedPath);
                }
              }}
            >
              <option value="" disabled>
                LUTを選択...
              </option>
              <For each={sortedHistory()}>
                {(entry) => (
                  <option value={entry.path} title={entry.fileName}>
                    {entry.fileName}
                  </option>
                )}
              </For>
            </select>
            <Show when={props.currentLutPath}>
              <button
                type="button"
                onClick={() =>
                  props.onLutRemoveFromHistory(props.currentLutPath!)
                }
                class="rounded-md bg-[var(--glass-bg-secondary)] px-3 py-2 text-label text-[var(--glass-text-tertiary)] hover:text-red-500 hover:bg-[var(--glass-bg-tertiary)] transition-colors duration-200 border border-[var(--glass-border)]"
                title="現在のLUTを履歴から削除"
              >
                ✕
              </button>
            </Show>
          </div>
        </div>
      </Show>

      {/* LUT不透明度スライダー */}
      <Show when={props.lutEnabled}>
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <label class="text-label font-medium text-[var(--glass-text-primary)]">
              不透明度
            </label>
            <span class="text-label text-[var(--glass-text-secondary)]">
              {Math.round(tempOpacity() * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={tempOpacity()}
            onInput={handleOpacityChange}
            class="w-full accent-blue-500"
          />
        </div>
      </Show>

      {/* 説明テキスト */}
      <div class="text-caption text-[var(--glass-text-tertiary)] bg-[var(--glass-bg-secondary)] rounded-md p-2 border border-[var(--glass-border)]">
        <p class="mb-1">対応形式: .cube</p>
        <p>.cube形式の3D LUTファイルを使用して、画像の色調を変換できます。</p>
      </div>
    </div>
  );
};

export default LutMenuContent;
