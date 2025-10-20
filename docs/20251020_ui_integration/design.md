# UI統合とフッター機能強化の設計

## 概要

コントロールパネルをタイトルバーに統合し、フッターに削除ボタンとファイルサイズ表示を追加する。

## 要件

### 1. フッターの機能追加

#### 1.1 削除ボタンの追加
- **配置**: エクスプローラーで開くボタンの隣（左側）
- **機能**: 現在表示中の画像ファイルを削除する
- **UI**:
  - ゴミ箱アイコンのボタン
  - ガラスモーフィズムデザインに統一
  - ホバー時にアクセント表示
- **動作**:
  - クリック時に確認ダイアログを表示
  - 削除後、次の画像を表示（ない場合は前の画像）
  - 画像がない場合はボタンを無効化

#### 1.2 ファイルサイズ表示の追加
- **配置**: 解像度の左側
- **表示形式**:
  - 1MB以上: `○○.○MB`（小数点第1位まで）
  - 1MB未満: `○○○KB`（整数）
  - 例: `1.2MB`, `850KB`
- **取得方法**: Tauriバックエンドに新しいコマンドを追加

### 2. コントロールパネルの機能統合

#### 2.1 FloatingControlPanelの機能をTitlebarに移行
以下の機能をTitlebarに統合：
- ズームイン/アウト/リセット
- 画面フィット
- 回転
- マルチメニュー（グリッド、ピーキング、ヒストグラム）
- 設定メニュー

#### 2.2 Titlebarのレイアウト
```
[ギャラリー] ... [ズーム−] [100%] [ズーム+] [フィット] [回転] [マルチ] [設定] | [最小化] [最大化] [閉じる]
```

- **左側**: ギャラリーボタン
- **中央右寄り**: 機能ボタン群
- **右端**: ウィンドウコントロール

#### 2.3 メニュー表示
- MultiMenuとSettingsMenuはTitlebarの下に表示
- 既存のドロップダウン形式を維持
- メニュー外クリックで閉じる動作を維持

### 3. FloatingControlPanelの削除

- `src/components/FloatingControlPanel/index.tsx`を削除
- `App.tsx`から関連するimportと使用箇所を削除
- 関連するlocalStorage設定も削除（`controlPanelExpanded`など）

## 技術仕様

### 3.1 新しいTauriコマンド

#### `get_file_size`
```rust
#[tauri::command]
pub async fn get_file_size(file_path: String) -> Result<u64, String>
```
- ファイルサイズをバイト単位で返す
- エラー時はエラーメッセージを返す

#### `delete_file`
```rust
#[tauri::command]
pub async fn delete_file(file_path: String) -> Result<(), String>
```
- 指定されたファイルを削除
- 削除成功時は`Ok(())`
- エラー時はエラーメッセージを返す

### 3.2 フロントエンド実装

#### Footer.tsx
- `useAppState`に`imageFileSize`を追加
- ファイルサイズ表示関数を追加
- 削除ボタンコンポーネントを追加
- レイアウトを調整（左から順に: ファイルサイズ、解像度、...、削除ボタン、エクスプローラーボタン）

#### Titlebar.tsx
- FloatingControlPanelから機能を移行
- propsに全ての必要な状態と関数を追加
- ガラスモーフィズムボタンスタイルを適用
- MultiMenuとSettingsMenuを統合

#### App.tsx
- FloatingControlPanelの使用を削除
- Titlebarに必要なpropsを渡す

#### AppStateContext
- `imageFileSize`状態を追加
- `setImageFileSize`関数を追加
- ファイルパス変更時にファイルサイズを取得

### 3.3 スタイリング

- 既存のガラスモーフィズムデザインを維持
- Titlebarの高さを調整（必要に応じて`h-10`または`h-12`に変更）
- ボタン間隔とサイズを調整
- レスポンシブ対応（必要に応じて）

## 実装の影響範囲

### 変更ファイル
- `src/components/Footer/index.tsx`
- `src/components/Titlebar/index.tsx`
- `src/App.tsx`
- `src/context/AppStateContext.tsx`
- `src-tauri/src/file_operations.rs`
- `src-tauri/src/lib.rs`

### 削除ファイル
- `src/components/FloatingControlPanel/index.tsx`

## 懸念事項と考慮事項

1. **Titlebarの横幅**: 多くの機能を追加するため、小さい画面での表示を確認する必要がある
2. **削除機能の安全性**: 誤削除を防ぐため、確認ダイアログを必ず表示する
3. **削除後の画像遷移**: ナビゲーション機能との連携が必要
4. **ファイルサイズ取得のパフォーマンス**: 画像変更時の取得が遅延を引き起こさないか確認
5. **既存のキーボードショートカット**: FloatingControlPanel関連のショートカットがあれば調整が必要

## テスト項目

1. フッター
   - ファイルサイズが正しく表示されるか（MB/KB形式）
   - 削除ボタンが正常に動作するか
   - 削除後の画像遷移が正しく動作するか
   - ボタンの有効/無効が適切に切り替わるか

2. Titlebar
   - 全ての機能ボタンが正常に動作するか
   - メニューが正しく表示されるか
   - ウィンドウコントロールが正常に動作するか
   - レイアウトが崩れていないか

3. 全体
   - FloatingControlPanelが完全に削除されているか
   - ビルドエラーがないか
   - パフォーマンスに問題がないか
