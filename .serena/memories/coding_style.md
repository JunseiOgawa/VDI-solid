# コーディングスタイルと規約

## TypeScript設定
- Target: ES2020
- Module: ESNext
- strict モード有効
- noUnusedLocals, noUnusedParameters 有効
- JSX: preserve (SolidJS)
- jsxImportSource: "solid-js"

## コーディング規約
- **関数コンポーネント**: アロー関数形式で定義
- **型定義**: TypeScript の interface を活用
- **状態管理**: SolidJS の `createSignal` を使用
- **命名規則**:
  - コンポーネント: PascalCase
  - 変数・関数: camelCase
  - 定数: UPPER_SNAKE_CASE
  - インターフェース: PascalCase (export interface)
- **コメント**: JSDoc形式で関数やコンポーネントの目的を記述
- **ファイル構成**: 機能ごとにディレクトリを分割
- **インポート**: 相対パスで明示的にインポート

## SolidJS固有の規約
- リアクティブ値は `createSignal` で作成
- エフェクトは `createEffect` で管理
- メモ化された値は `createMemo` で定義
- ライフサイクルは `onMount`, `onCleanup` を使用
- Props の型定義を明示的に行う

## スタイリング
- Tailwind CSS を使用
- インラインスタイルは JSX.CSSProperties 型で定義
- CSS クラス名は kebab-case
