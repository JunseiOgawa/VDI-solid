use image::{GenericImageView, ImageBuffer, Luma};
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Instant;

lazy_static::lazy_static! {
    static ref CANCEL_FLAGS: Mutex<HashMap<String, Arc<AtomicBool>>> = Mutex::new(HashMap::new());
    static ref REQUEST_COUNTER: AtomicU64 = AtomicU64::new(0);
}

/// ユニークなリクエストIDを生成
fn generate_unique_request_id(base_key: &str) -> String {
    let counter = REQUEST_COUNTER.fetch_add(1, Ordering::Relaxed);
    format!("{}#{}", base_key, counter)
}

/// エッジ上の1点の座標
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct EdgePoint {
    pub x: f32,
    pub y: f32,
}

/// Rustから返却されるピーキング結果
#[derive(Serialize, Deserialize, Debug)]
pub struct PeakingResult {
    /// 元画像の幅
    pub width: u32,
    /// 元画像の高さ
    pub height: u32,
    /// エッジの座標リスト（各配列が1つの連続エッジ）
    pub edges: Vec<Vec<EdgePoint>>,
}

/// キャンセルフラグを登録（古い処理を自動キャンセル）
fn register_cancel_flag(request_id: &str, base_key: &str) -> Arc<AtomicBool> {
    let flag = Arc::new(AtomicBool::new(false));
    let mut map = CANCEL_FLAGS.lock().unwrap();
    
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
            println!("[Peaking] キャンセル設定: {}", key);
        }
    }
    
    map.insert(request_id.to_string(), flag.clone());
    flag
}

/// キャンセルフラグを削除
fn unregister_cancel_flag(request_id: &str) {
    let mut map = CANCEL_FLAGS.lock().unwrap();
    map.remove(request_id);
}

/// Sobelフィルタを適用してエッジを検出（並列化版）
fn apply_sobel_filter(
    img: &ImageBuffer<Luma<u8>, Vec<u8>>,
    cancel_flag: Arc<AtomicBool>,
) -> Result<ImageBuffer<Luma<u8>, Vec<u8>>, String> {
    let (width, height) = img.dimensions();

    // Sobelカーネル
    let sobel_x = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    let sobel_y = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

    // 各行を並列処理
    let rows: Result<Vec<Vec<u8>>, String> = (1..height - 1)
        .into_par_iter()
        .map(|y| {
            // キャンセルチェック
            if cancel_flag.load(Ordering::Relaxed) {
                return Err("Cancelled".to_string());
            }

            let mut row_data = vec![0u8; width as usize];
            
            for x in 1..width - 1 {
                let mut gx: i32 = 0;
                let mut gy: i32 = 0;

                // 3x3カーネル適用
                for ky in 0..3 {
                    for kx in 0..3 {
                        let pixel = img.get_pixel(x + kx - 1, y + ky - 1)[0] as i32;
                        gx += pixel * sobel_x[ky as usize][kx as usize];
                        gy += pixel * sobel_y[ky as usize][kx as usize];
                    }
                }

                // 勾配強度を計算
                let magnitude = ((gx * gx + gy * gy) as f64).sqrt();
                let magnitude = magnitude.min(255.0) as u8;
                row_data[x as usize] = magnitude;
            }
            
            Ok(row_data)
        })
        .collect();

    let rows = rows?;

    // 結果をImageBufferにマージ
    let mut output = ImageBuffer::new(width, height);
    for (y, row_data) in rows.iter().enumerate() {
        for (x, &value) in row_data.iter().enumerate() {
            output.put_pixel(x as u32, (y + 1) as u32, Luma([value]));
        }
    }

    Ok(output)
}

/// エッジ座標を抽出
fn extract_edge_points(
    edge_img: &ImageBuffer<Luma<u8>, Vec<u8>>,
    threshold: u8,
    cancel_flag: Arc<AtomicBool>,
) -> Result<Vec<Vec<EdgePoint>>, String> {
    let (width, height) = edge_img.dimensions();
    let mut edges: Vec<Vec<EdgePoint>> = Vec::new();
    let mut visited = vec![vec![false; width as usize]; height as usize];

    // 閾値を超えるピクセルを探索
    for y in 0..height {
        // 定期的にキャンセルチェック
        if y % 100 == 0 && cancel_flag.load(Ordering::Relaxed) {
            return Err("Cancelled".to_string());
        }

        for x in 0..width {
            if visited[y as usize][x as usize] {
                continue;
            }

            let pixel_value = edge_img.get_pixel(x, y)[0];
            if pixel_value >= threshold {
                // 連続するエッジを追跡
                let edge = trace_edge(edge_img, &mut visited, x, y, threshold);
                if edge.len() > 1 {
                    // 1点のみのエッジは除外
                    edges.push(edge);
                }
            }
        }
    }

    Ok(edges)
}

/// 連続するエッジを追跡（簡易版：4近傍）
fn trace_edge(
    edge_img: &ImageBuffer<Luma<u8>, Vec<u8>>,
    visited: &mut Vec<Vec<bool>>,
    start_x: u32,
    start_y: u32,
    threshold: u8,
) -> Vec<EdgePoint> {
    let (width, height) = edge_img.dimensions();
    let mut edge = Vec::new();
    let mut stack = vec![(start_x, start_y)];

    while let Some((x, y)) = stack.pop() {
        if visited[y as usize][x as usize] {
            continue;
        }

        visited[y as usize][x as usize] = true;
        edge.push(EdgePoint {
            x: x as f32,
            y: y as f32,
        });

        // 4近傍をチェック
        let neighbors = [
            (x.wrapping_sub(1), y),
            (x + 1, y),
            (x, y.wrapping_sub(1)),
            (x, y + 1),
        ];

        for (nx, ny) in neighbors {
            if nx < width
                && ny < height
                && !visited[ny as usize][nx as usize]
                && edge_img.get_pixel(nx, ny)[0] >= threshold
            {
                stack.push((nx, ny));
            }
        }

        // スタックサイズ制限（メモリ保護）
        if edge.len() > 5000 {
            break;
        }
    }

    edge
}

/// フォーカスピーキング処理のTauri Command
///
/// # Arguments
/// * `image_path` - 画像ファイルパス
/// * `threshold` - エッジ検出閾値 (0-255)
/// * `request_id` - リクエストID（キャンセル管理用、オプション）
///
/// # Returns
/// * `Ok(PeakingResult)` - エッジ座標リスト
/// * `Err(String)` - エラーメッセージ
#[tauri::command]
pub async fn focus_peaking(
    image_path: String,
    threshold: u8,
    request_id: Option<String>,
) -> Result<PeakingResult, String> {
    let total_start = Instant::now();
    
    // ベースキーとユニークなリクエストIDを生成
    let base_key = request_id.unwrap_or_else(|| format!("{}:{}", image_path, threshold));
    let unique_request_id = generate_unique_request_id(&base_key);
    println!("[Peaking] 新規リクエスト開始: {}", unique_request_id);
    
    let cancel_flag = register_cancel_flag(&unique_request_id, &base_key);
    
    let path = Path::new(&image_path);

    // ファイル存在チェック
    if !path.exists() {
        unregister_cancel_flag(&unique_request_id);
        return Err("File not found".to_string());
    }

    // 画像読み込み
    let load_start = Instant::now();
    let img = image::open(path).map_err(|e| {
        unregister_cancel_flag(&unique_request_id);
        format!("Failed to load image: {}", e)
    })?;
    let (width, height) = img.dimensions();
    let gray_img = img.to_luma8();
    println!("[Peaking] 画像読み込み: {:?}", load_start.elapsed());

    // キャンセルチェック1
    if cancel_flag.load(Ordering::Relaxed) {
        println!("[Peaking] キャンセル検出1: {}", unique_request_id);
        unregister_cancel_flag(&unique_request_id);
        return Err("Cancelled".to_string());
    }

    // Sobelフィルタ適用
    let sobel_start = Instant::now();
    let edge_img = apply_sobel_filter(&gray_img, cancel_flag.clone())?;
    println!("[Peaking] Sobelフィルタ: {:?}", sobel_start.elapsed());

    // キャンセルチェック2
    if cancel_flag.load(Ordering::Relaxed) {
        println!("[Peaking] キャンセル検出2: {}", unique_request_id);
        unregister_cancel_flag(&unique_request_id);
        return Err("Cancelled".to_string());
    }

    // エッジ座標抽出
    let extract_start = Instant::now();
    let edges = extract_edge_points(&edge_img, threshold, cancel_flag.clone())?;
    println!("[Peaking] エッジ抽出: {:?}", extract_start.elapsed());

    // 総エッジポイント数を制限
    let total_points: usize = edges.iter().map(|e| e.len()).sum();
    let max_points = 10000;

    let filtered_edges = if total_points > max_points {
        // ポイント数が多すぎる場合は間引き
        let ratio = max_points as f32 / total_points as f32;
        edges
            .into_iter()
            .filter_map(|edge| {
                if edge.len() as f32 * ratio >= 2.0 {
                    Some(edge)
                } else {
                    None
                }
            })
            .collect()
    } else {
        edges
    };

    unregister_cancel_flag(&unique_request_id);

    println!(
        "[Peaking] 処理完了: {} - 合計時間: {:?}, {}x{}, {} edge groups, {} total points",
        unique_request_id,
        total_start.elapsed(),
        width,
        height,
        filtered_edges.len(),
        filtered_edges.iter().map(|e| e.len()).sum::<usize>()
    );

    Ok(PeakingResult {
        width,
        height,
        edges: filtered_edges,
    })
}
