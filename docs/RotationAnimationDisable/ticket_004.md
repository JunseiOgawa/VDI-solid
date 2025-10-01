# Ticket #004: 保存時に UI 回転をリセットせずそのまま回転適用する（無駄な逆回転の排除）
**優先度**: High

## 背景
現在の実装は、UI 側での回転を内部的にリセットしてからネイティブ（ファイル）側の回転を行い、完了後に UI を再度更新するフローを含んでいます。これにより、一時的に ``rotation`` を 0 に戻すなどの操作が入り、ユーザー視点で不要な逆回転や表示揺れが発生することがあります。

目的: 画像を保存（またはネイティブ回転を適用）する際、UI 上の回転値をリセットせず、そのまま継続して表示しながらバックグラウンドでファイルの回転を順次適用する。これにより「一度戻してから再回転する」無駄な操作をなくし、UX とパフォーマンスを改善する。

## 対象ファイル
- 変更: `src/lib/rotationManager.ts` - performRotation / applyResidualRotation の振る舞いを修正
- 変更: `src/context/AppStateContext.tsx` - rotationManager API の公開/利用方法に合わせたラップ調整（必要に応じて）
- 変更: `src/components/ImageViewer/index.tsx` - 表示側での角度の扱い確認（副作用がないか）

## 影響範囲
- 回転キュー処理の期待動作（enqueueRotation / flushRotationQueue / performRotation）
- applyResidualRotation の挙動（残差処理が変更されるため、回転の整合性を確認する必要あり）
- UI 上のアニメーション抑止ロジック（既に導入した suppressRotationAnimationCount / runWithoutRotationAnimation を維持しつつ適用）

## 提案される実装（差分の概念）
1. performRotation の成功時の状態遷移を「UI を 0 にリセットしてから更新する」から「UI の rotation をそのまま維持し、pendingRotation を消費して最小限の調整を行う」へ変更する。
   - 具体案A（推奨）: ネイティブ側に適用された実際の回転角 executedTotal を受け取れる場合、UI 側は現在の rotation をそのまま維持し、pendingRotation から executedTotal を引くだけにする。
   - 具体案B（互換優先）: ネイティブ側が実行角度を返さない場合でも、performRotation 内の "total"（pendingRotation の値）を用いて、UI の rotation を normalize したうえで pendingRotation を 0 にするが、UI を強制的に 0 にリセットしない。
2. applyResidualRotation の責務を明確化する。
   - 残差（実行できなかった角度）がある場合は pendingRotation を残し、UI の rotation は normalize して整合するように更新する（“すぐに 0 に戻す” といった強制操作は避ける）。
3. 保存・回転フローで `runWithoutRotationAnimation` を使用するかはケースバイケース。保存直後に瞬時に見た目を変えたくない（例: キャッシュ更新のため瞬間的に src が変わる場合）は一時抑止を使うが、基本動作は "回転を維持" にする。

## 実装手順（詳細）
1. `src/lib/rotationManager.ts` の `performRotation` を次のように修正する（概念）:
   - ネイティブ呼び出しの成功時に戻る値（もしあれば）で実際に適用された角度を取得。
   - pendingRotation を実行量だけ減らす。
   - UI の rotation は現在の rotation() を維持、もしくは normalize(rotation()) で整合させる（0 へ強制しない）。
   - エラー時は従来どおり残差処理を行う（applyResidualRotation を用いる）が、UI の強制 0 リセットは行わない。
2. コンテキスト側 (`AppStateContext.tsx`) は、ラップしている rotationManager の API が変わった場合に合わせて公開 API を調整する。
3. `ImageViewer/index.tsx` の表示ロジックを確認し、rotation の値を保持したまま表示が自然に遷移することを確認する（必要なら一時的に suppressRotationAnimation を 1 増やして、表示のフリッカを防ぐ）。
4. 最後に E2E/手動 QA を行う（下記参照）。

## 完了条件（受け入れ基準）
- [ ] 画像を複数回回転（enqueueRotation で複数回角度を溜める）→ 保存（flushRotationQueue）を実行しても UI 側の回転が途中で 0 に戻らず、そのまま維持される
- [ ] ファイル側の回転処理が成功した場合、pendingRotation が正しく減算され、表示とファイルの回転状態が整合する
- [ ] エラー時（ネイティブ回転失敗）の残差処理で UI が不整合にならない（applyResidualRotation の挙動を確認）
- [ ] 既存の通常回転操作（ユーザーによる enqueueRotation）に影響がない

## テスト／QA シナリオ（手順）
1. 画像を表示して UI 上で 90° 回転を複数回実行（例: 90→90→90）
2. 保存（flushRotationQueue もしくは保存ボタン操作）を実行
3. 期待: UI の表示角度が途中で 0 に戻らず、そのまま最終角度を表示し続ける
4. ネイティブ側で rotate_image を故意に失敗させたケースでも、UI の角度が即座に 0 に戻らず、残差が表示される（かつ明示的に復元ロジックが働く）

## リスクと軽減策
- リスク: performRotation の実行と UI の rotation 値の同期タイミングを誤ると、見た目とファイル内容の不整合が発生する。
  - 軽減: performRotation は実行開始時に isRotating フラグを立て、成功/失敗の両ケースで明確に pendingRotation と rotation を更新する。可能ならばネイティブ側から実際に適用された角度を返してもらう（より正確）。
- リスク: 既存テストや他コンポーネントが "rotation は 0 になる" 前提で動いている場合、挙動が変わると副作用が出る。
  - 軽減: 変更範囲を限定し、まずは rotationManager 内部での挙動変更に留め、Context の公開 API は互換性を保持する。

---

実装は `docs/RotationAnimationDisable/ticket_004.md` を起点に行ってください。必要であれば、私のほうで該当コードの最小差分実装（テスト込み）を行えますが、まずはこのチケットで方針合意をお願いします。