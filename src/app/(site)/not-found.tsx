import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { isRtl } from "@/i18n/locales";
import { NotFoundContent } from "@/components/errors/NotFoundContent";

export default async function NotFound() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return <NotFoundContent copy={dict.notFound} mapLabel={dict.nav.map} rtl={isRtl(locale)} />;
}
