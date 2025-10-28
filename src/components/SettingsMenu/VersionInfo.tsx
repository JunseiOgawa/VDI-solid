import { Component, createSignal } from "solid-js";
import { Update } from "@tauri-apps/plugin-updater";
import { updateManager } from "../../services/UpdateManager";
import { useAppState } from "../../context/AppStateContext";

const VersionInfo: Component = () => {
  const { t } = useAppState();
  const [isChecking, setIsChecking] = createSignal(false);
  const [isInstalling, setIsInstalling] = createSignal(false);
  const [message, setMessage] = createSignal("");
  const [availableUpdate, setAvailableUpdate] = createSignal<Update | null>(
    null,
  );

  const handleCheckUpdate = async () => {
    setIsChecking(true);
    setMessage(t("version.checking"));

    const result = await updateManager.checkForUpdatesManual();

    if (result.error) {
      setMessage(result.error);
      setAvailableUpdate(null);
    } else if (result.available && result.update) {
      setMessage(
        t("version.updateAvailable", { version: result.update.version }),
      );
      setAvailableUpdate(result.update);
    } else {
      setMessage(t("version.upToDate"));
      setAvailableUpdate(null);
    }

    setIsChecking(false);
  };

  const handleInstallUpdate = async () => {
    const update = availableUpdate();
    if (!update) return;

    setIsInstalling(true);
    setMessage(t("version.installing"));

    try {
      await updateManager.installUpdate(update);
    } catch (error) {
      console.error("[VersionInfo] インストール失敗:", error);
      setMessage(`インストールに失敗しました: ${error}`);
      setIsInstalling(false);
    }
  };

  return (
    <div class="px-3 py-2">
      <div class="flex flex-col gap-2">
        <span class="text-label font-medium text-[var(--glass-text-primary)]">
          {t("version.title")}
        </span>

        <div class="flex flex-col gap-1.5">
          <span class="text-caption text-[var(--glass-text-secondary)] font-mono">
            v{updateManager.getCurrentVersion()}
          </span>

          <button
            onClick={
              availableUpdate() ? handleInstallUpdate : handleCheckUpdate
            }
            disabled={isChecking() || isInstalling()}
            class="px-3 py-1.5 bg-blue-500/90 hover:bg-blue-400/90 disabled:bg-gray-500/50 disabled:cursor-not-allowed rounded text-white transition-all duration-200 text-small"
          >
            {isInstalling()
              ? t("version.installing")
              : isChecking()
                ? t("version.checking")
                : availableUpdate()
                  ? t("version.installUpdate")
                  : t("version.checkUpdate")}
          </button>

          {message() && (
            <span class="text-caption text-[var(--glass-text-secondary)] mt-1">
              {message()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VersionInfo;
