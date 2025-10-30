# VDI-solid CLOSEWINDOW MAX機能 実装仕様

## 概要

VDI-solidに第3引数`CLOSEWINDOW MAX`を追加し、新しいウィンドウを開く際に既存のVDIウィンドウを自動的に閉じる機能を実装します。

## 背景

VSA-launcherで写真を連続撮影した際、VDIウィンドウが大量に開いてしまう問題を解決するため、新しいウィンドウのみを表示するオプションが必要です。

## コマンドライン仕様

### 現在の仕様（v0.2.26）
```
vdi.exe [image-path] [window-mode]
```

- **image-path**: 画像ファイルのフルパス（必須）
- **window-mode**: ウィンドウモード（オプション）
  - `FullScreen`: フルスクリーン
  - `1920x1080`: カスタム解像度

### 新仕様（v0.3.0）
```
vdi.exe [image-path] [window-mode] [closewindow-mode]
```

- **image-path**: 画像ファイルのフルパス（必須）
- **window-mode**: ウィンドウモード（オプション）
  - `FullScreen`: フルスクリーン
  - `1920x1080`: カスタム解像度
  - 省略時: デフォルト800×600
- **closewindow-mode**: ウィンドウ制御モード（オプション）
  - `TRUE`: 既存VDIウィンドウを全て閉じる
  - `FALSE`: 既存ウィンドウを維持（デフォルト）
  - 省略時: `FALSE`

### 起動例

```bash
# フルスクリーン、既存ウィンドウを閉じる
vdi.exe "C:\Photos\photo.png" FullScreen TRUE

# カスタム解像度、既存ウィンドウ維持
vdi.exe "C:\Photos\photo.png" 1920x1080 FALSE

# 既存ウィンドウを閉じる（デフォルトウィンドウサイズ）
vdi.exe "C:\Photos\photo.png" "" TRUE
```

## 実装詳細（Rust/Tauri）

### 1. 依存関係追加

**Cargo.toml**に`sysinfo` crateを追加：

```toml
[dependencies]
sysinfo = "0.30"
```

### 2. コマンドライン引数パース

**src-tauri/src/main.rs**（またはエントリポイント）:

```rust
use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();

    let image_path = args.get(1).map(String::as_str).unwrap_or("");
    let window_mode = args.get(2).map(String::as_str).unwrap_or("");
    let closewindow_mode = args.get(3).map(String::as_str).unwrap_or("FALSE");

    // closewindow_modeがTRUEの場合、既存VDIプロセスを終了
    if closewindow_mode.eq_ignore_ascii_case("TRUE") {
        close_other_vdi_instances();
    }

    // 通常のアプリケーション起動処理
    tauri::Builder::default()
        .setup(move |app| {
            // image_pathとwindow_modeを使ってウィンドウを設定
            setup_window(app, image_path, window_mode)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 3. 既存VDIプロセスの終了

**src-tauri/src/process_manager.rs**（新規ファイル）:

```rust
use sysinfo::{System, Pid, ProcessExt, SystemExt};
use std::process;

/// 自プロセス以外のVDI.exeプロセスを終了する
pub fn close_other_vdi_instances() {
    let mut sys = System::new_all();
    sys.refresh_all();

    let current_pid = process::id();

    // すべてのプロセスをスキャン
    for (pid, process) in sys.processes() {
        // プロセス名がvdi.exeで、かつ自プロセスでない場合
        if process.name().eq_ignore_ascii_case("vdi.exe") && pid.as_u32() != current_pid {
            println!("既存VDIプロセスを終了: PID={}", pid);

            // プロセスを終了
            process.kill();
        }
    }
}
```

### 4. ウィンドウ設定

**src-tauri/src/window_setup.rs**（新規ファイル）:

```rust
use tauri::{App, Manager, WindowBuilder, WindowUrl};

pub fn setup_window(app: &App, image_path: &str, window_mode: &str) -> Result<(), Box<dyn std::error::Error>> {
    let window = app.get_window("main").expect("メインウィンドウが見つかりません");

    // ウィンドウモードに応じて設定
    if window_mode.eq_ignore_ascii_case("FullScreen") {
        window.set_fullscreen(true)?;
    } else if window_mode.contains('x') || window_mode.contains('X') {
        // カスタム解像度（例: 1920x1080）
        let parts: Vec<&str> = window_mode.split(|c| c == 'x' || c == 'X').collect();
        if parts.len() == 2 {
            if let (Ok(width), Ok(height)) = (parts[0].parse::<u32>(), parts[1].parse::<u32>()) {
                window.set_size(tauri::LogicalSize { width, height })?;
            }
        }
    }

    // image_pathをフロントエンドに渡す処理
    // （Tauriのイベントシステムまたは状態管理を使用）
    window.emit("load-image", image_path)?;

    Ok(())
}
```

### 5. フロントエンド連携（SolidJS）

**src/App.tsx**:

```typescript
import { listen } from '@tauri-apps/api/event';
import { onMount } from 'solid-js';

onMount(async () => {
  // Rustから送られるload-imageイベントをリッスン
  await listen<string>('load-image', (event) => {
    const imagePath = event.payload;
    console.log('画像を読み込み:', imagePath);
    // 画像表示処理
    loadImage(imagePath);
  });
});
```

## テスト計画

### 単体テスト

1. **プロセス検出テスト**
   - 複数のVDIインスタンスを起動
   - `close_other_vdi_instances()`が正しく他プロセスを検出することを確認

2. **引数パーステスト**
   - 各種引数パターンで正しく解析されることを確認

### 統合テスト

1. **シングルウィンドウモード**
   - VSA-launcherから連続撮影
   - VDIウィンドウが1つのみ表示されることを確認

2. **マルチウィンドウモード**
   - `FALSE`指定で連続撮影
   - 複数ウィンドウが開くことを確認

## 互換性

- 第3引数は省略可能なため、既存の使用方法と完全に互換性があります
- デフォルト動作（`FALSE`）は現在の動作と同じです

## セキュリティ考慮事項

- プロセス終了権限は同一ユーザー内のプロセスのみ
- 他ユーザーのVDIプロセスは終了できない（OSレベルで保護）
- プロセス名のチェックは大文字小文字を区別しない

## リリース計画

1. **実装**: 本仕様に基づいてコードを実装
2. **テスト**: ローカル環境で動作確認
3. **ビルド**: Tauriでビルド
4. **リリース**: GitHub Releasesにv0.3.0として公開

## VSA-launcherとの連携

VSA-launcher側では、`VdiLauncher.cs`で以下のようにVDIを起動します：

```csharp
// コマンドライン引数フォーマット
string arguments = $"\"{photoPath}\" {windowMode} {closeWindowMode}";

// 例: "C:\Photos\photo.png" FullScreen TRUE
```

これにより、VSA-launcherの設定に基づいて自動的にウィンドウ制御が行われます。
