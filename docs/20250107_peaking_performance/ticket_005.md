# Ticket #005: Rust側キャンセルチェック実装

**作成日**: 2025-01-07  
**優先度**: High  
**見積時間**: 1時間  
**担当**: Rust  
**依存関係**: なし（Ticket #003, #004と並行可能）  

---

## 目的

処理中断機能を実装し、ユーザーが連続操作した際に
古い処理をキャンセルできるようにする。

AtomicBoolを使用してスレッドセーフなキャンセルフラグを実装する。

---

## 背景

現在の実装では、一度処理が開始されると完了まで停止できない。
ユーザーが強度150→155→200と変更すると、3回とも処理が完了してしまう。

中断機能により、最後の操作（200）だけが処理され、
150と155の処理はキャンセルされる。

---

## 実装方針

### 1. グローバルキャンセルマップの追加

各処理にユニークなIDを割り当て、キャンセル可能にする:

```rust
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::collections::HashMap;

// グローバルなキャンセルマップ
lazy_static::lazy_static! {
    static ref CANCEL_FLAGS: Mutex<HashMap<String, Arc<AtomicBool>>> = Mutex::new(HashMap::new());
}

fn register_cancel_flag(request_id: &str) -> Arc<AtomicBool> {
    let flag = Arc::new(AtomicBool::new(false));
    let mut map = CANCEL_FLAGS.lock().unwrap();
    
    // 同じ画像・閾値の古い処理をキャンセル
    if let Some(old_flag) = map.get(request_id) {
        old_flag.store(true, Ordering::Relaxed);
    }
    
    map.insert(request_id.to_string(), flag.clone());
    flag
}

fn unregister_cancel_flag(request_id: &str) {
    let mut map = CANCEL_FLAGS.lock().unwrap();
    map.remove(request_id);
}
```

### 2. focus_peaking関数の拡張

リクエストIDを受け取り、キャンセルチェックを行う:

```rust
#[tauri::command]
pub async fn focus_peaking(
    image_path: String,
    threshold: u8,
    request_id: Option<String>, // 新規追加
) -> Result<PeakingResult, String> {
    let request_id = request_id.unwrap_or_else(|| format!("{}:{}", image_path, threshold));
    let cancel_flag = register_cancel_flag(&request_id);
    
    // 画像読み込み
    let img = image::open(&image_path).map_err(|e| e.to_string())?;
    let gray = img.to_luma8();
    
    // キャンセルチェック1
    if cancel_flag.load(Ordering::Relaxed) {
        unregister_cancel_flag(&request_id);
        return Err("Cancelled".to_string());
    }
    
    // Sobelフィルタ
    let edges = apply_sobel_filter(&gray, cancel_flag.clone())?;
    
    // キャンセルチェック2
    if cancel_flag.load(Ordering::Relaxed) {
        unregister_cancel_flag(&request_id);
        return Err("Cancelled".to_string());
    }
    
    // エッジ抽出
    let edge_points = extract_edges(&edges, threshold, cancel_flag.clone())?;
    
    unregister_cancel_flag(&request_id);
    
    Ok(PeakingResult {
        width: gray.width(),
        height: gray.height(),
        edges: edge_points,
    })
}
```

### 3. Sobelフィルタ内でのキャンセルチェック

並列処理の各イテレーションでキャンセルを確認:

```rust
fn apply_sobel_filter(
    img: &ImageBuffer<Luma<u8>, Vec<u8>>,
    cancel_flag: Arc<AtomicBool>,
) -> Result<ImageBuffer<Luma<u8>, Vec<u8>>, String> {
    let (width, height) = img.dimensions();
    
    let rows: Result<Vec<Vec<u8>>, String> = (1..height - 1)
        .into_par_iter()
        .map(|y| {
            // 定期的にキャンセルチェック
            if cancel_flag.load(Ordering::Relaxed) {
                return Err("Cancelled".to_string());
            }
            
            let mut row_data = vec![0u8; width as usize];
            for x in 1..width - 1 {
                let gx = calculate_gx(img, x, y);
                let gy = calculate_gy(img, x, y);
                let magnitude = ((gx * gx + gy * gy) as f32).sqrt() as u8;
                row_data[x as usize] = magnitude;
            }
            Ok(row_data)
        })
        .collect();
    
    let rows = rows?;
    
    // 結果をImageBufferにマージ
    let mut edge_img = ImageBuffer::new(width, height);
    for (y, row_data) in rows.iter().enumerate() {
        for (x, &value) in row_data.iter().enumerate() {
            edge_img.put_pixel(x as u32, (y + 1) as u32, Luma([value]));
        }
    }
    
    Ok(edge_img)
}
```

### 4. エッジ抽出内でのキャンセルチェック

```rust
fn extract_edges(
    edge_img: &ImageBuffer<Luma<u8>, Vec<u8>>,
    threshold: u8,
    cancel_flag: Arc<AtomicBool>,
) -> Result<Vec<Vec<EdgePoint>>, String> {
    let (width, height) = edge_img.dimensions();

    let edges: Result<Vec<Vec<EdgePoint>>, String> = (0..height)
        .into_par_iter()
        .filter_map(|y| {
            // キャンセルチェック
            if cancel_flag.load(Ordering::Relaxed) {
                return Some(Err("Cancelled".to_string()));
            }
            
            let mut row_edges = Vec::new();
            for x in 0..width {
                let pixel = edge_img.get_pixel(x, y)[0];
                if pixel >= threshold {
                    row_edges.push(EdgePoint { x, y });
                }
            }
            
            if !row_edges.is_empty() {
                Some(Ok(row_edges))
            } else {
                None
            }
        })
        .collect();

    edges
}
```

---

## タスク

### 1. 依存関係の追加

**ファイル**: `src-tauri/Cargo.toml`

```toml
[dependencies]
lazy_static = "1.4"  # グローバル変数用
```

### 2. peaking.rsの拡張

- [ ] `CANCEL_FLAGS`グローバル変数を追加
- [ ] `register_cancel_flag` / `unregister_cancel_flag`関数を実装
- [ ] `focus_peaking`にrequest_idパラメータを追加
- [ ] `apply_sobel_filter`にキャンセルチェックを追加
- [ ] `extract_edges`にキャンセルチェックを追加

### 3. ビルドと動作確認

```bash
cd src-tauri
cargo build
```

- キャンセルが機能する
- エラーハンドリングが正しい
- メモリリークがない

---

## 完了条件

- ✅ `lazy_static`が追加されている
- ✅ キャンセルフラグ機構が実装されている
- ✅ `focus_peaking`がrequest_idを受け取る
- ✅ 各処理でキャンセルチェックが行われる
- ✅ ビルドエラーなし
- ✅ キャンセル時に"Cancelled"エラーが返る

---

## リスク

### リスク1: Mutexのロック競合
多数の同時リクエストでMutexがボトルネックになる可能性。

**対策**: 現状のユースケースでは同時実行は少ないため問題なし。
将来的にはDashMapなどのlock-free mapを検討。

### リスク2: メモリリーク
キャンセル後にフラグが削除されない場合、mapが肥大化。

**対策**: `unregister_cancel_flag`を必ず呼ぶ（正常終了時とエラー時の両方）。

---

## 次のステップ

このチケット完了後、以下に進む:
- Ticket #006: TypeScript側AbortController統合

---

## 参考情報

### Atomic操作
```rust
use std::sync::atomic::{AtomicBool, Ordering};

let flag = AtomicBool::new(false);

// 値を設定
flag.store(true, Ordering::Relaxed);

// 値を読み込み
if flag.load(Ordering::Relaxed) {
    // キャンセルされた
}
```

### lazy_static
```rust
use lazy_static::lazy_static;
use std::sync::Mutex;

lazy_static! {
    static ref GLOBAL_MAP: Mutex<HashMap<String, i32>> = Mutex::new(HashMap::new());
}

fn use_map() {
    let mut map = GLOBAL_MAP.lock().unwrap();
    map.insert("key".to_string(), 42);
}
```
