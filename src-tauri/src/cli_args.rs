use serde::{Deserialize, Serialize};

/// アプリケーション起動時のコマンドライン引数から取得する設定
///
/// すべてのフィールドは`Option`型で、引数が指定されていない場合は`None`になります。
/// フロントエンド側でlocalStorageの値より優先して適用されます。
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct LaunchConfig {
    // 基本設定（位置引数）
    /// 起動時に開く画像ファイルのパス（引数1）
    pub image_path: Option<String>,
    /// ウィンドウモード/サイズ設定（引数2）
    /// - "FullScreen": フルスクリーン表示
    /// - "WIDTHxHEIGHT": 指定解像度（例: "1920x1080"）
    pub window_mode: Option<String>,
    /// 既存のVDIウィンドウを終了するかどうか（引数3）
    pub close_existing_windows: Option<bool>,

    // ピーキング設定
    pub peaking_enabled: Option<bool>,
    pub peaking_intensity: Option<u8>,
    pub peaking_color: Option<String>,
    pub peaking_opacity: Option<f32>,
    pub peaking_blink: Option<bool>,

    // グリッド設定
    pub grid_pattern: Option<String>,
    pub grid_opacity: Option<f32>,
}

impl LaunchConfig {
    /// コマンドライン引数からLaunchConfigを生成
    ///
    /// 引数の形式:
    /// - 位置引数1: 画像ファイルパス
    /// - 位置引数2: ウィンドウモード（"FullScreen" または "WIDTHxHEIGHT"）
    /// - `--peaking-enabled <true|false>`
    /// - `--peaking-intensity <0-255>`
    /// - `--peaking-color <color>`
    /// - `--peaking-opacity <0.0-1.0>`
    /// - `--peaking-blink <true|false>`
    /// - `--grid-pattern <off|3x3|5x3|4x4>`
    /// - `--grid-opacity <0.0-1.0>`
    ///
    /// # Returns
    ///
    /// パースされた設定を含む`LaunchConfig`を返します。
    /// 無効な値が指定された場合、その項目は`None`になります。
    pub fn from_args() -> Self {
        let mut config = LaunchConfig::default();
        let args: Vec<String> = std::env::args().collect();

        // デバッグ用：受け取った引数をログ出力
        println!("[CLI Args] Received arguments: {:?}", args);

        // 位置引数の処理
        // 引数1: 画像パス（存在するファイルの場合のみ）
        if let Some(path) = args.get(1) {
            // '--'で始まらない場合のみ画像パスとして扱う
            if !path.starts_with("--") && std::path::Path::new(path).exists() {
                config.image_path = Some(path.clone());
            }
        }

        // 引数2: ウィンドウモード
        if let Some(mode) = args.get(2) {
            // '--'で始まらない場合のみウィンドウモードとして扱う
            if !mode.starts_with("--") && !mode.trim().is_empty() {
                config.window_mode = Some(mode.clone());
            }
        }

        // 引数3: 既存ウィンドウのクローズ指定
        if let Some(close_mode) = args.get(3) {
            if !close_mode.starts_with("--") {
                let next_arg = args.get(4).map(|s| s.as_str());
                config.close_existing_windows = Self::parse_close_window_flag(close_mode, next_arg);
            }
        }

        // 引数をパース
        let mut i = 1;
        while i < args.len() {
            match args[i].as_str() {
                "--peaking-enabled" => {
                    if i + 1 < args.len() {
                        config.peaking_enabled = args[i + 1].parse().ok();
                        i += 2;
                    } else {
                        i += 1;
                    }
                }
                "--peaking-intensity" => {
                    if i + 1 < args.len() {
                        config.peaking_intensity = args[i + 1].parse().ok();
                        i += 2;
                    } else {
                        i += 1;
                    }
                }
                "--peaking-color" => {
                    if i + 1 < args.len() {
                        config.peaking_color = Some(args[i + 1].clone());
                        i += 2;
                    } else {
                        i += 1;
                    }
                }
                "--peaking-opacity" => {
                    if i + 1 < args.len() {
                        // 0.0-1.0の範囲でバリデーション
                        if let Ok(opacity) = args[i + 1].parse::<f32>() {
                            if (0.0..=1.0).contains(&opacity) {
                                config.peaking_opacity = Some(opacity);
                            }
                        }
                        i += 2;
                    } else {
                        i += 1;
                    }
                }
                "--peaking-blink" => {
                    if i + 1 < args.len() {
                        config.peaking_blink = args[i + 1].parse().ok();
                        i += 2;
                    } else {
                        i += 1;
                    }
                }
                "--grid-pattern" => {
                    if i + 1 < args.len() {
                        let pattern = args[i + 1].as_str();
                        // 有効なパターンのみ受け入れる
                        if ["off", "3x3", "5x3", "4x4"].contains(&pattern) {
                            config.grid_pattern = Some(pattern.to_string());
                        }
                        i += 2;
                    } else {
                        i += 1;
                    }
                }
                "--grid-opacity" => {
                    if i + 1 < args.len() {
                        // 0.0-1.0の範囲でバリデーション
                        if let Ok(opacity) = args[i + 1].parse::<f32>() {
                            if (0.0..=1.0).contains(&opacity) {
                                config.grid_opacity = Some(opacity);
                            }
                        }
                        i += 2;
                    } else {
                        i += 1;
                    }
                }
                _ => i += 1,
            }
        }

        // デバッグ用：パース結果をログ出力
        println!("[CLI Args] Parsed config: {:?}", config);

        config
    }
}

impl LaunchConfig {
    fn parse_close_window_flag(flag: &str, next: Option<&str>) -> Option<bool> {
        let trimmed = flag.trim();
        if trimmed.is_empty() {
            return None;
        }

        let normalized: String = trimmed
            .chars()
            .filter(|c| !c.is_ascii_whitespace())
            .collect();
        match normalized.to_ascii_uppercase().as_str() {
            "TRUE" | "1" | "CLOSEWINDOW" | "CLOSEWINDOWMAX" | "MAX" => Some(true),
            "FALSE" | "0" => Some(false),
            _ => {
                if trimmed.eq_ignore_ascii_case("CLOSEWINDOW") {
                    if let Some(next_arg) = next {
                        if next_arg.trim().eq_ignore_ascii_case("MAX") {
                            return Some(true);
                        }
                    }
                }
                None
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = LaunchConfig::default();
        assert!(config.peaking_enabled.is_none());
        assert!(config.peaking_intensity.is_none());
        assert!(config.peaking_color.is_none());
        assert!(config.peaking_opacity.is_none());
        assert!(config.peaking_blink.is_none());
        assert!(config.grid_pattern.is_none());
        assert!(config.grid_opacity.is_none());
    }
}
