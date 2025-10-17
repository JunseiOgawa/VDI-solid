import type { Component } from 'solid-js';
import { createSignal, createEffect, For, Show, onMount, onCleanup } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';
import { convertFileSrc } from '@tauri-apps/api/core';

/**
 * ImageGalleryコンポーネントのProps
 */
interface ImageGalleryProps {
  /** サイドバーの表示/非表示 */
  isOpen: boolean;
  /** サイドバーを閉じる */
  onClose: () => void;
  /** 現在表示中の画像パス */
  currentImagePath: string | null;
  /** 画像選択時のコールバック */
  onImageSelect: (imagePath: string) => void;
}

/**
 * ファイルパスからファイル名のみを抽出
 */
const getFileName = (path: string): string => {
  return path.split(/[\\/]/).pop() || '';
};

/**
 * ファイルパスから親フォルダパスを抽出
 */
const getParentFolder = (path: string): string | null => {
  const parts = path.split(/[\\/]/);
  parts.pop(); // ファイル名を削除
  return parts.length > 0 ? parts.join('\\') : null;
};

/**
 * フォルダ内の画像一覧をサムネイル付きで縦に表示するサイドバーコンポーネント
 */
const ImageGallery: Component<ImageGalleryProps> = (props) => {
  const [folderImages, setFolderImages] = createSignal<string[]>([]);
  const [isLoading, setIsLoading] = createSignal<boolean>(false);
  const [error, setError] = createSignal<string | null>(null);

  // 画像一覧を取得
  createEffect(() => {
    const currentPath = props.currentImagePath;
    if (!currentPath) {
      setFolderImages([]);
      return;
    }

    const parentFolder = getParentFolder(currentPath);
    if (!parentFolder) {
      setFolderImages([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    invoke<string[]>('get_folder_images', { folderPath: parentFolder })
      .then((images) => {
        if (images && images.length > 0) {
          setFolderImages(images);
          setError(null);
        } else {
          setFolderImages([]);
          setError('画像が見つかりませんでした');
        }
      })
      .catch((err) => {
        console.error('画像一覧の取得に失敗しました:', err);
        setFolderImages([]);
        setError('画像一覧の取得に失敗しました');
      })
      .finally(() => {
        setIsLoading(false);
      });
  });

  // サイドバー外クリックで閉じる処理
  onMount(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // ギャラリー内、またはギャラリーボタンのクリックは無視
      if (
        target.closest('[data-gallery="sidebar"]') ||
        target.closest('#galleryBtn')
      ) {
        return;
      }

      // サイドバー外のクリックは閉じる
      if (props.isOpen) {
        props.onClose();
      }
    };

    document.addEventListener('click', handleClickOutside);

    onCleanup(() => {
      document.removeEventListener('click', handleClickOutside);
    });
  });

  return (
    <div
      data-gallery="sidebar"
      class={`fixed left-0 top-8 bottom-0 w-64 glass-panel transform transition-transform duration-300 z-[60] ${
        props.isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* ヘッダー */}
      <div class="glass-header flex items-center justify-between p-2">
        <div class="flex flex-col min-w-0 flex-1">
          <span class="text-white/90 text-sm font-medium">画像一覧</span>
          <span class="text-white/60 text-xs truncate">
            {getParentFolder(props.currentImagePath || '') || 'フォルダが選択されていません'}
          </span>
        </div>
        <button
          onClick={props.onClose}
          class="glass-button-close text-white/70 hover:text-white transition-colors duration-150 p-1 rounded ml-2 flex-shrink-0"
          aria-label="閉じる"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.5 2.5l7 7M9.5 2.5l-7 7"
              stroke="currentColor"
              stroke-width="1"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      {/* 画像リスト */}
      <div class="overflow-y-auto h-full p-2 space-y-2 pb-4">
        <Show when={isLoading()}>
          <div class="text-white/60 text-sm text-center py-4">読み込み中...</div>
        </Show>

        <Show when={!isLoading() && error()}>
          <div class="text-red-400 text-sm text-center py-4">{error()}</div>
        </Show>

        <Show when={!isLoading() && !error() && folderImages().length === 0}>
          <div class="text-white/60 text-sm text-center py-4">
            画像が見つかりませんでした
          </div>
        </Show>

        <For each={folderImages()}>
          {(imagePath) => (
            <div
              class={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-150 ${
                imagePath === props.currentImagePath
                  ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                  : 'border-transparent hover:border-white/30'
              }`}
              onClick={() => {
                props.onImageSelect(imagePath);
              }}
            >
              {/* サムネイル */}
              <img
                src={convertFileSrc(imagePath)}
                class="w-full aspect-video object-cover glass-image-bg"
                alt={getFileName(imagePath)}
                loading="lazy"
              />
              {/* ファイル名 */}
              <div class="glass-item p-1.5 text-white/80 text-xs truncate">
                {getFileName(imagePath)}
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
};

export default ImageGallery;

<style>
{`
  /* グラスモフィズムメインパネル */
  .glass-panel {
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-left: none;
    box-shadow:
      0 8px 32px 0 rgba(0, 0, 0, 0.37),
      inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
      0 0 0 1px rgba(0, 0, 0, 0.1);
  }

  /* グラスモフィズムヘッダー */
  .glass-header {
    background: rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow:
      0 2px 8px 0 rgba(0, 0, 0, 0.2),
      inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
  }

  /* グラスモフィズムアイテム */
  .glass-item {
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(12px) saturate(160%);
    -webkit-backdrop-filter: blur(12px) saturate(160%);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  /* 画像背景 */
  .glass-image-bg {
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(8px) saturate(140%);
    -webkit-backdrop-filter: blur(8px) saturate(140%);
  }

  /* 閉じるボタン */
  .glass-button-close:hover {
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(12px) saturate(180%);
    -webkit-backdrop-filter: blur(12px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow:
      0 2px 8px 0 rgba(0, 0, 0, 0.25),
      inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
  }
`}
</style>
