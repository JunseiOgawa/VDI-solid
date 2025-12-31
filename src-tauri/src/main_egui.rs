#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod settings;

use eframe::egui;
use settings::*;
use std::path::PathBuf;
use std::sync::mpsc;
use std::sync::Arc;
use std::thread;
use vdi_lib::{histogram, peaking};

fn main() -> eframe::Result {
    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_inner_size([1200.0, 800.0])
            .with_title("VDI-solid (Egui)")
            .with_decorations(true)
            .with_resizable(true),
        ..Default::default()
    };

    eframe::run_native(
        "VDI-solid",
        options,
        Box::new(|cc| {
            egui_extras::install_image_loaders(&cc.egui_ctx);
            cc.egui_ctx.set_visuals(create_dark_theme());
            Ok(Box::new(VdiApp::new(cc)))
        }),
    )
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
    // Settings
    settings: AppSettings,
    
    // Image State
    current_path: Option<PathBuf>,
    texture: Option<egui::TextureHandle>,
    original_image: Option<Arc<image::DynamicImage>>,
    image_dimensions: Option<(u32, u32)>,
    file_size_bytes: Option<u64>,
    rotation: f32,
    rotation_in_progress: bool,
    pending_rotations: usize,
    
    // View State
    zoom: f32,
    pan: egui::Vec2,
    
    // Features
    peaking_enabled: bool,
    peaking_result: Option<Arc<peaking::PeakingResult>>,
    peaking_receiver: Option<mpsc::Receiver<peaking::PeakingResult>>,
    
    histogram_enabled: bool,
    histogram_result: Option<Arc<histogram::HistogramResult>>,
    histogram_receiver: Option<mpsc::Receiver<histogram::HistogramResult>>,
    
    rotation_receiver: Option<mpsc::Receiver<PathBuf>>,
    
    grid_enabled: bool,
    
    // UI State
    status_message: String,
    show_settings: bool,
    blink_time: f32,
    fit_requested: bool,
    
    // Throttling
    peaking_dirty: bool,
    last_peaking_trigger: f64,
}

impl VdiApp {
    fn new(_cc: &eframe::CreationContext<'_>) -> Self {
        let settings = AppSettings::load();
        
        Self {
            peaking_dirty: false,
            last_peaking_trigger: 0.0,
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
            status_message: "Ready".to_string(),
            show_settings: false,
            blink_time: 0.0,
            fit_requested: false,
        }
    }

    fn load_image(&mut self, path: PathBuf, ctx: &egui::Context) {
        println!("[LOAD_IMAGE] Starting load for: {}", path.display());
        println!("[LOAD_IMAGE] Current rotation before load: {}°", self.rotation);
        
        self.status_message = format!("Loading {}...", path.display());
        
        // Get file size
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
                
                // Always reset rotation to 0.0 after loading
                // The file itself is already rotated if this is a reload after rotation
                // So we don't need to apply visual rotation anymore
                println!("[LOAD_IMAGE] Resetting rotation to 0° (New image loaded)");
                self.rotation = 0.0;
                
                println!("[LOAD_IMAGE] Final rotation: {}°", self.rotation);
                
                // Request screen fit for new image
                self.fit_requested = true;
                
                // Reset features
                self.peaking_result = None;
                self.histogram_result = None;
                
                // Trigger features if enabled
                if self.peaking_enabled {
                    self.trigger_peaking();
                }
                if self.histogram_enabled {
                    self.trigger_histogram();
                }
                
                self.status_message = "Loaded".to_string();
            }
            Err(err) => {
                self.status_message = format!("Failed to load image: {}", err);
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
            // Update rotation immediately for visual feedback regardless of processing state
            let old_rotation = self.rotation;
            self.rotation = (self.rotation + 90.0) % 360.0;
            println!("[ROTATE_IMAGE] Updated visual rotation: {}° -> {}°", old_rotation, self.rotation);
            self.status_message = format!("Rotating to {}°...", self.rotation);

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
            
            // Start rotation processing
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
            
            // Calculate zoom to fit image in available space
            // Account for rotation
            let (display_width, display_height) = if self.rotation == 90.0 || self.rotation == 270.0 {
                (image_size.y, image_size.x)
            } else {
                (image_size.x, image_size.y)
            };
            
            let zoom_x = available_size.x / display_width;
            let zoom_y = available_size.y / display_height;
            
            // Use the smaller zoom factor to ensure entire image is visible
            // Removed 5% margin to fill the screen completely
            self.zoom = zoom_x.min(zoom_y).max(0.01);
            self.pan = egui::Vec2::ZERO;
            
            self.status_message = format!("Fit to screen: {:.0}%", self.zoom * 100.0);
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
        
        // Handle background results
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
                    self.status_message = "Rotation complete".to_string();
                }
            }
        }

        // Handle Drag & Drop
        if !ctx.input(|i| i.raw.dropped_files.is_empty()) {
            let dropped_files = ctx.input(|i| i.raw.dropped_files.clone());
            if let Some(file) = dropped_files.first() {
                if let Some(path) = &file.path {
                    self.load_image(path.clone(), ctx);
                }
            }
        }
        
        // Key Inputs
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

        // Top Panel
        egui::TopBottomPanel::top("vdi_top_panel").show(ctx, |ui| {
            ui.horizontal(|ui| {
                if ui.button("📂 Open").clicked() {
                    if let Some(path) = rfd::FileDialog::new().pick_file() {
                        self.load_image(path, ctx);
                    }
                }
                
                if ui.button("⬅").clicked() { self.prev_image(ctx); }
                if ui.button("➡").clicked() { self.next_image(ctx); }
                if ui.button("🔄").clicked() { self.rotate_image(ctx); }
                
                ui.separator();
                
                if ui.checkbox(&mut self.peaking_enabled, "Peaking (P)").changed() {
                    if self.peaking_enabled {
                        self.trigger_peaking();
                    } else {
                        self.peaking_result = None;
                    }
                }
                
                if ui.checkbox(&mut self.histogram_enabled, "Histogram (H)").changed() {
                    if self.histogram_enabled {
                        self.trigger_histogram();
                    } else {
                        self.histogram_result = None;
                    }
                }
                
                if ui.checkbox(&mut self.grid_enabled, "Grid (G)").changed() {}
                
                ui.separator();
                
                if ui.button("Fit (F)").clicked() {
                    self.fit_requested = true;
                }
                
                if ui.button("⚙ Settings").clicked() {
                    self.show_settings = !self.show_settings;
                }
                
                ui.separator();
                ui.label(&self.status_message);
            });
        });
        
        // Settings Window
        if self.show_settings {
            egui::Window::new("Settings")
                .open(&mut self.show_settings)
                .show(ctx, |ui| {
                    ui.heading("Zoom");
                    ui.add(egui::Slider::new(&mut self.settings.wheel_sensitivity,  0.05..=1.0)
                        .text("Wheel Sensitivity"));
                    
                    ui.separator();
                    ui.heading("Peaking");
                    
                    if ui.add(egui::Slider::new(&mut self.settings.peaking_threshold, 0..=255)
                        .text("Threshold")).changed() 
                    {
                        self.peaking_dirty = true;
                    }
                    
                    ui.add(egui::Slider::new(&mut self.settings.peaking_intensity, 0..=255)
                        .text("Intensity"));
                    
                    ui.add(egui::Slider::new(&mut self.settings.peaking_opacity, 0.0..=1.0)
                        .text("Opacity"));
                    
                    ui.color_edit_button_srgb(&mut self.settings.peaking_color);
                    ui.checkbox(&mut self.settings.peaking_blink, "Blink");
                    
                    ui.separator();
                    ui.heading("Grid");
                    egui::ComboBox::from_label("Pattern")
                        .selected_text(format!("{:?}", self.settings.grid_pattern))
                        .show_ui(ui, |ui| {
                            ui.selectable_value(&mut self.settings.grid_pattern, GridPattern::None, "None");
                            ui.selectable_value(&mut self.settings.grid_pattern, GridPattern::RuleOfThirds, "Rule of Thirds");
                            ui.selectable_value(&mut self.settings.grid_pattern, GridPattern::GoldenRatio, "Golden Ratio");
                            ui.selectable_value(&mut self.settings.grid_pattern, GridPattern::Grid4x4, "4x4 Grid");
                            ui.selectable_value(&mut self.settings.grid_pattern, GridPattern::Grid8x8, "8x8 Grid");
                        });
                    ui.add(egui::Slider::new(&mut self.settings.grid_opacity, 0.0..=1.0)
                        .text("Grid Opacity"));
                    
                    ui.separator();
                    ui.heading("Histogram");
                    
                    ui.add(egui::Slider::new(&mut self.settings.histogram_size, 0.5..=2.0)
                        .text("Size"));
                    
                    ui.add(egui::Slider::new(&mut self.settings.histogram_opacity, 0.0..=1.0)
                        .text("Opacity"));
                    
                    egui::ComboBox::from_label("Position")
                        .selected_text(format!("{:?}", self.settings.histogram_position))
                        .show_ui(ui, |ui| {
                            ui.selectable_value(&mut self.settings.histogram_position, HistogramPosition::TopLeft, "Top Left");
                            ui.selectable_value(&mut self.settings.histogram_position, HistogramPosition::TopRight, "Top Right");
                            ui.selectable_value(&mut self.settings.histogram_position, HistogramPosition::BottomLeft, "Bottom Left");
                            ui.selectable_value(&mut self.settings.histogram_position, HistogramPosition::BottomRight, "Bottom Right");
                        });
                    
                    ui.separator();
                    if ui.button("Save Settings").clicked() {
                        self.settings.save();
                        self.status_message = "Settings saved".to_string();
                    }
                });
        }
        
        // Trigger peaking logic with throttling
        let now = ctx.input(|i| i.time);
        if self.peaking_dirty && self.peaking_enabled {
            // Only trigger if enough time passed AND no calculation currently running
            if now - self.last_peaking_trigger > 0.1 && self.peaking_receiver.is_none() {
                self.trigger_peaking();
                self.last_peaking_trigger = now;
                self.peaking_dirty = false;
            }
        }

        // Central Panel - Image Viewer
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
                
                // Zoom & Pan Logic with mouse position
                if response.hovered() {
                    let scroll = ctx.input(|i| i.smooth_scroll_delta.y);
                    if scroll != 0.0 {
                        let zoom_factor = if scroll > 0.0 {
                            1.0 + (0.1 * self.settings.wheel_sensitivity)
                        } else {
                            1.0 / (1.0 + (0.1 * self.settings.wheel_sensitivity))
                        };
                        
                        // Zoom towards mouse position
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
                
                // Swap width/height for 90 and 270 degree rotations
                let display_size = if self.rotation == 90.0 || self.rotation == 270.0 {
                    egui::vec2(image_size.y, image_size.x)
                } else {
                    image_size
                };
                let scaled_size = display_size * self.zoom;
                
                if response.dragged() {
                    self.pan += response.drag_delta();
                }
                
                // Constrain Pan to keep image somewhat visible
                let x_limit = (available_size.x + scaled_size.x) / 2.0 - 50.0; // Keep 50px visible
                let y_limit = (available_size.y + scaled_size.y) / 2.0 - 50.0;
                
                self.pan.x = self.pan.x.clamp(-x_limit, x_limit);
                self.pan.y = self.pan.y.clamp(-y_limit, y_limit);
                
                // Center the image + pan
                let center = response.rect.center() + self.pan;
                let rect = egui::Rect::from_center_size(center, scaled_size);
                
                // Draw image with rotation
                if self.rotation == 0.0 {
                    // No rotation - draw normally
                    painter.image(
                        texture.id(),
                        rect,
                        egui::Rect::from_min_max(egui::pos2(0.0, 0.0), egui::pos2(1.0, 1.0)),
                        egui::Color32::WHITE
                    );
                } else {
                    // Apply rotation using mesh
                    use egui::epaint::{Mesh, Vertex};
                    
                    let mut mesh = Mesh::with_texture(texture.id());
                    
                    // Standard Rect corners
                    let corners = [
                        rect.min,                           // Top-left
                        egui::pos2(rect.max.x, rect.min.y), // Top-right
                        rect.max,                           // Bottom-right
                        egui::pos2(rect.min.x, rect.max.y), // Bottom-left
                    ];
                    
                    // UV coordinates based on rotation
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
                    
                    // Add vertices
                    for (i, corner) in corners.iter().enumerate() {
                        mesh.vertices.push(Vertex {
                            pos: *corner,
                            uv: egui::pos2(uvs[i][0], uvs[i][1]),
                            color: egui::Color32::WHITE,
                        });
                    }
                    
                    // Add indices
                    mesh.indices.extend_from_slice(&[0, 1, 2, 0, 2, 3]);
                    
                    painter.add(egui::Shape::mesh(mesh));
                }
                
                // Grid Overlay
                if self.grid_enabled {
                    self.draw_grid(&painter, rect);
                }
                
                // Peaking Overlay
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
                    ui.label("Drag & Drop an image here or click Open");
                });
            }
        });
        
        // Footer
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
