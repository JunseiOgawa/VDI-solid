import ja from "./ja.json";
import en from "./en.json";

/**
 * サポートされている言語コード
 */
export type Locale = "ja" | "en";

/**
 * 利用可能なロケール一覧
 */
export const AVAILABLE_LOCALES: Locale[] = ["ja", "en"];

/**
 * デフォルトのロケール
 */
export const DEFAULT_LOCALE: Locale = "ja";

/**
 * 翻訳リソースの型定義
 */
export type Translation = typeof ja;

/**
 * 翻訳リソースのマップ
 */
export const translations: Record<Locale, Translation> = {
  ja,
  en,
};

/**
 * ブラウザのシステムロケールを検出してサポートされている言語を返す
 * サポートされていない言語の場合はデフォルトロケールを返す
 */
export const getSystemLocale = (): Locale => {
  // ブラウザの言語設定を取得
  const browserLang = navigator.language.split("-")[0];

  // サポートされている言語かチェック
  if (AVAILABLE_LOCALES.includes(browserLang as Locale)) {
    return browserLang as Locale;
  }

  // サポートされていない場合はデフォルトを返す
  return DEFAULT_LOCALE;
};

/**
 * localStorageからロケールを読み込む
 */
export const loadLocaleFromStorage = (): Locale | null => {
  try {
    const stored = localStorage.getItem("vdi-locale");
    if (stored && AVAILABLE_LOCALES.includes(stored as Locale)) {
      return stored as Locale;
    }
  } catch (error) {
    console.warn("[i18n] Failed to load locale from localStorage:", error);
  }
  return null;
};

/**
 * localStorageにロケールを保存する
 */
export const saveLocaleToStorage = (locale: Locale): void => {
  try {
    localStorage.setItem("vdi-locale", locale);
  } catch (error) {
    console.warn("[i18n] Failed to save locale to localStorage:", error);
  }
};

/**
 * 初期ロケールを決定する
 * 優先順位: localStorage > システムロケール > デフォルト
 */
export const getInitialLocale = (): Locale => {
  // localStorageから読み込む
  const stored = loadLocaleFromStorage();
  if (stored) {
    return stored;
  }

  // システムロケールを使用
  return getSystemLocale();
};

/**
 * 言語名を取得する
 */
export const getLanguageName = (locale: Locale): string => {
  const names: Record<Locale, string> = {
    ja: "日本語",
    en: "English",
  };
  return names[locale];
};

/**
 * 翻訳キーのパスを辿って値を取得するヘルパー関数
 * 例: getValue(ja, "titlebar.gallery") => "ギャラリー表示"
 */
export const getValue = (obj: any, path: string, fallback?: string): string => {
  const keys = path.split(".");
  let current = obj;

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = current[key];
    } else {
      return fallback || path;
    }
  }

  return typeof current === "string" ? current : fallback || path;
};

/**
 * テンプレート変数を置換する
 * 例: interpolate("Hello {{name}}", { name: "World" }) => "Hello World"
 */
export const interpolate = (
  template: string,
  vars?: Record<string, string | number>,
): string => {
  if (!vars) {
    return template;
  }

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return vars[key] !== undefined ? String(vars[key]) : match;
  });
};
