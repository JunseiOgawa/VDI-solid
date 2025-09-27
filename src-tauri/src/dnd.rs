use serde::Serialize;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri_plugin_fs::FsExt;

#[derive(Serialize)]
pub struct ProcessedFilePath {
    pub original_path: String,
    pub canonical_path: String,
    pub asset_url: String,
    pub file_name: String,
}

const SUPPORTED_EXTENSIONS: &[&str] = &[
    "jpg", "jpeg", "png", "gif", "bmp", "webp", "tiff", "tif", "avif",
];

#[tauri::command]
pub async fn process_file_path(
    app_handle: AppHandle,
    path: String,
) -> Result<ProcessedFilePath, String> {
    let trimmed = path.trim();
    if trimmed.is_empty() {
        println!("[process_file_path] Empty path received");
        return Err("ファイルパスが空です".to_string());
    }

    let original_path = trimmed.to_string();
    println!("[process_file_path] Received path: {}", original_path);

    let candidate_path = PathBuf::from(trimmed);
    if !candidate_path.exists() {
        println!("[process_file_path] File does not exist: {}", original_path);
        return Err(format!("ファイルが見つかりません: {}", original_path));
    }

    if !candidate_path.is_file() {
        println!("[process_file_path] Path is not a file: {}", original_path);
        return Err("フォルダはサポートしていません".to_string());
    }

    let extension_valid = candidate_path
        .extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| {
            let ext_lower = ext.to_ascii_lowercase();
            let supported = SUPPORTED_EXTENSIONS.contains(&ext_lower.as_str());
            if !supported {
                println!(
                    "[process_file_path] Unsupported extension: {} (original path: {})",
                    ext_lower, original_path
                );
            }
            supported
        })
        .unwrap_or(false);

    if !extension_valid {
        return Err("対応していないファイル形式です".to_string());
    }

    let canonical = std::fs::canonicalize(&candidate_path).map_err(|err| {
        println!(
            "[process_file_path] Failed to canonicalize path: {} ({})",
            original_path, err
        );
        format!("パスの解決に失敗しました: {}", err)
    })?;

    // Ensure the webview can access the file via the asset protocol scope.
    if let Err(err) = app_handle.fs_scope().allow_file(&canonical) {
        println!(
            "[process_file_path] Failed to allow file in asset scope: {} ({})",
            canonical.display(),
            err
        );
        return Err(format!(
            "ファイルを読み込み対象に追加できませんでした: {}",
            err
        ));
    }

    let file_url = url::Url::from_file_path(&canonical)
        .map_err(|_| "ファイルURLの生成に失敗しました".to_string())?;
    let asset_url = file_url
        .as_str()
        .replacen("file://", "asset://localhost", 1);

    let file_name = canonical
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or_default()
        .to_string();

    let processed = ProcessedFilePath {
        original_path,
        canonical_path: canonical.to_string_lossy().to_string(),
        asset_url,
        file_name,
    };

    println!(
        "[process_file_path] Successfully processed file: {} -> {}",
        processed.original_path, processed.asset_url
    );

    Ok(processed)
}
