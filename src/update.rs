use self_update::cargo_crate_version;
use std::sync::mpsc;
use std::thread;

#[derive(Debug, Clone)]
pub enum UpdateStatus {
    Checking,
    UpToDate,
    UpdateAvailable {
        new_version: String,
        release_notes: Option<String>,
    },
    Downloading {
        progress: f32,
    },
    Updated {
        version: String,
    },
    Error(String),
}

pub struct UpdateCheckResult {
    pub has_update: bool,
    pub new_version: Option<String>,
    pub release_notes: Option<String>,
    pub current_version: String,
}

#[derive(Debug)]
pub enum UpdateResult {
    CheckResult(UpdateCheckResult),
    Updated(String),
    Error(String),
}

pub fn current_version() -> &'static str {
    cargo_crate_version!()
}

pub fn check_for_updates_async() -> mpsc::Receiver<UpdateResult> {
    let (tx, rx) = mpsc::channel();
    thread::spawn(move || {
        let result = check_for_updates_sync();
        let _ = tx.send(result);
    });
    rx
}

fn check_for_updates_sync() -> UpdateResult {
    let result = self_update::backends::github::Update::configure()
        .repo_owner("JunseiOgawa")
        .repo_name("VDI-solid")
        .bin_name("vdi-egui")
        .current_version(cargo_crate_version!())
        .build();

    match result {
        Ok(updater) => match updater.get_latest_release() {
            Ok(release) => {
                let current = cargo_crate_version!();
                let is_newer = self_update::version::bump_is_greater(current, &release.version)
                    .unwrap_or(false);

                if is_newer {
                    UpdateResult::CheckResult(UpdateCheckResult {
                        has_update: true,
                        new_version: Some(release.version),
                        release_notes: Some(release.body.unwrap_or_default()),
                        current_version: current.to_string(),
                    })
                } else {
                    UpdateResult::CheckResult(UpdateCheckResult {
                        has_update: false,
                        new_version: None,
                        release_notes: None,
                        current_version: current.to_string(),
                    })
                }
            }
            Err(e) => UpdateResult::Error(format!("Failed to get latest release: {}", e)),
        },
        Err(e) => UpdateResult::Error(format!("Failed to configure updater: {}", e)),
    }
}

pub fn perform_update_async() -> mpsc::Receiver<UpdateResult> {
    let (tx, rx) = mpsc::channel();
    thread::spawn(move || {
        let result = self_update::backends::github::Update::configure()
            .repo_owner("JunseiOgawa")
            .repo_name("VDI-solid")
            .bin_name("vdi-egui")
            .show_download_progress(true)
            .current_version(cargo_crate_version!())
            .build();

        match result {
            Ok(updater) => match updater.update() {
                Ok(status) => UpdateResult::Updated(status.version().to_string()),
                Err(e) => UpdateResult::Error(format!("Update failed: {}", e)),
            },
            Err(e) => UpdateResult::Error(format!("Failed to configure updater: {}", e)),
        }
    });
    rx
}
