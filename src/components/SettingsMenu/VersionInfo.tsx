import { Component, createSignal } from "solid-js";
import { updateManager } from "../../services/UpdateManager";
import { useAppState } from "../../context/AppStateContext";

const VersionInfo: Component = () => {
  const { t } = useAppState();
  const [isChecking, setIsChecking] = createSignal(false);
  const [message, setMessage] = createSignal("");

  const handleCheckUpdate = async () => {
    setIsChecking(true);
    setMessage(t("version.checking"));

    const result = await updateManager.checkForUpdatesManual();

    if (result.error) {
      setMessage(result.error);
    } else if (result.available && result.update) {
      setMessage(t("version.updateAvailable", { version: result.update.version }));
    } else {
      setMessage(t("version.upToDate"));
    }

    setIsChecking(false);
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
            onClick={handleCheckUpdate}
            disabled={isChecking()}
            class="px-3 py-1.5 bg-blue-500/90 hover:bg-blue-400/90 disabled:bg-gray-500/50 disabled:cursor-not-allowed rounded text-white transition-all duration-200 text-small"
          >
            {isChecking() ? t("version.checking") : t("version.checkUpdate")}
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
