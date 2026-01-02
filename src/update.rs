//! VDI-solidのAuto Updateモジュール（スタブ実装）
//!
//! 注意: self_updateクレートが依存関係に含まれていないため、
//! 現在はスタブ実装になっています。完全な機能を使用するには、
//! Cargo.tomlに `self_update = "0.39"` を追加してください。

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

/// 現在のバージョンを取得
pub fn current_version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}

/// バックグラウンドでアップデートをチェックするスレッドを開始（スタブ）
/// 結果をReceiverで受け取る
pub fn check_for_updates_async() -> mpsc::Receiver<UpdateResult> {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        // スタブ実装: self_updateクレートが必要
        let result = UpdateResult::Error(
            "アップデート機能は現在無効です。self_updateクレートを追加してください。".to_string(),
        );
        let _ = tx.send(result);
    });

    rx
}

/// バックグラウンドでアップデートを実行するスレッドを開始（スタブ）
pub fn perform_update_async() -> mpsc::Receiver<UpdateResult> {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        // スタブ実装: self_updateクレートが必要
        let result = UpdateResult::Error(
            "アップデート機能は現在無効です。self_updateクレートを追加してください。".to_string(),
        );
        let _ = tx.send(result);
    });

    rx
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_current_version() {
        // Cargo.tomlのバージョンが返されることを確認
        let ver = current_version();
        assert!(!ver.is_empty());
    }
}
