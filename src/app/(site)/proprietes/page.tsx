import type { Metadata } from "next";
import { ArrowUpRight, Home } from "lucide-react";
import { getProperties, getCitiesWithCounts, getPropertyTypes, type PropertyFilters } from "@/lib/data/properties";
import { getSeoOverride } from "@/lib/data/seo";
import { PropertyFiltersForm } from "@/components/properties/PropertyFiltersForm";
import { PropertyCard } from "@/components/home/PropertyCard";
import { StaggerReveal, staggerItem } from "@/components/motion/FadeIn";
import { MotionDiv } from "@/components/motion/MotionPrimitives";

const DEFAULT_METADATA: Metadata = {
  title: "Propriétés à vendre et à louer | Domify",
  description: "Parcourez notre sélection de villas, appartements, duplex et riads d'exception partout au Maroc.",
};

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoOverride("/proprietes");
  if (!seo) return DEFAULT_METADATA;
  return {
    title: seo.title,
    description: seo.description,
    openGraph: seo.ogImage ? { images: [seo.ogImage] } : undefined,
  };
}

type SearchParams = { city?: string; listingType?: string; propertyType?: string; sort?: string };

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;

  const filters: PropertyFilters = {
    city: params.city || undefined,
    listingType: params.listingType === "VENTE" || params.listingType === "LOCATION" ? params.listingType : undefined,
    propertyType: params.propertyType || undefined,
    sort: params.sort === "price-asc" || params.sort === "price-desc" ? params.sort : "recent",
  };

  const [properties, cities, propertyTypes] = await Promise.all([
    getProperties(filters),
    getCitiesWithCounts(),
    getPropertyTypes(),
  ]);

  return (
    <>
      <section className="relative overflow-hidden border-b border-domify-dark/8 bg-domify-warm-white/80">
        <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full border border-domify-gold/25" />
        <div className="pointer-events-none absolute right-[13%] top-12 h-36 w-36 rounded-full border border-domify-primary/10" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <p className="luxury-eyebrow flex items-center gap-3 text-domify-gold"><span className="h-px w-8 bg-domify-gold" /> Collection Domify</p>
            <h1 className="mt-4 font-display text-5xl font-semibold text-domify-dark sm:text-6xl">Nos propriétés</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-domify-dark/62 sm:text-lg">Découvrez des adresses sélectionnées pour leur qualité, leur emplacement et leur potentiel.</p>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8 flex flex-col gap-4 border-b border-domify-dark/8 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-domify-dark/60"><span className="font-semibold text-domify-dark">{properties.length}</span> bien(s) correspondent à votre recherche</p>
          <span className="inline-flex w-fit items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-domify-primary/75"><Home size={14} /> Maroc</span>
        </div>

        <div className="grid grid-cols-1 gap-9 lg:grid-cols-[292px_1fr]">
          <aside>
            <PropertyFiltersForm cities={cities} propertyTypes={propertyTypes} current={params} />
          </aside>

          <div>
            {properties.length === 0 ? (
              <div className="relative overflow-hidden rounded-[1.5rem] border border-domify-dark/8 bg-domify-warm-white p-10 text-center sm:p-14">
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full border border-domify-gold/25" />
                <p className="relative font-display text-2xl font-semibold text-domify-dark">Aucun bien ne correspond à vos critères.</p>
                <p className="relative mx-auto mt-3 max-w-md text-sm leading-6 text-domify-dark/60">Essayez d&apos;élargir votre recherche ou de modifier vos filtres pour découvrir d&apos;autres opportunités.</p>
              </div>
            ) : (
              <StaggerReveal className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3" stagger={0.06}>
                {properties.map((property) => (
                  <MotionDiv key={property.id} variants={staggerItem}>
                    <PropertyCard property={property} />
                  </MotionDiv>
                ))}
              </StaggerReveal>
            )}
          </div>
        </div>

        <div className="mt-12 flex justify-end">
          <a href="#top" className="group inline-flex items-center gap-2 text-sm font-semibold text-domify-primary transition-luxury hover:text-domify-gold">
            Retour en haut <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </div>
      </main>
    </>
  );
}
