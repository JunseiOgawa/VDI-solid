#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod settings;

use eframe::egui;
use settings::*;
use std::path::PathBuf;
use std::sync::mpsc;
use std::sync::Arc;
use std::thread;
use vdi_lib::{histogram, peaking};
use std::io::Write;



fn main() -> eframe::Result {
    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_inner_size([1200.0, 800.0])
            .with_title("VDI-solid (Egui版)")
            .with_decorations(true)
            .with_resizable(true),
        ..Default::default()
    };

    eframe::run_native(
        "VDI-solid",
        options,
        Box::new(|cc| {
            // 初期フォント設定（システムフォント）
            let fonts = load_system_fonts();
            cc.egui_ctx.set_fonts(fonts);
            
            egui_extras::install_image_loaders(&cc.egui_ctx);
            cc.egui_ctx.set_visuals(create_dark_theme());
            Ok(Box::new(VdiApp::new(cc)))
        }),
    )
}

fn load_system_fonts() -> egui::FontDefinitions {
    let mut fonts = egui::FontDefinitions::default();
    
    // Windows標準の日本語フォントを試行
    let font_candidates = [
        "C:\\Windows\\Fonts\\msgothic.ttc", // MS ゴシック
        "C:\\Windows\\Fonts\\meiryo.ttc",   // メイリオ
    ];

    for path in font_candidates {
        if let Ok(data) = std::fs::read(path) {
            println!("[FONTS] Loading system font from: {}", path);
            fonts.font_data.insert(
                "japanese_system".to_owned(),
                egui::FontData::from_owned(data).tweak(
                    egui::FontTweak {
                        scale: 1.2, // MSゴシックなどは少し小さいので調整
                        ..Default::default()
                    }
                ),
            );

            // Proportionalフォントの先頭に追加（優先使用）
            if let Some(vec) = fonts.families.get_mut(&egui::FontFamily::Proportional) {
                vec.insert(0, "japanese_system".to_owned());
            }

            // Monospaceにも追加
            if let Some(vec) = fonts.families.get_mut(&egui::FontFamily::Monospace) {
                vec.push("japanese_system".to_owned());
            }
            
            return fonts;
        }
    }
    
    eprintln!("[FONTS] No suitable system Japanese font found.");
    fonts
}

fn create_dark_theme() -> egui::Visuals {
    let mut visuals = egui::Visuals::dark();
    visuals.window_fill = egui::Color32::from_rgba_unmultiplied(20, 20, 25, 230);
    visuals.panel_fill = egui::Color32::from_rgba_unmultiplied(25, 25, 30, 200);
    visuals.widgets.noninteractive.bg_fill = egui::Color32::from_rgba_unmultiplied(40, 40, 50, 180);
    visuals.widgets.inactive.bg_fill = egui::Color32::from_rgba_unmultiplied(50, 50, 60, 200);
    visuals.widgets.hovered.bg_fill = egui::Color32::from_rgba_unmultiplied(70, 70, 85, 220);
    visuals.widgets.active.bg_fill = egui::Color32::from_rgba_unmultiplied(90, 90, 110, 240);
    visuals.widgets.noninteractive.rounding = egui::Rounding::same(6.0);
    visuals.widgets.inactive.rounding = egui::Rounding::same(6.0);
    visuals.widgets.hovered.rounding = egui::Rounding::same(6.0);
    visuals.widgets.active.rounding = egui::Rounding::same(6.0);
    visuals.window_rounding = egui::Rounding::same(8.0);
    visuals.window_shadow = egui::epaint::Shadow {
        offset: [0.0, 4.0].into(),
        blur: 16.0,
        spread: 0.0,
        color: egui::Color32::from_black_alpha(100),
    };
    visuals
}

struct VdiApp {
    // 設定
    settings: AppSettings,
    
    // 画像の状態
    current_path: Option<PathBuf>,
    texture: Option<egui::TextureHandle>,
    original_image: Option<Arc<image::DynamicImage>>,
    image_dimensions: Option<(u32, u32)>,
    file_size_bytes: Option<u64>,
    rotation: f32,
    rotation_in_progress: bool,
    pending_rotations: usize,
    
    // 表示状態
    zoom: f32,
    pan: egui::Vec2,
    
    // 機能
    peaking_enabled: bool,
    peaking_result: Option<Arc<peaking::PeakingResult>>,
    peaking_receiver: Option<mpsc::Receiver<peaking::PeakingResult>>,
    
    histogram_enabled: bool,
    histogram_result: Option<Arc<histogram::HistogramResult>>,
    histogram_receiver: Option<mpsc::Receiver<histogram::HistogramResult>>,
    
    rotation_receiver: Option<mpsc::Receiver<PathBuf>>,
    
    grid_enabled: bool,
    
    // UI状態
    status_message: String,
    show_settings: bool,
    blink_time: f32,
    fit_requested: bool,
    
    // スロットリング
    peaking_dirty: bool,
    last_peaking_trigger: f64,
    
    // フォント読み込み
    font_download_receiver: Option<mpsc::Receiver<Vec<u8>>>,
    font_status_message: Option<String>,
}

impl VdiApp {
    fn new(_cc: &eframe::CreationContext<'_>) -> Self {
        let settings = AppSettings::load();
        
        // フォントの非同期ダウンロード開始
        let (font_tx, font_rx) = mpsc::channel();
        thread::spawn(move || {
            // BIZ UDP明朝のURL（Google Fonts GitHub Raw）
            let url = "https://github.com/google/fonts/raw/main/ofl/bizudpmincho/BIZUDPMincho-Regular.ttf";
            // キャッシュディレクトリの確認
            let cache_dir = dirs_next::cache_dir().unwrap_or(PathBuf::from("."));
            let font_cache_path = cache_dir.join("vdi_biz_udp_mincho.ttf");
            
            // キャッシュがあるか確認
            if font_cache_path.exists() {
                println!("[FONTS] Loading from cache: {:?}", font_cache_path);
                if let Ok(data) = std::fs::read(&font_cache_path) {
                     let _ = font_tx.send(data);
                     return;
                }
            }
            
            println!("[FONTS] Downloading from: {}", url);
            // ダウンロード実行
            match reqwest::blocking::get(url) {
                Ok(resp) => {
                    if let Ok(bytes) = resp.bytes() {
                        let data = bytes.to_vec();
                        // キャッシュに保存
                        if let Ok(mut file) = std::fs::File::create(&font_cache_path) {
                            let _ = file.write_all(&data);
                        }
                        let _ = font_tx.send(data);
                    }
                }
                Err(e) => eprintln!("[FONTS] Download failed: {}", e),
            }
        });

        Self {
            peaking_dirty: false,
            last_peaking_trigger: 0.0,
            font_download_receiver: Some(font_rx),
            font_status_message: None,
            settings,
            current_path: None,
            texture: None,
            original_image: None,
            image_dimensions: None,
            file_size_bytes: None,
            rotation: 0.0,
            rotation_in_progress: false,
            pending_rotations: 0,
            zoom: 1.0,
            pan: egui::Vec2::ZERO,
            peaking_enabled: false,
            peaking_result: None,
            peaking_receiver: None,
            histogram_enabled: false,
            histogram_result: None,
            histogram_receiver: None,
            rotation_receiver: None,
            grid_enabled: false,
            status_message: "準備完了".to_string(),
            show_settings: false,
            blink_time: 0.0,
            fit_requested: false,
        }
    }

    fn load_image(&mut self, path: PathBuf, ctx: &egui::Context) {
        println!("[LOAD_IMAGE] Starting load for: {}", path.display());
        println!("[LOAD_IMAGE] Current rotation before load: {}°", self.rotation);
        
        self.status_message = format!("{} を読み込み中...", path.display());
        
        // ファイルサイズを取得
        self.file_size_bytes = std::fs::metadata(&path).ok().map(|m| m.len());
        
        match image::open(&path) {
            Ok(img) => {
                println!("[LOAD_IMAGE] Successfully opened image: {}x{}", img.width(), img.height());
                
                self.image_dimensions = Some((img.width(), img.height()));
                let size = [img.width() as _, img.height() as _];
                let image_buffer = img.to_rgba8();
                let pixels = image_buffer.as_flat_samples();
                let color_image = egui::ColorImage::from_rgba_unmultiplied(
                    size,
                    pixels.as_slice(),
                );
                
                self.texture = Some(ctx.load_texture(
                    "main_image",
                    color_image,
                    egui::TextureOptions::LINEAR,
                ));
                self.original_image = Some(Arc::new(img));
                self.current_path = Some(path);
                self.zoom = 1.0;
                self.pan = egui::Vec2::ZERO;
                
                // 読み込み後、常に回転を0.0にリセットする
                // ファイル自体は回転後の再読み込みであれば既に回転している
                // そのため、視覚的な回転を適用する必要はもうない
                println!("[LOAD_IMAGE] Resetting rotation to 0° (New image loaded)");
                self.rotation = 0.0;
                
                println!("[LOAD_IMAGE] Final rotation: {}°", self.rotation);
                
                // 新しい画像の画面合わせをリクエスト
                self.fit_requested = true;
                
                // 機能をリセット
                self.peaking_result = None;
                self.histogram_result = None;
                
                // 有効な場合、機能をトリガーする
                if self.peaking_enabled {
                    self.trigger_peaking();
                }
                if self.histogram_enabled {
                    self.trigger_histogram();
                }
                
                self.status_message = "読み込み完了".to_string();
            }
            Err(err) => {
                self.status_message = format!("画像の読み込みに失敗しました: {}", err);
            }
        }
    }
    
    fn trigger_peaking(&mut self) {
        if let Some(path) = &self.current_path {
            let path_str = path.to_string_lossy().to_string();
            let threshold = self.settings.peaking_threshold;
            let (tx, rx) = mpsc::channel();
            self.peaking_receiver = Some(rx);
            
            thread::spawn(move || {
                let rt = tokio::runtime::Runtime::new().unwrap();
                let res = rt.block_on(async {
                    vdi_lib::peaking::focus_peaking(path_str, threshold, None).await
                });
                
                if let Ok(result) = res {
                    let _ = tx.send(result);
                }
            });
        }
    }
    
    fn trigger_histogram(&mut self) {
        if let Some(path) = &self.current_path {
            let path_str = path.to_string_lossy().to_string();
            let (tx, rx) = mpsc::channel();
            self.histogram_receiver = Some(rx);
            
            thread::spawn(move || {
                let rt = tokio::runtime::Runtime::new().unwrap();
                let res = rt.block_on(async {
                    vdi_lib::histogram::calculate_histogram(path_str, "rgb".to_string(), None).await
                });
                if let Ok(result) = res {
                    let _ = tx.send(result);
                }
            });
        }
    }
    
    fn next_image(&mut self, ctx: &egui::Context) {
        if let Some(path) = &self.current_path {
            if let Some(next) = vdi_lib::navigation::get_next_image(path.to_string_lossy().to_string(), true) {
                self.load_image(PathBuf::from(next), ctx);
            }
        }
    }
    
    fn prev_image(&mut self, ctx: &egui::Context) {
        if let Some(path) = &self.current_path {
            if let Some(prev) = vdi_lib::navigation::get_previous_image(path.to_string_lossy().to_string(), true) {
                self.load_image(PathBuf::from(prev), ctx);
            }
        }
    }
    
    fn rotate_image(&mut self, _ctx: &egui::Context) {
        println!("[ROTATE_IMAGE] Function called");
        
        if let Some(path) = &self.current_path {
            // 処理状態に関係なく、視覚的なフィードバックのために回転を即座に更新する
            let old_rotation = self.rotation;
            self.rotation = (self.rotation + 90.0) % 360.0;
            println!("[ROTATE_IMAGE] Updated visual rotation: {}° -> {}°", old_rotation, self.rotation);
            self.status_message = format!("{}° に回転中...", self.rotation);

            // Check if we can stack more rotations (max 3 pending)
            if self.rotation_in_progress {
                if self.pending_rotations < 3 {
                    self.pending_rotations += 1;
                    println!("[ROTATE_IMAGE] Stacked rotation request. Pending: {}", self.pending_rotations);
                } else {
                    println!("[ROTATE_IMAGE] Max pending rotations reached (3), ignoring request");
                }
                return;
            }
            
            // 回転処理を開始
            self.start_rotation_process(path.clone());
        }
    }

    fn start_rotation_process(&mut self, path: PathBuf) {
        self.rotation_in_progress = true;
        println!("[ROTATE_IMAGE] Starting background rotation process");
        
        // Create channel for completion notification
        let (tx, rx) = mpsc::channel();
        self.rotation_receiver = Some(rx);
        
        let path_str = path.to_string_lossy().to_string();
        let reload_path = path.clone();
        
        thread::spawn(move || {
            let rt = tokio::runtime::Runtime::new().unwrap();
            let result = rt.block_on(async {
                vdi_lib::img::rotate_image(path_str, 90.0).await
            });
            
            if result.is_ok() {
                // Wait a bit for file to be written
                thread::sleep(std::time::Duration::from_millis(100));
                let _ = tx.send(reload_path);
            }
        });
    }
    
    fn screen_fit(&mut self, available_size: egui::Vec2) {
        if let Some(texture) = &self.texture {
            let image_size = texture.size_vec2();
            
            // 利用可能なスペースに合わせて画像のズームを計算
            // 回転を考慮
            let (display_width, display_height) = if self.rotation == 90.0 || self.rotation == 270.0 {
                (image_size.y, image_size.x)
            } else {
                (image_size.x, image_size.y)
            };
            
            let zoom_x = available_size.x / display_width;
            let zoom_y = available_size.y / display_height;
            
            // 画像全体が表示されるように小さい方のズーム係数を使用
            // 画面全体を埋めるために5%のマージンを削除
            self.zoom = zoom_x.min(zoom_y).max(0.01);
            self.pan = egui::Vec2::ZERO;
            

        }
    }
    
    fn reveal_in_explorer(&self) {
        if let Some(path) = &self.current_path {
            #[cfg(target_os = "windows")]
            {
                let _ = std::process::Command::new("explorer")
                    .args(&["/select,", &path.to_string_lossy()])
                    .spawn();
            }
            
            #[cfg(target_os = "macos")]
            {
                let _ = std::process::Command::new("open")
                    .args(&["-R", &path.to_string_lossy()])
                    .spawn();
            }
            
            #[cfg(target_os = "linux")]
            {
                if let Some(parent) = path.parent() {
                    let _ = std::process::Command::new("xdg-open")
                        .arg(parent)
                        .spawn();
                }
            }
        }
    }
    
    fn format_file_size(bytes: u64) -> String {
        const KB: u64 = 1024;
        const MB: u64 = KB * 1024;
        const GB: u64 = MB * 1024;
        
        if bytes >= GB {
            format!("{:.2} GB", bytes as f64 / GB as f64)
        } else if bytes >= MB {
            format!("{:.2} MB", bytes as f64 / MB as f64)
        } else if bytes >= KB {
            format!("{:.2} KB", bytes as f64 / KB as f64)
        } else {
            format!("{} B", bytes)
        }
    }
    
    fn draw_grid(&self, painter: &egui::Painter, rect: egui::Rect) {
        let color = egui::Color32::from_white_alpha((self.settings.grid_opacity * 255.0) as u8);
        let stroke = egui::Stroke::new(1.0, color);
        
        match self.settings.grid_pattern {
            GridPattern::None => {}
            GridPattern::RuleOfThirds => {
                // Vertical lines
                let x1 = rect.min.x + rect.width() / 3.0;
                let x2 = rect.min.x + rect.width() * 2.0 / 3.0;
                painter.line_segment([egui::pos2(x1, rect.min.y), egui::pos2(x1, rect.max.y)], stroke);
                painter.line_segment([egui::pos2(x2, rect.min.y), egui::pos2(x2, rect.max.y)], stroke);
                
                // Horizontal lines
                let y1 = rect.min.y + rect.height() / 3.0;
                let y2 = rect.min.y + rect.height() * 2.0 / 3.0;
                painter.line_segment([egui::pos2(rect.min.x, y1), egui::pos2(rect.max.x, y1)], stroke);
                painter.line_segment([egui::pos2(rect.min.x, y2), egui::pos2(rect.max.x, y2)], stroke);
            }
            GridPattern::GoldenRatio => {
                let phi = 1.618;
                let x1 = rect.min.x + rect.width() / phi;
                let x2 = rect.max.x - rect.width() / phi;
                painter.line_segment([egui::pos2(x1, rect.min.y), egui::pos2(x1, rect.max.y)], stroke);
                painter.line_segment([egui::pos2(x2, rect.min.y), egui::pos2(x2, rect.max.y)], stroke);
                
                let y1 = rect.min.y + rect.height() / phi;
                let y2 = rect.max.y - rect.height() / phi;
                painter.line_segment([egui::pos2(rect.min.x, y1), egui::pos2(rect.max.x, y1)], stroke);
                painter.line_segment([egui::pos2(rect.min.x, y2), egui::pos2(rect.max.x, y2)], stroke);
            }
            GridPattern::Grid4x4 => {
                for i in 1..4 {
                    let x = rect.min.x + rect.width() * i as f32 / 4.0;
                    painter.line_segment([egui::pos2(x, rect.min.y), egui::pos2(x, rect.max.y)], stroke);
                    let y = rect.min.y + rect.height() * i as f32 / 4.0;
                    painter.line_segment([egui::pos2(rect.min.x, y), egui::pos2(rect.max.x, y)], stroke);
                }
            }
            GridPattern::Grid8x8 => {
                for i in 1..8 {
                    let x = rect.min.x + rect.width() * i as f32 / 8.0;
                    painter.line_segment([egui::pos2(x, rect.min.y), egui::pos2(x, rect.max.y)], stroke);
                    let y = rect.min.y + rect.height() * i as f32 / 8.0;
                    painter.line_segment([egui::pos2(rect.min.x, y), egui::pos2(rect.max.x, y)], stroke);
                }
            }
        }
    }
}

impl eframe::App for VdiApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        // Update blink time
        self.blink_time += ctx.input(|i| i.stable_dt);
        
        // バックグラウンドの結果を処理
        if let Some(rx) = &self.peaking_receiver {
            if let Ok(res) = rx.try_recv() {
                self.peaking_result = Some(Arc::new(res));
                self.peaking_receiver = None;
            }
        }
        if let Some(rx) = &self.histogram_receiver {
            if let Ok(res) = rx.try_recv() {
                self.histogram_result = Some(Arc::new(res));
                self.histogram_receiver = None;
            }
        }
        if let Some(rx) = &self.rotation_receiver {
            if let Ok(path) = rx.try_recv() {
                self.rotation_receiver = None;
                
                if self.pending_rotations > 0 {
                    println!("[ROTATION_COMPLETE] Pending rotations: {}. Processing next rotation.", self.pending_rotations);
                    self.pending_rotations -= 1;
                    self.start_rotation_process(path);
                } else {
                    println!("[ROTATION_COMPLETE] All rotations finished. Reloading image.");
                    self.load_image(path, ctx);
                    self.rotation_in_progress = false;
                    self.status_message = "回転完了".to_string();
                }
            }
        }

        // フォントの適用確認
        if let Some(rx) = &self.font_download_receiver {
            if let Ok(font_data) = rx.try_recv() {
                println!("[FONTS] Received custom font data. Applying...");
                self.font_download_receiver = None; // 完了
                
                let mut fonts = load_system_fonts(); // ベースはシステムフォント
                
                fonts.font_data.insert(
                    "shippori_mincho".to_owned(),
                    egui::FontData::from_owned(font_data),
                );
                
                // 最優先に設定
                if let Some(vec) = fonts.families.get_mut(&egui::FontFamily::Proportional) {
                    vec.insert(0, "shippori_mincho".to_owned());
                }
                if let Some(vec) = fonts.families.get_mut(&egui::FontFamily::Monospace) {
                    vec.insert(0, "shippori_mincho".to_owned());
                }
                
                ctx.set_fonts(fonts);
                self.font_status_message = Some("フォントを更新しました: しっぽり明朝".to_string());
                
                // 3秒後にメッセージを消す（簡易実装）
                self.status_message = "フォントを更新しました".to_string();
            }
        }

        // ドラッグ＆ドロップを処理
        if !ctx.input(|i| i.raw.dropped_files.is_empty()) {
            let dropped_files = ctx.input(|i| i.raw.dropped_files.clone());
            if let Some(file) = dropped_files.first() {
                if let Some(path) = &file.path {
                    self.load_image(path.clone(), ctx);
                }
            }
        }
        
        // キー入力
        if ctx.input(|i| i.key_pressed(egui::Key::ArrowRight)) {
            self.next_image(ctx);
        }
        if ctx.input(|i| i.key_pressed(egui::Key::ArrowLeft)) {
            self.prev_image(ctx);
        }
        if ctx.input(|i| i.key_pressed(egui::Key::R)) {
            self.rotate_image(ctx);
        }
        if ctx.input(|i| i.key_pressed(egui::Key::G)) {
            self.grid_enabled = !self.grid_enabled;
        }
        if ctx.input(|i| i.key_pressed(egui::Key::P)) {
            self.peaking_enabled = !self.peaking_enabled;
            if self.peaking_enabled {
                self.trigger_peaking();
            } else {
                self.peaking_result = None;
            }
        }
        if ctx.input(|i| i.key_pressed(egui::Key::H)) {
            self.histogram_enabled = !self.histogram_enabled;
            if self.histogram_enabled {
                self.trigger_histogram();
            } else {
                self.histogram_result = None;
            }
        }
        if ctx.input(|i| i.key_pressed(egui::Key::F)) {
            self.fit_requested = true;
        }

        // 上部パネル
        egui::TopBottomPanel::top("vdi_top_panel").show(ctx, |ui| {
            ui.horizontal(|ui| {
                if ui.button("📂 開く").clicked() {
                    if let Some(path) = rfd::FileDialog::new().pick_file() {
                        self.load_image(path, ctx);
                    }
                }
                
                if ui.button("⬅").clicked() { self.prev_image(ctx); }
                if ui.button("➡").clicked() { self.next_image(ctx); }
                if ui.button("🔄").clicked() { self.rotate_image(ctx); }
                
                ui.separator();
                
                if ui.checkbox(&mut self.peaking_enabled, "ピーキング (P)").changed() {
                    if self.peaking_enabled {
                        self.trigger_peaking();
                    } else {
                        self.peaking_result = None;
                    }
                }
                
                if ui.checkbox(&mut self.histogram_enabled, "ヒストグラム (H)").changed() {
                    if self.histogram_enabled {
                        self.trigger_histogram();
                    } else {
                        self.histogram_result = None;
                    }
                }
                
                if ui.checkbox(&mut self.grid_enabled, "グリッド (G)").changed() {}
                
                ui.separator();
                
                if ui.button("全体表示 (F)").clicked() {
                    self.fit_requested = true;
                }
                
                if ui.button("⚙ 設定").clicked() {
                    self.show_settings = !self.show_settings;
                }
                
                ui.separator();
                ui.label(&self.status_message);
            });
        });
        
        // 設定ウィンドウ
        if self.show_settings {
            egui::Window::new("設定")
                .open(&mut self.show_settings)
                .show(ctx, |ui| {
                    ui.heading("ズーム");
                    ui.add(egui::Slider::new(&mut self.settings.wheel_sensitivity,  0.05..=1.0)
                        .text("ホイール感度"));
                    
                    ui.separator();
                    ui.heading("ピーキング");
                    
                    if ui.add(egui::Slider::new(&mut self.settings.peaking_threshold, 0..=255)
                        .text("しきい値")).changed() 
                    {
                        self.peaking_dirty = true;
                    }
                    
                    ui.add(egui::Slider::new(&mut self.settings.peaking_intensity, 0..=255)
                        .text("強度"));
                    
                    ui.add(egui::Slider::new(&mut self.settings.peaking_opacity, 0.0..=1.0)
                        .text("不透明度"));
                    
                    ui.color_edit_button_srgb(&mut self.settings.peaking_color);
                    ui.checkbox(&mut self.settings.peaking_blink, "点滅");
                    
                    ui.separator();
                    ui.heading("グリッド");
                    egui::ComboBox::from_label("パターン")
                        .selected_text(format!("{:?}", self.settings.grid_pattern))
                        .show_ui(ui, |ui| {
                            ui.selectable_value(&mut self.settings.grid_pattern, GridPattern::None, "なし");
                            ui.selectable_value(&mut self.settings.grid_pattern, GridPattern::RuleOfThirds, "三分割法");
                            ui.selectable_value(&mut self.settings.grid_pattern, GridPattern::GoldenRatio, "黄金比");
                            ui.selectable_value(&mut self.settings.grid_pattern, GridPattern::Grid4x4, "4x4 グリッド");
                            ui.selectable_value(&mut self.settings.grid_pattern, GridPattern::Grid8x8, "8x8 グリッド");
                        });
                    ui.add(egui::Slider::new(&mut self.settings.grid_opacity, 0.0..=1.0)
                        .text("グリッド不透明度"));
                    
                    ui.separator();
                    ui.heading("ヒストグラム");
                    
                    ui.add(egui::Slider::new(&mut self.settings.histogram_size, 0.5..=2.0)
                        .text("サイズ"));
                    
                    ui.add(egui::Slider::new(&mut self.settings.histogram_opacity, 0.0..=1.0)
                        .text("不透明度"));
                    
                    egui::ComboBox::from_label("位置")
                        .selected_text(format!("{:?}", self.settings.histogram_position))
                        .show_ui(ui, |ui| {
                            ui.selectable_value(&mut self.settings.histogram_position, HistogramPosition::TopLeft, "左上");
                            ui.selectable_value(&mut self.settings.histogram_position, HistogramPosition::TopRight, "右上");
                            ui.selectable_value(&mut self.settings.histogram_position, HistogramPosition::BottomLeft, "左下");
                            ui.selectable_value(&mut self.settings.histogram_position, HistogramPosition::BottomRight, "右下");
                        });
                    
                    ui.separator();
                    if ui.button("設定を保存").clicked() {
                        self.settings.save();
                        self.status_message = "設定を保存しました".to_string();
                    }
                });
        }
        
        // スロットリング付きでピーキングロジックをトリガー
        let now = ctx.input(|i| i.time);
        if self.peaking_dirty && self.peaking_enabled {
            // Only trigger if enough time passed AND no calculation currently running
            if now - self.last_peaking_trigger > 0.1 && self.peaking_receiver.is_none() {
                self.trigger_peaking();
                self.last_peaking_trigger = now;
                self.peaking_dirty = false;
            }
        }

        // 中央パネル - 画像ビューア
        let mut fit_size = None;
        
        egui::CentralPanel::default()
            .frame(egui::Frame::none().inner_margin(0.0))
            .show(ctx, |ui| {
            if let Some(texture) = &self.texture {
                let available_size = ui.available_size();
                
                // Store size for fit processing outside closure
                if self.fit_requested {
                    fit_size = Some(available_size);
                }
                
                let (response, painter) = ui.allocate_painter(available_size, egui::Sense::drag());
                
                // マウス位置によるズーム＆パンのロジック
                if response.hovered() {
                    let scroll = ctx.input(|i| i.smooth_scroll_delta.y);
                    if scroll != 0.0 {
                        let zoom_factor = if scroll > 0.0 {
                            1.0 + (0.1 * self.settings.wheel_sensitivity)
                        } else {
                            1.0 / (1.0 + (0.1 * self.settings.wheel_sensitivity))
                        };
                        
                        // マウス位置に向かってズーム
                        if let Some(pointer_pos) = response.hover_pos() {
                            let center = response.rect.center() + self.pan;
                            let before_zoom_offset = (pointer_pos - center) / self.zoom;
                            self.zoom = (self.zoom * zoom_factor).clamp(0.1, 20.0);
                            let after_zoom_offset = (pointer_pos - center) / self.zoom;
                            self.pan += (after_zoom_offset - before_zoom_offset) * self.zoom;
                        } else {
                            self.zoom = (self.zoom * zoom_factor).clamp(0.1, 20.0);
                        }
                    }
                }
                
                let image_size = texture.size_vec2();
                
                // 90度および270度回転の場合、幅と高さを入れ替える
                let display_size = if self.rotation == 90.0 || self.rotation == 270.0 {
                    egui::vec2(image_size.y, image_size.x)
                } else {
                    image_size
                };
                let scaled_size = display_size * self.zoom;
                
                if response.dragged() {
                    self.pan += response.drag_delta();
                }
                
                // 画像がある程度見えるようにパンを制限
                let x_limit = (available_size.x + scaled_size.x) / 2.0 - 50.0; // Keep 50px visible
                let y_limit = (available_size.y + scaled_size.y) / 2.0 - 50.0;
                
                self.pan.x = self.pan.x.clamp(-x_limit, x_limit);
                self.pan.y = self.pan.y.clamp(-y_limit, y_limit);
                
                // 画像を中央に配置 + パン
                let center = response.rect.center() + self.pan;
                let rect = egui::Rect::from_center_size(center, scaled_size);
                
                // 回転付きで画像を描画
                if self.rotation == 0.0 {
                    // 回転なし - 通常通り描画
                    painter.image(
                        texture.id(),
                        rect,
                        egui::Rect::from_min_max(egui::pos2(0.0, 0.0), egui::pos2(1.0, 1.0)),
                        egui::Color32::WHITE
                    );
                } else {
                    // メッシュを使用して回転を適用
                    use egui::epaint::{Mesh, Vertex};
                    
                    let mut mesh = Mesh::with_texture(texture.id());
                    
                    // 標準のRectコーナー
                    let corners = [
                        rect.min,                           // Top-left
                        egui::pos2(rect.max.x, rect.min.y), // Top-right
                        rect.max,                           // Bottom-right
                        egui::pos2(rect.min.x, rect.max.y), // Bottom-left
                    ];
                    
                    // 回転に基づくUV座標
                    let uvs = match self.rotation as i32 {
                        90 => [
                            [0.0, 1.0],
                            [0.0, 0.0],
                            [1.0, 0.0],
                            [1.0, 1.0],
                        ],
                        180 => [
                            [1.0, 1.0],
                            [0.0, 1.0],
                            [0.0, 0.0],
                            [1.0, 0.0],
                        ],
                        270 => [
                            [1.0, 0.0],
                            [1.0, 1.0],
                            [0.0, 1.0],
                            [0.0, 0.0],
                        ],
                        _ => [
                            [0.0, 0.0],
                            [1.0, 0.0],
                            [1.0, 1.0],
                            [0.0, 1.0],
                        ],
                    };
                    
                    // 頂点を追加
                    for (i, corner) in corners.iter().enumerate() {
                        mesh.vertices.push(Vertex {
                            pos: *corner,
                            uv: egui::pos2(uvs[i][0], uvs[i][1]),
                            color: egui::Color32::WHITE,
                        });
                    }
                    
                    // インデックスを追加
                    mesh.indices.extend_from_slice(&[0, 1, 2, 0, 2, 3]);
                    
                    painter.add(egui::Shape::mesh(mesh));
                }
                
                // グリッドオーバーレイ
                if self.grid_enabled {
                    self.draw_grid(&painter, rect);
                }
                
                // ピーキングオーバーレイ
                if self.peaking_enabled {
                    if let Some(peaking) = &self.peaking_result {
                        let should_draw = if self.settings.peaking_blink {
                            (self.blink_time * 3.0).sin() > 0.0
                        } else {
                            true
                        };
                        
                        if should_draw {
                            let alpha = (self.settings.peaking_opacity * 255.0) as u8;
                            let color = egui::Color32::from_rgba_premultiplied(
                                self.settings.peaking_color[0],
                                self.settings.peaking_color[1],
                                self.settings.peaking_color[2],
                                alpha
                            );
                            let stroke = egui::Stroke::new(1.0, color);
                            
                            for edge in &peaking.edges {
                                let points: Vec<egui::Pos2> = edge.iter().map(|p| {
                                    let u = p.x / image_size.x;
                                    let v = p.y / image_size.y;
                                    egui::pos2(
                                        rect.min.x + u * rect.width(),
                                        rect.min.y + v * rect.height()
                                    )
                                }).collect();
                                
                                if points.len() > 1 {
                                    painter.add(egui::Shape::line(points, stroke));
                                }
                            }
                        }
                    }
                }
            } else {
                ui.centered_and_justified(|ui| {
                    ui.label("画像をここにドラッグ＆ドロップするか、開くをクリックしてください");
                });
            }
        });
        
        // フッター
        egui::TopBottomPanel::bottom("vdi_bottom_panel").show(ctx, |ui| {
            ui.horizontal(|ui| {
                if let Some(path) = &self.current_path {
                    ui.label(format!("📄 {}", path.file_name().unwrap_or_default().to_string_lossy()));
                }
                
                if let Some((w, h)) = self.image_dimensions {
                    ui.label(format!("{}x{}", w, h));
                }
                
                if let Some(size) = self.file_size_bytes {
                    ui.label(Self::format_file_size(size));
                }
                
                ui.label(format!("Zoom: {:.0}%", self.zoom * 100.0));
                
                ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                    if ui.button("📂 Reveal in Explorer").clicked() {
                        self.reveal_in_explorer();
                    }
                });
            });
        });
        
        // Process fit request outside closure
        if let Some(size) = fit_size {
            self.fit_requested = false;
            self.screen_fit(size);
        }
        
        // Histogram Window
        if self.histogram_enabled {
            if let Some(hist) = &self.histogram_result {
                let window_size = egui::vec2(300.0 * self.settings.histogram_size, 200.0 * self.settings.histogram_size);
                
                let anchor = match self.settings.histogram_position {
                    HistogramPosition::TopLeft => egui::Align2::LEFT_TOP,
                    HistogramPosition::TopRight => egui::Align2::RIGHT_TOP,
                    HistogramPosition::BottomLeft => egui::Align2::LEFT_BOTTOM,
                    HistogramPosition::BottomRight => egui::Align2::RIGHT_BOTTOM,
                };
                
                egui::Window::new("Histogram")
                    .anchor(anchor, egui::vec2(10.0, 10.0))
                    .default_size(window_size)
                    .resizable(false)
                    .show(ctx, |ui| {
                        use egui_plot::{Plot, BarChart, Bar};
                        
                        if let vdi_lib::histogram::HistogramData::RGB { r, g, b } = &hist.data {
                            let r_bars: Vec<Bar> = r.iter().enumerate().map(|(i, &v)| {
                                Bar::new(i as f64, v as f64)
                                    .fill(egui::Color32::from_rgba_premultiplied(255, 0, 0, (self.settings.histogram_opacity * 255.0) as u8))
                            }).collect();
                            let g_bars: Vec<Bar> = g.iter().enumerate().map(|(i, &v)| {
                                Bar::new(i as f64, v as f64)
                                    .fill(egui::Color32::from_rgba_premultiplied(0, 255, 0, (self.settings.histogram_opacity * 255.0) as u8))
                            }).collect();
                            let b_bars: Vec<Bar> = b.iter().enumerate().map(|(i, &v)| {
                                Bar::new(i as f64, v as f64)
                                    .fill(egui::Color32::from_rgba_premultiplied(0, 0, 255, (self.settings.histogram_opacity * 255.0) as u8))
                            }).collect();
                            
                            Plot::new("rgb_hist")
                                .allow_zoom(false)
                                .allow_drag(false)
                                .height(180.0 * self.settings.histogram_size)
                                .show(ui, |plot_ui| {
                                    plot_ui.bar_chart(BarChart::new(r_bars).color(egui::Color32::RED));
                                    plot_ui.bar_chart(BarChart::new(g_bars).color(egui::Color32::GREEN));
                                    plot_ui.bar_chart(BarChart::new(b_bars).color(egui::Color32::BLUE));
                                });
                        }
                    });
            }
        }
    }
}
