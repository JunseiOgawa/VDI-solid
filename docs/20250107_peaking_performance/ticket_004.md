# Ticket #004: エッジ抽出の並列化

**作成日**: 2025-01-07  
**優先度**: High  
**見積時間**: 1時間  
**担当**: Rust  
**依存関係**: Ticket #003（Sobelフィルタ並列化）  

---

## 目的

エッジ抽出処理を並列化し、さらなる高速化を実現する。
エッジポイントの収集を並列化することで、処理時間を短縮する。

---

## 背景

現在のエッジ抽出は以下のように実装されている:
```rust
fn extract_edges(
    edge_img: &ImageBuffer<Luma<u8>, Vec<u8>>,
    threshold: u8,
) -> Vec<Vec<EdgePoint>> {
    let (width, height) = edge_img.dimensions();
    let mut edges = Vec::new();

    for y in 0..height {
        for x in 0..width {
            let pixel = edge_img.get_pixel(x, y)[0];
            if pixel >= threshold {
                edges.push(vec![EdgePoint { x, y }]);
            }
        }
    }

    edges
}
```

この処理も行ごとに独立しているため、並列化が可能。

---

## 実装方針

### 1. 行ごとに並列でエッジ抽出

```rust
use rayon::prelude::*;

fn extract_edges(
    edge_img: &ImageBuffer<Luma<u8>, Vec<u8>>,
    threshold: u8,
) -> Vec<Vec<EdgePoint>> {
    let (width, height) = edge_img.dimensions();

    // 各行を並列処理し、エッジポイントのベクトルを生成
    let edges: Vec<Vec<EdgePoint>> = (0..height)
        .into_par_iter()
        .flat_map(|y| {
            let mut row_edges = Vec::new();
            for x in 0..width {
                let pixel = edge_img.get_pixel(x, y)[0];
                if pixel >= threshold {
                    row_edges.push(EdgePoint { x, y });
                }
            }
            
            // 行内のエッジポイントを個別のベクトルとして返す
            if !row_edges.is_empty() {
                vec![row_edges]
            } else {
                vec![]
            }
        })
        .collect();

    edges
}
```

### 2. メモリ効率の最適化

エッジポイントの数が多い場合、事前に容量を確保:

```rust
fn extract_edges(
    edge_img: &ImageBuffer<Luma<u8>, Vec<u8>>,
    threshold: u8,
) -> Vec<Vec<EdgePoint>> {
    let (width, height) = edge_img.dimensions();

    (0..height)
        .into_par_iter()
        .filter_map(|y| {
            let mut row_edges = Vec::with_capacity(width as usize / 4); // 推定容量
            
            for x in 0..width {
                let pixel = edge_img.get_pixel(x, y)[0];
                if pixel >= threshold {
                    row_edges.push(EdgePoint { x, y });
                }
            }
            
            if !row_edges.is_empty() {
                Some(row_edges)
            } else {
                None
            }
        })
        .collect()
}
```

---

## タスク

### 1. `extract_edges`関数の並列化実装

**ファイル**: `src-tauri/src/peaking.rs`

- [ ] Rayonの`into_par_iter()`を使用
- [ ] 各行を並列に処理
- [ ] 空の行はスキップ（`filter_map`）
- [ ] メモリ効率を考慮

### 2. 10,000ポイント制限の維持

既存の制限ロジックを保持:
```rust
pub async fn focus_peaking(
    image_path: String,
    threshold: u8,
) -> Result<PeakingResult, String> {
    // ... 処理 ...
    
    let mut edge_points = extract_edges(&edges, threshold);
    
    // 10,000ポイント制限
    let total_points: usize = edge_points.iter().map(|v| v.len()).sum();
    if total_points > 10000 {
        let factor = total_points as f32 / 10000.0;
        edge_points.retain(|_| rand::random::<f32>() < 1.0 / factor);
    }
    
    Ok(PeakingResult { ... })
}
```

### 3. パフォーマンステスト

Ticket #001の計測コードを使用し、並列化前後を比較:

```
Before: エッジ抽出 XXXms
After: エッジ抽出 YYYms
高速化率: ZZZ%
```

### 4. 動作確認

- エッジポイントの数が正しい
- 座標が正確
- 複数の閾値でテスト（50, 100, 150）

---

## 完了条件

- ✅ `extract_edges`が並列化されている
- ✅ ビルドエラーなし
- ✅ 処理時間が30~50%削減されている
- ✅ エッジポイント数が正しい
- ✅ 視覚的な品質に変化なし
- ✅ 10,000ポイント制限が機能

---

## リスク

### リスク1: 並列処理の順序性
`flat_map`や`filter_map`の結果の順序は保証されないが、
エッジポイントの順序は重要ではないため問題なし。

### リスク2: メモリの断片化
多くの小さいベクトルを生成するとメモリが断片化する可能性。

**対策**: 初期容量を適切に設定し、再割り当てを減らす。

---

## 次のステップ

このチケット完了後、以下に進む:
- Ticket #005: Rust側キャンセルチェック実装
- Ticket #007: パフォーマンステストと調整

---

## 参考情報

### Rayonのフラット化パターン
```rust
// パターン1: flat_map - ネストしたベクトルを展開
vec![vec![1, 2], vec![3, 4]]
    .par_iter()
    .flat_map(|v| v.clone())
    .collect() // [1, 2, 3, 4]

// パターン2: filter_map - フィルタとマップを同時実行
(0..10)
    .into_par_iter()
    .filter_map(|i| if i % 2 == 0 { Some(i * 2) } else { None })
    .collect()
```

### EdgePoint構造体（参考）
```rust
#[derive(Serialize, Clone)]
pub struct EdgePoint {
    pub x: u32,
    pub y: u32,
}
```
