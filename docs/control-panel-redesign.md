# コントロールパネルデザイン刷新

**作成日**: 2025-10-15
**目的**: コントロールパネルのUIを改善し、統一感のあるデザインに刷新する

## 変更内容

### 1. 位置設定の簡素化

**変更前**: top/bottom/left/rightの4方向
**変更後**: top/bottomの2方向のみ

**理由**:
- 縦配置（left/right）は使用頻度が低い
- 上下配置のみにすることでコードが簡潔になる
- ↑/↓アイコンとの整合性

**削除対象**:
- `getPositionClasses()`のleft/rightケース
- `getPanelDirection()`関数（常にflex-rowなので不要）
- `getMenuPositionClasses()`のleft/rightケース
- SettingsMenuのposition設定項目からleft/rightオプション
- AppStateContextのcontrolPanelPositionの型定義

### 2. 展開/折りたたみアイコンの変更

**変更前**: 折りたたみ時はハンバーガーメニュー（≡）、展開時は×
**変更後**:
- top位置: 折りたたみ時は↓、展開時は↑
- bottom位置: 折りたたみ時は↑、展開時は↓

**理由**:
- 位置に応じた直感的なアイコン
- パネルの展開方向が明確

**実装**:
- positionに応じてSVGパスを切り替える
- アイコンは常に展開/折りたたみの方向を示す

### 3. ボタンサイズの統一

**問題**: ボタン間でサイズが異なり、ガタついて見える

**解決策**:
- 全てのボタンを同じ高さに統一（48px）
- 区切り線を削除（視覚的な整理のみ）
- mt-2クラスを全て削除
- gap-2で均等な間隔を保つ

**対象ボタン**:
- トグルボタン（閉じる）
- ズームイン/アウト/リセット
- 画面フィット
- 回転
- エクスプローラーで開く
- マルチメニュー
- 設定

### 4. 背景色の統一

**変更前**: `bg-black/20 backdrop-blur-md border border-white/10`
**変更後**: `bg-black/80 backdrop-blur-md border border-white/10`

**参考**: ImageGalleryと同じ配色
- より濃い背景で視認性向上
- 統一感のあるデザイン

**トグルボタン（折りたたみ時）の背景色**:
- 変更前: `bg-black/30`
- 変更後: `bg-black/80`

### 5. 削除する不要なコード

#### FloatingControlPanel.tsx
- `getPanelDirection()`関数
- `getPositionClasses()`のleft/rightケース
- `getMenuPositionClasses()`のleft/rightケース
- `getDefaultMenuPosition()`のleft/rightケース
- 全ての区切り線（`<div class="h-px bg-white/10 my-2" />`）
- 全ての`mt-2`クラス

#### Props型定義
- positionの型を`'top' | 'bottom'`に変更

#### AppStateContext.tsx
- controlPanelPositionの型を`'top' | 'bottom'`に変更
- 初期値を'top'に変更（bottom保持の場合はそのまま）

#### SettingsMenu
- position設定のleft/rightオプションを削除

## 実装手順

### ステップ1: 型定義の更新

1. FloatingControlPanel/index.tsxのProps型定義を更新
   - `position: 'top' | 'bottom'`

2. AppStateContext.tsxの型定義を更新
   - `controlPanelPosition`の型を`'top' | 'bottom'`に変更

### ステップ2: FloatingControlPanelの改修

1. 不要な関数を削除
   - `getPanelDirection()` - 常にflex-rowなので不要

2. `getPositionClasses()`を簡略化
   ```tsx
   const getPositionClasses = () => {
     return props.position === 'top'
       ? 'top-12 left-1/2 -translate-x-1/2'
       : 'bottom-12 left-1/2 -translate-x-1/2';
   };
   ```

3. トグルアイコンを位置に応じて変更
   - 折りたたみ時: top=↓, bottom=↑
   - 展開時: top=↑, bottom=↓

4. 区切り線を全て削除

5. ボタンからmt-2クラスを削除

6. 背景色を変更
   - メインコンテナ: `bg-black/80`
   - トグルボタン: `bg-black/80`

7. flex-rowを固定
   - `flex ${getPanelDirection()}` → `flex flex-row`

### ステップ3: SettingsMenuの更新

1. position設定のオプションを更新
   - left/rightオプションを削除
   - 上部/下部の2つのみ

### ステップ4: メニュー配置ロジックの簡略化

1. `getMenuPositionClasses()`を簡略化
   - top/bottomケースのみ残す

2. `getDefaultMenuPosition()`を簡略化
   - top/bottomケースのみ残す

3. `getMenuAnchor()`はそのまま（bottom位置の処理が必要）

## ビジュアルイメージ

### 折りたたみ時
```
top位置:
┌─────┐
│  ↓  │ ← クリックで展開
└─────┘

bottom位置:
┌─────┐
│  ↑  │ ← クリックで展開
└─────┘
```

### 展開時（top位置）
```
┌───────────────────────────────────┐
│ ↑ │ + │100%│ - │ ⛶ │ ↻ │ 📁│ ⊞ │⚙│
└───────────────────────────────────┘
 ↑   ↑   ↑    ↑   ↑   ↑   ↑   ↑  ↑
 閉  拡  倍   縮  画  回  Ex  マ  設
 じ  大  率   小  面  転  pl  ル  定
 る              フ      or  チ
                ィ      er
                ト
```

## 期待される効果

1. **シンプル化**: left/right削除により、コードが20%程度削減
2. **直感的**: ↑/↓アイコンで展開方向が明確
3. **統一感**: ImageGalleryと同じ配色で一貫性
4. **視認性向上**: 濃い背景色で見やすく
5. **ガタつき解消**: ボタンサイズ統一で美しい見た目

## テスト項目

- [ ] top位置で折りたたみ時に↓アイコンが表示される
- [ ] top位置で展開時に↑アイコンが表示される
- [ ] bottom位置で折りたたみ時に↑アイコンが表示される
- [ ] bottom位置で展開時に↓アイコンが表示される
- [ ] 全てのボタンが同じ高さで整列している
- [ ] 背景色がImageGalleryと同じになっている
- [ ] 展開/折りたたみが正しく動作する
- [ ] 設定メニューでleft/rightオプションが表示されない
- [ ] ビルドが成功する

## 変更ファイル

- `src/components/FloatingControlPanel/index.tsx`
- `src/context/AppStateContext.tsx`
- `src/components/SettingsMenu/index.tsx`
