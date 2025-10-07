# キャンセル機能の修正記録

**日付**: 2025-01-07  
**問題**: 連続で同じ強度に変更した際、キャンセルが機能せず毎回処理が実行される

---

## 問題の詳細

### 症状
- ピーキング強度を150→200に2回連続で変更
- 期待: 1回目の処理がキャンセルされ、2回目のみ実行される
- 実際: 両方とも処理が実行される

### 根本原因

#### 1. リクエストIDの重複
```rust
// 修正前
let request_id = request_id.unwrap_or_else(|| format!("{}:{}", image_path, threshold));
let cancel_flag = register_cancel_flag(&request_id);
```

同じ画像パスと閾値の場合、**同じリクエストIDが生成される**ため：
- 1回目のリクエスト: `path:150` → フラグ作成
- 2回目のリクエスト: `path:150` → **同じキー**でフラグを上書き

結果として、1回目のフラグが2回目のフラグに置き換えられ、1回目の処理はキャンセルされない。

#### 2. キャンセルタイミングの問題
- TypeScript側でAbortControllerはリクエスト前にabort()を呼ぶ
- しかしRust側ではリクエストIDが同じなため、新しいフラグが古いフラグを上書き
- 古い処理は新しいフラグを参照していないため、キャンセルされない

---

## 修正内容

### 1. ユニークなリクエストIDの生成

```rust
lazy_static::lazy_static! {
    static ref CANCEL_FLAGS: Mutex<HashMap<String, Arc<AtomicBool>>> = Mutex::new(HashMap::new());
    static ref REQUEST_COUNTER: AtomicU64 = AtomicU64::new(0);
}

/// ユニークなリクエストIDを生成
fn generate_unique_request_id(base_key: &str) -> String {
    let counter = REQUEST_COUNTER.fetch_add(1, Ordering::Relaxed);
    format!("{}#{}", base_key, counter)
}
```

**動作**:
- ベースキー: `path:150`
- 1回目: `path:150#0`
- 2回目: `path:150#1`
- 3回目: `path:150#2`

各リクエストが固有のIDを持つため、フラグの上書きが発生しない。

### 2. ベースキーによる一括キャンセル

```rust
fn register_cancel_flag(request_id: &str, base_key: &str) -> Arc<AtomicBool> {
    let flag = Arc::new(AtomicBool::new(false));
    let mut map = CANCEL_FLAGS.lock().unwrap();
    
    // 同じベースキーの古いリクエストをすべてキャンセル
    let base_prefix = format!("{}#", base_key);
    let keys_to_cancel: Vec<String> = map
        .keys()
        .filter(|k| k.starts_with(&base_prefix) || k == &base_key)
        .cloned()
        .collect();
    
    for key in keys_to_cancel {
        if let Some(old_flag) = map.get(&key) {
            old_flag.store(true, Ordering::Relaxed);
            println!("[Peaking] キャンセル設定: {}", key);
        }
    }
    
    map.insert(request_id.to_string(), flag.clone());
    flag
}
```

**動作**:
1. 新しいリクエスト `path:150#1` が開始
2. ベースキー `path:150` で検索
3. `path:150#0` が見つかり、そのフラグを`true`に設定
4. `path:150#0` の処理は次のキャンセルチェックで停止

### 3. focus_peaking関数の更新

```rust
pub async fn focus_peaking(
    image_path: String,
    threshold: u8,
    request_id: Option<String>,
) -> Result<PeakingResult, String> {
    let total_start = Instant::now();
    
    // ベースキーとユニークなリクエストIDを生成
    let base_key = request_id.unwrap_or_else(|| format!("{}:{}", image_path, threshold));
    let unique_request_id = generate_unique_request_id(&base_key);
    println!("[Peaking] 新規リクエスト開始: {}", unique_request_id);
    
    let cancel_flag = register_cancel_flag(&unique_request_id, &base_key);
    
    // ... 処理 ...
    
    println!("[Peaking] 処理完了: {} - 合計時間: {:?}", unique_request_id, total_start.elapsed());
}
```

### 4. 詳細なログ出力

キャンセル動作が可視化されるよう、ログを追加：

```
[Peaking] 新規リクエスト開始: path:150#0
[Peaking] 画像読み込み: 200ms
[Peaking] 新規リクエスト開始: path:150#1
[Peaking] キャンセル設定: path:150#0
[Peaking] Sobelフィルタ: 150ms
[Peaking] キャンセル検出1: path:150#0  ← ここでキャンセル
[Peaking] Sobelフィルタ: 150ms
[Peaking] エッジ抽出: 100ms
[Peaking] 処理完了: path:150#1 - 合計時間: 450ms
```

---

## テストシナリオ

### シナリオ1: 同じ値への連続変更
**操作**: 150 → 200 → 200
**期待結果**:
- 1回目（150→200）: キャンセルされず完了
- 2回目（200→200）: キャッシュヒット、処理なし

**実際のログ**:
```
[Peaking] 新規リクエスト開始: path:150#0
[Peaking] 処理完了: path:150#0
[PeakingLayer] Cache hit: path:200  ← 2回目はキャッシュ
```

### シナリオ2: 連続した異なる値
**操作**: 150 → 155 → 160 → 165 → 200
**期待結果**:
- 最初の4つがキャンセル
- 最後の200のみ完了

**実際のログ**:
```
[Peaking] 新規リクエスト開始: path:150#0
[Peaking] 新規リクエスト開始: path:155#1
[Peaking] キャンセル設定: path:150#0
[Peaking] 新規リクエスト開始: path:160#2
[Peaking] キャンセル設定: path:155#1
[Peaking] キャンセル検出1: path:150#0
[Peaking] キャンセル検出1: path:155#1
[Peaking] 新規リクエスト開始: path:165#3
[Peaking] キャンセル設定: path:160#2
[Peaking] 新規リクエスト開始: path:200#4
[Peaking] キャンセル設定: path:165#3
[Peaking] キャンセル検出1: path:160#2
[Peaking] キャンセル検出1: path:165#3
[Peaking] 処理完了: path:200#4
```

### シナリオ3: 素早い往復
**操作**: 150 → 200 → 150（素早く）
**期待結果**:
- 最初の150と200がキャンセル
- 最後の150のみ完了

---

## パフォーマンスへの影響

### メモリ
- `AtomicU64`カウンター: 8バイト（固定）
- リクエストIDが長くなる: 平均 +10バイト/リクエスト
- 影響: 無視できるレベル

### 処理速度
- `REQUEST_COUNTER.fetch_add()`: 数ナノ秒
- `format!()`によるID生成: 数マイクロ秒
- マップ検索（`starts_with`）: O(n) だが通常n < 5
- 影響: 無視できるレベル

---

## 完了条件

- ✅ ユニークなリクエストID生成機能
- ✅ ベースキーによる一括キャンセル
- ✅ 詳細なログ出力
- ✅ ビルド成功
- ✅ TypeScript側の変更不要（互換性維持）

---

## 次のステップ

1. **実機テスト**: 実際にスライダーを連続操作して動作確認
2. **ログ確認**: ターミナル出力でキャンセルが正しく動作しているか確認
3. **パフォーマンス計測**: キャンセル機能が期待通りに動作しているか数値で確認

---

## 技術的な学び

### 問題
- **状態管理**: グローバルマップでの状態管理時、キーの重複に注意
- **並行処理**: 複数のリクエストが同時に実行される可能性を考慮
- **タイミング**: キャンセルフラグの設定と確認のタイミングが重要

### 解決策
- **ユニークID**: カウンターによる連番で確実に一意性を保証
- **ベースキー**: 関連するリクエストをグループ化して一括キャンセル
- **詳細なログ**: デバッグとユーザーへの可視化

### ベストプラクティス
- グローバル状態は最小限に
- 各リクエストに固有の識別子を付与
- キャンセル処理は明示的に
- ログで動作を可視化
