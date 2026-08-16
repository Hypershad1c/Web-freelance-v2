import type { Locale } from "@/i18n/locales";

export type LocalizedPropertyContent = {
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
};

type PropertyContentFields = {
  title: string;
  titleEn?: string | null;
  titleAr?: string | null;
  description: string;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  seoTitle?: string | null;
  seoTitleEn?: string | null;
  seoTitleAr?: string | null;
  seoDescription?: string | null;
  seoDescriptionEn?: string | null;
  seoDescriptionAr?: string | null;
};

export function getLocalizedPropertyContent(property: PropertyContentFields, locale: Locale): LocalizedPropertyContent {
  const localizedTitle = locale === "ar" ? property.titleAr : locale === "en" ? property.titleEn : undefined;
  const localizedDescription = locale === "ar" ? property.descriptionAr : locale === "en" ? property.descriptionEn : undefined;
  const localizedSeoTitle = locale === "ar" ? property.seoTitleAr : locale === "en" ? property.seoTitleEn : undefined;
  const localizedSeoDescription = locale === "ar" ? property.seoDescriptionAr : locale === "en" ? property.seoDescriptionEn : undefined;

  return {
    title: localizedTitle?.trim() || property.title,
    description: localizedDescription?.trim() || property.description,
    seoTitle: localizedSeoTitle?.trim() || property.seoTitle?.trim() || localizedTitle?.trim() || property.title,
    seoDescription: localizedSeoDescription?.trim() || property.seoDescription?.trim() || localizedDescription?.trim() || property.description,
  };
}
