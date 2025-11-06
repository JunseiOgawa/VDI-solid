use tauri::Manager;
use tauri_plugin_fs::init as fs_init;

mod cli_args;
mod file_operations;
mod histogram;
mod img;
mod navigation;
mod peaking;
mod process_manager;
mod profiling;

/// ウィンドウを表示するコマンド
///
/// フロントエンドの初期化が完了した後に呼び出され、
/// 非表示で起動していたウィンドウを表示します。
#[tauri::command]
fn show_window(window: tauri::Window) -> Result<(), String> {
    #[cfg(feature = "profiling")]
    {
        let _span = tracing::info_span!("show_window_command").entered();
        let start = std::time::Instant::now();
        let result = window.show().map_err(|e| e.to_string());
        let elapsed = start.elapsed();
        tracing::info!(
            duration_ms = elapsed.as_millis() as u64,
            success = result.is_ok(),
            "show_window command completed"
        );
        result
    }
    #[cfg(not(feature = "profiling"))]
    window.show().map_err(|e| e.to_string())
}

/// コマンドライン引数から起動設定を取得するコマンド
///
/// アプリケーション起動時に指定されたコマンドライン引数をパースし、
/// ピーキングとグリッド線の初期設定を返します。
///
/// # Returns
///
/// * `LaunchConfig` - パースされた起動設定を返します。引数が指定されていない項目は`None`になります。
#[tauri::command]
fn get_launch_config() -> cli_args::LaunchConfig {
    cli_args::LaunchConfig::from_args()
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
///
/// # Note
///
/// 非同期で実行され、起動時のブロッキングを防ぎます。
#[tauri::command]
async fn get_system_theme() -> String {
    #[cfg(target_os = "windows")]
    {
        use tokio::process::Command;

        // Windowsレジストリから現在のテーマ設定を読み取り
        // AppsUseLightTheme: 0x1 = ライト, 0x0 = ダーク
        // 非同期で実行し、起動時のブロッキングを防ぐ
        let output = Command::new("reg")
            .args(&[
                "query",
                "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize",
                "/v",
                "AppsUseLightTheme",
            ])
            .output()
            .await;

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
        use tokio::process::Command;

        // macOSのグローバル設定からAppleInterfaceStyleを取得
        // "Dark"が返されればダークモード、それ以外はライトモード
        // 非同期で実行し、起動時のブロッキングを防ぐ
        let output = Command::new("defaults")
            .args(&["read", "-g", "AppleInterfaceStyle"])
            .output()
            .await;

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
        use tokio::process::Command;

        // GNOME環境のgsettingsからGTKテーマ名を取得
        // テーマ名に"dark"が含まれていればダークモードと判定
        // 非同期で実行し、起動時のブロッキングを防ぐ
        let output = Command::new("gsettings")
            .args(&["get", "org.gnome.desktop.interface", "gtk-theme"])
            .output()
            .await;

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
/// 1. 引数 1: 起動時に表示する画像パス（オプション）
/// 2. 引数 2: ウィンドウモード/サイズ（例: `FullScreen` または `1920x1080`）
/// 3. オプション引数: `--peaking-enabled`, `--grid-pattern` など
///
/// # 動作
///
/// * `FullScreen` を指定するとフルスクリーンに遷移します。
/// * `WIDTHxHEIGHT` の形式を渡すと指定解像度にウィンドウサイズを設定します。
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(feature = "profiling")]
    {
        profiling::init_tracing();
        tracing::info!("Application run() started");
    }

    // コマンドライン引数から起動設定を取得
    #[cfg(feature = "profiling")]
    let launch_config = {
        let _span = tracing::info_span!("parse_launch_config").entered();
        let start = std::time::Instant::now();
        let config = cli_args::LaunchConfig::from_args();
        let elapsed = start.elapsed();
        tracing::info!(
            duration_ms = elapsed.as_millis() as u64,
            "Launch config parsed"
        );
        config
    };
    #[cfg(not(feature = "profiling"))]
    let launch_config = cli_args::LaunchConfig::from_args();

    let window_mode = launch_config.window_mode;

    if launch_config.close_existing_windows.unwrap_or(false) {
        #[cfg(feature = "profiling")]
        {
            let _span = tracing::info_span!("close_other_instances").entered();
            let start = std::time::Instant::now();
            process_manager::close_other_vdi_instances();
            let elapsed = start.elapsed();
            tracing::info!(
                duration_ms = elapsed.as_millis() as u64,
                "Other instances closed"
            );
        }
        #[cfg(not(feature = "profiling"))]
        process_manager::close_other_vdi_instances();
    }

    #[cfg(feature = "profiling")]
    tracing::info!("Starting Tauri builder initialization");

    #[cfg(feature = "profiling")]
    let builder = {
        let _span = tracing::info_span!("tauri_builder_init").entered();
        tauri::Builder::default()
    };
    #[cfg(not(feature = "profiling"))]
    let builder = tauri::Builder::default();

    // 軽量プラグインから順に初期化して起動速度を最適化
    #[cfg(feature = "profiling")]
    let builder = {
        let _span = tracing::info_span!("plugin_opener_init").entered();
        let start = std::time::Instant::now();
        let b = builder.plugin(tauri_plugin_opener::init());
        let elapsed = start.elapsed();
        tracing::info!(
            duration_ms = elapsed.as_millis() as u64,
            "opener plugin initialized"
        );
        b
    };
    #[cfg(not(feature = "profiling"))]
    let builder = builder.plugin(tauri_plugin_opener::init());

    #[cfg(feature = "profiling")]
    let builder = {
        let _span = tracing::info_span!("plugin_fs_init").entered();
        let start = std::time::Instant::now();
        let b = builder.plugin(fs_init());
        let elapsed = start.elapsed();
        tracing::info!(
            duration_ms = elapsed.as_millis() as u64,
            "fs plugin initialized"
        );
        b
    };
    #[cfg(not(feature = "profiling"))]
    let builder = builder.plugin(fs_init());

    #[cfg(feature = "profiling")]
    let builder = {
        let _span = tracing::info_span!("plugin_dialog_init").entered();
        let start = std::time::Instant::now();
        let b = builder.plugin(tauri_plugin_dialog::init());
        let elapsed = start.elapsed();
        tracing::info!(
            duration_ms = elapsed.as_millis() as u64,
            "dialog plugin initialized"
        );
        b
    };
    #[cfg(not(feature = "profiling"))]
    let builder = builder.plugin(tauri_plugin_dialog::init());

    builder
        .invoke_handler(tauri::generate_handler![
            img::get_launch_image_path,
            img::get_launch_window_mode,
            navigation::get_folder_images,
            navigation::get_next_image,
            navigation::get_previous_image,
            get_system_theme,
            get_launch_config,
            show_window,
            img::rotate_image,
            img::create_image_backup,
            img::restore_image_from_backup,
            img::cleanup_image_backup,
            peaking::focus_peaking,
            histogram::calculate_histogram,
            file_operations::open_in_explorer,
            file_operations::get_file_size,
            file_operations::delete_file
        ])
        .setup(move |app| {
            #[cfg(feature = "profiling")]
            let _span = tracing::info_span!("tauri_setup").entered();

            // Desktop専用のプラグインを登録
            #[cfg(desktop)]
            {
                #[cfg(feature = "profiling")]
                {
                    let _span = tracing::info_span!("desktop_plugins_init").entered();
                    let start = std::time::Instant::now();

                    app.handle()
                        .plugin(tauri_plugin_updater::Builder::new().build())?;

                    let updater_elapsed = start.elapsed();
                    tracing::info!(
                        duration_ms = updater_elapsed.as_millis() as u64,
                        "updater plugin initialized"
                    );

                    let start = std::time::Instant::now();
                    app.handle().plugin(tauri_plugin_process::init())?;

                    let process_elapsed = start.elapsed();
                    tracing::info!(
                        duration_ms = process_elapsed.as_millis() as u64,
                        "process plugin initialized"
                    );
                }
                #[cfg(not(feature = "profiling"))]
                {
                    app.handle()
                        .plugin(tauri_plugin_updater::Builder::new().build())?;
                    app.handle().plugin(tauri_plugin_process::init())?;
                }
            }

            // メインウィンドウを取得して右クリックメニューとテキスト選択を無効化
            if let Some((_, window)) = app.webview_windows().iter().next() {
                // JavaScriptで右クリックメニューを無効化
                window
                    .eval("document.addEventListener('contextmenu', (e) => e.preventDefault())")
                    .ok();
                // JavaScriptでテキスト選択を無効化
                window
                    .eval(
                        "document.body.style.userSelect = 'none'; \
                     document.body.style.webkitUserSelect = 'none';",
                    )
                    .ok();
            }

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
