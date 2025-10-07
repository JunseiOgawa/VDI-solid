# Ticket #002: ダウンサンプリングロジックの実装（Rust）

**日付**: 2025-01-07  
**担当**: Agent  
**優先度**: High  
**見積時間**: 1.5時間  
**依存**: なし

---

## 概要

`src-tauri/src/peaking.rs`に画像サイズに応じたダウンサンプリングロジックを追加し、高解像度画像（例: 4K）の処理速度を大幅に改善します。

---

## 目的

- 高解像度画像（幅または高さが2000px以上）をダウンサンプリング
- 処理速度を4倍改善（4K: 6秒 → 1.5秒）
- 低解像度画像の処理速度は維持
- エッジ座標を元のサイズにスケールバック

---

## 技術仕様

### 変更ファイル
- `src-tauri/src/peaking.rs`

### ダウンサンプリング戦略

#### 閾値判定
```rust
const DOWNSAMPLE_THRESHOLD: u32 = 2000; // 幅または高さが2000px以上

if width >= DOWNSAMPLE_THRESHOLD || height >= DOWNSAMPLE_THRESHOLD {
    // ダウンサンプリング実行
} else {
    // 既存の処理
}
```

#### ダウンサンプリング率
```rust
// HD（1920x1080）を目標サイズとする
let target_max_dimension = 1920;
let scale_factor = if width > height {
    target_max_dimension as f32 / width as f32
} else {
    target_max_dimension as f32 / height as f32
};

let new_width = (width as f32 * scale_factor) as u32;
let new_height = (height as f32 * scale_factor) as u32;
```

#### 座標スケールバック
```rust
// ダウンサンプリング後のエッジ座標を元のサイズに戻す
let scale_back_x = width as f32 / new_width as f32;
let scale_back_y = height as f32 / new_height as f32;

for edge in edges.iter_mut() {
    edge.x = (edge.x as f32 * scale_back_x) as u32;
    edge.y = (edge.y as f32 * scale_back_y) as u32;
}
```

---

## 実装手順

### ステップ1: ヘルパー関数の追加（30分）

#### 関数: `downsample_if_needed`
```rust
/// 画像サイズが閾値以上の場合、ダウンサンプリングを実行
/// 戻り値: (処理用画像, スケール率のOption)
fn downsample_if_needed(
    img: &DynamicImage,
    threshold: u32
) -> (DynamicImage, Option<(f32, f32)>) {
    let (width, height) = img.dimensions();
    
    if width < threshold && height < threshold {
        // ダウンサンプリング不要
        return (img.clone(), None);
    }
    
    // ダウンサンプリング実行
    let target_max = 1920;
    let scale_factor = if width > height {
        target_max as f32 / width as f32
    } else {
        target_max as f32 / height as f32
    };
    
    let new_width = (width as f32 * scale_factor) as u32;
    let new_height = (height as f32 * scale_factor) as u32;
    
    println!(
        "[Downsample] {}x{} -> {}x{} (scale: {:.2})",
        width, height, new_width, new_height, scale_factor
    );
    
    let downsampled = img.resize(
        new_width,
        new_height,
        image::imageops::FilterType::Lanczos3 // 高品質リサイズ
    );
    
    let scale_back_x = width as f32 / new_width as f32;
    let scale_back_y = height as f32 / new_height as f32;
    
    (downsampled, Some((scale_back_x, scale_back_y)))
}
```

#### 関数: `scale_back_edges`
```rust
/// エッジ座標を元のサイズにスケールバック
fn scale_back_edges(
    edges: &mut Vec<Edge>,
    scale: Option<(f32, f32)>
) {
    if let Some((scale_x, scale_y)) = scale {
        println!("[ScaleBack] Applying scale: x={:.2}, y={:.2}", scale_x, scale_y);
        
        for edge in edges.iter_mut() {
            edge.x = (edge.x as f32 * scale_x).round() as u32;
            edge.y = (edge.y as f32 * scale_y).round() as u32;
        }
    }
}
```

### ステップ2: focus_peaking関数の修正（30分）

**現在のコード構造**:
```rust
#[tauri::command]
pub async fn focus_peaking(
    path: String,
    intensity: i32,
    state: State<'_, AppState>
) -> Result<Vec<Edge>, String> {
    // 1. キャンセルフラグ登録
    // 2. 画像読み込み
    // 3. Sobelフィルタ適用
    // 4. エッジ抽出
    // 5. キャンセルフラグ解放
}
```

**修正後のコード構造**:
```rust
#[tauri::command]
pub async fn focus_peaking(
    path: String,
    intensity: i32,
    state: State<'_, AppState>
) -> Result<Vec<Edge>, String> {
    // 1. キャンセルフラグ登録
    
    // 2. 画像読み込み
    let img = ...;
    
    // 3. ダウンサンプリング（新規）
    let (processing_img, scale) = downsample_if_needed(&img, 2000);
    
    // 4. Sobelフィルタ適用（processing_imgを使用）
    let sobel_img = apply_sobel_filter(&processing_img, &cancel_flag)?;
    
    // 5. エッジ抽出（processing_imgを使用）
    let mut edges = extract_edges(&sobel_img, intensity, &cancel_flag)?;
    
    // 6. 座標スケールバック（新規）
    scale_back_edges(&mut edges, scale);
    
    // 7. キャンセルフラグ解放
    Ok(edges)
}
```

### ステップ3: ログ追加（10分）

各ステップでログを追加:
```rust
println!("[Peaking] Original size: {}x{}", width, height);
println!("[Peaking] Processing size: {}x{}", proc_width, proc_height);
println!("[Peaking] Extracted {} edges", edges.len());
```

### ステップ4: 動作確認（20分）

1. Rustビルド成功を確認
2. 低解像度画像（1280x720）でダウンサンプリングが発生しないことを確認
3. 4K画像（3840x2160）でダウンサンプリングが発生することを確認
4. エッジ座標が正しくスケールバックされていることを確認
5. 処理時間が改善されていることを確認（6秒 → 1.5秒）

---

## テスト計画

### 単体テスト（コンソールログで確認）

#### テストケース1: 低解像度画像（ダウンサンプリングなし）
```
入力: 1280x720
期待: ダウンサンプリングなし、そのまま処理
ログ: "[Peaking] Original size: 1280x720"
      "[Peaking] Processing size: 1280x720"
```

#### テストケース2: 4K画像（ダウンサンプリングあり）
```
入力: 3840x2160
期待: 1920x1080にダウンサンプリング
ログ: "[Downsample] 3840x2160 -> 1920x1080 (scale: 0.50)"
      "[ScaleBack] Applying scale: x=2.00, y=2.00"
```

#### テストケース3: 縦長画像
```
入力: 1080x3840
期待: 540x1920にダウンサンプリング
ログ: "[Downsample] 1080x3840 -> 540x1920 (scale: 0.50)"
```

### パフォーマンステスト

| 画像サイズ | 処理時間（Before） | 処理時間（After） | 改善率 |
|----------|---------------|--------------|-------|
| 1280x720 | 数十ms | 数十ms | 変化なし |
| 1920x1080 | 数百ms | 数百ms | 変化なし |
| 3840x2160 | 6秒 | 1.5秒 | 4倍高速 |

---

## 完了条件

- ✅ `downsample_if_needed`関数が実装されている
- ✅ `scale_back_edges`関数が実装されている
- ✅ `focus_peaking`関数がダウンサンプリングを呼び出している
- ✅ 低解像度画像でダウンサンプリングが発生しない
- ✅ 高解像度画像で正しくダウンサンプリングされる
- ✅ エッジ座標が正しくスケールバックされる
- ✅ 4K画像の処理時間が1.5秒以下
- ✅ Rustビルドエラーなし
- ✅ キャンセル機能が正常に動作

---

## 注意事項

### パフォーマンス
- `Lanczos3`フィルタは高品質だが遅い場合は`Triangle`や`CatmullRom`に変更可能
- スケールバック時は`round()`で丸め誤差を最小化

### メモリ管理
- ダウンサンプリング後の画像は関数スコープ内で自動解放
- 元画像は変更せず、cloneを使用

### 座標精度
- スケールバック時にf32で計算し、最後にu32にキャスト
- 境界外の座標は後続処理で自動的にクリッピングされる

### キャンセル対応
- ダウンサンプリング処理中もキャンセルフラグをチェック
- 既存のキャンセル機構を維持

---

## 次のステップ

このチケット完了後:
- **Ticket #005**: 統合テストで点滅機能と合わせて動作確認

---

## 参考情報

### image crateのリサイズAPI
```rust
pub fn resize(
    &self,
    nwidth: u32,
    nheight: u32,
    filter: FilterType
) -> DynamicImage
```

### FilterType選択肢
- `Nearest`: 最速、品質最低
- `Triangle`: 速い、品質普通
- `CatmullRom`: 普通、品質良い
- `Gaussian`: 遅い、品質良い
- `Lanczos3`: 最も遅い、品質最高

### 推奨: `Lanczos3`
ピーキング用途では精度が重要なため、品質優先
