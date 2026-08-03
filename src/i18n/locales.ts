export const LOCALES = ["fr", "ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";

export const RTL_LOCALES: Locale[] = ["ar"];

export const LOCALE_LABELS: Record<Locale, string> = {
  fr: "Français",
  ar: "العربية",
  en: "English",
};

export function isRtl(locale: Locale) {
  return RTL_LOCALES.includes(locale);
}
