// コントローラー入力機能
// Questコントローラー(XInput/Xbox 360エミュレート)の入力を取得

use gilrs::{Button, Gilrs};
use serde::{Deserialize, Serialize};

/// コントローラーの状態を表す構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ControllerState {
    /// 接続されているコントローラーの数
    pub connected_count: usize,
    
    /// Aボタンが押されているか
    pub button_a: bool,
    
    /// Bボタンが押されているか
    pub button_b: bool,
    
    /// Xボタンが押されているか
    pub button_x: bool,
    
    /// Yボタンが押されているか
    pub button_y: bool,
    
    /// LBボタンが押されているか
    pub button_lb: bool,
    
    /// RBボタンが押されているか
    pub button_rb: bool,
    
    /// 左スティックのX軸 (-1.0 ~ 1.0)
    pub left_stick_x: f32,
    
    /// 左スティックのY軸 (-1.0 ~ 1.0)
    pub left_stick_y: f32,
    
    /// 右スティックのX軸 (-1.0 ~ 1.0)
    pub right_stick_x: f32,
    
    /// 右スティックのY軸 (-1.0 ~ 1.0)
    pub right_stick_y: f32,
    
    /// 左トリガー (0.0 ~ 1.0)
    pub left_trigger: f32,
    
    /// 右トリガー (0.0 ~ 1.0)
    pub right_trigger: f32,
    
    /// Startボタンが押されているか
    pub button_start: bool,
}

impl Default for ControllerState {
    fn default() -> Self {
        Self {
            connected_count: 0,
            button_a: false,
            button_b: false,
            button_x: false,
            button_y: false,
            button_lb: false,
            button_rb: false,
            left_stick_x: 0.0,
            left_stick_y: 0.0,
            right_stick_x: 0.0,
            right_stick_y: 0.0,
            left_trigger: 0.0,
            right_trigger: 0.0,
            button_start: false,
        }
    }
}

/// ゲームパッド(コントローラー)が接続されているかを検出する
/// 
/// # Returns
/// 
/// * `Ok(true)` - ゲームパッドが接続されている
/// * `Ok(false)` - ゲームパッドが接続されていない
#[tauri::command]
pub fn detect_gamepad() -> Result<bool, String> {
    let gilrs = Gilrs::new().map_err(|e| format!("Failed to initialize gilrs: {}", e))?;
    
    // 接続されているゲームパッドの数をカウント
    let connected_count = gilrs.gamepads().count();
    
    Ok(connected_count > 0)
}

/// コントローラーの入力状態をポーリングする
/// 
/// # Returns
/// 
/// * `Ok(ControllerState)` - 現在のコントローラー状態
/// * `Err(String)` - エラーメッセージ
#[tauri::command]
pub fn poll_controller_input() -> Result<ControllerState, String> {
    let gilrs = Gilrs::new().map_err(|e| format!("Failed to initialize gilrs: {}", e))?;
    
    let mut state = ControllerState::default();
    state.connected_count = gilrs.gamepads().count();
    
    // 接続されているゲームパッドがない場合はデフォルト状態を返す
    if state.connected_count == 0 {
        return Ok(state);
    }
    
    // 最初に見つかったゲームパッドの状態を取得
    if let Some((_, gamepad)) = gilrs.gamepads().next() {
        // ボタンの状態を取得
        state.button_a = gamepad.is_pressed(Button::South);
        state.button_b = gamepad.is_pressed(Button::East);
        state.button_x = gamepad.is_pressed(Button::West);
        state.button_y = gamepad.is_pressed(Button::North);
        state.button_lb = gamepad.is_pressed(Button::LeftTrigger);
        state.button_rb = gamepad.is_pressed(Button::RightTrigger);
        state.button_start = gamepad.is_pressed(Button::Start);
        
        // アナログスティックの値を取得
        use gilrs::Axis;
        state.left_stick_x = gamepad.value(Axis::LeftStickX);
        state.left_stick_y = gamepad.value(Axis::LeftStickY);
        state.right_stick_x = gamepad.value(Axis::RightStickX);
        state.right_stick_y = gamepad.value(Axis::RightStickY);
        
        // トリガーの値を取得
        state.left_trigger = gamepad.value(Axis::LeftZ);
        state.right_trigger = gamepad.value(Axis::RightZ);
    }
    
    Ok(state)
}
