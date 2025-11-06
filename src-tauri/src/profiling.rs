/// プロファイリング用のトレーシング初期化モジュール
///
/// このモジュールは`profiling` feature flagが有効な場合のみコンパイルされます。
/// 起動時の詳細なパフォーマンス計測を行うために、構造化ログとスパントレーシングを提供します。

#[cfg(feature = "profiling")]
use std::io;
#[cfg(feature = "profiling")]
use tracing_subscriber::{fmt, prelude::*, EnvFilter};

/// トレーシングシステムを初期化
///
/// アプリケーション起動時に一度だけ呼び出します。
///
/// # 動作
///
/// - 標準出力にJSON形式でトレースログを出力
/// - 環境変数 `RUST_LOG` でフィルタレベルを制御可能(デフォルト: info)
/// - 各スパンとイベントにタイムスタンプが付与される
///
/// # Examples
///
/// ```no_run
/// init_tracing();
/// ```
#[cfg(feature = "profiling")]
pub fn init_tracing() {
    // JSON形式のフォーマッタを作成
    let fmt_layer = fmt::layer()
        .json()
        .with_current_span(true)
        .with_span_list(true)
        .with_timer(fmt::time::SystemTime)
        .with_writer(io::stdout);

    // 環境変数でフィルタレベルを制御(デフォルトはinfo)
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info"));

    // Subscriberを初期化
    tracing_subscriber::registry()
        .with(filter)
        .with(fmt_layer)
        .init();

    tracing::info!("Tracing initialized");
}

/// トレーシングシステムを初期化(feature無効時のスタブ)
///
/// `profiling` feature が無効な場合、この関数は何もしません。
#[cfg(not(feature = "profiling"))]
pub fn init_tracing() {
    // 何もしない
}

/// マクロ: 処理時間を計測してログ出力
///
/// # Examples
///
/// ```no_run
/// profile_block!("my_operation", {
///     // 計測したい処理
/// });
/// ```
#[macro_export]
#[cfg(feature = "profiling")]
macro_rules! profile_block {
    ($name:expr, $block:expr) => {{
        let _span = tracing::info_span!($name).entered();
        let start = std::time::Instant::now();
        let result = $block;
        let elapsed = start.elapsed();
        tracing::info!(
            target: "profiling",
            operation = $name,
            duration_ms = elapsed.as_millis() as u64,
            duration_us = elapsed.as_micros() as u64,
            "Operation completed"
        );
        result
    }};
}

#[macro_export]
#[cfg(not(feature = "profiling"))]
macro_rules! profile_block {
    ($name:expr, $block:expr) => {{
        $block
    }};
}
