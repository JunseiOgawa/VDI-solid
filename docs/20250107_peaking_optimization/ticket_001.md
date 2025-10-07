# Ticket #001: Debounceユーティリティ実装

**優先度**: High  
**見積時間**: 0.5時間  
**依存チケット**: なし

---

## 目的

スライダー操作時の処理回数を削減するためのDebounce機能を実装する。
連続した入力を遅延実行することで、最後の操作のみを処理対象とする。

---

## 対象ファイル

### 変更
- `src/components/SettingsMenu/index.tsx`

---

## 影響範囲

- SettingsMenuコンポーネント内部のみ
- 外部APIへの影響なし
- 既存のprops構造は変更なし

---

## 実装手順

### 1. debounce関数の実装

SettingsMenuコンポーネント内に以下の関数を追加:

```typescript
// SettingsMenuコンポーネント内に追加
function createDebounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): [(...args: Parameters<T>) => void, () => void] {
  let timeoutId: number | undefined;
  
  const debouncedFn = (...args: Parameters<T>) => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = undefined;
    }, delay);
  };
  
  const cleanup = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  };
  
  return [debouncedFn, cleanup];
}
```

### 2. SolidJSのonCleanupフックを追加

```typescript
import { onCleanup } from 'solid-js';
```

### 3. コンポーネント内でdebounce関数を準備

後続チケットで使用するための基盤を整備。
実際のスライダーへの適用は#003で実施。

---

## 技術的詳細

### Debounceの仕組み

1. **入力イベント発生**: スライダー移動
2. **既存タイマーキャンセル**: 前回の処理を中止
3. **新規タイマー設定**: 指定時間後に実行
4. **遅延時間経過**: 実際の処理を実行

### 遅延時間の設定

- デフォルト: 500ms
- 理由: ユーザーの操作完了を検知するのに適切な時間
- 調整可能: 必要に応じて300ms~700msで調整

### メモリリーク対策

```typescript
onCleanup(() => {
  cleanup(); // コンポーネントアンマウント時にタイマークリア
});
```

### TypeScript型安全性

- ジェネリクス`<T>`で関数の型を保持
- `Parameters<T>`で引数の型を推論
- タイマーIDの型を明示（`number | undefined`）

---

## エッジケース

### ケース1: 高速な連続入力
- **動作**: 最後の入力のみ処理
- **期待**: タイマーが毎回リセットされる

### ケース2: コンポーネントアンマウント中
- **動作**: onCleanupでタイマークリア
- **期待**: メモリリークなし

### ケース3: 遅延中に同じ値が入力される
- **動作**: タイマーリセットで再度遅延
- **期待**: 重複処理の回避

---

## 完了条件

- [x] createDebounce関数が実装されている
- [x] onCleanupでタイマーをクリアしている
- [x] TypeScriptの型エラーがない
- [x] ESLint警告がない
- [x] 関数が2つの戻り値を返す（debounced関数とcleanup関数）

---

## テスト項目

### 単体テスト（手動確認）

1. **基本動作**
   - debounce関数を呼び出して500ms後に実行されることを確認

2. **連続呼び出し**
   - 複数回呼び出して最後の1回のみ実行されることを確認

3. **クリーンアップ**
   - cleanup関数呼び出しで保留中の処理がキャンセルされることを確認

---

## 参考資料

### Debounceパターン
- [Lodash debounce実装](https://lodash.com/docs/#debounce)
- [JavaScript Debounce解説](https://davidwalsh.name/javascript-debounce-function)

### SolidJS
- [onCleanup API](https://www.solidjs.com/docs/latest/api#oncleanup)
- [Reactivity Basics](https://www.solidjs.com/tutorial/introduction_basics)

---

## 実装後の確認

```bash
# ビルドエラーチェック
npm run build

# 開発サーバー起動
npm run dev
```

コンソールにエラーがないことを確認。
