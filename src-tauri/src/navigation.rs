use std::fs;
use std::path::Path;

/// フォルダ内の画像ファイル一覧を作成日時順で取得する
///
/// # Arguments
///
/// * `folder_path` - 検索対象のフォルダパス
///
/// # Returns
///
/// * `Some(Vec<String>)` - 作成日時順にソートされた画像ファイルパスのリスト
/// * `None` - フォルダが存在しないか、画像ファイルが見つからない場合
///
/// # Notes
///
/// サポートされる画像形式: jpg, jpeg, png, gif, bmp, webp, tiff, tif, jxl
#[tauri::command]
pub fn get_folder_images(folder_path: String) -> Option<Vec<String>> {
    let folder = Path::new(&folder_path);
    if !folder.is_dir() {
        return None;
    }

    let mut images: Vec<(String, std::time::SystemTime)> = Vec::new();

    // 画像拡張子フィルター
    let image_extensions = [
        "jpg", "jpeg", "png", "gif", "bmp", "webp", "tiff", "tif", "jxl",
    ];

    if let Ok(entries) = fs::read_dir(folder) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(extension) = path.extension() {
                    let ext_str = extension.to_string_lossy().to_lowercase();
                    if image_extensions.contains(&ext_str.as_str()) {
                        if let Ok(metadata) = entry.metadata() {
                            let timestamp = metadata
                                .created()
                                .or_else(|_| metadata.modified())
                                .unwrap_or(std::time::UNIX_EPOCH);
                            images.push((path.to_string_lossy().to_string(), timestamp));
                        }
                    }
                }
            }
        }
    }

    // 作成日付順でソート（古い順）
    images.sort_by(|a, b| a.1.cmp(&b.1));

    let sorted_paths: Vec<String> = images.into_iter().map(|(path, _)| path).collect();

    if sorted_paths.is_empty() {
        None
    } else {
        Some(sorted_paths)
    }
}

/// 指定された画像の次の画像パスを取得
///
/// # Arguments
///
/// * `current_path` - 現在表示している画像ファイルのパス
/// * `folder_navigation_enabled` - フォルダ内ナビゲーションが有効かどうか
///
/// # Returns
///
/// * `Some(String)` - 次の画像のパス（ループする）
/// * `None` - ナビゲーションが無効、または親フォルダ/画像一覧が取得できない場合
#[tauri::command]
pub fn get_next_image(current_path: String, folder_navigation_enabled: bool) -> Option<String> {
    if !folder_navigation_enabled {
        return None;
    }

    let current = std::path::Path::new(&current_path);
    if let Some(parent) = current.parent() {
        if let Some(folder_images) = get_folder_images(parent.to_string_lossy().to_string()) {
            if let Some(current_index) = folder_images.iter().position(|path| path == &current_path)
            {
                let next_index = (current_index + 1) % folder_images.len();
                return Some(folder_images[next_index].clone());
            }
        }
    }
    None
}

/// 指定された画像の前の画像パスを取得
///
/// # Arguments
///
/// * `current_path` - 現在表示している画像ファイルのパス
/// * `folder_navigation_enabled` - フォルダ内ナビゲーションが有効かどうか
///
/// # Returns
///
/// * `Some(String)` - 前の画像のパス（ループする）
/// * `None` - ナビゲーションが無効、または親フォルダ/画像一覧が取得できない場合
#[tauri::command]
pub fn get_previous_image(current_path: String, folder_navigation_enabled: bool) -> Option<String> {
    if !folder_navigation_enabled {
        return None;
    }

    let current = std::path::Path::new(&current_path);
    if let Some(parent) = current.parent() {
        if let Some(folder_images) = get_folder_images(parent.to_string_lossy().to_string()) {
            if let Some(current_index) = folder_images.iter().position(|path| path == &current_path)
            {
                let prev_index = if current_index == 0 {
                    folder_images.len() - 1
                } else {
                    current_index - 1
                };
                return Some(folder_images[prev_index].clone());
            }
        }
    }
    None
}
