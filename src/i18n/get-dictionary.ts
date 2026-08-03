import type { Locale } from "./locales";

import fr from "./dictionaries/fr.json";
import ar from "./dictionaries/ar.json";
import en from "./dictionaries/en.json";

const dictionaries = { fr, ar, en } satisfies Record<Locale, typeof fr>;

export type Dictionary = typeof fr;

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
