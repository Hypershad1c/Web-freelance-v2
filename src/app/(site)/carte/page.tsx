import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MapDiscoveryView, type DiscoveryProperty } from "@/components/map/MapDiscoveryView";
import { getLocale } from "@/i18n/get-locale";
import { getLocalizedPropertyContent } from "@/lib/data/property-localization";

export const metadata: Metadata = {
  title: "Recherche sur la carte | Domify",
  description: "Explorez les biens disponibles directement sur la carte, partout au Maroc.",
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop";

const MAP_COPY = {
  fr: { eyebrow: "Explorer le Maroc", title: "Trouvez votre adresse sur la carte", body: "Comparez les opportunités par quartier et laissez la carte vous guider vers les lieux qui correspondent à votre projet.", located: "bien(s) géolocalisé(s)", empty: "Aucun bien géolocalisé pour le moment. Les biens publiés apparaîtront ici dès qu’une localisation leur sera assignée depuis l’admin." },
  en: { eyebrow: "Explore Morocco", title: "Find your address on the map", body: "Compare opportunities by neighbourhood and let the map guide you to places that match your project.", located: "mapped property(ies)", empty: "No mapped properties yet. Published listings will appear here once a location is assigned in the admin area." },
  ar: { eyebrow: "استكشف المغرب", title: "اعثر على عنوانك على الخريطة", body: "قارن الفرص حسب الحي ودع الخريطة ترشدك إلى الأماكن التي تناسب مشروعك.", located: "عقارات محددة الموقع", empty: "لا توجد عقارات محددة الموقع حالياً. ستظهر العقارات المنشورة هنا عند إضافة موقعها من لوحة الإدارة." },
} as const;

export default async function MapSearchPage() {
  const locale = await getLocale();
  const copy = MAP_COPY[locale];
  const isRtl = locale === "ar";
  const properties = await prisma.property.findMany({
    where: { status: "PUBLISHED", latitude: { not: null }, longitude: { not: null } },
    include: { city: true, media: { orderBy: { order: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  const discoveryProperties: DiscoveryProperty[] = properties
    .filter((property) => property.latitude !== null && property.longitude !== null)
    .map((property) => ({
      id: property.id,
      title: getLocalizedPropertyContent(property, locale).title,
      price: property.price,
      listingType: property.listingType,
      latitude: property.latitude as number,
      longitude: property.longitude as number,
      cityName: property.city.name,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      surfaceArea: property.surfaceArea,
      image: property.media[0]?.url ?? FALLBACK_IMAGE,
    }));

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className={`mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14 ${isRtl ? "text-right" : ""}`}>
      <header className={`mb-7 flex flex-col gap-4 sm:items-end sm:justify-between ${isRtl ? "sm:flex-row-reverse" : "sm:flex-row"}`}>
        <div><p className="luxury-eyebrow flex items-center gap-3 text-domify-gold"><span className="h-px w-8 bg-domify-gold" /> {copy.eyebrow}</p><h1 className="mt-3 font-display text-4xl font-semibold text-domify-dark sm:text-5xl">{copy.title}</h1><p className="mt-3 max-w-2xl text-base leading-7 text-domify-dark/60">{copy.body}</p></div>
        <div className="flex items-center gap-2 text-sm text-domify-dark/55"><MapPin size={17} className="text-domify-gold" /> <bdi>{discoveryProperties.length}</bdi> {copy.located}</div>
      </header>

      {discoveryProperties.length === 0 ? <p className="rounded-[1.5rem] bg-domify-warm-white p-10 text-center text-domify-dark/60">{copy.empty}</p> : <MapDiscoveryView properties={discoveryProperties} locale={locale} />}
    </main>
  );
}
