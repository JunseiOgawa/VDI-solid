// VirtualDesktop検知機能
// VirtualDesktop.Streamer.exeプロセスの検知を行う

use sysinfo::{ProcessRefreshKind, ProcessesToUpdate, System};

/// VirtualDesktop.Streamer.exeプロセスが実行中かどうかを検知する
/// 
/// # Returns
/// 
/// * `Ok(true)` - VirtualDesktop.Streamer.exeが実行中
/// * `Ok(false)` - VirtualDesktop.Streamer.exeが実行されていない
#[tauri::command]
pub fn detect_virtualdesktop_streamer() -> Result<bool, String> {
    // システム情報を取得
    let mut sys = System::new();
    
    // すべてのプロセスをリフレッシュ
    sys.refresh_processes_specifics(ProcessesToUpdate::All, true, ProcessRefreshKind::new());

    // VirtualDesktop.Streamer.exeプロセスを検索
    for (_pid, process) in sys.processes() {
        let process_name = process.name().to_string_lossy().to_lowercase();
        
        // VirtualDesktop.Streamer.exeまたはvirtualdesktop.streamer.exeを検索
        if process_name.contains("virtualdesktop.streamer") {
            return Ok(true);
        }
    }

    Ok(false)
}
