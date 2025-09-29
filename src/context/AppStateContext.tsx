import type { ParentComponent } from 'solid-js';
import { createContext, createSignal, onMount, useContext } from 'solid-js';
import { createThemeController, isThemeKey, type ThemeKey } from '../lib/theme';

export interface AppState {
  currentImagePath: () => string;
  setCurrentImagePath: (path: string) => void;
  zoomScale: () => number;
  setZoomScale: (scale: number) => void;
  rotation: () => number;
  setRotation: (updater: (prev: number) => number) => void;
  theme: () => ThemeKey;
  setTheme: (theme: ThemeKey) => void;
}

const AppContext = createContext<AppState>();

/**
 * アプリケーションの状態を管理するプロバイダーコンポーネント。
 * 現在の画像パス、ズームスケール、テーマを状態として保持し、
 * ローカルストレージからテーマを復元し、デフォルトの画像パスを設定する。
 * 子コンポーネントにAppStateを提供する。
 * @param props - 親コンポーネントのプロパティ
 */
export const AppProvider: ParentComponent = (props) => {
  const [currentImagePath, _setCurrentImagePath] = createSignal<string>('');
  const [zoomScale, setZoomScale] = createSignal<number>(1);
  const [rotation, setRotation] = createSignal<number>(0);
  const [theme, setTheme] = createSignal<ThemeKey>('auto');

  createThemeController(theme);

  onMount(() => {
    const savedTheme = localStorage.getItem('vdi-theme');
    if (isThemeKey(savedTheme)) {
      setTheme(savedTheme);
    }
    _setCurrentImagePath('public/sen19201080.png');
  });

  const handleThemeChange = (newTheme: ThemeKey) => {
    setTheme(newTheme);
    localStorage.setItem('vdi-theme', newTheme);
  };

  const setCurrentImagePath = (path: string) => {
    _setCurrentImagePath(path);
    setRotation(0); // 画像が変更されたら回転をリセット
  };

  const appState: AppState = {
    currentImagePath,
    setCurrentImagePath,
    zoomScale,
    setZoomScale,
    rotation,
    setRotation,
    theme,
    setTheme: handleThemeChange,
  };

  return (
    <AppContext.Provider value={appState}>{props.children}</AppContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
};
