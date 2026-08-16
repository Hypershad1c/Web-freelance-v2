import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Home, Map, SlidersHorizontal } from "lucide-react";
import { getProperties, getCitiesWithCounts, getPropertyTypes, getNeighborhoods, getAmenities, type PropertyFilters } from "@/lib/data/properties";
import { getSeoOverride } from "@/lib/data/seo";
import { PropertyFiltersForm } from "@/components/properties/PropertyFiltersForm";
import { PropertyCard } from "@/components/home/PropertyCard";
import { StaggerReveal, staggerItem } from "@/components/motion/FadeIn";
import { MotionDiv } from "@/components/motion/MotionPrimitives";
import { getLocale } from "@/i18n/get-locale";

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

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const locale = await getLocale();
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

  const [properties, cities, propertyTypes, neighborhoods, amenities] = await Promise.all([
    readWithRetry(() => getProperties(filters), []),
    readWithRetry(() => getCitiesWithCounts(), []),
    readWithRetry(() => getPropertyTypes(), []),
    readWithRetry(() => getNeighborhoods(), []),
    readWithRetry(() => getAmenities(), []),
  ]);

  const hasFilters = Object.values(params).some(Boolean);
  const intentLabel = params.listingType === "LOCATION" ? "Locations sélectionnées" : params.listingType === "VENTE" ? "Acquisitions sélectionnées" : "La collection Domify";

  return (
    <>
      <section className="relative overflow-hidden bg-domify-primary-dark text-white">
        <div className="pointer-events-none absolute -right-28 -top-24 h-80 w-80 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute bottom-[-10rem] left-[18%] h-80 w-80 rounded-full bg-domify-primary/45 blur-3xl" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:flex-row lg:items-end lg:justify-between lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="luxury-eyebrow flex items-center gap-3 text-domify-soft-gold"><span className="h-px w-9 bg-domify-soft-gold" /> Collection Domify</p>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.02] text-white sm:text-6xl">Des lieux qui méritent votre attention.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">Découvrez des adresses sélectionnées pour leur qualité, leur emplacement et leur potentiel.</p>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.08] p-4 backdrop-blur-md"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-domify-gold text-white"><Home size={19} /></div><div><p className="text-2xl font-semibold text-white">{properties.length}</p><p className="text-xs uppercase tracking-[0.12em] text-white/52">résultats</p></div></div>
        </div>
      </section>

      <main id="top" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8 flex flex-col gap-5 border-b border-domify-dark/8 pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="luxury-eyebrow text-domify-gold">Recherche immobilière</p><h2 className="mt-2 font-display text-3xl font-semibold text-domify-dark">{intentLabel}</h2><p className="mt-2 text-sm text-domify-dark/58"><span className="font-semibold text-domify-dark">{properties.length}</span> bien(s) correspondent à votre recherche{hasFilters ? "." : " dans notre sélection actuelle."}</p></div>
          <a href="/carte" className="inline-flex w-fit items-center gap-2 rounded-full border border-domify-primary/15 bg-white px-4 py-2.5 text-sm font-semibold text-domify-primary shadow-[0_16px_30px_-25px_rgba(16,47,66,0.75)] transition-luxury hover:-translate-y-0.5 hover:border-domify-gold/50 hover:text-domify-gold"><Map size={15} /> Explorer sur la carte</a>
        </div>

        <div className="grid grid-cols-1 gap-9 lg:grid-cols-[292px_1fr]">
          <aside className="lg:sticky lg:top-28 lg:self-start"><div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-domify-primary/70 lg:hidden"><SlidersHorizontal size={14} /> Affiner la recherche</div><div className="rounded-[1.4rem] border border-domify-dark/8 bg-white p-4 shadow-luxury sm:p-5"><PropertyFiltersForm cities={cities} propertyTypes={propertyTypes} neighborhoods={neighborhoods} amenities={amenities} current={params} locale={locale} /></div></aside>

          <div>
            {properties.length === 0 ? <div className="relative overflow-hidden rounded-[1.5rem] border border-domify-dark/8 bg-domify-warm-white p-10 text-center sm:p-14"><div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full border border-domify-gold/25" /><p className="relative font-display text-2xl font-semibold text-domify-dark">Aucun bien ne correspond à vos critères.</p><p className="relative mx-auto mt-3 max-w-md text-sm leading-6 text-domify-dark/60">Essayez d&apos;élargir votre recherche ou de modifier vos filtres pour découvrir d&apos;autres opportunités.</p><Link href="/proprietes" className="relative mt-6 inline-flex rounded-full bg-domify-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-domify-gold">Réinitialiser la recherche</Link></div> : <StaggerReveal className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3" stagger={0.06}>{properties.map((property) => <MotionDiv key={property.id} variants={staggerItem}><PropertyCard property={property} locale={locale} /></MotionDiv>)}</StaggerReveal>}
          </div>
        </div>

        <div className="mt-12 flex justify-end"><a href="#top" className="group inline-flex items-center gap-2 text-sm font-semibold text-domify-primary transition-luxury hover:text-domify-gold">Retour en haut <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></a></div>
      </main>
    </>
  );
}

async function readWithRetry<T>(read: () => Promise<T>, fallback: T): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await read();
    } catch {
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  return fallback;
}
