"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LOCALES, type Locale } from "@/i18n/locales";
import { LOCALE_COOKIE_NAME } from "@/i18n/get-locale";

export async function setLocale(locale: string) {
  if (!(LOCALES as readonly string[]).includes(locale)) return;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, locale as Locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
}
