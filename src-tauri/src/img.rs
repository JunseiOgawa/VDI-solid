use image::ImageFormat;
use std::path::Path;

/// 画像ファイルのバックアップを作成する
///
/// # Arguments
///
/// * `image_path` - バックアップを作成する画像ファイルのパス
///
/// # Returns
///
/// * `Ok(String)` - 作成されたバックアップファイルのパス
/// * `Err(String)` - エラーメッセージ
///
/// # Errors
///
/// * ファイルが存在しない場合
/// * ファイルのコピーに失敗した場合
#[tauri::command]
pub async fn create_image_backup(image_path: String) -> Result<String, String> {
    let path = std::path::Path::new(&image_path);

    if !path.exists() {
        return Err("指定されたファイルが存在しません".to_string());
    }

    // バックアップファイル名を生成
    let backup_path = format!("{}.backup", image_path);

    // ファイルをコピーしてバックアップ作成
    std::fs::copy(&image_path, &backup_path)
        .map_err(|e| format!("バックアップ作成に失敗しました: {}", e))?;

    Ok(backup_path)
}

/// バックアップから画像を復元する
///
/// バックアップファイルから元の画像を復元し、バックアップファイルを削除します。
///
/// # Arguments
///
/// * `image_path` - 復元先の画像ファイルパス
///
/// # Returns
///
/// * `Ok(String)` - 復元された画像ファイルのパス
/// * `Err(String)` - エラーメッセージ
///
/// # Errors
///
/// * バックアップファイルが存在しない場合
/// * ファイルのコピーに失敗した場合
/// * バックアップファイルの削除に失敗した場合
#[tauri::command]
pub async fn restore_image_from_backup(image_path: String) -> Result<String, String> {
    let backup_path = format!("{}.backup", image_path);
    let backup = std::path::Path::new(&backup_path);

    if !backup.exists() {
        return Err("バックアップファイルが存在しません".to_string());
    }

    // バックアップから元ファイルを復元
    std::fs::copy(&backup_path, &image_path)
        .map_err(|e| format!("画像復元に失敗しました: {}", e))?;

    // バックアップファイルを削除
    std::fs::remove_file(&backup_path)
        .map_err(|e| format!("バックアップファイル削除に失敗しました: {}", e))?;

    Ok(image_path)
}

/// バックアップファイルを削除するコマンド
///
/// 指定された画像パスに対応するバックアップファイル（`<path>.backup`）を削除します。
/// 存在しない場合は何も行いません。
///
/// # Arguments
///
/// * `image_path` - バックアップ対象だった画像ファイルのパス
///
/// # Returns
///
/// * `Ok(())` - 成功
/// * `Err(String)` - エラーメッセージ
#[tauri::command]
pub async fn cleanup_image_backup(image_path: String) -> Result<(), String> {
    let backup_path = format!("{}.backup", image_path);
    let backup = std::path::Path::new(&backup_path);

    if backup.exists() {
        std::fs::remove_file(&backup_path)
            .map_err(|e| format!("バックアップファイル削除に失敗しました: {}", e))?;
    }

    Ok(())
}

/// 画像を指定角度で回転させる
///
/// 画像を90度単位で回転させ、元のファイルを上書きします。
///
/// # Arguments
///
/// * `image_path` - 回転させる画像ファイルのパス
/// * `rotation_angle` - 回転角度（90度単位、例: 90, 180, 270）
///
/// # Returns
///
/// * `Ok(String)` - 回転後の画像ファイルパス（元のパスと同じ）
/// * `Err(String)` - エラーメッセージ
///
/// # Errors
///
/// * ファイルが存在しない場合
/// * 回転角が90度単位でない場合
/// * 画像の読み込みまたは保存に失敗した場合
#[tauri::command]
pub async fn rotate_image(image_path: String, rotation_angle: f32) -> Result<String, String> {
    let path = Path::new(&image_path);

    // パスの検証
    if !path.exists() {
        return Err("指定されたファイルが存在しません".to_string());
    }

    let normalized_angle = ((rotation_angle.round() as i32 % 360) + 360) % 360;

    if normalized_angle == 0 {
        return Ok(image_path);
    }

    if normalized_angle % 90 != 0 {
        return Err("回転角は90度単位で指定してください".to_string());
    }

    // 画像を読み込み
    let img = image::open(path).map_err(|e| format!("画像の読み込みに失敗しました: {}", e))?;

    // 回転処理（90度単位での回転を想定）
    let rotated_img = match normalized_angle {
        90 => img.rotate90(),
        180 => img.rotate180(),
        270 => img.rotate270(),
        _ => img, // 0度または無効な角度の場合はそのまま
    };

    // 元の画像形式を推測
    let format = image::ImageFormat::from_path(path).unwrap_or(ImageFormat::Png);

    // 元のファイルを直接上書き
    rotated_img
        .save_with_format(&image_path, format)
        .map_err(|e| format!("回転した画像の保存に失敗しました: {}", e))?;

    // 元のパスをそのまま返す
    Ok(image_path)
}

/// 起動時の引数から画像ファイルパスを取得する
///
/// # Returns
///
/// * `Some(String)` - 起動引数の1番目に指定された画像ファイルパス（ファイルが存在する場合）
/// * `None` - 引数が指定されていないか、ファイルが存在しない場合
#[tauri::command]
pub fn get_launch_image_path() -> Option<String> {
    if let Some(path) = std::env::args().nth(1) {
        // パスの検証：実際にファイルが存在するかチェック
        if std::path::Path::new(&path).exists() {
            Some(path)
        } else {
            println!("指定されたファイルが存在しません: {}", path);
            None
        }
    } else {
        None
    }
}

/// 起動引数から２つ目（ウィンドウサイズ指定）を返す
///
/// # Returns
///
/// * `Some(String)` - 起動引数の2番目（ウィンドウモードやサイズ指定）
/// * `None` - 指定がない場合
#[tauri::command]
pub fn get_launch_window_mode() -> Option<String> {
    std::env::args().nth(2)
}

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
/// サポートされる画像形式: jpg, jpeg, png, gif, bmp, webp, tiff, tif
#[tauri::command]
pub fn get_folder_images(folder_path: String) -> Option<Vec<String>> {
    use std::fs;
    use std::path::Path;

    let folder = Path::new(&folder_path);
    if !folder.is_dir() {
        return None;
    }

    let mut images: Vec<(String, std::time::SystemTime)> = Vec::new();

    // 画像拡張子フィルター
    let image_extensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "tiff", "tif"];

    if let Ok(entries) = fs::read_dir(folder) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(extension) = path.extension() {
                    let ext_str = extension.to_string_lossy().to_lowercase();
                    if image_extensions.contains(&ext_str.as_str()) {
                        if let Ok(metadata) = entry.metadata() {
                            if let Ok(created) = metadata.created() {
                                images.push((path.to_string_lossy().to_string(), created));
                            }
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
