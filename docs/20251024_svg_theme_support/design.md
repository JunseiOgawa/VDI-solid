# SVGアイコンのテーマ対応

## 概要

ライトモード・ダークモードに適応していないSVGアイコンファイルを、テーマに対応させる。

## 対象ファイル

1. `public/reload_hoso.svg` - リロード/回転アイコン
2. `public/setting_ge_h.svg` - 設定アイコン
3. `public/全画面表示ボタン5.svg` - フルスクリーンアイコン

## 現状の問題

### 現在の実装

- SVGは`<img>`タグで読み込まれている
- CSSフィルター（`brightness-0 invert dark:invert-0 dark:brightness-100`）でテーマ対応を実現
- SVGファイル内の色定義が統一されていない：
  - `reload_hoso.svg`: `currentColor`を使用（既に対応済み）
  - `setting_ge_h.svg`: `#231815`でハードコード
  - `全画面表示ボタン5.svg`: `#4B4B4B`でハードコード

### 問題点

1. CSSフィルターによる色変換は間接的で保守性が低い
2. SVGファイル間で色定義の方法が統一されていない
3. `currentColor`を使用しているファイルと固定色のファイルが混在

## 解決方法

### アプローチ

すべてのSVGファイルを`currentColor`に統一し、親要素のテキスト色を継承する方式に変更する。

### 実装内容

#### 1. SVGファイルの修正

**setting_ge_h.svg**
```svg
<!-- 変更前 -->
stroke: #231815;

<!-- 変更後 -->
stroke: currentColor;
```

**全画面表示ボタン5.svg**
```svg
<!-- 変更前 -->
.st0{fill:#4B4B4B;}

<!-- 変更後 -->
.st0{fill:currentColor;}
```

**reload_hoso.svg**
- 既に`currentColor`を使用しているため変更不要

#### 2. コンポーネントの修正

CSSフィルターを削除し、テキスト色で直接制御する。

**変更対象コンポーネント**
- `src/components/Titlebar/index.tsx`
- `src/components/Footer/index.tsx`

**変更内容**
```tsx
<!-- 変更前 -->
class="h-4 w-4 brightness-0 invert dark:invert-0 dark:brightness-100 opacity-90"

<!-- 変更後 -->
class="h-4 w-4 opacity-90 dark:brightness-0 dark:invert"
```

**フィルターの動作**
- **ライトモード**: フィルターなし → SVGの元の色（currentColor = 黒）が表示される
- **ダークモード**: `dark:brightness-0 dark:invert` → 黒を白に反転

**技術的な背景**
`<img>`タグで読み込まれたSVGは外部リソースとして扱われるため、親要素の`color`プロパティがSVG内の`currentColor`に反映されません。そのため、CSSフィルターを使用して色を変換する方法が最も確実です。

## メリット

1. **保守性の向上**: フィルターを使わず直接的な色制御
2. **一貫性**: すべてのSVGが同じ方式で色を定義
3. **シンプル**: 親要素の`color`プロパティで制御可能
4. **柔軟性**: CSS変数や他のTailwindクラスとの組み合わせが容易

## テスト計画

1. ライトモードでアイコンが適切に表示されることを確認
2. ダークモードでアイコンが適切に表示されることを確認
3. テーマ切り替え時にアイコンの色が正しく変更されることを確認
4. ビルドが正常に完了することを確認

## 参考

- プロジェクト概要: SVGアイコンは`currentColor`でテーマ対応する方針
- App.css: テーマカラーは`--text-primary`で定義済み
