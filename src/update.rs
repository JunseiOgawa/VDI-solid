//! VDI-solidのAuto Updateモジュール
//!
//! GitHub Releasesから最新バージョンを取得し、アプリケーションを更新する機能を提供します。

use std::sync::mpsc;
use std::thread;

/// アップデートのステータス
#[derive(Debug, Clone, PartialEq)]
pub enum UpdateStatus {
    /// チェック中
    Checking,
    /// 最新版である
    UpToDate,
    /// 新しいバージョンが利用可能
    UpdateAvailable {
        /// 新しいバージョン番号
        new_version: String,
        /// リリースノート
        release_notes: Option<String>,
    },
    /// ダウンロード中
    Downloading {
        /// 進捗（0.0〜1.0）
        progress: f32,
    },
    /// 更新完了（再起動が必要）
    Updated {
        /// 更新後のバージョン
        version: String,
    },
    /// エラーが発生した
    Error(String),
}

/// アップデートチェックの結果
#[derive(Debug)]
pub struct UpdateCheckResult {
    /// 新しいバージョンがあるか
    pub has_update: bool,
    /// 新しいバージョン番号（ある場合）
    pub new_version: Option<String>,
    /// リリースノート（ある場合）
    pub release_notes: Option<String>,
    /// 現在のバージョン
    pub current_version: String,
}

/// アップデート操作の結果
#[derive(Debug)]
pub enum UpdateResult {
    /// チェック結果
    CheckResult(UpdateCheckResult),
    /// 更新完了
    Updated(String),
    /// エラー
    Error(String),
}

/// 定数
const REPO_OWNER: &str = "JunseiOgawa";
const REPO_NAME: &str = "VDI-solid";
const BIN_NAME: &str = "vdi-egui";

/// 現在のバージョンを取得
pub fn current_version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}

/// バックグラウンドでアップデートをチェックするスレッドを開始
/// 結果をReceiverで受け取る
pub fn check_for_updates_async() -> mpsc::Receiver<UpdateResult> {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let result = check_for_updates_sync();
        let _ = tx.send(result);
    });

    rx
}

/// 同期的にアップデートをチェック
fn check_for_updates_sync() -> UpdateResult {
    // self_updateクレートを使用してGitHub Releasesをチェック
    match self_update::backends::github::Update::configure()
        .repo_owner(REPO_OWNER)
        .repo_name(REPO_NAME)
        .bin_name(BIN_NAME)
        .current_version(current_version())
        .build()
    {
        Ok(updater) => {
            match updater.get_latest_release() {
                Ok(release) => {
                    let latest_version = release.version.trim_start_matches('v').to_string();
                    let current = current_version();

                    // バージョン比較
                    let has_update = is_newer_version(&latest_version, current);

                    UpdateResult::CheckResult(UpdateCheckResult {
                        has_update,
                        new_version: if has_update {
                            Some(latest_version)
                        } else {
                            None
                        },
                        release_notes: Some(release.body.unwrap_or_default()),
                        current_version: current.to_string(),
                    })
                }
                Err(e) => UpdateResult::Error(format!("リリース情報の取得に失敗: {}", e)),
            }
        }
        Err(e) => UpdateResult::Error(format!("アップデーターの初期化に失敗: {}", e)),
    }
}

/// バックグラウンドでアップデートを実行するスレッドを開始
pub fn perform_update_async() -> mpsc::Receiver<UpdateResult> {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let result = perform_update_sync();
        let _ = tx.send(result);
    });

    rx
}

/// 同期的にアップデートを実行
fn perform_update_sync() -> UpdateResult {
    println!("[UPDATE] Starting update process...");

    match self_update::backends::github::Update::configure()
        .repo_owner(REPO_OWNER)
        .repo_name(REPO_NAME)
        .bin_name(BIN_NAME)
        .show_download_progress(true)
        .current_version(current_version())
        .build()
    {
        Ok(updater) => match updater.update() {
            Ok(status) => {
                let version = status.version().to_string();
                if status.updated() {
                    println!("[UPDATE] Successfully updated to v{}", version);
                    UpdateResult::Updated(version)
                } else {
                    println!("[UPDATE] Already up to date (v{})", version);
                    UpdateResult::CheckResult(UpdateCheckResult {
                        has_update: false,
                        new_version: None,
                        release_notes: None,
                        current_version: current_version().to_string(),
                    })
                }
            }
            Err(e) => {
                let error_msg = format!("アップデートに失敗: {}", e);
                eprintln!("[UPDATE] {}", error_msg);
                UpdateResult::Error(error_msg)
            }
        },
        Err(e) => UpdateResult::Error(format!("アップデーターの初期化に失敗: {}", e)),
    }
}

/// セマンティックバージョンを比較して新しいかどうかを判定
/// new_ver が current_ver より新しい場合 true を返す
fn is_newer_version(new_ver: &str, current_ver: &str) -> bool {
    let parse_version = |v: &str| -> (u32, u32, u32) {
        let parts: Vec<u32> = v
            .trim_start_matches('v')
            .split('.')
            .filter_map(|s| s.parse().ok())
            .collect();
        (
            parts.first().copied().unwrap_or(0),
            parts.get(1).copied().unwrap_or(0),
            parts.get(2).copied().unwrap_or(0),
        )
    };

    let new = parse_version(new_ver);
    let current = parse_version(current_ver);

    new > current
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_newer_version() {
        assert!(is_newer_version("1.0.1", "1.0.0"));
        assert!(is_newer_version("1.1.0", "1.0.0"));
        assert!(is_newer_version("2.0.0", "1.0.0"));
        assert!(!is_newer_version("1.0.0", "1.0.0"));
        assert!(!is_newer_version("0.9.0", "1.0.0"));
        assert!(is_newer_version("v0.6.0", "0.5.0"));
    }

    #[test]
    fn test_current_version() {
        // Cargo.tomlのバージョンが返されることを確認
        let ver = current_version();
        assert!(!ver.is_empty());
    }
}
