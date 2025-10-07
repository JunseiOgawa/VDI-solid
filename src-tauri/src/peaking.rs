use image::{DynamicImage, GenericImageView, ImageBuffer, Luma};
use serde::{Deserialize, Serialize};
use std::path::Path;

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

/// Sobelフィルタを適用してエッジを検出
fn apply_sobel_filter(img: &ImageBuffer<Luma<u8>, Vec<u8>>) -> ImageBuffer<Luma<u8>, Vec<u8>> {
    let (width, height) = img.dimensions();
    let mut output = ImageBuffer::new(width, height);

    // Sobelカーネル
    let sobel_x = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    let sobel_y = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

    for y in 1..height - 1 {
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

            output.put_pixel(x, y, Luma([magnitude]));
        }
    }

    output
}

/// エッジ座標を抽出
fn extract_edge_points(
    edge_img: &ImageBuffer<Luma<u8>, Vec<u8>>,
    threshold: u8,
) -> Vec<Vec<EdgePoint>> {
    let (width, height) = edge_img.dimensions();
    let mut edges: Vec<Vec<EdgePoint>> = Vec::new();
    let mut visited = vec![vec![false; width as usize]; height as usize];

    // 閾値を超えるピクセルを探索
    for y in 0..height {
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

    edges
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
///
/// # Returns
/// * `Ok(PeakingResult)` - エッジ座標リスト
/// * `Err(String)` - エラーメッセージ
#[tauri::command]
pub async fn focus_peaking(image_path: String, threshold: u8) -> Result<PeakingResult, String> {
    let path = Path::new(&image_path);

    // ファイル存在チェック
    if !path.exists() {
        return Err("File not found".to_string());
    }

    // 画像読み込み
    let img = image::open(path).map_err(|e| format!("Failed to load image: {}", e))?;

    let (width, height) = img.dimensions();

    // グレースケール変換
    let gray_img = img.to_luma8();

    // Sobelフィルタ適用
    let edge_img = apply_sobel_filter(&gray_img);

    // エッジ座標抽出
    let edges = extract_edge_points(&edge_img, threshold);

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

    println!(
        "[Peaking] Processed {}x{}, found {} edge groups, {} total points",
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
