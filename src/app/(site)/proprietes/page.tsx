import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CircleAlert, Compass, Home, Map, SearchX, SlidersHorizontal } from "lucide-react";
import { getProperties, getCitiesWithCounts, getPropertyTypes, getNeighborhoods, getAmenities, type PropertyFilters } from "@/lib/data/properties";
import { getSeoOverride } from "@/lib/data/seo";
import { PropertyFiltersForm } from "@/components/properties/PropertyFiltersForm";
import { PropertyCard } from "@/components/home/PropertyCard";
import { StaggerReveal, staggerItem } from "@/components/motion/FadeIn";
import { MotionDiv } from "@/components/motion/MotionPrimitives";
import { getLocale } from "@/i18n/get-locale";
import { isPrismaReady } from "@/lib/prisma";

export const revalidate = 300;

const DEFAULT_METADATA: Metadata = {
  title: "Propriétés à vendre et à louer | Domify",
  description: "Parcourez notre sélection de villas, appartements, duplex et riads d'exception partout au Maroc.",
};

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoOverride("/proprietes");
  if (!seo) return DEFAULT_METADATA;
  return { title: seo.title, description: seo.description, openGraph: seo.ogImage ? { images: [seo.ogImage] } : undefined };
}

type SearchParams = { city?: string; neighborhood?: string; listingType?: string; propertyType?: string; priceMin?: string; priceMax?: string; bedrooms?: string; surfaceMin?: string; amenity?: string; reference?: string; sort?: string };

const CATALOGUE_COPY = {
  fr: { collection: "Collection Domify", hero: "Des lieux qui méritent votre attention.", heroBody: "Découvrez des adresses sélectionnées pour leur qualité, leur emplacement et leur potentiel.", results: "résultats", search: "Recherche immobilière", all: "La collection Domify", rent: "Locations sélectionnées", buy: "Acquisitions sélectionnées", matches: "bien(s) correspondent à votre recherche", selection: "dans notre sélection actuelle.", map: "Explorer sur la carte", refine: "Affiner la recherche", reconnect: "Le catalogue se reconnecte.", unavailable: "Notre inventaire est momentanément indisponible. Réessayez dans quelques instants : vos critères seront conservés.", retry: "Réessayer", empty: "Aucune adresse ne correspond encore à cette recherche.", emptyBody: "Modifiez un filtre ou revenez à la collection complète pour découvrir d’autres opportunités vérifiées.", resetSearch: "Réinitialiser la recherche", backTop: "Retour en haut" },
  en: { collection: "Domify collection", hero: "Places worth your attention.", heroBody: "Discover addresses selected for their quality, location, and potential.", results: "results", search: "Property search", all: "The Domify collection", rent: "Selected rentals", buy: "Selected purchases", matches: "property(ies) match your search", selection: "in our current selection.", map: "Explore on the map", refine: "Refine your search", reconnect: "The catalogue is reconnecting.", unavailable: "Our inventory is temporarily unavailable. Please try again shortly; your criteria will be kept.", retry: "Try again", empty: "No addresses match this search yet.", emptyBody: "Adjust a filter or return to the full collection to discover other verified opportunities.", resetSearch: "Reset search", backTop: "Back to top" },
  ar: { collection: "مجموعة دوميفاي", hero: "أماكن تستحق اهتمامك.", heroBody: "اكتشف عناوين مختارة لجودتها وموقعها وإمكاناتها.", results: "نتيجة", search: "البحث عن عقار", all: "مجموعة دوميفاي", rent: "عقارات مختارة للإيجار", buy: "عقارات مختارة للشراء", matches: "عقاراً يطابق بحثك", selection: "ضمن مجموعتنا الحالية.", map: "استكشف على الخريطة", refine: "حسّن بحثك", reconnect: "جارٍ إعادة الاتصال بالكتالوج.", unavailable: "المخزون غير متاح مؤقتاً. أعد المحاولة بعد لحظات؛ سيتم الاحتفاظ بمعاييرك.", retry: "أعد المحاولة", empty: "لا توجد عقارات تطابق هذا البحث حالياً.", emptyBody: "عدّل أحد الفلاتر أو عُد إلى المجموعة الكاملة لاكتشاف فرص موثقة أخرى.", resetSearch: "إعادة ضبط البحث", backTop: "العودة إلى الأعلى" },
} as const;

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const locale = await getLocale();
  const copy = CATALOGUE_COPY[locale];
  const isRtl = locale === "ar";
  const filters: PropertyFilters = {
    city: params.city || undefined,
    listingType: params.listingType === "VENTE" || params.listingType === "LOCATION" ? params.listingType : undefined,
    propertyType: params.propertyType || undefined,
    neighborhood: params.neighborhood || undefined,
    priceMin: Number(params.priceMin) > 0 ? Number(params.priceMin) : undefined,
    priceMax: Number(params.priceMax) > 0 ? Number(params.priceMax) : undefined,
    bedrooms: Number(params.bedrooms) > 0 ? Number(params.bedrooms) : undefined,
    surfaceMin: Number(params.surfaceMin) > 0 ? Number(params.surfaceMin) : undefined,
    amenity: params.amenity || undefined,
    reference: params.reference?.trim() || undefined,
    sort: params.sort === "price-asc" || params.sort === "price-desc" ? params.sort : "recent",
  };

  const databaseReady = await waitForDatabase();
  const propertiesResult = databaseReady ? await readWithRetry(() => getProperties(filters), []) : { data: [], failed: true };
  const citiesResult = databaseReady ? await readWithRetry(() => getCitiesWithCounts(), []) : { data: [], failed: true };
  const propertyTypesResult = databaseReady ? await readWithRetry(() => getPropertyTypes(), []) : { data: [], failed: true };
  const neighborhoodsResult = databaseReady ? await readWithRetry(() => getNeighborhoods(), []) : { data: [], failed: true };
  const amenitiesResult = databaseReady ? await readWithRetry(() => getAmenities(), []) : { data: [], failed: true };

  const { data: properties } = propertiesResult;
  const { data: cities } = citiesResult;
  const { data: propertyTypes } = propertyTypesResult;
  const { data: neighborhoods } = neighborhoodsResult;
  const { data: amenities } = amenitiesResult;
  const catalogueUnavailable = propertiesResult.failed;

  const hasFilters = Object.values(params).some(Boolean);
  const intentLabel = params.listingType === "LOCATION" ? copy.rent : params.listingType === "VENTE" ? copy.buy : copy.all;

  return (
    <>
      <section dir={isRtl ? "rtl" : "ltr"} className={`relative overflow-hidden bg-domify-primary-dark text-white ${isRtl ? "text-right" : ""}`}>
        <div className="pointer-events-none absolute -right-28 -top-24 h-80 w-80 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute bottom-[-10rem] left-[18%] h-80 w-80 rounded-full bg-domify-primary/45 blur-3xl" />
        <div className={`relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:items-end lg:justify-between lg:px-8 lg:py-24 ${isRtl ? "lg:flex-row-reverse" : "lg:flex-row"}`}>
          <div className="max-w-3xl">
            <p className="luxury-eyebrow flex items-center gap-3 text-domify-soft-gold"><span className="h-px w-9 bg-domify-soft-gold" /> {copy.collection}</p>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.02] text-white sm:text-6xl">{copy.hero}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">{copy.heroBody}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.08] p-4 backdrop-blur-md"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-domify-gold text-white"><Home size={19} /></div><div><p className="text-2xl font-semibold text-white"><bdi>{properties.length}</bdi></p><p className="text-xs uppercase tracking-[0.12em] text-white/52">{copy.results}</p></div></div>
        </div>
      </section>

      <main id="top" dir={isRtl ? "rtl" : "ltr"} className={`mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14 ${isRtl ? "text-right" : ""}`}>
        <div className={`mb-8 flex flex-col gap-5 border-b border-domify-dark/8 pb-7 lg:items-end lg:justify-between ${isRtl ? "lg:flex-row-reverse" : "lg:flex-row"}`}>
          <div><p className="luxury-eyebrow text-domify-gold">{copy.search}</p><h2 className="mt-2 font-display text-3xl font-semibold text-domify-dark">{intentLabel}</h2><p className="mt-2 text-sm text-domify-dark/58"><span className="font-semibold text-domify-dark"><bdi>{properties.length}</bdi></span> {copy.matches}{hasFilters ? "." : ` ${copy.selection}`}</p></div>
          <a href="/carte" className="inline-flex w-fit items-center gap-2 rounded-full border border-domify-primary/15 bg-white px-4 py-2.5 text-sm font-semibold text-domify-primary shadow-[0_16px_30px_-25px_rgba(16,47,66,0.75)] transition-luxury hover:-translate-y-0.5 hover:border-domify-gold/50 hover:text-domify-gold"><Map size={15} /> {copy.map}</a>
        </div>

        <div className={`grid grid-cols-1 gap-9 ${isRtl ? "lg:grid-cols-[1fr_292px]" : "lg:grid-cols-[292px_1fr]"}`}>
          <aside className="lg:sticky lg:top-28 lg:self-start"><div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-domify-primary/70 lg:hidden"><SlidersHorizontal size={14} /> {copy.refine}</div><div className="rounded-[1.4rem] border border-domify-dark/8 bg-white p-4 shadow-luxury sm:p-5"><PropertyFiltersForm cities={cities} propertyTypes={propertyTypes} neighborhoods={neighborhoods} amenities={amenities} current={params} locale={locale} /></div></aside>

          <div>
            {catalogueUnavailable ? <div className="relative overflow-hidden rounded-[1.5rem] border border-domify-gold/25 bg-domify-warm-white p-8 text-center sm:p-14"><div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full border border-domify-gold/25" /><div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-domify-gold shadow-[0_18px_32px_-24px_rgba(16,47,66,0.55)]"><CircleAlert size={24} strokeWidth={1.6} /></div><p className="relative mt-6 font-display text-2xl font-semibold text-domify-dark">{copy.reconnect}</p><p className="relative mx-auto mt-3 max-w-md text-sm leading-6 text-domify-dark/60">{copy.unavailable}</p><Link href={`/proprietes${hasFilters ? `?${new URLSearchParams(Object.entries(params).filter(([, value]) => Boolean(value)) as Array<[string, string]>).toString()}` : ""}`} className="relative mt-7 inline-flex items-center gap-2 rounded-full bg-domify-primary px-4 py-2.5 text-sm font-semibold text-white transition-luxury hover:-translate-y-0.5 hover:bg-domify-gold">{copy.retry} <ArrowUpRight size={15} className={isRtl ? "-scale-x-100" : undefined} /></Link></div> : properties.length === 0 ? <div className="relative overflow-hidden rounded-[1.5rem] border border-domify-dark/8 bg-domify-warm-white p-8 text-center sm:p-14"><div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full border border-domify-gold/25" /><div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-domify-gold shadow-[0_18px_32px_-24px_rgba(16,47,66,0.55)]"><SearchX size={24} strokeWidth={1.6} /></div><p className="relative mt-6 font-display text-2xl font-semibold text-domify-dark">{copy.empty}</p><p className="relative mx-auto mt-3 max-w-md text-sm leading-6 text-domify-dark/60">{copy.emptyBody}</p><div className="relative mt-7 flex flex-wrap justify-center gap-3"><Link href="/proprietes" className="inline-flex items-center gap-2 rounded-full bg-domify-primary px-4 py-2.5 text-sm font-semibold text-white transition-luxury hover:-translate-y-0.5 hover:bg-domify-gold">{copy.resetSearch} <ArrowUpRight size={15} className={isRtl ? "-scale-x-100" : undefined} /></Link><Link href="/carte" className="inline-flex items-center gap-2 rounded-full border border-domify-primary/15 bg-white px-4 py-2.5 text-sm font-semibold text-domify-primary transition-luxury hover:-translate-y-0.5 hover:border-domify-gold hover:text-domify-gold"><Compass size={15} /> {copy.map}</Link></div></div> : <StaggerReveal className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3" stagger={0.06}>{properties.map((property) => <MotionDiv key={property.id} variants={staggerItem}><PropertyCard property={property} locale={locale} /></MotionDiv>)}</StaggerReveal>}
          </div>
        </div>

        <div className={`mt-12 flex ${isRtl ? "justify-start" : "justify-end"}`}><a href="#top" className="group inline-flex items-center gap-2 text-sm font-semibold text-domify-primary transition-luxury hover:text-domify-gold">{copy.backTop} <ArrowUpRight size={16} className={`transition-transform duration-300 group-hover:-translate-y-0.5 ${isRtl ? "-scale-x-100 group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5"}`} /></a></div>
      </main>
    </>
  );
}

async function waitForDatabase() {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (await isPrismaReady()) return true;
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 200 * 2 ** attempt));
  }
  return false;
}

async function readWithRetry<T>(read: () => Promise<T>, fallback: T): Promise<{ data: T; failed: boolean }> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return { data: await read(), failed: false };
    } catch {
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 200 * 2 ** attempt));
    }
  }
  return { data: fallback, failed: true };
}
