import type { Accessor } from "solid-js";
import { createEffect, onCleanup, onMount } from "solid-js";

export type BaseThemeKey = "light" | "dark";
export type ThemeKey = BaseThemeKey | "auto";

export interface ThemeDefinition {
  /** 固有の識別子。設定保存時はこの値を利用します。 */
  key: ThemeKey;
  /** UI に表示する人間向けラベル。 */
  label: string;
  /** 設定メニュー等で利用できる説明文。 */
  description: string;
  /** DOM に適用する data-theme 値。auto の場合は system を示します。 */
  dataTheme: BaseThemeKey | "system";
}

const THEME_DEFINITIONS: Record<ThemeKey, ThemeDefinition> = {
  light: {
    key: "light",
    label: "ライトモード",
    description: "明るい背景と濃いテキストで日中の作業に最適です。",
    dataTheme: "light",
  },
  dark: {
    key: "dark",
    label: "ダークモード",
    description: "暗い背景と明るいテキストで夜間でも目に優しい配色です。",
    dataTheme: "dark",
  },
  auto: {
    key: "auto",
    label: "OSに合わせる",
    description: "OSの配色設定に追従して自動的に切り替えます。",
    dataTheme: "system",
  },
};

export const ORDERED_THEME_KEYS: readonly ThemeKey[] = [
  "light",
  "dark",
  "auto",
] as const;
export const AVAILABLE_THEMES = ORDERED_THEME_KEYS.map(
  (key) => THEME_DEFINITIONS[key],
);

export const isThemeKey = (value: unknown): value is ThemeKey =>
  typeof value === "string" && value in THEME_DEFINITIONS;

export const resolveTheme = (
  key: ThemeKey,
  systemPrefersDark: boolean,
): BaseThemeKey =>
  key === "auto" ? (systemPrefersDark ? "dark" : "light") : key;

const applyResolvedTheme = (resolved: BaseThemeKey) => {
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.setAttribute("data-theme", resolved);
  // ブラウザのダイアログやスクロールバー配色にも反映させる
  document.documentElement.style.setProperty("color-scheme", resolved);
};

const prefersDarkQuery = "(prefers-color-scheme: dark)";

/**
 * Solid のコンポーネント内で呼び出して、テーマ設定に応じて DOM の data-theme を同期させます。
 * auto 設定の場合は OS の配色変更も購読します。
 */
export const createThemeController = (theme: Accessor<ThemeKey>) => {
  let mediaQuery: MediaQueryList | undefined;
  let resolvedTheme: BaseThemeKey = "light";

  const computeSystemPreference = () => {
    if (typeof window === "undefined") {
      return false;
    }
    if (!mediaQuery) {
      mediaQuery = window.matchMedia(prefersDarkQuery);
    }
    return mediaQuery.matches;
  };

  const syncTheme = (key: ThemeKey) => {
    if (typeof document === "undefined") {
      return;
    }
    resolvedTheme = resolveTheme(key, computeSystemPreference());
    applyResolvedTheme(resolvedTheme);
  };

  onMount(() => {
    if (typeof window === "undefined") {
      return;
    }

    mediaQuery = window.matchMedia(prefersDarkQuery);

    const handleMediaChange = (event: MediaQueryListEvent) => {
      if (theme() === "auto") {
        resolvedTheme = event.matches ? "dark" : "light";
        applyResolvedTheme(resolvedTheme);
      }
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleMediaChange);
    } else {
      mediaQuery.addListener(handleMediaChange);
    }

    syncTheme(theme());

    onCleanup(() => {
      if (!mediaQuery) {
        return;
      }
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", handleMediaChange);
      } else {
        mediaQuery.removeListener(handleMediaChange);
      }
    });
  });

  createEffect(() => {
    syncTheme(theme());
  });

  return {
    getResolvedTheme: () => resolvedTheme,
    definitions: THEME_DEFINITIONS,
  } as const;
};
