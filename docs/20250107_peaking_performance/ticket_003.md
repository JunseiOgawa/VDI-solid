# Ticket #003: Sobelフィルタの並列化

**作成日**: 2025-01-07  
**優先度**: High  
**見積時間**: 1.5時間  
**担当**: Rust  
**依存関係**: Ticket #002（Rayon追加）  

---

## 目的

Sobelフィルタ処理を並列化し、処理時間を2~3倍高速化する。
画像の各行を並列に処理することで、マルチコアCPUを活用する。

---

## 背景

現在のSobelフィルタは以下のように実装されている:
```rust
fn apply_sobel_filter(img: &ImageBuffer<Luma<u8>, Vec<u8>>) -> ImageBuffer<Luma<u8>, Vec<u8>> {
    let (width, height) = img.dimensions();
    let mut edge_img = ImageBuffer::new(width, height);

    for y in 1..height - 1 {
        for x in 1..width - 1 {
            // Sobelカーネル適用
            let gx = calculate_gx(img, x, y);
            let gy = calculate_gy(img, x, y);
            let magnitude = ((gx * gx + gy * gy) as f32).sqrt() as u8;
            edge_img.put_pixel(x, y, Luma([magnitude]));
        }
    }
    edge_img
}
```

この処理は行ごとに独立しているため、並列化が可能。

---

## 実装方針

### 1. 行ごとに並列処理

Rayonの`par_iter()`を使用し、各行を並列に処理する:

```rust
use rayon::prelude::*;

fn apply_sobel_filter(img: &ImageBuffer<Luma<u8>, Vec<u8>>) -> ImageBuffer<Luma<u8>, Vec<u8>> {
    let (width, height) = img.dimensions();
    let mut edge_img = ImageBuffer::new(width, height);

    // 行番号のベクトルを生成し、並列処理
    let rows: Vec<u32> = (1..height - 1).collect();
    
    rows.par_iter().for_each(|&y| {
        for x in 1..width - 1 {
            let gx = calculate_gx(img, x, y);
            let gy = calculate_gy(img, x, y);
            let magnitude = ((gx * gx + gy * gy) as f32).sqrt() as u8;
            
            // ここでedge_imgへの書き込みが問題になる（後述）
        }
    });

    edge_img
}
```

### 2. 並列書き込みの問題解決

複数スレッドから`edge_img`に書き込むと競合が発生するため、
各行の結果を個別に計算し、後でマージする:

```rust
fn apply_sobel_filter(img: &ImageBuffer<Luma<u8>, Vec<u8>>) -> ImageBuffer<Luma<u8>, Vec<u8>> {
    let (width, height) = img.dimensions();
    let mut edge_img = ImageBuffer::new(width, height);

    // 各行の計算結果をベクトルとして生成
    let rows: Vec<Vec<u8>> = (1..height - 1)
        .into_par_iter()
        .map(|y| {
            let mut row_data = vec![0u8; width as usize];
            for x in 1..width - 1 {
                let gx = calculate_gx(img, x, y);
                let gy = calculate_gy(img, x, y);
                let magnitude = ((gx * gx + gy * gy) as f32).sqrt() as u8;
                row_data[x as usize] = magnitude;
            }
            row_data
        })
        .collect();

    // 結果をedge_imgにコピー
    for (y, row_data) in rows.iter().enumerate() {
        for (x, &value) in row_data.iter().enumerate() {
            edge_img.put_pixel(x as u32, (y + 1) as u32, Luma([value]));
        }
    }

    edge_img
}
```

---

## タスク

### 1. `apply_sobel_filter`関数の並列化実装

**ファイル**: `src-tauri/src/peaking.rs`

- [ ] Rayonの`into_par_iter()`を使用
- [ ] 各行を並列に処理
- [ ] 結果を安全にマージ

### 2. ヘルパー関数の確認

既存の`calculate_gx`と`calculate_gy`がそのまま使えることを確認:
```rust
fn calculate_gx(img: &ImageBuffer<Luma<u8>, Vec<u8>>, x: u32, y: u32) -> i32 {
    // 既存実装を維持
}

fn calculate_gy(img: &ImageBuffer<Luma<u8>, Vec<u8>>, x: u32, y: u32) -> i32 {
    // 既存実装を維持
}
```

### 3. パフォーマンステスト

Ticket #001の計測コードを使用し、並列化前後を比較:

```
Before: Sobelフィルタ XXXms
After: Sobelフィルタ YYYms
高速化率: ZZZ%
```

### 4. 動作確認

- 画像が正しく処理される
- エッジが正確に検出される
- 画像サイズによらず安定動作

---

## 完了条件

- ✅ `apply_sobel_filter`が並列化されている
- ✅ ビルドエラーなし
- ✅ 処理時間が50~70%削減されている
- ✅ 視覚的な品質に変化なし
- ✅ 複数の画像サイズでテスト完了

---

## リスク

### リスク1: メモリ使用量の増加
各行を独立したベクトルで保持するため、一時的にメモリが増える。

**対策**: 大きい画像（4K等）でテストし、メモリ使用量を確認。

### リスク2: 並列化オーバーヘッド
小さい画像では並列化のオーバーヘッドが処理時間を上回る可能性。

**対策**: 画像サイズに応じて並列処理を切り替える（後回し可）。

---

## 次のステップ

このチケット完了後、以下に進む:
- Ticket #004: エッジ抽出の並列化

---

## 参考情報

### Rayonの並列パターン
```rust
// パターン1: par_iter() - 既存コレクションを並列処理
data.par_iter().for_each(|item| { ... });

// パターン2: into_par_iter() - 範囲を並列処理
(0..100).into_par_iter().map(|i| { ... }).collect();

// パターン3: par_chunks() - チャンクごとに並列処理
data.par_chunks(10).for_each(|chunk| { ... });
```

### Sobelカーネル（参考）
```
Gx = [-1  0  +1]     Gy = [-1 -2 -1]
     [-2  0  +2]          [ 0  0  0]
     [-1  0  +1]          [+1 +2 +1]
```
