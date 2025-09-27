import type { Component } from 'solid-js';
import { createSignal, createContext, useContext, onMount } from 'solid-js';
import { createThemeController, isThemeKey, type ThemeKey } from './lib/theme';

import Titlebar from './components/Titlebar';
import ImageViewer from './components/ImageViewer';
import Footer from './components/Footer';

import './App.css';

// 共通の状態管理コンテキスト
interface AppState {
  currentImagePath: () => string;
  setCurrentImagePath: (path: string) => void;
  zoomScale: () => number;
  setZoomScale: (scale: number) => void;
  theme: () => ThemeKey;
  setTheme: (theme: ThemeKey) => void;
}

const AppContext = createContext<AppState>();

export const useAppState = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within AppProvider');
  }
  return context;
};

const App: Component = () => {
  // 状態管理
  const [currentImagePath, setCurrentImagePath] = createSignal<string>('');
  const [zoomScale, setZoomScale] = createSignal<number>(1);
  const [theme, setTheme] = createSignal<ThemeKey>('auto');

  createThemeController(theme);

  // テーマの永続化と初期画像設定
  onMount(async () => {
    const savedTheme = localStorage.getItem('vdi-theme');
    if (isThemeKey(savedTheme)) {
      setTheme(savedTheme);
    }

    // テスト用にsen19201080.pngを設定
    setCurrentImagePath('public/sen19201080.png');
  });

  // テーマ変更時に保存
  const handleThemeChange = (newTheme: ThemeKey) => {
    setTheme(newTheme);
    localStorage.setItem('vdi-theme', newTheme);
  };

  const appState: AppState = {
    currentImagePath,
    setCurrentImagePath,
    zoomScale,
    setZoomScale,
    theme,
    setTheme: handleThemeChange,
  };

  return (
    <AppContext.Provider value={appState}>
      <div class="flex min-h-screen flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
        <Titlebar />
        <main class="relative flex flex-1 flex-col overflow-hidden pb-12">
          <ImageViewer />
        </main>
        <Footer />
      </div>
    </AppContext.Provider>
  );
};

export default App;
