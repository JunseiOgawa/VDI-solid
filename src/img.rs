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
pub async fn rotate_image(image_path: String, rotation_angle: f32) -> Result<String, String> {
    let path = Path::new(&image_path);

    // パスの検証
    if !path.exists() {
        return Err("指定されたファイルが存在しません".to_string());
    }

    // JPEG XL形式のチェック
    if let Some(ext) = path.extension() {
        if ext.to_string_lossy().to_lowercase() == "jxl" {
            return Err("JPEG XL形式の画像編集は現在サポートされていません".to_string());
        }
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
/// 内部的には`cli_args::LaunchConfig`を使用して引数をパースします。
///
/// # Returns
///
/// * `Some(String)` - 起動引数の1番目に指定された画像ファイルパス（ファイルが存在する場合）
/// * `None` - 引数が指定されていないか、ファイルが存在しない場合
pub fn get_launch_image_path() -> Option<String> {
    crate::cli_args::LaunchConfig::from_args().image_path
}

/// 起動引数から２つ目（ウィンドウサイズ指定）を返す
///
/// 内部的には`cli_args::LaunchConfig`を使用して引数をパースします。
///
/// # Returns
///
/// * `Some(String)` - 起動引数の2番目（ウィンドウモードやサイズ指定）
/// * `None` - 指定がない場合
pub fn get_launch_window_mode() -> Option<String> {
    crate::cli_args::LaunchConfig::from_args().window_mode
}
