# コードレビュー

## 概要

全体として、`src` (SolidJS/TypeScript) と `src-tauri` (Rust) の関心事がきれいに分離されており、見通しがよくメンテナンス性の高いアーキテクチャです。フロントエンドはコンポーネントベースで構築され、状態管理のコンテキストも適切に使用されています。バックエンドはTauriのコマンドとして機能が整理されています。

以下に、各パートごとの具体的なレビューと改善提案を記載します。

---

## 1. フロントエンド (`src`)

### 1.1. `ImageViewer/index.tsx` のリファクタリング

このコンポーネントはアプリケーションの中核であり、多くのロジックを担っています。現状でも機能していますが、いくつかの点を改善することで、より堅牢で再利用しやすくなります。

#### **問題点: グローバル関数の公開**

`calculateAndSetScreenFit` と `resetImagePosition` が `window` オブジェクトに直接アタッチされています。

```typescript
// ImageViewer/index.tsx
onMount(() => {
  // ...
  (window as any).calculateAndSetScreenFit = calculateAndSetScreenFit;
  (window as any).resetImagePosition = resetImagePosition;
  // ...
});
```

これはコンポーネントのカプセル化を破壊し、以下のようなリスクを生みます。
- **名前空間の汚染:** 他のライブラリやコンポーネントと関数名が衝突する可能性があります。
- **意図しない呼び出し:** アプリケーションのどこからでも呼び出せてしまうため、状態管理が複雑になります。
- **コンポーネントの再利用性の低下:** このコンポーネントは `window` オブジェクトへの登録を前提としており、単体での再利用が難しくなります。

#### **改善案: イベントまたはコンテキスト経由での呼び出し**

1.  **Tauriイベントを利用する:**
    外部から `ImageViewer` の機能を呼び出したい場合、Tauriのイベントシステムを利用するのがクリーンです。例えば、メニューからスクリーンフィットを実行したい場合、Rust側から `"fit-screen"` のようなカスタムイベントをemitし、`ImageViewer` はそれをリッスンして `calculateAndSetScreenFit` を実行します。

    ```typescript
    // ImageViewer/index.tsx
    import { listen } from '@tauri-apps/api/event';

    onMount(async () => {
      const unlistenFit = await listen('fit-screen', () => {
        calculateAndSetScreenFit();
      });
      // ...
      onCleanup(() => unlistenFit());
    });
    ```

2.  **状態管理コンテキスト (`AppStateContext`) を利用する:**
    これらのアクションをトリガーするための関数をコンテキスト経由で公開します。これにより、`ImageViewer` 自身がロジックの本体を持ちつつ、他のコンポーネント（例えばフッターのボタン）はコンテキストを通じて安全にその機能を呼び出せます。

### 1.2. 状態管理の改善

`ImageViewer` 内で多数の `createSignal` が使用されています。

```typescript
const [position, setPosition] = createSignal({ x: 0, y: 0 });
const [isDragging, setIsDragging] = createSignal(false);
const [containerSize, setContainerSize] = createSignal({ width: 0, height: 0 });
// ...など多数
```

これらの状態は互いに関連性が高いため、SolidJSの `createStore` を使って単一のストアオブジェクトにまとめることを推奨します。

#### **改善案: `createStore` の活用**

```typescript
import { createStore } from 'solid-js/store';

// ...

const [state, setState] = createStore({
  position: { x: 0, y: 0 },
  isDragging: false,
  isDragActive: false,
  containerSize: { width: 0, height: 0 },
  displaySize: null as { width: number; height: number } | null,
  baseSize: null as { width: number; height: number } | null,
});
```

これにより、関連する状態の更新ロジックを集約しやすくなり、コードの見通しが向上します。

### 1.3. `lib/boundaryUtils.ts` のコメント

`computeMinMax` 関数は複雑な境界計算を行っています。コメントは付与されていますが、ロジックの意図をより明確にすることで、将来のメンテナンス性が向上します。

#### **問題点: 計算ロジックの複雑さ**

特に `halfWidthScreen` や `halfHeightScreen` の三項演算子は、一読しただけでは意図を理解するのが困難です。

#### **改善案: 具体的な説明コメントの追加**

計算の目的を説明するコメントを追加します。

```typescript
// lib/boundaryUtils.ts

// ...
const halfWidthScreen = displaySize.width >= container.width
  ? (displaySize.width - container.width) / 2 // 画像がコンテナより大きい場合：はみ出す部分の半分を移動範囲とする
  : Math.min(
      (container.width - displaySize.width) / 2, // 画像がコンテナより小さい場合：基本的には中央揃えの範囲
      // ただし、低倍率での移動許可(maxTravelFactor)が設定されている場合、その範囲まではみ出しを許容する
      factor > 1 ? Math.max(0, (desiredWidth - displaySize.width) / 2) : (container.width - displaySize.width) / 2
    );
// ...
```

---

## 2. バックエンド (`src-tauri`)

### 2.1. エラーハンドリング

現在、すべてのコマンドはエラー時に `Err(String)` を返しています。これはデバッグ時には有用ですが、フロントエンドでエラーの種類に応じた処理（例: 「ファイルが見つかりません」というメッセージを出す）を行うのが困難です。

#### **改善案: カスタムエラー型の定義**

エラーの種類を表すカスタムenumを定義し、`Result` のエラー型として使用します。`thiserror` クレートを利用すると、この実装を簡潔に行えます。

```rust
// main.rs または lib.rs
use thiserror::Error;
use tauri::InvokeError;

#[derive(Debug, Error)]
pub enum CommandError {
    #[error("I/Oエラー: {0}")]
    Io(#[from] std::io::Error),

    #[error("画像処理エラー: {0}")]
    Image(#[from] image::ImageError),

    #[error("指定されたファイルが存在しません: {0}")]
    NotFound(String),

    #[error("回転角は90度単位で指定してください")]
    InvalidAngle,

    #[error("不明な画像フォーマットです")]
    UnknownFormat,
}

// `Into<InvokeError>` を実装することで、Tauriのコマンドから直接返せるようになる
impl From<CommandError> for InvokeError {
    fn from(error: CommandError) -> Self {
        InvokeError::from(error.to_string())
    }
}

// コマンドのシグネチャを変更
#[tauri::command]
async fn rotate_image(image_path: String, rotation_angle: f32) -> Result<String, CommandError> {
    // ...
    if normalized_angle % 90 != 0 {
        return Err(CommandError::InvalidAngle);
    }
    // ...
}
```

### 2.2. 画像回転処理 (`img.rs`)

`rotate_image` 関数内で、画像フォーマットの推測に失敗した場合に `ImageFormat::Png` にフォールバックしています。

#### **問題点: 意図しないフォーマット変換**

```rust
// img.rs
let format = image::ImageFormat::from_path(path).unwrap_or(ImageFormat::Png);
```

これにより、例えば拡張子のないJPEGファイルなどがPNGとして保存されてしまう可能性があります。これはユーザーのデータを意図せず変更することになり、問題を引き起こす可能性があります。

#### **改善案: エラーとして処理**

フォーマットが推測できない場合は、処理を中断してエラーを返す方が安全です。

```rust
// img.rs
let format = image::ImageFormat::from_path(path)
    .ok_or(CommandError::UnknownFormat)?; // カスタムエラー型を使用

rotated_img
    .save_with_format(&image_path, format)
    .map_err(|e| CommandError::Image(e))?; // エラーをラップ
```

### 2.3. 画像ナビゲーションの効率

`get_next_image` と `get_previous_image` は、呼び出されるたびに `get_folder_images` を実行します。`get_folder_images` は毎回ディレクトリを読み込み、ファイルをフィルタリングし、ソートしています。画像が多数あるフォルダではパフォーマンスの低下が懸念されます。

#### **改善案: フロントエンドでのリスト管理**

1.  Rust側は、指定されたフォルダ内の画像リストを一度だけ返す `get_folder_images` コマンドのみを提供します。
2.  フロントエンド（`AppStateContext`など）は、画像がドロップされた際にこのコマンドを呼び出し、画像パスのリストをキャッシュします。
3.  「次へ」「前へ」のナビゲーションは、フロントエンド側でこのキャッシュされたリストのインデックスを操作することで行います。

これにより、ファイルシステムへのアクセスが最小限になり、高速なナビゲーションが実現できます。
