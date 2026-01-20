//! コマンドライン引数パーサー
//!
//! VSAから渡されるCLI引数を解析し、アプリケーション設定に変換する。
//! 全ての引数は `--key value` 形式で統一されている。
//!
//! # メタデータについて
//! `--metadata` 引数はBase64エンコードされたJSON文字列を受け取る。
//! Base64を使用する理由:
//! - ワールド名やユーザー名に日本語が含まれる可能性がある
//! - スペースやクォートがCLI引数のパースで問題になる
//! - Windowsコマンドラインの文字エンコーディング問題を回避

use crate::metadata::PhotoMetadata;
use serde::{Deserialize, Serialize};

/// アプリケーション起動時のコマンドライン引数から取得する設定
///
/// # 引数形式
/// 全ての引数は `--key value` 形式で指定する。
/// 後方互換性のため、位置引数もサポートするが非推奨。
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct LaunchConfig {
    // ===== 基本設定 =====
    /// 起動時に開く画像ファイルのパス (--image)
    pub image_path: Option<String>,
    /// ウィンドウモード: "FullScreen", "Window", "WIDTHxHEIGHT" (--window-mode)
    pub window_mode: Option<String>,
    /// 既存のVDIウィンドウを終了するかどうか (--close-windows)
    pub close_existing_windows: Option<bool>,

    // ===== メタデータ (Base64 JSON) =====
    /// Base64エンコードされたメタデータJSON (--metadata)
    /// ※ 日本語・スペース・特殊文字を安全にCLI経由で渡すためBase64を使用
    pub metadata: Option<String>,

    // ===== ピーキング設定 =====
    pub peaking_enabled: Option<bool>,
    pub peaking_line_width: Option<f32>,
    pub peaking_color: Option<String>,
    pub peaking_opacity: Option<f32>,
    pub peaking_blink: Option<bool>,

    // ===== グリッド設定 =====
    pub grid_enabled: Option<bool>,
    pub grid_pattern: Option<String>,
    pub grid_opacity: Option<f32>,

    // ===== 表示設定 =====
    pub show_metadata: Option<bool>,
}

impl LaunchConfig {
    /// コマンドライン引数からLaunchConfigを生成
    ///
    /// # 引数形式
    /// - `--image <path>`: 画像ファイルパス
    /// - `--window-mode <mode>`: ウィンドウモード
    /// - `--close-windows <true|false>`: 既存ウィンドウを閉じるか
    /// - `--metadata <base64>`: Base64エンコードされたメタデータJSON
    /// - `--peaking-enabled <true|false>`: ピーキング有効
    /// - `--grid-enabled <true|false>`: グリッド有効
    /// - `--grid-pattern <3x3|gold|4x4|8x8>`: グリッドパターン
    /// - `--show-metadata <true|false>`: メタデータパネル表示
    ///
    /// # 後方互換性
    /// 位置引数（画像パス、ウィンドウモード、クローズフラグ）もサポート
    pub fn from_args() -> Self {
        let mut config = LaunchConfig::default();
        let args: Vec<String> = std::env::args().collect();

        println!("[CLI Args] Received arguments: {:?}", args);

        let mut i = 1;
        while i < args.len() {
            let arg = args[i].as_str();
            let next_value = args.get(i + 1).map(|s| s.as_str());

            match arg {
                // ===== 基本設定 =====
                "--image" => {
                    if let Some(path) = next_value {
                        if std::path::Path::new(path).exists() {
                            config.image_path = Some(path.to_string());
                        }
                        i += 2;
                    } else {
                        i += 1;
                    }
                }
                "--window-mode" => {
                    if let Some(mode) = next_value {
                        config.window_mode = Some(mode.to_string());
                        i += 2;
                    } else {
                        i += 1;
                    }
                }
                "--close-windows" => {
                    if let Some(val) = next_value {
                        config.close_existing_windows = parse_bool(val);
                        i += 2;
                    } else {
                        i += 1;
                    }
                }

                // ===== メタデータ (Base64) =====
                // Base64を使用する理由:
                // - ワールド名・ユーザー名に日本語やスペースが含まれる
                // - CLI引数として安全に渡せる形式に変換する必要がある
                "--metadata" => {
                    if let Some(encoded) = next_value {
                        config.metadata = Some(encoded.to_string());
                        i += 2;
                    } else {
                        i += 1;
                    }
                }

                // ===== ピーキング設定 =====
                "--peaking-enabled" => {
                    if let Some(val) = next_value {
                        config.peaking_enabled = parse_bool(val);
                        i += 2;
                    } else {
                        i += 1;
                    }
                }
                "--peaking-line-width" => {
                    if let Some(val) = next_value {
                        config.peaking_line_width = val.parse().ok();
                        i += 2;
                    } else {
                        i += 1;
                    }
                }
                "--peaking-color" => {
                    if let Some(color) = next_value {
                        config.peaking_color = Some(color.to_string());
                        i += 2;
                    } else {
                        i += 1;
                    }
                }
                "--peaking-opacity" => {
                    if let Some(val) = next_value {
                        if let Ok(opacity) = val.parse::<f32>() {
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
                    if let Some(val) = next_value {
                        config.peaking_blink = parse_bool(val);
                        i += 2;
                    } else {
                        i += 1;
                    }
                }

                // ===== グリッド設定 =====
                "--grid-enabled" => {
                    if let Some(val) = next_value {
                        config.grid_enabled = parse_bool(val);
                        i += 2;
                    } else {
                        i += 1;
                    }
                }
                "--grid-pattern" => {
                    if let Some(pattern) = next_value {
                        if ["3x3", "gold", "4x4", "8x8"].contains(&pattern) {
                            config.grid_pattern = Some(pattern.to_string());
                        }
                        i += 2;
                    } else {
                        i += 1;
                    }
                }
                "--grid-opacity" => {
                    if let Some(val) = next_value {
                        if let Ok(opacity) = val.parse::<f32>() {
                            if (0.0..=1.0).contains(&opacity) {
                                config.grid_opacity = Some(opacity);
                            }
                        }
                        i += 2;
                    } else {
                        i += 1;
                    }
                }

                // ===== 表示設定 =====
                "--show-metadata" => {
                    if let Some(val) = next_value {
                        config.show_metadata = parse_bool(val);
                        i += 2;
                    } else {
                        i += 1;
                    }
                }

                // ===== 後方互換性: 位置引数もサポート (非推奨) =====
                _ => {
                    if !arg.starts_with("--") {
                        // 最初の非フラグ引数は画像パスとして扱う
                        if config.image_path.is_none() && std::path::Path::new(arg).exists() {
                            config.image_path = Some(arg.to_string());
                        }
                        // 2番目はウィンドウモード
                        else if config.image_path.is_some() && config.window_mode.is_none() {
                            config.window_mode = Some(arg.to_string());
                        }
                        // 3番目はクローズフラグ
                        else if config.window_mode.is_some()
                            && config.close_existing_windows.is_none()
                        {
                            config.close_existing_windows =
                                parse_close_window_flag(arg, next_value);
                        }
                    }
                    i += 1;
                }
            }
        }

        println!("[CLI Args] Parsed config: {:?}", config);
        config
    }

    /// --metadata引数からPhotoMetadataをデコード
    ///
    /// # Returns
    /// * `Some(PhotoMetadata)` - デコード成功時
    /// * `None` - メタデータがない、またはデコード失敗時
    pub fn decode_metadata(&self) -> Option<PhotoMetadata> {
        self.metadata
            .as_ref()
            .and_then(|encoded| PhotoMetadata::from_base64(encoded))
    }
}

/// bool値をパース ("true", "false", "1", "0" をサポート)
fn parse_bool(s: &str) -> Option<bool> {
    match s.to_lowercase().as_str() {
        "true" | "1" | "yes" => Some(true),
        "false" | "0" | "no" => Some(false),
        _ => None,
    }
}

/// 後方互換性用: クローズウィンドウフラグをパース
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

#[cfg(test)]
mod tests {
    use super::*;
    use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};

    #[test]
    fn test_parse_bool_true_variants() {
        assert_eq!(parse_bool("true"), Some(true));
        assert_eq!(parse_bool("True"), Some(true));
        assert_eq!(parse_bool("TRUE"), Some(true));
        assert_eq!(parse_bool("1"), Some(true));
        assert_eq!(parse_bool("yes"), Some(true));
    }

    #[test]
    fn test_parse_bool_false_variants() {
        assert_eq!(parse_bool("false"), Some(false));
        assert_eq!(parse_bool("False"), Some(false));
        assert_eq!(parse_bool("FALSE"), Some(false));
        assert_eq!(parse_bool("0"), Some(false));
        assert_eq!(parse_bool("no"), Some(false));
    }

    #[test]
    fn test_parse_bool_invalid() {
        assert_eq!(parse_bool("invalid"), None);
        assert_eq!(parse_bool(""), None);
        assert_eq!(parse_bool("maybe"), None);
    }

    #[test]
    fn test_default_launch_config() {
        let config = LaunchConfig::default();
        assert!(config.image_path.is_none());
        assert!(config.window_mode.is_none());
        assert!(config.metadata.is_none());
        assert!(config.peaking_enabled.is_none());
        assert!(config.grid_enabled.is_none());
        assert!(config.show_metadata.is_none());
    }

    #[test]
    fn test_decode_metadata_valid() {
        let json = r#"{"world_name":"Test World","user_count":5}"#;
        let encoded = BASE64.encode(json);

        let config = LaunchConfig {
            metadata: Some(encoded),
            ..Default::default()
        };

        let meta = config.decode_metadata().unwrap();
        assert_eq!(meta.world_name, Some("Test World".to_string()));
        assert_eq!(meta.user_count, Some(5));
    }

    #[test]
    fn test_decode_metadata_none() {
        let config = LaunchConfig::default();
        assert!(config.decode_metadata().is_none());
    }

    #[test]
    fn test_decode_metadata_with_japanese() {
        let json = r#"{"world_name":"テストワールド","photographer_name":"撮影者名"}"#;
        let encoded = BASE64.encode(json);

        let config = LaunchConfig {
            metadata: Some(encoded),
            ..Default::default()
        };

        let meta = config.decode_metadata().unwrap();
        assert_eq!(meta.world_name, Some("テストワールド".to_string()));
        assert_eq!(meta.photographer_name, Some("撮影者名".to_string()));
    }

    #[test]
    fn test_parse_close_window_flag() {
        assert_eq!(parse_close_window_flag("TRUE", None), Some(true));
        assert_eq!(parse_close_window_flag("FALSE", None), Some(false));
        assert_eq!(parse_close_window_flag("1", None), Some(true));
        assert_eq!(parse_close_window_flag("0", None), Some(false));
        assert_eq!(
            parse_close_window_flag("CLOSEWINDOW", Some("MAX")),
            Some(true)
        );
    }
}
