# Ticket #001: img要素のドラッグ機能実装
**優先度**: High

## 対象ファイル
- 変更: `src/components/ImageViewer/index.tsx` - ドラッグイベント追加、位置state追加、カーソル変更

## 影響範囲
- `src/components/ImageViewer/index.tsx` - img要素のドラッグ動作

## 実装手順
1. 位置state追加 (x, y)
2. マウスダウンイベントでドラッグ開始
3. マウスムーブで位置更新
4. マウスアップでドラッグ終了
5. imgスタイルにcursor: grab, grabbing追加
6. transformにtranslate追加

## 完了条件
- [x] img要素をドラッグして動かせる
- [x] カーソルがdrag形になる
- [x] ズーム機能と互換
