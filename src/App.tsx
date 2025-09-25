import type { Component, JSX } from 'solid-js';
import { createSignal, createContext, useContext, onMount } from 'solid-js';

import Titlebar from './components/Titlebar';
import ImageViewer from './components/ImageViewer';
import Footer from './components/Footer';
import Controls from './components/Controls';

import './App.css';

// 共通の状態管理コンテキスト
interface AppState {
  currentImagePath: () => string;
  setCurrentImagePath: (path: string) => void;
  zoomScale: () => number;
  setZoomScale: (scale: number) => void;
  rotationAngle: () => number;
  setRotationAngle: (angle: number) => void;
  theme: () => 'light' | 'dark' | 'auto';
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
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
  const [rotationAngle, setRotationAngle] = createSignal<number>(0);
  const [theme, setTheme] = createSignal<'light' | 'dark' | 'auto'>('auto');

  // テーマの永続化
  onMount(() => {
    const savedTheme = localStorage.getItem('vdi-theme') as 'light' | 'dark' | 'auto' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  });

  // テーマ変更時に保存
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
    localStorage.setItem('vdi-theme', newTheme);
  };

  const appState: AppState = {
    currentImagePath,
    setCurrentImagePath,
    zoomScale,
    setZoomScale,
    rotationAngle,
    setRotationAngle,
    theme,
    setTheme: handleThemeChange,
  };

  return (
    <AppContext.Provider value={appState}>
      <div class="app-container">
        <Titlebar />
        <main class="main-content">
          <ImageViewer />
          <Controls />
        </main>
        <Footer />
      </div>
    </AppContext.Provider>
  );
};

export default App;
