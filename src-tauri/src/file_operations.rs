use std::process::Command;
use tauri::command;

/// 指定されたファイルをOSのエクスプローラーで開く
///
/// Windows環境では `explorer.exe /select,` コマンドを使用して、
/// ファイルエクスプローラーを起動し、指定されたファイルを選択状態で表示します。
///
/// # Arguments
///
/// * `file_path` - 開きたいファイルの絶対パス
///
/// # Returns
///
/// * `Ok(())` - コマンドが正常に実行された場合
/// * `Err(String)` - エラーが発生した場合、エラーメッセージを返します
///
/// # Examples
///
/// ```
/// // Tauriコマンドとしてフロントエンドから呼び出す
/// invoke('open_in_explorer', { filePath: 'C:\Users\user\image.png' })
/// ```
#[command]
pub async fn open_in_explorer(file_path: String) -> Result<(), String> {
    // 空のパスはエラー
    if file_path.is_empty() {
        return Err("File path is empty".to_string());
    }

    #[cfg(target_os = "windows")]
    {
        // Windows環境: explorer.exe /select,を使用
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
        // 現在はWindows環境のみをサポート
        Err("This feature is only supported on Windows".to_string())
    }
}