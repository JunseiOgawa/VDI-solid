use tauri::Manager;
use tauri_plugin_fs::init as fs_init;

mod img;
mod peaking;

/// ウィンドウを表示するコマンド
///
/// フロントエンドの初期化が完了した後に呼び出され、
/// 非表示で起動していたウィンドウを表示します。
#[tauri::command]
fn show_window(window: tauri::Window) -> Result<(), String> {
    window.show().map_err(|e| e.to_string())
}

/// OSのテーマ設定（ライト/ダークモード）を取得するコマンド
///
/// プラットフォームごとに方法が異なります:
/// - Windows: レジストリの `AppsUseLightTheme` 値を確認
/// - macOS: `defaults read -g AppleInterfaceStyle` を確認
/// - Linux: `gsettings` で GTK テーマ名を確認
///
/// # Returns
///
/// * `String` - "light" または "dark" を返します。取得に失敗した場合はフォールバックで "light" を返します。
#[tauri::command]
fn get_system_theme() -> String {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;

        // Windowsレジストリから現在のテーマ設定を読み取り
        // AppsUseLightTheme: 0x1 = ライト, 0x0 = ダーク
        let output = Command::new("reg")
            .args(&[
                "query",
                "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize",
                "/v",
                "AppsUseLightTheme",
            ])
            .output();

        if let Ok(output) = output {
            let output_str = String::from_utf8_lossy(&output.stdout);
            // レジストリ値が0x0（ダークモード）か0x1（ライトモード）かを判定
            if output_str.contains("0x0") {
                return "dark".to_string();
            } else if output_str.contains("0x1") {
                return "light".to_string();
            }
        }
        // レジストリ読み取りに失敗した場合のフォールバック
        return "light".to_string();
    }

    #[cfg(target_os = "macos")]
    {
        use std::process::Command;

        // macOSのグローバル設定からAppleInterfaceStyleを取得
        // "Dark"が返されればダークモード、それ以外はライトモード
        let output = Command::new("defaults")
            .args(&["read", "-g", "AppleInterfaceStyle"])
            .output();

        if let Ok(output) = output {
            let output_str = String::from_utf8_lossy(&output.stdout);
            if output_str.trim() == "Dark" {
                return "dark".to_string();
            }
        }
        // AppleInterfaceStyleが設定されていない = ライトモード
        return "light".to_string();
    }

    #[cfg(target_os = "linux")]
    {
        use std::process::Command;

        // GNOME環境のgsettingsからGTKテーマ名を取得
        // テーマ名に"dark"が含まれていればダークモードと判定
        let output = Command::new("gsettings")
            .args(&["get", "org.gnome.desktop.interface", "gtk-theme"])
            .output();

        if let Ok(output) = output {
            let output_str = String::from_utf8_lossy(&output.stdout);
            if output_str.to_lowercase().contains("dark") {
                return "dark".to_string();
            }
        }
        // gsettingsが利用できない環境やダークテーマでない場合
        "light".to_string()
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        // その他のプラットフォーム用フォールバック
        "light".to_string()
    }
}

/// Tauri アプリケーションのエントリーポイント
///
/// アプリ起動時にウィンドウサイズ/モードを引数から読み取り、ウィンドウに反映します。
///
/// 起動引数の仕様（例）:
/// 1. 引数 1: 起動時に表示する画像パス（オプション、`img` モジュールで処理）
/// 2. 引数 2: ウィンドウモード/サイズ（例: `FullScreen` または `1920x1080`）
///
/// # 動作
///
/// * `FullScreen` を指定するとフルスクリーンに遷移します。
/// * `WIDTHxHEIGHT` の形式を渡すと指定解像度にウィンドウサイズを設定します。
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 起動引数から画面サイズ設定を取得
    let window_mode = std::env::args().nth(2);

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(fs_init())
        .invoke_handler(tauri::generate_handler![
            img::get_launch_image_path,
            img::get_launch_window_mode,
            img::get_folder_images,
            img::get_next_image,
            img::get_previous_image,
            get_system_theme,
            show_window,
            img::rotate_image,
            img::create_image_backup,
            img::restore_image_from_backup,
            img::cleanup_image_backup,
            peaking::focus_peaking
        ])
        .setup(move |app| {
            // ウィンドウサイズに応じて設定を変更
            if let Some(mode) = &window_mode {
                match mode.as_str() {
                    "FullScreen" => {
                        let windows = app.webview_windows();
                        if let Some((_, window)) = windows.iter().next() {
                            window.set_fullscreen(true).unwrap();
                        }
                    }
                    mode_str if mode_str.contains('x') => {
                        // 解像度指定 (例: "1920x1080")
                        if let Some((width_str, height_str)) = mode_str.split_once('x') {
                            if let (Ok(width), Ok(height)) =
                                (width_str.parse::<u32>(), height_str.parse::<u32>())
                            {
                                let windows = app.webview_windows();
                                if let Some((_, window)) = windows.iter().next() {
                                    window
                                        .set_size(tauri::LogicalSize::new(width, height))
                                        .unwrap();
                                }
                            }
                        }
                    }
                    _ => {
                        // 不正な値の場合はデフォルトサイズ（何もしない）
                    }
                }
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
