# コントロールパネル拡張機能

**作成日**: 2025-10-15
**ステータス**: 設計中

## 概要

FloatingControlPanelに以下の2つの機能を追加する：
1. **エクスプローラーで開く機能** - 現在表示中の画像ファイルをOSのファイルエクスプローラーで開く
2. **展開/折りたたみUI機能** - ExcelのリボンやZoomのペンマークのような、パネルを展開/折りたたみできるUI

## 背景と目的

### エクスプローラーで開く機能
- ユーザーが画像を確認しながら、ファイル管理操作を行いたい場合がある
- 画像の保存場所を確認したり、他のファイルと一緒に操作したい場合に便利

### 展開/折りたたみUI機能
- 常時表示のコントロールパネルが画面を占有する問題を解決
- 必要な時だけパネルを展開し、通常は最小限の表示にする
- ExcelのリボンUI、Zoomのペンマークアイコンのような使い勝手を提供

## 要件定義

### 1. エクスプローラーで開く機能

#### 機能要件
- **FR-1.1**: 現在表示中の画像ファイルをOSのファイルエクスプローラーで開く
- **FR-1.2**: エクスプローラーで該当ファイルを選択状態で開く
- **FR-1.3**: Windows環境でexplorer.exe /select,コマンドを使用
- **FR-1.4**: エラーが発生した場合は適切にハンドリングする

#### 非機能要件
- **NFR-1.1**: コマンド実行は非同期で行い、UIをブロックしない
- **NFR-1.2**: ファイルパスが存在しない場合は適切なエラーメッセージを表示

#### UI要件
- FloatingControlPanelにフォルダアイコンのボタンを追加
- ボタンはガラス表現で既存のデザインに統一
- ホバー時のツールチップ「エクスプローラーで開く」を表示

### 2. 展開/折りたたみUI機能

#### 機能要件
- **FR-2.1**: パネルを展開/折りたたみできるトグルボタンを追加
- **FR-2.2**: 折りたたみ時は丸いアイコンボタンのみを表示
- **FR-2.3**: 展開時は現在のコントロールパネル全体を表示
- **FR-2.4**: トグル状態はローカルストレージに保存し、再起動後も維持
- **FR-2.5**: アニメーション付きで展開/折りたたみを行う

#### 非機能要件
- **NFR-2.1**: アニメーションは滑らか（300ms程度のトランジション）
- **NFR-2.2**: 折りたたみ時のアイコンは視認性が高く、機能が明確
- **NFR-2.3**: 展開/折りたたみ操作は即座にレスポンス

#### UI要件
- **折りたたみ時**:
  - 丸い半透明のガラス表現ボタン（直径48px程度）
  - 中央にハンバーガーメニューアイコンまたは3点リーダーアイコン
  - 位置設定に応じた配置（top/bottom/left/right）

- **展開時**:
  - 現在のFloatingControlPanelを表示
  - トグルボタンはパネルの端に配置（閉じるボタンとして機能）

- **アニメーション**:
  - scale + opacity のトランジション
  - slideIn/slideOut効果（位置に応じた方向）

## 技術設計

### アーキテクチャ

#### 1. エクスプローラーで開く機能

```
┌─────────────────┐
│ FloatingControl │
│     Panel       │
│  (フォルダボタン)│
└────────┬────────┘
         │
         │ invoke("open_in_explorer")
         ▼
┌─────────────────┐
│  Tauri Backend  │
│  (Rust)         │
│ - open_in_explorer│
│   コマンド       │
└────────┬────────┘
         │
         │ std::process::Command
         ▼
┌─────────────────┐
│  OS Explorer    │
│  (explorer.exe) │
└─────────────────┘
```

#### 2. 展開/折りたたみUI機能

```
┌─────────────────────────────────┐
│  FloatingControlPanel           │
│  - isExpanded: Signal<boolean>  │
│  - toggleExpand()               │
└────────┬────────────────────────┘
         │
         │ ローカルストレージに保存
         ▼
┌─────────────────────────────────┐
│  localStorage                   │
│  key: "controlPanelExpanded"    │
└─────────────────────────────────┘
```

### データフロー

#### エクスプローラーで開く機能

1. ユーザーがフォルダボタンをクリック
2. FloatingControlPanelがApp.tsxから受け取った`currentImageFilePath`を使用
3. Tauriコマンド`open_in_explorer(filePath)`を呼び出し
4. Rustバックエンドで`explorer.exe /select,"filePath"`を実行
5. エクスプローラーが開き、ファイルが選択される

#### 展開/折りたたみ機能

1. コンポーネントマウント時にlocalStorageから状態を読み込み
2. ユーザーがトグルボタンをクリック
3. `isExpanded`シグナルを切り替え
4. localStorageに保存
5. CSSトランジションでアニメーション

### 実装詳細

#### 1. Rustバックエンド実装

**ファイル**: `src-tauri/src/file_operations.rs`（新規作成）

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

**ファイル**: `src-tauri/src/lib.rs`（修正）

```rust
mod file_operations;

fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // ... 既存のコマンド
            file_operations::open_in_explorer,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

#### 2. FloatingControlPanel実装

**ファイル**: `src/components/FloatingControlPanel/index.tsx`（修正）

追加要素：
- `currentImageFilePath: string` プロップ
- `isExpanded: Signal<boolean>` ローカル状態
- トグルボタン
- 展開/折りたたみアニメーション
- エクスプローラーボタン

主要な変更点：
- `isExpanded`シグナルでパネルの表示/非表示を制御
- `toggleExpand`関数で状態を切り替え、localStorageに保存
- `openInExplorer`関数でTauriコマンドを呼び出し
- Show/Hideコンポーネントで条件付きレンダリング

#### 3. App.tsxの修正

FloatingControlPanelに`currentImageFilePath`を渡す：

```tsx
<FloatingControlPanel
  // ... 既存のプロップ
  currentImageFilePath={currentImageFilePath()}
/>
```

### スタイリング

#### トグルボタン（折りたたみ時）

```css
.toggle-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-button:hover {
  background: rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}
```

#### 展開アニメーション

```css
.control-panel-expanded {
  animation: expandPanel 0.3s ease;
}

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
```

## 実装手順

### フェーズ1: エクスプローラーで開く機能

1. Rustバックエンド実装
   - [ ] `src-tauri/src/file_operations.rs`を作成
   - [ ] `open_in_explorer`コマンドを実装
   - [ ] `lib.rs`でコマンド登録
   - [ ] ビルドテスト

2. フロントエンド実装
   - [ ] FloatingControlPanelにフォルダボタンを追加
   - [ ] `open_in_explorer`呼び出し処理を実装
   - [ ] エラーハンドリング実装

3. 動作確認
   - [ ] エクスプローラーが正しく開くことを確認
   - [ ] ファイルが選択されることを確認
   - [ ] エラー時の挙動を確認

### フェーズ2: 展開/折りたたみUI機能

1. 状態管理実装
   - [ ] `isExpanded`シグナルを追加
   - [ ] localStorageとの連携実装
   - [ ] トグル機能実装

2. UI実装
   - [ ] 折りたたみ時のトグルボタンを作成
   - [ ] 展開時の閉じるボタンを追加
   - [ ] Show/Hideロジック実装

3. アニメーション実装
   - [ ] CSSトランジション追加
   - [ ] expandPanel/collapsePanel アニメーション
   - [ ] 位置に応じたアニメーション方向調整

4. 動作確認
   - [ ] 展開/折りたたみが正しく動作
   - [ ] アニメーションが滑らか
   - [ ] 状態が保存される
   - [ ] 全ての位置設定で正しく動作

## テスト計画

### エクスプローラーで開く機能

#### 機能テスト
- [ ] 画像ファイルを開いている状態でボタンをクリック
- [ ] エクスプローラーが起動すること
- [ ] 該当ファイルが選択されていること
- [ ] 存在しないファイルパスの場合のエラーハンドリング

#### エッジケース
- [ ] ファイルパスが空の場合
- [ ] ファイルパスに特殊文字が含まれる場合
- [ ] 非常に長いファイルパスの場合

### 展開/折りたたみUI機能

#### 機能テスト
- [ ] トグルボタンクリックでパネルが展開
- [ ] 閉じるボタンクリックでパネルが折りたたみ
- [ ] 状態がlocalStorageに保存される
- [ ] ページリロード後も状態が維持される

#### アニメーションテスト
- [ ] 展開時のアニメーションが滑らか
- [ ] 折りたたみ時のアニメーションが滑らか
- [ ] トランジション時間が適切（300ms）

#### 位置別テスト
- [ ] top位置で正しく動作
- [ ] bottom位置で正しく動作
- [ ] left位置で正しく動作
- [ ] right位置で正しく動作

#### インタラクションテスト
- [ ] 折りたたみ状態でも他の機能（ショートカットなど）が動作
- [ ] メニュー展開中に折りたたみした場合の挙動
- [ ] 複数回の展開/折りたたみで問題なし

## 成果物

### 新規作成
- `src-tauri/src/file_operations.rs`

### 修正
- `src-tauri/src/lib.rs`
- `src/components/FloatingControlPanel/index.tsx`
- `src/App.tsx`

## 注意事項

1. **Windows環境前提**
   - エクスプローラーで開く機能はWindows専用
   - 他のOSでは機能を無効化またはエラーメッセージ

2. **パフォーマンス**
   - アニメーションはGPUアクセラレーションを利用
   - localStorageアクセスは最小限に

3. **アクセシビリティ**
   - トグルボタンには適切なaria-label
   - キーボード操作対応を検討

4. **既存機能との整合性**
   - 位置設定機能との連携確認
   - メニュー展開時の挙動確認

## 今後の拡張案

- macOS/Linux向けのファイルマネージャー対応
- トグルボタンのカスタマイズ機能
- 展開/折りたたみのショートカットキー対応
- アニメーション速度の設定
