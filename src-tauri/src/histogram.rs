use image::{DynamicImage, GenericImageView};
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Instant;

lazy_static::lazy_static! {
    static ref HISTOGRAM_CANCEL_FLAGS: Mutex<HashMap<String, Arc<AtomicBool>>> = Mutex::new(HashMap::new());
    static ref HISTOGRAM_REQUEST_COUNTER: AtomicU64 = AtomicU64::new(0);
}

/// ユニークなリクエストIDを生成
fn generate_unique_request_id(base_key: &str) -> String {
    let counter = HISTOGRAM_REQUEST_COUNTER.fetch_add(1, Ordering::Relaxed);
    format!("{}#{}", base_key, counter)
}

/// ヒストグラムデータのenum
#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum HistogramData {
    RGB { r: Vec<u32>, g: Vec<u32>, b: Vec<u32> },
    Luminance { y: Vec<u32> },
}

/// Rustから返却されるヒストグラム結果
#[derive(Serialize, Deserialize, Debug)]
pub struct HistogramResult {
    /// 元画像の幅
    pub width: u32,
    /// 元画像の高さ
    pub height: u32,
    /// ヒストグラムのタイプ
    pub histogram_type: String,
    /// ヒストグラムデータ
    pub data: HistogramData,
}

/// キャンセルフラグを登録（古い処理を自動キャンセル）
fn register_histogram_cancel_flag(request_id: &str, base_key: &str) -> Arc<AtomicBool> {
    let flag = Arc::new(AtomicBool::new(false));
    let mut map = HISTOGRAM_CANCEL_FLAGS.lock().unwrap();

    // 同じベースキーの古いリクエストをすべてキャンセル
    let base_prefix = format!("{}#", base_key);
    let keys_to_cancel: Vec<String> = map
        .keys()
        .filter(|k| k.starts_with(&base_prefix) || k == &base_key)
        .cloned()
        .collect();

    for key in keys_to_cancel {
        if let Some(old_flag) = map.get(&key) {
            old_flag.store(true, Ordering::Relaxed);
            println!("[Histogram] キャンセル設定: {}", key);
        }
    }

    map.insert(request_id.to_string(), flag.clone());
    flag
}

/// キャンセルフラグを削除
fn unregister_histogram_cancel_flag(request_id: &str) {
    let mut map = HISTOGRAM_CANCEL_FLAGS.lock().unwrap();
    map.remove(request_id);
}

/// RGB別ヒストグラムを計算（並列化版）
fn calculate_rgb_histogram(
    img: &DynamicImage,
    cancel_flag: Arc<AtomicBool>,
) -> Result<(Vec<u32>, Vec<u32>, Vec<u32>), String> {
    let rgb_img = img.to_rgb8();
    let (width, height) = rgb_img.dimensions();

    // 各行を並列処理してRGBヒストグラムを計算
    let row_histograms: Result<Vec<(Vec<u32>, Vec<u32>, Vec<u32>)>, String> = (0..height)
        .into_par_iter()
        .map(|y| {
            // 定期的にキャンセルチェック
            if y % 100 == 0 && cancel_flag.load(Ordering::Relaxed) {
                return Err("Cancelled".to_string());
            }

            let mut hist_r = vec![0u32; 256];
            let mut hist_g = vec![0u32; 256];
            let mut hist_b = vec![0u32; 256];

            for x in 0..width {
                let pixel = rgb_img.get_pixel(x, y);
                hist_r[pixel[0] as usize] += 1;
                hist_g[pixel[1] as usize] += 1;
                hist_b[pixel[2] as usize] += 1;
            }

            Ok((hist_r, hist_g, hist_b))
        })
        .collect();

    let row_histograms = row_histograms?;

    // 各行のヒストグラムを統合
    let mut hist_r = vec![0u32; 256];
    let mut hist_g = vec![0u32; 256];
    let mut hist_b = vec![0u32; 256];

    for (row_r, row_g, row_b) in row_histograms {
        for i in 0..256 {
            hist_r[i] += row_r[i];
            hist_g[i] += row_g[i];
            hist_b[i] += row_b[i];
        }
    }

    Ok((hist_r, hist_g, hist_b))
}

/// 輝度ヒストグラムを計算（並列化版）
/// ITU-R BT.709の係数を使用
fn calculate_luminance_histogram(
    img: &DynamicImage,
    cancel_flag: Arc<AtomicBool>,
) -> Result<Vec<u32>, String> {
    let rgb_img = img.to_rgb8();
    let (width, height) = rgb_img.dimensions();

    // 各行を並列処理して輝度ヒストグラムを計算
    let row_histograms: Result<Vec<Vec<u32>>, String> = (0..height)
        .into_par_iter()
        .map(|y| {
            // 定期的にキャンセルチェック
            if y % 100 == 0 && cancel_flag.load(Ordering::Relaxed) {
                return Err("Cancelled".to_string());
            }

            let mut hist_y = vec![0u32; 256];

            for x in 0..width {
                let pixel = rgb_img.get_pixel(x, y);
                // ITU-R BT.709
                let y_value = (0.2126 * pixel[0] as f32
                            + 0.7152 * pixel[1] as f32
                            + 0.0722 * pixel[2] as f32) as u8;
                hist_y[y_value as usize] += 1;
            }

            Ok(hist_y)
        })
        .collect();

    let row_histograms = row_histograms?;

    // 各行のヒストグラムを統合
    let mut hist_y = vec![0u32; 256];

    for row_y in row_histograms {
        for i in 0..256 {
            hist_y[i] += row_y[i];
        }
    }

    Ok(hist_y)
}

/// ヒストグラム計算のTauri Command
///
/// # Arguments
/// * `image_path` - 画像ファイルパス
/// * `display_type` - ヒストグラムタイプ ("rgb" または "luminance")
/// * `request_id` - リクエストID（キャンセル管理用、オプション）
///
/// # Returns
/// * `Ok(HistogramResult)` - ヒストグラムデータ
/// * `Err(String)` - エラーメッセージ
#[tauri::command]
pub async fn calculate_histogram(
    image_path: String,
    display_type: String,
    request_id: Option<String>,
) -> Result<HistogramResult, String> {
    let total_start = Instant::now();

    // ベースキーとユニークなリクエストIDを生成
    let base_key = request_id.unwrap_or_else(|| format!("{}:{}", image_path, display_type));
    let unique_request_id = generate_unique_request_id(&base_key);
    println!("[Histogram] 新規リクエスト開始: {}", unique_request_id);

    let cancel_flag = register_histogram_cancel_flag(&unique_request_id, &base_key);

    let path = Path::new(&image_path);

    // ファイル存在チェック
    if !path.exists() {
        unregister_histogram_cancel_flag(&unique_request_id);
        return Err("File not found".to_string());
    }

    // 画像読み込み
    let load_start = Instant::now();
    let img = image::open(path).map_err(|e| {
        unregister_histogram_cancel_flag(&unique_request_id);
        format!("Failed to load image: {}", e)
    })?;
    let (width, height) = img.dimensions();
    println!("[Histogram] 画像読み込み: {:?}, サイズ: {}x{}", load_start.elapsed(), width, height);

    // キャンセルチェック1
    if cancel_flag.load(Ordering::Relaxed) {
        println!("[Histogram] キャンセル検出1: {}", unique_request_id);
        unregister_histogram_cancel_flag(&unique_request_id);
        return Err("Cancelled".to_string());
    }

    // ヒストグラム計算
    let calc_start = Instant::now();
    let (histogram_type, data) = match display_type.as_str() {
        "rgb" => {
            let (r, g, b) = calculate_rgb_histogram(&img, cancel_flag.clone())?;
            ("rgb".to_string(), HistogramData::RGB { r, g, b })
        }
        "luminance" => {
            let y = calculate_luminance_histogram(&img, cancel_flag.clone())?;
            ("luminance".to_string(), HistogramData::Luminance { y })
        }
        _ => {
            unregister_histogram_cancel_flag(&unique_request_id);
            return Err(format!("Invalid display_type: {}", display_type));
        }
    };
    println!("[Histogram] ヒストグラム計算: {:?}", calc_start.elapsed());

    // キャンセルチェック2
    if cancel_flag.load(Ordering::Relaxed) {
        println!("[Histogram] キャンセル検出2: {}", unique_request_id);
        unregister_histogram_cancel_flag(&unique_request_id);
        return Err("Cancelled".to_string());
    }

    unregister_histogram_cancel_flag(&unique_request_id);

    println!(
        "[Histogram] 処理完了: {} - 合計時間: {:?}, サイズ: {}x{}, タイプ: {}",
        unique_request_id,
        total_start.elapsed(),
        width,
        height,
        histogram_type
    );

    Ok(HistogramResult {
        width,
        height,
        histogram_type,
        data,
    })
}
