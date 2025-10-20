use std::fs;
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

/// 指定されたファイルのサイズをバイト単位で取得する
///
/// ファイルのメタデータを読み取り、サイズを返します。
///
/// # Arguments
///
/// * `file_path` - サイズを取得したいファイルの絶対パス
///
/// # Returns
///
/// * `Ok(u64)` - ファイルサイズ（バイト単位）
/// * `Err(String)` - エラーが発生した場合、エラーメッセージを返します
///
/// # Examples
///
/// ```
/// // Tauriコマンドとしてフロントエンドから呼び出す
/// invoke('get_file_size', { filePath: 'C:\Users\user\image.png' })
/// ```
#[command]
pub async fn get_file_size(file_path: String) -> Result<u64, String> {
    // 空のパスはエラー
    if file_path.is_empty() {
        return Err("File path is empty".to_string());
    }

    // ファイルのメタデータを取得
    match fs::metadata(&file_path) {
        Ok(metadata) => Ok(metadata.len()),
        Err(e) => Err(format!("Failed to get file size: {}", e)),
    }
}

/// 指定されたファイルを削除する
///
/// ファイルシステムから指定されたファイルを永久に削除します。
/// この操作は取り消せないため、慎重に使用してください。
///
/// # Arguments
///
/// * `file_path` - 削除したいファイルの絶対パス
///
/// # Returns
///
/// * `Ok(())` - ファイルが正常に削除された場合
/// * `Err(String)` - エラーが発生した場合、エラーメッセージを返します
///
/// # Examples
///
/// ```
/// // Tauriコマンドとしてフロントエンドから呼び出す
/// invoke('delete_file', { filePath: 'C:\Users\user\image.png' })
/// ```
#[command]
pub async fn delete_file(file_path: String) -> Result<(), String> {
    // 空のパスはエラー
    if file_path.is_empty() {
        return Err("File path is empty".to_string());
    }

    // ファイルが存在するか確認
    if !std::path::Path::new(&file_path).exists() {
        return Err(format!("File does not exist: {}", file_path));
    }

    // ファイルを削除
    match fs::remove_file(&file_path) {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to delete file: {}", e)),
    }
}