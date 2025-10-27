# Tauri v2 アップデート配信（latest.json）導入ガイド

本ドキュメントは、VDI-solid（Tauri v2）でアプリの自己更新を実現するために必要な設定・ワークフロー・運用手順をまとめたものです。GitHub Releases の「最新リリース（releases/latest）」に `latest.json` を公開し、アプリがプラグイン経由でそこから更新情報を取得します。

- 対象: Windows（必要に応じて他プラットフォームも拡張可能）
- 方式: Tauri Updater Plugin v2 + 署名付きアップデータ成果物 + latest.json
- 配信先: GitHub Releases（`https://github.com/<OWNER>/<REPO>/releases/latest/download/latest.json`）

---

## 1. 仕組みの全体像

Tauri v2 では、**プラグイン** をベースにした updater アーキテクチャを採用しています。以下の3点が重要です。

### 1.1) アップデータ成果物（zip 形式）

- 通常のインストーラ（MSI / NSIS）とは別に、アップデータ用の zip がビルドされます
- `src-tauri/tauri.conf.json` の `bundle.createUpdaterArtifacts: true` で生成
- 出力先: `src-tauri/target/release/bundle/updater/`

### 1.2) 署名（.sig）

- 各アップデータ成果物（zip）に対して、秘密鍵で署名された `.sig` ファイルを生成
- アプリ側は **フロント** の Updater Plugin で公開鍵を設定し、ダウンロード zip の真正性を検証

### 1.3) latest.json（マニフェスト）

- 現在の最新バージョン・配布 URL・署名などを記載したマニフェスト
- 例（Windows x64）:
  ```json
  {
    "version": "0.2.9",
    "notes": "Automatic update for v0.2.9",
    "pub_date": "2025-10-27T00:00:00Z",
    "platforms": {
      "windows-x86_64": {
        "url": "https://github.com/JunseiOgawa/VDI-solid/releases/download/v0.2.9/vdi-solid_0.2.9_x64_en-US.zip",
        "signature": "<対応する .sig ファイルの内容>"
      }
    }
  }
  ```

---

## 2. 事前準備（鍵の生成とSecrets設定）

### 2.1) アップデータ用の鍵ペアを生成

Tauri CLI を使用します。

```bash
# ターミナルで以下のどれか一つを実行
npx @tauri-apps/cli signer generate
# または
npm run tauri signer generate
```

実行後、以下の情報が表示/保存されます。**必ず控えておいてください**。

- **Public Key**: `Dx...` で始まる長い文字列 → フロント側で使用
- **秘密鍵**: ファイル（通常 `~/.tauri/key.key`）
- **パスワード**: 秘密鍵に設定されたパスフレーズ（必要な場合）

### 2.2) GitHub Secrets に登録

リポジトリ > Settings > Secrets and variables > Actions > New repository secret

以下を追加:

- **TAURI_PRIVATE_KEY**: 生成した秘密鍵の内容（テキスト形式またはBase64）
- **TAURI_KEY_PASSWORD**: 秘密鍵パスフレーズ（設定していない場合は空のまま可）

---

## 3. Tauri 設定（tauri.conf.json）

本リポジトリの設定（現在）:

```json
{
  "bundle": {
    "active": true,
    "targets": "all",
    "createUpdaterArtifacts": true,
    "icon": [...]
  }
}
```

- `createUpdaterArtifacts: true` → ビルド時にアップデータ成果物（zip + sig）を生成
- `updater` セクション は **tauri.conf.json には不要** です（Tauri v2 ではプラグイン側で設定）

---

## 4. Rust 側（src-tauri/src/lib.rs）

既に設定済みですが、以下のようにプラグインが初期化されています。

```rust
#[cfg(desktop)]
{
    app.handle()
        .plugin(tauri_plugin_updater::Builder::new().build())?;
    app.handle().plugin(tauri_plugin_process::init())?;
}
```

- Updater プラグインはデスクトップ環境でのみ初期化
- エンドポイント・公開鍵の設定は **フロント側（TypeScript）** で指定

---

## 5. フロント側の実装（@tauri-apps/plugin-updater）

アップデータの初期化と定期チェック、またはボタンクリックでのチェックを実装します。

### 5.1) 基本的な更新チェック

```typescript
import { check, update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

async function checkAndUpdate() {
  try {
    const { shouldUpdate, manifest } = await check();
    
    if (shouldUpdate) {
      console.log(`更新利用可能: ${manifest?.version}`);
      
      // ダウンロード＆インストール
      await update();
      
      // 再起動
      await relaunch();
    } else {
      console.log('最新版を使用中です');
    }
  } catch (error) {
    console.error('更新チェックエラー:', error);
  }
}
```

### 5.2) エンドポイント・公開鍵の設定方法

フロント起動時に環境変数またはコンフィグから読み込み、アプリ初期化時に設定します。

**パターン1: 環境変数から**

```typescript
// 例：vite.config.ts または frontend initialization
const UPDATER_ENDPOINT = import.meta.env.VITE_UPDATER_ENDPOINT 
  || 'https://github.com/JunseiOgawa/VDI-solid/releases/latest/download/latest.json';
const UPDATER_PUBKEY = import.meta.env.VITE_UPDATER_PUBKEY
  || 'Dx....'; // 生成した公開鍵
```

**パターン2: TypeScript設定ファイルから**

```typescript
// config/updater.ts
export const updaterConfig = {
  endpoint: 'https://github.com/JunseiOgawa/VDI-solid/releases/latest/download/latest.json',
  pubkey: 'Dx...', // 生成した公開鍵
};
```

**パターン3: 起動時に指定**

```typescript
import { installUpdate, onUpdaterEvent } from '@tauri-apps/plugin-updater';

// リスナーを設定して進捗を監視
onUpdaterEvent(({ event, payload }) => {
  switch (event) {
    case 'CHECKING':
      console.log('更新をチェック中...');
      break;
    case 'UPDATE_AVAILABLE':
      console.log(`更新利用可能: ${payload.version}`);
      break;
    case 'DOWNLOADING':
      console.log(`ダウンロード中: ${payload.contentLength} bytes`);
      break;
    case 'DOWNLOADED':
      console.log('ダウンロード完了。再起動を促す UI を表示');
      break;
    case 'ERROR':
      console.error('更新エラー:', payload);
      break;
  }
});

// 定期的にチェック（例: 5分ごと）
setInterval(async () => {
  await installUpdate(); // チェックしてダウンロード
}, 5 * 60 * 1000);
```

---

## 6. GitHub Actions（release.yml）

ワークフローは既に以下のステップを含んでいます。

1) **秘密鍵を環境変数で供給**
   ```yaml
   env:
     TAURI_PRIVATE_KEY: ${{ secrets.TAURI_PRIVATE_KEY }}
     TAURI_KEY_PASSWORD: ${{ secrets.TAURI_KEY_PASSWORD }}
   ```

2) **ビルド実行**
   - `npm run tauri build` で MSI/NSIS インストーラ＋ Updater zip/sig を生成

3) **PowerShell で latest.json を生成**
   - `src-tauri/target/release/bundle/updater/**/*.zip` を検出
   - `.sig` を読み取り
   - `latest.json` を作成

4) **リリースにアセットを添付**
   - MSI / NSIS インストーラ
   - Updater zip / sig
   - **latest.json**

---

## 7. リリース手順（運用フロー）

### 7.1) 準備が整った前提

- [ ] Tauri CLI で鍵ペアを生成済み
- [ ] GitHub Secrets に `TAURI_PRIVATE_KEY` / `TAURI_KEY_PASSWORD` を登録済み
- [ ] フロント側に公開鍵とエンドポイントを設定済み

### 7.2) リリース手順

1) バージョンを更新（`package.json` / `src-tauri/tauri.conf.json`）
   ```bash
   npm run version:update  # またはコマンド実行
   ```

2) コミット
   ```bash
   git commit -m "chore: bump version to X.Y.Z"
   ```

3) タグを作成してプッシュ
   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

4) GitHub Actions がトリガーされ、以下が自動実行
   - ビルド
   - 署名＆Updater 成果物生成
   - `latest.json` 生成
   - Release に全てを添付

5) Release が公開されたら、`latest.json` はこのエンドポイントで配信
   ```
   https://github.com/JunseiOgawa/VDI-solid/releases/latest/download/latest.json
   ```

6) エンドユーザのアプリが定期チェック/手動チェックで `latest.json` を取得
   - 新バージョンが利用可能なら更新ダイアログ表示
   - ユーザが同意すれば zip をダウンロード＆インストール

---

## 8. トラブルシュート

### 8.1) ビルドエラー: `Additional properties are not allowed ('updater' was unexpected)`

- **原因**: `tauri.conf.json` に `bundle.updater` セクションがある
- **対処**: このセクションを削除（Tauri v2 では bundle に updater 設定は不要）

### 8.2) .sig ファイルが生成されない

- **原因 1**: Secrets が未登録 → `npm run tauri build` で署名が行われていない
- **原因 2**: `createUpdaterArtifacts` が `false` のまま
- **対処**: Secrets 確認 ＋ config の `createUpdaterArtifacts: true` 確認

### 8.3) アプリが更新を検知しない

- **原因 1**: フロント側で updater エンドポイントが未設定
- **原因 2**: 公開鍵が不正
- **原因 3**: `latest.json` の URL が誤っている
- **対処**:
  - フロント側コードを確認（エンドポイント・公開鍵の設定）
  - `releases/latest/download/latest.json` が 200 で返るか確認
  - ブラウザコンソールでエラーを確認

### 8.4) 署名検証エラー

- **原因**: `latest.json` に記載された `.sig` とアップロード `.sig` が不一致
- **対処**: `latest.json` 生成スクリプトが `.sig` ファイルを正しく読み込んでいるか確認

---

## 9. 次に行うこと（チェックリスト）

- [ ] Tauri CLI で鍵ペアを生成（`npx @tauri-apps/cli signer generate`）
- [ ] 公開鍵を控える（`Dx...` で始まる文字列）
- [ ] GitHub Secrets に `TAURI_PRIVATE_KEY` / `TAURI_KEY_PASSWORD` を登録
- [ ] フロント側に公開鍵とエンドポイント URL を埋め込む
- [ ] バージョンを上げてタグを push（`vX.Y.Z`）
- [ ] GitHub Actions が正常に完了し、Release に latest.json が含まれるか確認
- [ ] ローカルでアプリを起動し、更新チェックが動作するか確認

---

## 10. 参考情報

- **Tauri v2 Updater Plugin**: `@tauri-apps/plugin-updater`（既に package.json に含まれている）
- **公開ドキュメント**: https://tauri.app/v1/guides/distribution/updater/
- **鍵生成**: `tauri signer generate`
- **最新リリースの固定 URL**: `https://github.com/<OWNER>/<REPO>/releases/latest/download/<FILE>`

本ガイドは Tauri v2 系の updater プラグインをベースにしています。詳細や最新情報は公式ドキュメントをご参照ください。
