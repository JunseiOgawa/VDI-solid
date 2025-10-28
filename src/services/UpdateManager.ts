import { check, Update } from "@tauri-apps/plugin-updater";
import { ask } from "@tauri-apps/plugin-dialog";
import { relaunch } from "@tauri-apps/plugin-process";

const UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6時間
const RATE_LIMIT_MAX_CHECKS = 3; // 最大チェック回数
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1時間

export interface UpdateCheckResult {
  available: boolean;
  update?: Update;
  error?: string;
}

export class UpdateManager {
  private lastCheckTime: number = 0;
  private manualCheckHistory: number[] = [];

  /**
   * ローカルストレージから最終チェック時刻を読み込む
   */
  loadLastCheckTime(): void {
    const stored = localStorage.getItem("lastUpdateCheckTime");
    if (stored) {
      this.lastCheckTime = parseInt(stored, 10);
    }
  }

  /**
   * 最終チェック時刻を保存
   */
  private saveLastCheckTime(): void {
    this.lastCheckTime = Date.now();
    localStorage.setItem("lastUpdateCheckTime", this.lastCheckTime.toString());
  }

  /**
   * バックグラウンドでアップデートをチェック（起動時に実行）
   */
  async checkForUpdatesBackground(): Promise<void> {
    const now = Date.now();

    // 6時間経過していない場合はスキップ
    if (now - this.lastCheckTime < UPDATE_CHECK_INTERVAL_MS) {
      console.log(
        "[UpdateManager] 前回のチェックから6時間経過していないためスキップ",
      );
      return;
    }

    try {
      const result = await this.performUpdateCheck();

      if (result.available && result.update) {
        await this.showUpdateDialog(result.update);
      }
    } catch (error) {
      const message = this.describeUpdaterError(error);
      console.error(
        "[UpdateManager] バックグラウンドチェック失敗:",
        message,
        error,
      );
    }
  }

  /**
   * 手動でアップデートをチェック
   */
  async checkForUpdatesManual(): Promise<UpdateCheckResult> {
    // レート制限チェック
    if (!this.canPerformManualCheck()) {
      return {
        available: false,
        error:
          "短時間に連続してチェックすることはできません。しばらくお待ちください。",
      };
    }

    this.recordManualCheck();

    try {
      return await this.performUpdateCheck();
    } catch (error) {
      const message = this.describeUpdaterError(error);
      console.error("[UpdateManager] 手動チェック失敗:", message, error);
      return {
        available: false,
        error: message,
      };
    }
  }

  /**
   * 実際のアップデートチェック処理
   */
  private async performUpdateCheck(): Promise<UpdateCheckResult> {
    console.log("[UpdateManager] アップデートをチェック中...");

    const update = await check();

    this.saveLastCheckTime();

    if (update) {
      console.log(`[UpdateManager] アップデート利用可能: ${update.version}`);
      return { available: true, update };
    } else {
      console.log("[UpdateManager] 最新版です");
      return { available: false };
    }
  }

  /**
   * アップデートダイアログを表示
   */
  private async showUpdateDialog(update: Update): Promise<void> {
    const message =
      `新しいバージョン ${update.version} が利用可能です。\n\n` +
      `リリースノート:\n${update.body || "詳細はGitHubをご覧ください"}\n\n` +
      `今すぐアップデートしますか？`;

    const shouldUpdate = await ask(message, {
      title: "アップデート利用可能",
      kind: "info",
      okLabel: "アップデート",
      cancelLabel: "キャンセル",
    });

    if (shouldUpdate) {
      await this.performUpdate(update);
    }
  }

  /**
   * アップデートをダウンロード・インストール
   */
  private async performUpdate(update: Update): Promise<void> {
    try {
      console.log(
        "[UpdateManager] アップデートをダウンロード・インストール中...",
      );

      await update.downloadAndInstall((progress) => {
        if (progress.event === "Started") {
          console.log(
            `[UpdateManager] ダウンロード開始: ${progress.data.contentLength} bytes`,
          );
        } else if (progress.event === "Progress") {
          console.log(
            `[UpdateManager] ダウンロード中: ${progress.data.chunkLength} bytes`,
          );
        } else if (progress.event === "Finished") {
          console.log("[UpdateManager] ダウンロード完了");
        }
      });

      console.log("[UpdateManager] アップデート完了、再起動中...");
      await update.close();
      await relaunch();
    } catch (error) {
      console.error("[UpdateManager] アップデート失敗:", error);
      await ask(`アップデートに失敗しました: ${error}`, {
        title: "エラー",
        kind: "error",
      });
    }
  }

  /**
   * 手動でアップデートをインストール
   */
  async installUpdate(update: Update): Promise<void> {
    try {
      console.log(
        "[UpdateManager] アップデートをダウンロード・インストール中...",
      );

      await update.downloadAndInstall((progress) => {
        if (progress.event === "Started") {
          console.log(
            `[UpdateManager] ダウンロード開始: ${progress.data.contentLength} bytes`,
          );
        } else if (progress.event === "Progress") {
          console.log(
            `[UpdateManager] ダウンロード中: ${progress.data.chunkLength} bytes`,
          );
        } else if (progress.event === "Finished") {
          console.log("[UpdateManager] ダウンロード完了");
        }
      });

      console.log("[UpdateManager] アップデート完了、再起動中...");
      await update.close();
      await relaunch();
    } catch (error) {
      console.error("[UpdateManager] アップデート失敗:", error);
      await ask(`アップデートに失敗しました: ${error}`, {
        title: "エラー",
        kind: "error",
      });
      throw error;
    }
  }

  /**
   * 手動チェックのレート制限を確認
   */
  private canPerformManualCheck(): boolean {
    const now = Date.now();

    // 1時間以上前のチェック履歴を削除
    this.manualCheckHistory = this.manualCheckHistory.filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
    );

    return this.manualCheckHistory.length < RATE_LIMIT_MAX_CHECKS;
  }

  /**
   * 手動チェック履歴を記録
   */
  private recordManualCheck(): void {
    this.manualCheckHistory.push(Date.now());
  }

  /**
   * 現在のバージョンを取得
   */
  getCurrentVersion(): string {
    // package.jsonから取得（ビルド時に埋め込まれる）
    return import.meta.env.PACKAGE_VERSION || "0.1.0";
  }

  private describeUpdaterError(error: unknown): string {
    const raw = this.stringifyError(error);
    const normalized = raw.toLowerCase();

    if (normalized.includes("could not fetch a valid release json")) {
      return `${raw}\nGitHub Release に署名付き latest.json と .sig が存在するか、エンドポイントURLが正しいか確認してください。`;
    }

    if (normalized.includes("updater does not have any endpoints set")) {
      return `${raw}\ntauri.conf.json の plugins.updater.endpoints が空になっていないか確認してください。`;
    }

    if (
      normalized.includes(
        "the configured updater endpoint must use a secure protocol",
      )
    ) {
      return `${raw}\n本番ビルドでは HTTPS のみ許可されています。エンドポイントを https:// で公開するか、development のみ dangerousInsecureTransportProtocol を許可してください。`;
    }

    if (
      normalized.includes("the platform") &&
      normalized.includes("was not found")
    ) {
      return `${raw}\nlatest.json に現在のターゲット向けのプラットフォーム情報が含まれているか確認してください。`;
    }

    if (normalized.includes("signature")) {
      return `${raw}\n署名(.sig)と tauri.conf.json の pubkey が一致しているか確認してください。`;
    }

    if (
      normalized.includes("reqwest error") ||
      normalized.includes("network")
    ) {
      return `${raw}\nネットワークに接続できなかった可能性があります。プロキシやファイアウォールの設定を確認してください。`;
    }

    if (normalized.includes("minisign")) {
      return `${raw}\n署名ファイルの整合性に問題があります。最新のビルドで生成された .sig をアップロードし直してください。`;
    }

    if (normalized.includes("invalid updater binary format")) {
      return `${raw}\n配信されているインストーラの形式が対応外です。ターゲットとバンドル種類を確認してください。`;
    }

    return raw || "アップデートチェックに失敗しました。";
  }

  private stringifyError(error: unknown): string {
    if (typeof error === "string") {
      return error;
    }

    if (error instanceof Error) {
      return error.message || error.toString();
    }

    try {
      return JSON.stringify(error);
    } catch {
      return "";
    }
  }
}

export const updateManager = new UpdateManager();
