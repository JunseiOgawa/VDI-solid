# コントロールパネル拡張機能 - タスク定義

**開始日**: 2025-10-15
**現在のフェーズ**: フェーズ1（エクスプローラーで開く機能）

## タスク概要

FloatingControlPanelに以下の機能を追加する：
1. エクスプローラーで開く機能
2. 展開/折りたたみUI機能

## フェーズ1: エクスプローラーで開く機能

### 第1段階: Rustバックエンド実装

#### タスク1.1: file_operations.rsの作成

- [ ] `src-tauri/src/file_operations.rs`ファイルを新規作成
- [ ] `open_in_explorer`コマンド関数を実装
  - [ ] Windows向けの実装（explorer.exe /select,）
  - [ ] エラーハンドリング実装
  - [ ] 非Windows環境向けのエラーメッセージ実装
- [ ] JSDoc形式のコメントを追加

**期待される成果物**:
```rust
use std::process::Command;
use tauri::command;

#[command]
pub async fn open_in_explorer(file_path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let result = Command::new("explorer.exe")
            .args(&["/select,", &file_path])
            .spawn();

        match result {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Failed to open explorer: {}", e)),
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("This feature is only supported on Windows".to_string())
    }
}
```

#### タスク1.2: lib.rsの修正

- [ ] `mod file_operations;`を追加
- [ ] `invoke_handler`に`file_operations::open_in_explorer`を追加
- [ ] ビルドが通ることを確認

**確認事項**:
- [ ] `npm run build`が成功する
- [ ] コンパイルエラーがないこと

### 第2段階: フロントエンド実装

#### タスク2.1: FloatingControlPanelの修正

- [ ] Props型に`currentImageFilePath: string`を追加
- [ ] フォルダアイコンのSVGを準備
- [ ] エクスプローラーボタンを追加
  - [ ] ガラス表現のスタイルを適用
  - [ ] ホバー時のツールチップ設定
  - [ ] 適切な位置に配置（回転ボタンの下など）
- [ ] `openInExplorer`関数を実装
  - [ ] `invoke('open_in_explorer')`呼び出し
  - [ ] エラーハンドリング
  - [ ] コンソールログ出力
- [ ] ファイルパスが空の場合はボタンを無効化

**ボタン配置案**:
```
[ズームイン]
[倍率表示]
[ズームアウト]
---区切り線---
[画面フィット]
[回転]
[エクスプローラー] ← 新規追加
---区切り線---
[マルチメニュー]
[設定]
```

#### タスク2.2: App.tsxの修正

- [ ] FloatingControlPanelに`currentImageFilePath`プロップを追加
- [ ] 既存の`currentImageFilePath()`シグナルを渡す

**修正箇所**:
```tsx
<FloatingControlPanel
  // ... 既存のプロップ
  currentImageFilePath={currentImageFilePath()}
/>
```

### 第3段階: テストと動作確認

#### タスク3.1: 基本動作テスト

- [ ] ビルドが成功することを確認
- [ ] アプリケーションが起動することを確認
- [ ] 画像を開いた状態でエクスプローラーボタンが表示される
- [ ] ボタンをクリックしてエクスプローラーが開く
- [ ] 該当ファイルがエクスプローラーで選択されている

#### タスク3.2: エラーハンドリングテスト

- [ ] ファイルパスが空の場合のボタンの挙動
- [ ] 存在しないファイルパスの場合のエラーメッセージ
- [ ] 特殊文字を含むファイルパスの動作確認

#### タスク3.3: UI/UXテスト

- [ ] ボタンのガラス表現が適切
- [ ] ホバー時のエフェクトが動作
- [ ] ツールチップが表示される
- [ ] 他のボタンとのスタイル統一性

---

## フェーズ2: 展開/折りたたみUI機能

### 第1段階: 状態管理実装

#### タスク4.1: 展開状態の管理

- [ ] `isExpanded`シグナルを追加
  - [ ] 初期値はlocalStorageから取得
  - [ ] デフォルトはtrue（展開状態）
- [ ] `toggleExpand`関数を実装
  - [ ] 状態を切り替え
  - [ ] localStorageに保存
  - [ ] メニューが開いている場合は閉じる

**実装コード**:
```tsx
const [isExpanded, setIsExpanded] = createSignal(
  localStorage.getItem('controlPanelExpanded') !== 'false'
);

const toggleExpand = () => {
  const newState = !isExpanded();
  setIsExpanded(newState);
  localStorage.setItem('controlPanelExpanded', String(newState));

  // メニューが開いている場合は閉じる
  if (!newState) {
    setShowMultiMenu(false);
    setShowSettings(false);
  }
};
```

### 第2段階: UI実装

#### タスク5.1: トグルボタン（折りたたみ時）の作成

- [ ] 丸いトグルボタンのマークアップを作成
- [ ] ガラス表現のスタイルを適用
  - [ ] 直径48px
  - [ ] 半透明背景
  - [ ] backdrop-filter: blur
  - [ ] ボーダー
- [ ] ハンバーガーメニューアイコンを追加
  - [ ] SVGアイコン
  - [ ] 3本線のシンプルなデザイン
- [ ] ホバーエフェクトを追加
- [ ] `onClick`イベントで`toggleExpand`を呼び出し

**デザイン仕様**:
```css
.toggle-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  cursor: pointer;
  transition: all 0.2s ease;
}
```

#### タスク5.2: 展開時のUI修正

- [ ] 既存のパネルを`Show`コンポーネントでラップ
- [ ] 展開時に閉じるボタンを追加
  - [ ] 「×」アイコンまたはシェブロンアイコン
  - [ ] パネルの先頭または末尾に配置
- [ ] 閉じるボタンに`toggleExpand`を接続

#### タスク5.3: 条件付きレンダリング

- [ ] `Show when={!isExpanded()}`でトグルボタンを表示
- [ ] `Show when={isExpanded()}`でフルパネルを表示
- [ ] 両方が同時に表示されないことを確認

### 第3段階: アニメーション実装

#### タスク6.1: CSSアニメーション定義

- [ ] `expandPanel`キーフレームアニメーションを作成
  - [ ] opacity: 0 → 1
  - [ ] scale: 0.8 → 1
  - [ ] duration: 300ms
  - [ ] easing: ease
- [ ] `collapsePanel`キーフレームアニメーションを作成
  - [ ] opacity: 1 → 0
  - [ ] scale: 1 → 0.8
  - [ ] duration: 300ms
  - [ ] easing: ease

**アニメーション定義**:
```css
@keyframes expandPanel {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes collapsePanel {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.8);
  }
}
```

#### タスク6.2: アニメーションの適用

- [ ] 展開時にアニメーションクラスを追加
- [ ] 折りたたみ時にアニメーションクラスを追加
- [ ] GPUアクセラレーションを有効化（transform使用）

#### タスク6.3: 位置別アニメーション調整

- [ ] top位置: 上から下へスライド
- [ ] bottom位置: 下から上へスライド
- [ ] left位置: 左から右へスライド
- [ ] right位置: 右から左へスライド

### 第4段階: テストと動作確認

#### タスク7.1: 基本機能テスト

- [ ] トグルボタンクリックでパネルが展開
- [ ] 閉じるボタンクリックでパネルが折りたたみ
- [ ] 展開/折りたたみが正しく切り替わる
- [ ] 状態がlocalStorageに保存される
- [ ] ページリロード後も状態が維持される

#### タスク7.2: アニメーションテスト

- [ ] 展開時のアニメーションが滑らか
- [ ] 折りたたみ時のアニメーションが滑らか
- [ ] トランジション時間が適切（300ms）
- [ ] アニメーション中にちらつきがない

#### タスク7.3: 位置別テスト

- [ ] top位置で正しく動作
  - [ ] トグルボタンの位置が適切
  - [ ] アニメーション方向が適切
- [ ] bottom位置で正しく動作
  - [ ] トグルボタンの位置が適切
  - [ ] アニメーション方向が適切
- [ ] left位置で正しく動作
  - [ ] トグルボタンの位置が適切
  - [ ] アニメーション方向が適切
- [ ] right位置で正しく動作
  - [ ] トグルボタンの位置が適切
  - [ ] アニメーション方向が適切

#### タスク7.4: インタラクションテスト

- [ ] 折りたたみ状態でもショートカットキーが動作
- [ ] マルチメニュー展開中に折りたたみした場合の挙動
  - [ ] メニューが閉じること
- [ ] 設定メニュー展開中に折りたたみした場合の挙動
  - [ ] メニューが閉じること
- [ ] 複数回の展開/折りたたみで問題なし
- [ ] 位置変更後も正しく動作

#### タスク7.5: エッジケーステスト

- [ ] 初回起動時（localStorageが空）の挙動
- [ ] 高速連打時の挙動
- [ ] 画面サイズ変更時の挙動
- [ ] ウィンドウリサイズ中の挙動

---

## 第5段階: 統合テストと最終確認

### タスク8.1: 統合テスト

- [ ] エクスプローラー機能と展開/折りたたみ機能が両方動作
- [ ] 折りたたみ状態でもエクスプローラー機能を呼び出せる（ショートカットキー経由）
- [ ] 全ての既存機能が正常動作
  - [ ] ズーム機能
  - [ ] 回転機能
  - [ ] マルチメニュー
  - [ ] 設定メニュー
  - [ ] 位置変更

### タスク8.2: パフォーマンステスト

- [ ] アニメーションが60fps以上で動作
- [ ] localStorageアクセスがUIをブロックしない
- [ ] メモリリークがない

### タスク8.3: 最終UI/UXチェック

- [ ] 全てのボタンが適切に配置されている
- [ ] ガラス表現が統一されている
- [ ] ツールチップが全て正しく表示される
- [ ] アイコンが分かりやすい

---

## 第6段階: ドキュメントとコミット

### タスク9.1: コードドキュメント

- [ ] FloatingControlPanelにコメントを追加
  - [ ] 新機能の説明
  - [ ] トグルボタンの挙動説明
- [ ] file_operations.rsにコメントを追加
- [ ] 複雑なロジックに説明コメントを追加

### タスク9.2: 設計書の更新

- [ ] 実装内容と設計書の差異を確認
- [ ] 必要に応じて設計書を更新

### タスク9.3: ユーザーへの確認依頼

- [ ] 実装内容のサマリーを作成
- [ ] 変更ファイル一覧を提示
  - [ ] 新規: `src-tauri/src/file_operations.rs`
  - [ ] 修正: `src-tauri/src/lib.rs`
  - [ ] 修正: `src/components/FloatingControlPanel/index.tsx`
  - [ ] 修正: `src/App.tsx`
- [ ] 動作確認のポイントを説明
- [ ] コミット確認を依頼

---

## 進捗管理

- **開始日**: 2025-10-15
- **完了予定日**: 未定
- **現在のフェーズ**: フェーズ1 - 第1段階（Rustバックエンド実装）

## 実装完了の定義

### フェーズ1完了の定義
- [ ] file_operations.rsが正しく作成されている
- [ ] lib.rsでコマンドが登録されている
- [ ] FloatingControlPanelにエクスプローラーボタンが追加されている
- [ ] App.tsxでcurrentImageFilePathが渡されている
- [ ] ビルドが成功する
- [ ] エクスプローラーが正しく開く
- [ ] 全てのテストが合格する

### フェーズ2完了の定義
- [ ] トグルボタンが作成されている
- [ ] 展開/折りたたみ機能が動作する
- [ ] アニメーションが滑らか
- [ ] 状態がlocalStorageに保存される
- [ ] 全ての位置設定で正しく動作
- [ ] 既存機能が全て動作する
- [ ] 全てのテストが合格する

## 備考

- 各タスク完了後にビルドを実行して問題がないことを確認
- フェーズ1完了後にユーザーに確認を求める
- フェーズ2完了後に最終的なコミット確認を求める
- コミットはユーザーの承認を得てから行う
