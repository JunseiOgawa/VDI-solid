/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";
import { readFileSync } from "fs";
import Inspect from "vite-plugin-inspect";
import { visualizer } from "rollup-plugin-visualizer";
import { buildTimer } from "./vite-plugin-build-timer";

const host = process.env.TAURI_DEV_HOST;
const packageJson = JSON.parse(readFileSync("./package.json", "utf-8"));

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [
    solid(),
    // ビルド時間測定プラグイン(ANALYZE=trueまたはTIME=trueの時に有効化)
    ...(process.env.ANALYZE === "true" || process.env.TIME === "true"
      ? [buildTimer()]
      : []),
    // プラグイン分析(ANALYZE=trueの時に有効化)
    ...(process.env.ANALYZE === "true" ? [Inspect()] : []),
    // バンドル可視化(ANALYZE=trueの時に有効化)
    ...(process.env.ANALYZE === "true"
      ? [
          visualizer({
            open: false,
            filename: "docs/20251029_build_optimization/bundle-stats.html",
            gzipSize: true,
            brotliSize: true,
          }) as any,
        ]
      : []),
  ],
  define: {
    "import.meta.env.PACKAGE_VERSION": JSON.stringify(packageJson.version),
  },
  test: {
    environment: "jsdom",
    globals: true,
    transformMode: { web: [/\.[jt]sx?$/] },
  },

  // 依存関係の最適化
  optimizeDeps: {
    include: [
      "solid-js",
      "@tauri-apps/api",
      "@tauri-apps/plugin-dialog",
      "@tauri-apps/plugin-fs",
      "@tauri-apps/plugin-opener",
      "@tauri-apps/plugin-process",
      "@tauri-apps/plugin-updater",
      "@solid-primitives/i18n",
    ],
  },

  // ビルド最適化設定
  build: {
    // esbuildを使用した高速minify(Terserより約3倍高速)
    minify: "esbuild",
    // チャンクサイズ警告の閾値を調整
    chunkSizeWarningLimit: 1000,
    // Rollup設定
    rollupOptions: {
      output: {
        // 戦略的なコード分割
        manualChunks: {
          // Tauri APIを別チャンクに
          "tauri-api": [
            "@tauri-apps/api",
            "@tauri-apps/plugin-dialog",
            "@tauri-apps/plugin-fs",
            "@tauri-apps/plugin-opener",
          ],
          // SolidJS関連を別チャンクに
          "vendor-solid": ["solid-js"],
        },
      },
    },
    // ソースマップは本番では無効化(サイズ削減)
    sourcemap: false,
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
