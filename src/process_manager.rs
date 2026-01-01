use std::path::Path;

use sysinfo::{get_current_pid, Pid, System};

/// CLOSEWINDOWモードを尊重し、このアプリケーションの他の実行中のインスタンスを終了します。
pub fn close_other_vdi_instances() {
    let mut system = System::new_all();
    system.refresh_processes();

    let current_pid = get_current_pid().unwrap_or_else(|_| Pid::from_u32(std::process::id()));
    let current_exe = std::env::current_exe().ok();

    for (pid, process) in system.processes() {
        if *pid == current_pid {
            continue;
        }

        if !is_same_application(process, current_exe.as_deref()) {
            continue;
        }

        if !process.kill() {
            eprintln!(
                "[ProcessManager] Failed to terminate process {} ({})",
                pid,
                process.name()
            );
        }
    }
}

fn is_same_application(process: &sysinfo::Process, current_exe: Option<&Path>) -> bool {
    if let Some(exe_path) = current_exe {
        if process.exe() == Some(exe_path) {
            return true;
        }
        if let Some(current_name) = exe_path.file_name().and_then(|name| name.to_str()) {
            if process.name().eq_ignore_ascii_case(current_name) {
                return true;
            }
        }
    }

    let name = process.name();
    name.eq_ignore_ascii_case("vdi") || name.eq_ignore_ascii_case("vdi.exe")
}
