# JPEG XL対応の設計

## 背景

現在、VDI-solidは以下の画像形式に対応している:
- jpg, jpeg
- png
- gif
- bmp
- webp
- tiff, tif

JPEG XL（JXL形式）は次世代の画像フォーマットであり、より効率的な圧縮と高品質な画像表示を実現するため、対応を追加する。

## 要件

1. **画像ナビゲーション**: フォルダ内のJPEG XL画像をリストアップし、他の画像形式と同様に扱えるようにする
2. **画像表示**: JPEG XL画像をブラウザで表示できるようにする
3. **画像操作**: 回転などの編集機能でJPEG XL形式をサポートする

## 技術的な制約

- **ブラウザ対応**: 現時点でJPEG XLのブラウザネイティブサポートは限定的
  - Chrome: フラグによる有効化が必要（2023年以降、デフォルトでは無効）
  - Safari: 対応なし
  - Firefox: 一部対応

- **Rust imageクレート**: `image`クレートはJPEG XL形式をネイティブサポートしている（v0.24.0以降、`jxl` featureで対応）

## 実装方針

### 調査結果

- **imageクレート**: v0.24系にはJPEG XLサポートがない（`jxl` featureは存在しない）
- **代替クレート**:
  - `jxl-oxide`: Pure Rustの実装、imageクレートとの統合機能あり
  - `jpegxl-rs`: libjxlのラッパー

### 選択したアプローチ: jxl-oxideを使用

1. **画像拡張子リストへの追加**
   - `src-tauri/src/navigation.rs`の`image_extensions`配列に`"jxl"`を追加
   - これにより、フォルダ内のJXL画像がリストアップされる

2. **jxl-oxideクレートの追加**
   - `Cargo.toml`に`jxl-oxide`クレートを追加（`image` featureを有効化）
   - これでJPEG XL画像のデコードが可能になる

3. **画像処理の対応**
   - `rotate_image`などの編集コマンドでJXL形式を扱う際の処理を追加
   - JXL画像をデコードし、回転処理を適用後、再エンコードする
   - または、PNG等の中間フォーマットに変換してから処理する

### フロントエンド側の対応

- JPEG XL画像の表示にはブラウザのネイティブサポートが必要
- サポートされていない場合、Rust側でPNG等に変換して提供することを検討

## 実装タスク

詳細は`docs/20251105_jpegxl_support/task.md`を参照。
