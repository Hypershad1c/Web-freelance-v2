import { cookies } from "next/headers";
import { LOCALES, DEFAULT_LOCALE, type Locale } from "./locales";

const COOKIE_NAME = "NEXT_LOCALE";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  return (LOCALES as readonly string[]).includes(value ?? "") ? (value as Locale) : DEFAULT_LOCALE;
}

export { COOKIE_NAME as LOCALE_COOKIE_NAME };
