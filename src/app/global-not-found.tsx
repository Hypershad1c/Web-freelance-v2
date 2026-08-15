import "./globals.css";
import { NotFoundContent } from "@/components/errors/NotFoundContent";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { isRtl } from "@/i18n/locales";

export default async function GlobalNotFound() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const copy = dict.notFound;

  return (
    <html lang={locale} dir={isRtl(locale) ? "rtl" : "ltr"}>
      <head>
        <title>{copy.eyebrow} | Domify</title>
        <meta name="robots" content="noindex" />
      </head>
      <body className="antialiased">
        <NotFoundContent copy={dict.notFound} mapLabel={dict.nav.map} rtl={isRtl(locale)} />
      </body>
    </html>
  );
}
