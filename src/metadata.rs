//! VSAから受け取るメタデータの構造体定義
//!
//! メタデータはBase64エンコードされたJSON形式でCLI引数として渡される。
//!
//! # Base64を使用する理由
//! - ワールド名やユーザー名に日本語が含まれる可能性がある
//! - スペースやクォートなどの特殊文字がCLI引数で問題になる
//! - Windowsコマンドラインでの文字エンコーディング問題を回避

use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use serde::{Deserialize, Serialize};

/// VSAから渡されるメタデータ（表示に必要な項目のみ）
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PhotoMetadata {
    /// ワールド名
    pub world_name: Option<String>,
    /// 撮影者名
    pub photographer_name: Option<String>,
    /// ワールド内ユーザー数
    pub user_count: Option<usize>,
    /// カメラタイプ
    pub camera_type: Option<String>,
    /// カメラ: F値
    pub camera_aperture: Option<f32>,
    /// カメラ: ズーム
    pub camera_zoom: Option<f32>,
    /// カメラ: 露出
    pub camera_exposure: Option<f32>,
    /// 撮影日時
    pub taken_at: Option<String>,
}

impl PhotoMetadata {
    /// Base64エンコードされたJSON文字列からデコード
    ///
    /// # Arguments
    /// * `encoded` - Base64エンコードされたJSON文字列
    ///
    /// # Returns
    /// * `Some(PhotoMetadata)` - デコード成功時
    /// * `None` - デコード失敗時（無効なBase64、無効なJSON）
    ///
    /// # Note
    /// Base64を使用する理由:
    /// - CLI引数で日本語（ワールド名、ユーザー名）を安全に渡すため
    /// - スペースや特殊文字によるパース問題を回避するため
    pub fn from_base64(encoded: &str) -> Option<Self> {
        // Base64デコード
        let decoded_bytes = BASE64.decode(encoded).ok()?;

        // UTF-8文字列に変換
        let json_str = String::from_utf8(decoded_bytes).ok()?;

        // JSONデシリアライズ
        serde_json::from_str(&json_str).ok()
    }

    /// メタデータが存在するか（少なくとも1フィールドが設定されている）
    pub fn is_empty(&self) -> bool {
        self.world_name.is_none()
            && self.photographer_name.is_none()
            && self.user_count.is_none()
            && self.camera_type.is_none()
            && self.taken_at.is_none()
    }

    /// カメラパラメータが存在するか
    pub fn has_camera_params(&self) -> bool {
        self.camera_aperture.is_some()
            || self.camera_zoom.is_some()
            || self.camera_exposure.is_some()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_photo_metadata_default() {
        let meta = PhotoMetadata::default();
        assert!(meta.is_empty());
        assert!(!meta.has_camera_params());
    }

    #[test]
    fn test_photo_metadata_not_empty() {
        let meta = PhotoMetadata {
            world_name: Some("Test World".to_string()),
            ..Default::default()
        };
        assert!(!meta.is_empty());
    }

    #[test]
    fn test_from_base64_valid() {
        // 有効なBase64 JSONをデコードできること
        let meta = PhotoMetadata {
            world_name: Some("テストワールド".to_string()),
            photographer_name: Some("撮影者 Name".to_string()),
            user_count: Some(5),
            camera_type: Some("VirtualLens2".to_string()),
            camera_aperture: Some(2.8),
            camera_zoom: Some(0.5),
            camera_exposure: Some(1.0),
            taken_at: Some("2026/01/20 16:00".to_string()),
        };

        let json = serde_json::to_string(&meta).unwrap();
        let encoded = BASE64.encode(&json);

        let decoded = PhotoMetadata::from_base64(&encoded).unwrap();

        assert_eq!(decoded.world_name, Some("テストワールド".to_string()));
        assert_eq!(decoded.photographer_name, Some("撮影者 Name".to_string()));
        assert_eq!(decoded.user_count, Some(5));
        assert_eq!(decoded.camera_type, Some("VirtualLens2".to_string()));
        assert_eq!(decoded.camera_aperture, Some(2.8));
    }

    #[test]
    fn test_from_base64_invalid() {
        // 無効なBase64はNoneを返すこと
        assert!(PhotoMetadata::from_base64("!!!invalid!!!").is_none());
    }

    #[test]
    fn test_from_base64_empty_json() {
        // 空のJSONオブジェクトはデフォルト値でデコードされること
        let encoded = BASE64.encode("{}");
        let decoded = PhotoMetadata::from_base64(&encoded).unwrap();

        assert!(decoded.world_name.is_none());
        assert!(decoded.is_empty());
    }

    #[test]
    fn test_has_camera_params() {
        let meta = PhotoMetadata {
            camera_aperture: Some(2.8),
            ..Default::default()
        };
        assert!(meta.has_camera_params());

        let meta2 = PhotoMetadata::default();
        assert!(!meta2.has_camera_params());
    }
}
