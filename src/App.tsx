import type { Component } from 'solid-js';
import { onMount } from 'solid-js';
import { invoke } from '@tauri-apps/api/core';

import Titlebar from './components/Titlebar';
import ImageViewer from './components/ImageViewer';
import Footer from './components/Footer';
import { AppProvider } from './context/AppStateContext';

import './App.css';

const App: Component = () => {
  // UIがマウントされた後にウィンドウを表示
  onMount(() => {
    // 次のフレームでウィンドウを表示（レンダリング完了を確実に待つ）
    requestAnimationFrame(() => {
      invoke('show_window').catch((err: unknown) => 
        console.error('Failed to show window:', err)
      );
    });
  });

  return (
    <AppProvider>
      <div class="flex h-screen flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
        <Titlebar />
        <main class="relative flex flex-1 flex-col overflow-hidden min-h-0">
          <ImageViewer />
        </main>
        <Footer />
      </div>
    </AppProvider>
  );
};

export default App;
