import type { Component } from 'solid-js';

import Titlebar from './components/Titlebar';
import ImageViewer from './components/ImageViewer';
import Footer from './components/Footer';
import { AppProvider } from './context/AppStateContext';

import './App.css';

const App: Component = () => {
  return (
    <AppProvider>
      <div class="flex min-h-screen flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
        <Titlebar />
        <main class="relative flex flex-1 flex-col overflow-hidden pb-12">
          <ImageViewer />
        </main>
        <Footer />
      </div>
    </AppProvider>
  );
};

export default App;
