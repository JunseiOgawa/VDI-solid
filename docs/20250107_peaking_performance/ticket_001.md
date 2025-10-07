# Ticket #001: 処理時間計測とボトルネック分析

**作成日**: 2025-01-07  
**優先度**: High  
**見積時間**: 0.5時間  
**担当**: フロントエンド + Rust  
**依存関係**: なし  

---

## 目的

現状のフォーカスピーキング処理の各段階における処理時間を詳細に計測し、
最も時間がかかっている処理（ボトルネック)を特定する。

これにより、並列化の優先順位を決定し、最大の効果を得る。

---

## タスク

### 1. Rust側に処理時間計測コードを追加

**ファイル**: `src-tauri/src/peaking.rs`

```rust
use std::time::Instant;

#[tauri::command]
pub async fn focus_peaking(
    image_path: String,
    threshold: u8,
) -> Result<PeakingResult, String> {
    let total_start = Instant::now();
    
    // 画像読み込み
    let load_start = Instant::now();
    let img = image::open(&image_path).map_err(|e| e.to_string())?;
    let gray = img.to_luma8();
    println!("[Peaking] 画像読み込み: {:?}", load_start.elapsed());
    
    // Sobelフィルタ適用
    let sobel_start = Instant::now();
    let edges = apply_sobel_filter(&gray);
    println!("[Peaking] Sobelフィルタ: {:?}", sobel_start.elapsed());
    
    // エッジ抽出
    let extract_start = Instant::now();
    let edge_points = extract_edges(&edges, threshold);
    println!("[Peaking] エッジ抽出: {:?}", extract_start.elapsed());
    
    println!("[Peaking] 合計処理時間: {:?}", total_start.elapsed());
    
    Ok(PeakingResult {
        width: gray.width(),
        height: gray.height(),
        edges: edge_points,
    })
}
```

### 2. テストケースの準備

**画像サイズ**:
- 小: 640x480 (VGA)
- 中: 1280x720 (HD)
- 大: 1920x1080 (Full HD)

**テストパラメータ**:
- threshold: 50, 100, 150（異なる強度）

### 3. 計測の実行

1. 開発サーバー起動
2. 各画像サイズで3回ずつ計測
3. ターミナルに出力されるログを記録

### 4. 結果の記録

**ファイル**: `docs/20250107_peaking_performance/performance_analysis.md`

```markdown
# パフォーマンス分析結果

## テスト環境
- CPU: [記録する]
- メモリ: [記録する]
- OS: Windows
- Rust: [バージョン]

## 計測結果（平均値）

### 1920x1080 (threshold=100)
| 処理 | 時間 | 割合 |
|------|------|------|
| 画像読み込み | XXXms | XX% |
| Sobelフィルタ | XXXms | XX% |
| エッジ抽出 | XXXms | XX% |
| **合計** | XXXms | 100% |

### 1280x720 (threshold=100)
...

### 640x480 (threshold=100)
...

## ボトルネック分析
[最も時間がかかっている処理を特定]
```

---

## 完了条件

- ✅ `peaking.rs` に計測コードが追加されている
- ✅ 3種類の画像サイズで計測完了
- ✅ `performance_analysis.md` に結果が記録されている
- ✅ ボトルネック処理が明確になっている

---

## 次のステップ

結果に基づき、以下のタスクの優先度を調整:
- Sobelフィルタの並列化（Ticket #003）
- エッジ抽出の並列化（Ticket #004）

---

## 備考

- この計測は開発時のみ使用（本番では削除）
- 計測オーバーヘッドは数マイクロ秒程度で無視可能
- 結果は後続のチケット設計に使用
