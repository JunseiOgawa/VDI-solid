# ビルド時間ベースライン測定結果

## 測定日時

2025年10月29日

## 測定環境

- OS: Windows 10 (MINGW64_NT-10.0-26100)
- Node.js: (npm使用)
- Vite: 6.0.3
- TypeScript: 5.6.2
- SolidJS: 1.9.3

## 測定方法

`npm run build:time`コマンドを3回実行して平均を取得

## ビルド時間(Viteのみ)

| 測定回数 | ビルド時間 | 依存関係の解決 | バンドリング |
|---------|----------|--------------|------------|
| 1回目   | 2.59s    | 0.28s        | 1.89s      |
| 2回目   | 2.39s    | 0.28s        | 1.85s      |
| 3回目   | 2.52s    | 0.29s        | 1.96s      |
| **平均** | **2.50s** | **0.28s**    | **1.90s**  |

## ビルド出力

### バンドルサイズ

```
dist/index.html                          0.80 kB │ gzip:  0.42 kB
dist/assets/logo-BKhbptE1.svg            1.60 kB │ gzip:  0.55 kB
dist/assets/index-BLl3KNop.css          45.92 kB │ gzip:  7.65 kB
dist/assets/HistogramLayer-D6gKSJPc.js   2.33 kB │ gzip:  1.19 kB
dist/assets/index-B9v_0ZHb.js            3.58 kB │ gzip:  1.67 kB
dist/assets/index-D-TATWPJ.js            7.01 kB │ gzip:  2.19 kB
dist/assets/vendor-solid-Cirgxg-Z.js     9.74 kB │ gzip:  4.07 kB
dist/assets/tauri-api-Ca3v3JAg.js       16.09 kB │ gzip:  4.18 kB
dist/assets/index-D5f92CYH.js           74.39 kB │ gzip: 23.56 kB
```

### モジュール数

47モジュール

### 総出力サイズ

- 非圧縮: 161.46 kB
- gzip圧縮: 45.49 kB

## 現在の最適化設定

### vite.config.ts

```typescript
build: {
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true,
      drop_debugger: true,
      pure_funcs: ['console.log', 'console.info', 'console.debug'],
    },
    format: {
      comments: false,
    },
  },
  chunkSizeWarningLimit: 1000,
  rollupOptions: {
    output: {
      manualChunks: {
        'tauri-api': ['@tauri-apps/api', '@tauri-apps/plugin-dialog', '@tauri-apps/plugin-fs', '@tauri-apps/plugin-opener'],
        'vendor-solid': ['solid-js'],
      },
    },
  },
  sourcemap: false,
}
```

## ボトルネック分析

### 時間配分

1. **バンドリング**: 1.90s (76%)
   - メインのビルド処理
   - Terserによるminify
   - コード分割

2. **依存関係の解決**: 0.28s (11%)
   - モジュールの読み込み
   - 依存関係のグラフ構築

3. **その他**: 0.32s (13%)
   - ファイルI/O
   - 圧縮サイズの計算
   - 出力処理

### 大きなバンドル

最も大きいバンドルは`index-D5f92CYH.js` (74.39 kB、gzip: 23.56 kB)で、メインのアプリケーションコードが含まれています。

## 最適化の方向性

### 優先度A: 即座に実施可能

1. **esbuildへのminify変更**
   - Terserよりも高速
   - ビルド時間20-30%削減を期待

2. **TypeScriptインクリメンタルビルド**
   - `incremental: true`の設定
   - 2回目以降のビルド高速化

3. **依存関係の事前バンドル**
   - `optimizeDeps.include`の設定
   - 開発時の初回起動高速化

### 優先度B: 検証が必要

1. **SWCトランスパイラの使用**
   - Rust製で高速
   - プラグインの互換性確認が必要

2. **並列処理の最適化**
   - ビルドスレッド数の調整

## 次のステップ

1. visualizerレポートの確認
2. 優先度Aの最適化を実施
3. 最適化後の再測定
4. 改善率の計算
