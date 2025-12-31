#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use eframe::egui;
use std::sync::{Arc, Mutex};
use std::path::PathBuf;
use std::thread;
use std::sync::mpsc;
use vdi_lib::{navigation, peaking, histogram};
use image::GenericImageView;

fn main() -> eframe::Result {
    // Initialize logging if needed
    
    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_inner_size([1200.0, 800.0])
            .with_title("VDI-solid (Egui)"),
        ..Default::default()
    };

    eframe::run_native(
        "VDI-solid",
        options,
        Box::new(|cc| {
            egui_extras::install_image_loaders(&cc.egui_ctx);
            Ok(Box::new(VdiApp::new(cc)))
        }),
    )
}

struct VdiApp {
    // Image State
    current_path: Option<PathBuf>,
    texture: Option<egui::TextureHandle>,
    original_image: Option<Arc<image::DynamicImage>>, // Arc for sharing with worker threads
    
    // View State
    zoom: f32,
    pan: egui::Vec2,
    
    // Features
    peaking_enabled: bool,
    peaking_threshold: u8,
    peaking_result: Option<Arc<peaking::PeakingResult>>,
    peaking_receiver: Option<mpsc::Receiver<peaking::PeakingResult>>,
    
    histogram_enabled: bool,
    histogram_result: Option<Arc<histogram::HistogramResult>>,
    histogram_receiver: Option<mpsc::Receiver<histogram::HistogramResult>>,
    
    // UI
    status_message: String,
}

impl VdiApp {
    fn new(_cc: &eframe::CreationContext<'_>) -> Self {
        Self {
            current_path: None,
            texture: None,
            original_image: None,
            zoom: 1.0,
            pan: egui::Vec2::ZERO,
            peaking_enabled: false,
            peaking_threshold: 100,
            peaking_result: None,
            peaking_receiver: None,
            histogram_enabled: false,
            histogram_result: None,
            histogram_receiver: None,
            status_message: "Ready".to_string(),
        }
    }

    fn load_image(&mut self, path: PathBuf, ctx: &egui::Context) {
        self.status_message = format!("Loading {}...", path.display());
        let ctx_clone = ctx.clone();
        
        match image::open(&path) {
            Ok(img) => {
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
            },
            Err(err) => {
                self.status_message = format!("Failed to load image: {}", err);
            }
        }
    }
    
    fn trigger_peaking(&mut self) {
        if let Some(path) = &self.current_path {
            let path_str = path.to_string_lossy().to_string();
            let threshold = self.peaking_threshold;
            let (tx, rx) = mpsc::channel();
            self.peaking_receiver = Some(rx);
            
            thread::spawn(move || {
                // We use the async function synchronously for now via blocking, or just call logic if we exposed inner functions.
                // focus_peaking is async. For simplicity in this migration, we might want to use a runtime or Refactor peaking to be sync.
                // Since calling async from sync thread is annoying without a runtime, let's create a temporary runtime.
                // Or better, vdi_lib::peaking::focus_peaking returns a Future.
                
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
}

impl eframe::App for VdiApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
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

        egui::TopBottomPanel::top("vdi_top_panel").show(ctx, |ui| {
            ui.horizontal(|ui| {
                if ui.button("📂 Open").clicked() {
                    if let Some(path) = rfd::FileDialog::new().pick_file() {
                        self.load_image(path, ctx);
                    }
                }
                
                if ui.button("⬅").clicked() { self.prev_image(ctx); }
                if ui.button("➡").clicked() { self.next_image(ctx); }
                
                ui.separator();
                
                if ui.checkbox(&mut self.peaking_enabled, "Peaking").changed() {
                    if self.peaking_enabled {
                        self.trigger_peaking();
                    } else {
                        self.peaking_result = None;
                    }
                }
                if self.peaking_enabled {
                    ui.add(egui::DragValue::new(&mut self.peaking_threshold).range(0..=255).speed(1));
                }
                
                if ui.checkbox(&mut self.histogram_enabled, "Histogram").changed() {
                    if self.histogram_enabled {
                        self.trigger_histogram();
                    } else {
                        self.histogram_result = None;
                    }
                }
                
                ui.separator();
                ui.label(&self.status_message);
            });
        });

        egui::CentralPanel::default().show(ctx, |ui| {
            if let Some(texture) = &self.texture {
                let available_size = ui.available_size();
                let (response, painter) = ui.allocate_painter(available_size, egui::Sense::drag());
                
                // Zoom & Pan Logic
                if response.hovered() {
                    let scroll = ctx.input(|i| i.smooth_scroll_delta.y);
                    if scroll != 0.0 {
                        let zoom_factor = if scroll > 0.0 { 1.1 } else { 0.9 };
                        self.zoom = (self.zoom * zoom_factor).clamp(0.1, 20.0);
                    }
                }
                if response.dragged() {
                    self.pan += response.drag_delta();
                }

                let image_size = texture.size_vec2();
                let scaled_size = image_size * self.zoom;
                
                // Center the image + pan
                let center = response.rect.center() + self.pan;
                let rect = egui::Rect::from_center_size(center, scaled_size);
                
                painter.image(
                    texture.id(),
                    rect,
                    egui::Rect::from_min_max(egui::pos2(0.0, 0.0), egui::pos2(1.0, 1.0)),
                    egui::Color32::WHITE
                );
                
                // Peaking Overlay
                if self.peaking_enabled {
                    if let Some(peaking) = &self.peaking_result {
                         // Map peaking coordinates to screen coordinates
                         // Original image coord (px) -> Screen coord
                         // ScreenX = RectMinX + (ImgX / ImgW) * RectW
                         // ScreenY = RectMinY + (ImgY / ImgH) * RectH
                         
                         let stroke = egui::Stroke::new(1.0, egui::Color32::RED);
                         
                         // Optimization: Don't draw if too small?
                         // Draw points/lines
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
                             } else if !points.is_empty() {
                                 // Draw single point?
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
        
        // Histogram Window
        if self.histogram_enabled {
            if let Some(hist) = &self.histogram_result {
                egui::Window::new("Histogram").show(ctx, |ui| {
                    use egui_plot::{Plot, BarChart, Bar};
                    
                    if let vdi_lib::histogram::HistogramData::RGB { r, g, b } = &hist.data {
                         let r_bars: Vec<Bar> = r.iter().enumerate().map(|(i, &v)| Bar::new(i as f64, v as f64).fill(egui::Color32::RED)).collect();
                         let g_bars: Vec<Bar> = g.iter().enumerate().map(|(i, &v)| Bar::new(i as f64, v as f64).fill(egui::Color32::GREEN)).collect();
                         let b_bars: Vec<Bar> = b.iter().enumerate().map(|(i, &v)| Bar::new(i as f64, v as f64).fill(egui::Color32::BLUE)).collect();
                         
                         Plot::new("rgb_hist")
                            .allow_zoom(false)
                            .allow_drag(false)
                            .height(200.0)
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
