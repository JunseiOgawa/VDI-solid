# Ticket #002: グリッド線の濃淡を調整可能にする
**優先度**: Medium  
**実装日**: 2025-10-07

## 概要
グリッド線の不透明度をユーザーが調整できるようにする機能を実装しました。
GridMenuにスライダーを追加し、リアルタイムでグリッド線の濃さを変更できます。

## 対象ファイル
- **変更**: `src/config/config.ts` - グリッド設定を追加（defaultOpacity, minOpacity, maxOpacity）
- **変更**: `src/context/AppStateContext.tsx` - gridOpacity の状態管理を追加
- **変更**: `src/components/ImageViewer/GridOverlay.tsx` - gridOpacity プロパティを追加し、動的に適用
- **変更**: `src/components/ImageViewer/GridMenu.tsx` - 濃淡調整用スライダーを追加
- **変更**: `src/components/ImageViewer/index.tsx` - gridOpacity を取得し GridOverlay に渡す
- **変更**: `src/components/Titlebar/index.tsx` - GridMenu に gridOpacity 関連の props を渡す
- **新規**: `docs/ImageViewer_GridOverlay/ticket_002.md` - 本チケット

## 実装内容

### 1. CONFIG への設定追加
`src/config/config.ts` に以下の設定を追加:
```typescript
grid: {
  defaultOpacity: 0.5,  // デフォルトの不透明度
  minOpacity: 0.1,      // 最小値
  maxOpacity: 1.0,      // 最大値
}
```

### 2. AppStateContext への状態管理追加
- `gridOpacity` Signal を作成（初期値: `CONFIG.grid.defaultOpacity`）
- `AppState` インターフェースに `gridOpacity()` と `setGridOpacity()` を追加
- JSDoc コメントで役割を明記

### 3. GridOverlay での濃淡適用
- `GridOverlayProps` に `gridOpacity: number` を追加
- `drawGrid()` 関数で `ctx.strokeStyle = \`rgba(255, 255, 255, ${props.gridOpacity})\`` と動的に設定
- `createEffect` で `gridOpacity` の変更も監視して再描画

### 4. GridMenu への UI 追加
- スライダーコンポーネントを追加
- `currentOpacity` と `onOpacityChange` プロパティを追加
- スライダーの範囲: `CONFIG.grid.minOpacity` ～ `CONFIG.grid.maxOpacity`（ステップ: 0.05）
- 現在の値をパーセント表示
- グリッドが 'off' の場合はスライダーを無効化

### 5. ImageViewer での Props 渡し
- `useAppState()` から `gridOpacity` を取得
- `<GridOverlay gridPattern={gridPattern()} gridOpacity={gridOpacity()} />` として渡す

### 6. Titlebar での GridMenu 更新
- `useAppState()` から `gridOpacity` と `setGridOpacity` を取得
- GridMenu に `currentOpacity={gridOpacity()}` と `onOpacityChange={(opacity) => setGridOpacity(opacity)}` を渡す

## 技術詳細

### Canvas API の使用
グリッド線の描画には Canvas API の `strokeStyle` を使用:
```typescript
ctx.strokeStyle = `rgba(255, 255, 255, ${props.gridOpacity})`;
```

### リアクティブ更新
SolidJS の `createEffect` を使用し、`gridOpacity` の変更時に自動的に再描画:
```typescript
createEffect(() => {
  props.gridPattern;
  props.gridOpacity;
  drawGrid();
});
```

## UI/UX
- **配置**: GridMenu の下部にスライダーを配置
- **フィードバック**: スライダー操作中にリアルタイムでグリッド線の濃さが変化
- **範囲**: 10%（0.1）～ 100%（1.0）
- **表示**: パーセンテージで現在の値を表示
- **無効化**: グリッドが 'off' の場合、スライダーは無効化される

## 完了条件
- [x] CONFIG にグリッド設定を追加
- [x] AppStateContext に gridOpacity の状態管理を追加
- [x] GridOverlay で gridOpacity を動的に適用
- [x] GridMenu にスライダー UI を追加
- [x] ImageViewer で gridOpacity を GridOverlay に渡す
- [x] Titlebar で GridMenu に opacity 関連の props を渡す
- [x] `npx tsc --noEmit` で型エラーなし
- [ ] `npm run dev` で実際に動作確認（スライダーでグリッド濃淡が変更されること）
- [ ] 既存機能（グリッドパターン切り替え等）に退行がないこと

## テスト観点
1. グリッドメニューを開き、スライダーが表示されることを確認
2. スライダーを動かすと、リアルタイムでグリッド線の濃さが変わることを確認
3. グリッドパターンを 'off' にすると、スライダーが無効化されることを確認
4. グリッドパターンを変更しても、設定した濃淡が維持されることを確認
5. パーセンテージ表示が正しく更新されることを確認

## 今後の拡張案
- 濃淡設定の永続化（localStorage への保存）
- グリッド線の色をカスタマイズ可能にする
- プリセット値（薄い/標準/濃い）のクイック選択ボタン追加
