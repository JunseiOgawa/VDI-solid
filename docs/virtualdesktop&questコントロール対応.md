# VirtualDesktop & Questコントローラー対応 要件定義書

## 概要

VRゴーグル(Meta Quest)でVirtualDesktopを使用してデスクトップ操作を行う際、このアプリケーションがVirtualDesktop環境を検知し、Questコントローラーでの操作に対応する機能を追加する。

## 背景と目的

### 現在の課題

- VR環境でデスクトップアプリを操作する際、マウスやキーボードが使いにくい
- VirtualDesktopでデスクトップを表示している状態で、画像ビューワーアプリをコントローラーで快適に操作したい
- 既存のマウス/キーボード操作をVRコントローラーの入力にマッピングしたい

### 目的

1. **VirtualDesktop環境の自動検知**: アプリがVirtualDesktop経由で起動されていることを検知
2. **VirtualDesktopモードの切り替え**: 検知時にvirtualdesktopModeをONに設定
3. **コントローラー入力の対応**: Questコントローラーの入力を既存の操作にマッピング
4. **キーバインドのカスタマイズ**: ユーザーが自由にキーバインドを変更可能

## 要件定義

### 機能要件

#### FR-1: VirtualDesktop環境の検知

**説明**: アプリケーション起動時またはランタイムにVirtualDesktop環境を検知する

**実装方法の選択肢**:

2. **方法B: プロセス名/ウィンドウタイトル確認（間接的）**
   - VirtualDesktopのプロセス（VirtualDesktop.Streamer.exe）が実行中かチェック
   - **利点**: 実装がシンプル
   - **欠点**: 間接的な判定、誤検知の可能性
   - **注意点**: Virtual Desktopのバックグラウンド動時にもプロセスが存在するため、誤検知のリスクがある。可能であれば、ウィンドウタイトルや他の識別情報も併用して精度を上げる。

3. **方法C: ユーザー設定による明示的な指定（最もシンプル）**
   - ユーザーが設定メニューで「VirtualDesktopモード」を手動でON/OFF
   - **利点**: 確実、実装が最も簡単
   - **欠点**: ユーザーの手動操作が必要

**推奨**: 方法Cをベースとし、将来的に方法Bでの自動検知を追加

#### FR-2: VirtualDesktopモードの状態管理

**説明**: virtualdesktopModeフラグを管理し、UIに反映する

**実装内容**:
- AppStateContextに`virtualdesktopMode: () => boolean`を追加
- `setVirtualDesktopMode: (enabled: boolean) => void`で状態を変更
- localStorageに設定を永続化
- SettingsMenuにトグルスイッチを追加

**UI表示**:
```tsx
<label class="flex items-center gap-2">
  <input
    type="checkbox"
    checked={virtualdesktopMode()}
    onChange={(e) => setVirtualDesktopMode(e.currentTarget.checked)}
  />
  <span>VirtualDesktopモード</span>
</label>
```

#### FR-3: Questコントローラー入力の取得

**説明**: Questコントローラーの入力を取得し、アプリ内の操作にマッピングする

**実装方法の選択肢**:
**方法B: Virtual Desktopのゲームパッドエミュレーション経由（最も現実的）**
   - Virtual Desktopの「Use Touch controllers as gamepad」機能を有効化
   - コントローラーがXbox 360コントローラーとしてエミュレートされる
   - Rustクレート: `gilrs`（クロスプラットフォーム）または`rusty-xinput`（Windows専用）
   - **利点**: 実装がシンプル、既存のゲームパッドライブラリが使える、Tauriとの統合が容易
   - **欠点**: Virtual Desktopの設定に依存、間接的な方法
   - 追記: アプリ側で「自動セットアップ（ガイド）」チェックを提供（Virtual Desktopの設定はQuest側アプリのため外部から直接変更不可。手順ガイド＋自動検知でユーザー操作を最小化）


**推奨**: 方法B（Virtual Desktopのゲームパッドエミュレーション経由）

**理由**:
- Virtual Desktopユーザーは既にこの機能を使える
- 実装が比較的シンプル
- Tauriコマンドで簡単にフロントエンドに公開できる
- キーバインドのカスタマイズが容易

#### FR-4: コントローラー入力のマッピング

**説明**: コントローラーボタン/スティック入力を既存の操作にマッピング

**デフォルトキーバインド案**:

| コントローラー入力 | マッピング先の操作 | 説明 |
|------------------|------------------|------|
| 左スティック | パン（画像移動） | 画像をドラッグ移動 |
| 右スティック上/下 | ズームイン/アウト | 画像を拡大縮小 |
| Aボタン | 画像切り替え（次） | 次の画像を表示 |
| Bボタン | 画像切り替え（前） | 前の画像を表示 |
| Xボタン | 画面フィット | 画像を画面にフィット |
| Yボタン | ズームリセット | ズームを100%に戻す |
| LBボタン | 回転（左90度） | 画像を左に90度回転 |
| RBボタン | 回転（右90度） | 画像を右に90度回転 |
| LTトリガー | グリッド表示切替 | グリッドON/OFF |
| RTトリガー | ピーキング表示切替 | ピーキングON/OFF |
| Startボタン | 設定メニュー表示 | 設定メニューを開く |
| Backボタン | - | 未使用（将来の拡張用） |

**実装方法**:
1. Rust側でゲームパッド入力をポーリング
2. 入力状態をTauriコマンド経由でフロントエンドに送信
3. フロントエンド側で対応する操作を実行

**Rustコード例**:
```rust
use gilrs::{Gilrs, Event, Button};

#[tauri::command]
fn poll_controller_input() -> Result<ControllerState, String> {
    let mut gilrs = Gilrs::new().map_err(|e| e.to_string())?;

    // イベントをポーリング
    while let Some(Event { id, event, time }) = gilrs.next_event() {
        match event {
            gilrs::EventType::ButtonPressed(button, _) => {
                // ボタン押下処理
            }
            gilrs::EventType::AxisChanged(axis, value, _) => {
                // スティック/トリガー処理
            }
            _ => {}
        }
    }

    Ok(ControllerState { /* ... */ })
}

##### 自動セットアップ（ガイド）フロー

- 目的: ユーザーがVirtual Desktopの「Use controllers as gamepad」を手動でONにする作業を、アプリ内ウィザードで最小化する。
- 制約: 当該設定はQuest側Virtual DesktopアプリのUIにあり、公開API/レジストリ/CLIが存在しないため、外部アプリからの直接切り替えは不可。

実行フロー:
1. VDストリーマー検知: `VirtualDesktop.Streamer.exe`の稼働を`sysinfo`で確認（未検出なら案内表示）。
2. XInputデバイス検知: `gilrs`でXbox 360/XInputデバイスの存在をチェック。
3. 未検出時ガイド: モーダルで手順提示（スクリーンショット/図）：
   - Quest内でVirtual Desktopメニュー → Settings → Controllers → 「Use controllers as gamepad」をON。
3-1. に度と表示しないにチェックが入ると次回から表示しない
4. リトライ: 「再検出」ボタンで(2)を再実行、検出成功で完了バッジ表示＋有効化日時を保存。

UI仕様（設定メニュー内）:
- チェックボックス: 「自動セットアップ（ガイド）を開始」
- ステータス表示: [未検出]/[検出済み]/[再試行中]
- ヘルプ: 手順ドキュメント/FAQへのリンク、QRコード表示（Questブラウザで閲覧用）
```

#### FR-5: キーバインドのカスタマイズ

**説明**: ユーザーが自由にキーバインドを変更できる設定画面を提供

**実装内容**:

1. **設定データ構造**:
```typescript
interface ControllerBinding {
  action: string; // 'zoomIn', 'zoomOut', 'nextImage', etc.
  input: string;  // 'ButtonA', 'AxisLeftY', etc.
}

interface ControllerConfig {
  enabled: boolean;
  bindings: ControllerBinding[];
}
```

2. **設定画面**:
- SettingsMenuに「コントローラー設定」セクションを追加
- 各操作に対して入力を割り当てるUI
- 「デフォルトに戻す」ボタン
- localStorageに保存

3. **設定UI例**:
```tsx
<div class="controller-settings">
  <h3>コントローラー設定</h3>

  {Object.entries(controllerBindings()).map(([action, input]) => (
    <div class="binding-row">
      <span>{getActionLabel(action)}</span>
      <button onClick={() => startRebinding(action)}>
        {input || '未設定'}
      </button>
    </div>
  ))}

  <button onClick={resetToDefaults}>デフォルトに戻す</button>
</div>
```

### 非機能要件

#### NFR-1: パフォーマンス

- コントローラー入力のポーリング頻度: 60Hz（約16ms間隔）
- 入力遅延: 50ms以内
- CPU使用率への影響: 5%以内

#### NFR-2: 互換性

- Windows 10/11対応
- Virtual Desktop最新版との互換性
- Tauri 2.x対応

#### NFR-3: ユーザビリティ

- VirtualDesktopモードON/OFF切り替えが設定メニューから簡単にできる
- キーバインド設定画面が直感的
- デフォルト設定で基本操作が可能

## 技術的実現可能性の評価

### 実現可能性: **高い**

以下の理由により、この機能は十分に実現可能です。

#### 1. VirtualDesktop検知

**実装難易度**: 低〜中

- **方法C（ユーザー設定）**: 実装が非常に簡単（1〜2時間）
- **方法B（プロセス検知）**: Rustの`sysinfo`クレートで実装可能（3〜5時間）
- **方法A（OpenXR）**: 複雑だが技術的には可能（1〜2日）

#### 2. コントローラー入力取得

**実装難易度**: 中

- **推奨方法B**: gilrsクレートを使用
- Tauriコマンドで入力状態を取得: 実装可能
- Virtual Desktopのゲームパッドエミュレーション機能を利用: ユーザー設定で有効化

**必要なRust依存関係**:
```toml
[dependencies]
gilrs = "0.10"  # ゲームパッドライブラリ
serde = { version = "1.0", features = ["derive"] }
```

**実装時間**: 2〜3日

#### 3. キーバインドシステム

**実装難易度**: 中

- 設定データの永続化: localStorage使用
- 設定UIの作成: SolidJSで実装
- 入力マッピングロジック: フロントエンド側で実装

**実装時間**: 1〜2日

### 実装の優先順位

#### Phase 1: 基本機能（必須）

1. ✅ VirtualDesktopモード設定の追加（手動ON/OFF）
2. ✅ gilrsクレートの統合
3. ✅ 基本的なコントローラー入力取得
4. ✅ デフォルトキーバインドの実装

**所要時間**: 3〜5日

#### Phase 2: カスタマイズ機能（推奨）

1. キーバインド設定画面の実装
2. 設定の永続化
3. デフォルトへのリセット機能

**所要時間**: 2〜3日

#### Phase 3: 高度な機能（オプション）

1. VirtualDesktop自動検知（プロセス監視）
2. コントローラー入力のスムージング
3. 振動フィードバック対応

**所要時間**: 3〜5日

## 実装アーキテクチャ

### システム構成

```
┌─────────────────────────────────────────┐
│         VirtualDesktop環境              │
│  ┌───────────────────────────────────┐ │
│  │     Meta Quest + VRコントローラー  │ │
│  └───────────────────────────────────┘ │
│                  ↓                      │
│  ┌───────────────────────────────────┐ │
│  │   Virtual Desktop Streamer        │ │
│  │   (ゲームパッドエミュレーション)  │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
                  ↓ XInput API
┌─────────────────────────────────────────┐
│      VDI-solid (Tauriアプリ)             │
│  ┌───────────────────────────────────┐ │
│  │  Rust Backend                     │ │
│  │  - gilrsでXInput取得              │ │
│  │  - 入力状態の管理                 │ │
│  │  - Tauriコマンド公開              │ │
│  └───────────────────────────────────┘ │
│                  ↓                      │
│  ┌───────────────────────────────────┐ │
│  │  SolidJS Frontend                 │ │
│  │  - 入力マッピング処理             │ │
│  │  - キーバインド設定UI             │ │
│  │  - AppStateContext更新            │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### ファイル構成

#### 新規作成ファイル

```
src-tauri/src/
  ├── controller.rs          # コントローラー入力処理
  └── controller_config.rs   # キーバインド設定管理

src/
  ├── context/
  │   └── ControllerContext.tsx    # コントローラー状態管理
  ├── components/
  │   └── SettingsMenu/
  │       └── ControllerSettings.tsx  # 設定UI
  └── lib/
      └── controllerMapping.ts     # 入力マッピングロジック
```

#### 修正ファイル

```
src/context/AppStateContext.tsx   # virtualdesktopMode追加
src/components/SettingsMenu/index.tsx  # コントローラー設定セクション追加
src/config/config.ts              # デフォルトキーバインド定義
```

### データフロー

```
1. Rust側でコントローラー入力をポーリング（60Hz）
   ↓
2. Tauriコマンド経由でフロントエンドに送信
   ↓
3. ControllerContextで入力状態を管理
   ↓
4. controllerMapping.tsで入力をアクションにマッピング
   ↓
5. 対応するAppState関数を呼び出し
   ↓
6. UIが更新される
```

## リスクと対策

### リスク1: Virtual Desktopの設定が必要

**内容**: ユーザーがVirtual Desktopで「Use Touch controllers as gamepad」を有効化する必要がある

**対策**:
- 設定方法を説明するドキュメントを作成
- アプリ内にヘルプボタンを配置し、設定手順を表示
- コントローラーが検出されない場合は警告メッセージを表示

### リスク2: 入力遅延

**内容**: VirtualDesktop経由のため、入力遅延が発生する可能性がある

**対策**:
- ポーリング頻度を調整可能にする
- 入力スムージングを実装して体感遅延を軽減
- デッドゾーンの調整機能を追加

### リスク3: 他のゲームパッドとの競合

**内容**: 他のゲームパッドが接続されている場合、誤検知する可能性がある

**対策**:
- コントローラー選択機能を実装
- デバイス名で識別して優先順位を設定
- 設定画面で使用するコントローラーを明示的に選択できるようにする

## 追加検討事項

### Q1: VirtualDesktop以外のVRストリーミングソフト（ALVR、Oculus Link等）にも対応すべきか？

**回答**: Phase 3以降で検討。基本設計をVirtualDesktop専用にせず、他のソフトウェアにも拡張可能にする。

### Q2: コントローラーの種類（Quest 2 / Quest 3 / Quest Pro）によって挙動が変わるか？

**回答**: Virtual Desktopのゲームパッドエミュレーションを使用する限り、同じXInput APIを経由するため、差異はない。

### Q3: 将来的にVR空間内でのUI表示（オーバーレイ）に対応すべきか？

**回答**: 現時点では対応しない。VirtualDesktopのデスクトップビュー内での操作に限定する。将来的にOpenXRベースのVRオーバーレイ機能を追加する可能性はある。

### Q4: マルチモニター環境でも正常に動作するか？

**回答**: VirtualDesktopがマルチモニターに対応しているため、問題なし。ただし、テストは必要。

## 参考資料

### 使用するRustクレート

- [gilrs](https://crates.io/crates/gilrs) - クロスプラットフォームゲームパッドライブラリ
- [rusty-xinput](https://crates.io/crates/rusty-xinput) - Windows XInput専用ライブラリ（代替案）
- [sysinfo](https://crates.io/crates/sysinfo) - システム情報取得（プロセス監視用）
- [openxrs](https://crates.io/crates/openxr) - OpenXRバインディング（将来の拡張用）

### 参考ドキュメント

- [Virtual Desktop公式サイト](https://www.vrdesktop.net/)
- [OpenXR仕様書](https://registry.khronos.org/OpenXR/specs/1.0/html/xrspec.html)
- [XInput API (Microsoft)](https://learn.microsoft.com/en-us/windows/win32/xinput/xinput-game-controller-apis-portal)
- [Tauri Commands](https://v2.tauri.app/develop/calling-rust/)

## 次のステップ

1. ✅ 要件定義の確認と承認
2. 詳細設計書の作成
3. Phase 1の実装開始
4. ユーザーテスト
5. Phase 2以降の実装判断

## 不明点・質問事項

以下の点について、追加で確認が必要です：

1. **コントローラー入力の優先度**: 既存のマウス/キーボード操作と、コントローラー操作のどちらを優先すべきか？
   - 案1: virtualdesktopMode=ON時はコントローラー専用（マウス/キーボード無効）
   - 案2: 常に両方の入力を受け付ける（推奨）

2. **デフォルトキーバインド**: 提案したマッピングで問題ないか？特に変更したい操作はあるか？

3. **実装の優先度**: Phase 1の実装をすぐに開始すべきか、それとも他の機能を先に実装すべきか？

4. **UIの配置**: VirtualDesktopモードのON/OFFトグルをどこに配置するか？
   - 案1: SettingsMenu内（推奨）
   - 案2: Titlebarに専用ボタン
   - 案3: Footerに状態表示

5. **コントローラー接続状態の表示**: コントローラーが接続されているかどうかをUIに表示すべきか？

これらの質問に回答いただければ、さらに詳細な設計を進められます。
