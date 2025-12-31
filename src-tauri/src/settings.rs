use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    // ピーキング設定
    pub peaking_threshold: u8,
    pub peaking_intensity: u8,
    pub peaking_color: [u8; 3],
    pub peaking_opacity: f32,
    pub peaking_blink: bool,

    // ズーム設定
    pub wheel_sensitivity: f32,

    // グリッド設定
    pub grid_pattern: GridPattern,
    pub grid_opacity: f32,

    // ヒストグラム設定
    pub histogram_size: f32,
    pub histogram_opacity: f32,
    pub histogram_position: HistogramPosition,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum GridPattern {
    None,
    RuleOfThirds,
    GoldenRatio,
    Grid4x4,
    Grid8x8,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum HistogramPosition {
    TopLeft,
    TopRight,
    BottomLeft,
    BottomRight,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            peaking_threshold: 128,
            peaking_intensity: 128,
            peaking_color: [255, 0, 0],
            peaking_opacity: 0.7,
            peaking_blink: false,
            wheel_sensitivity: 0.3,
            grid_pattern: GridPattern::None,
            grid_opacity: 0.5,
            histogram_size: 1.0,
            histogram_opacity: 0.9,
            histogram_position: HistogramPosition::BottomRight,
        }
    }
}

impl AppSettings {
    pub fn load() -> Self {
        if let Some(config_dir) = dirs_next::config_dir() {
            let settings_path = config_dir.join("vdi-solid").join("settings.json");

            if let Ok(contents) = std::fs::read_to_string(&settings_path) {
                if let Ok(settings) = serde_json::from_str(&contents) {
                    return settings;
                }
            }
        }

        Self::default()
    }

    pub fn save(&self) {
        if let Some(config_dir) = dirs_next::config_dir() {
            let settings_dir = config_dir.join("vdi-solid");
            let _ = std::fs::create_dir_all(&settings_dir);

            let settings_path = settings_dir.join("settings.json");

            if let Ok(json) = serde_json::to_string_pretty(self) {
                let _ = std::fs::write(&settings_path, json);
            }
        }
    }
}
