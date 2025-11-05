/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import solid from "vite-plugin-solid";
import { readFileSync } from 'fs';

const host = process.env.TAURI_DEV_HOST;
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [solid()],
  define: {
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(packageJson.version),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    transformMode: { web: [/\.[jt]sx?$/] },
  },

  // ビルド最適化設定
  build: {
    // Terserを使用した最適化
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,      // console.logを削除
        drop_debugger: true,     // debugger文を削除
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      format: {
        comments: false,         // コメントを削除
      },
    },
    // チャンクサイズ警告の閾値を調整
    chunkSizeWarningLimit: 1000,
    // Rollup設定
    rollupOptions: {
      output: {
        // 戦略的なコード分割
        manualChunks: {
          // Tauri APIを別チャンクに
          'tauri-api': ['@tauri-apps/api', '@tauri-apps/plugin-dialog', '@tauri-apps/plugin-fs', '@tauri-apps/plugin-opener'],
          // SolidJS関連を別チャンクに
          'vendor-solid': ['solid-js'],
        },
      },
    },
    // ソースマップは本番では無効化(サイズ削減)
    sourcemap: false,
  },

  // WebWorker設定（@jsquash/jxl対応）
  worker: {
    format: 'es',
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 50500,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
