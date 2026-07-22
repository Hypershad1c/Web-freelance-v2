import type { Metadata } from "next";
import { getProperties, getCitiesWithCounts, getPropertyTypes, type PropertyFilters } from "@/lib/data/properties";
import { getSeoOverride } from "@/lib/data/seo";
import { PropertyFiltersForm } from "@/components/properties/PropertyFiltersForm";
import { PropertyCard } from "@/components/home/PropertyCard";

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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-domify-dark">Nos propriétés</h1>
        <p className="mt-1 text-sm text-domify-dark/60">{properties.length} bien(s) correspondent à votre recherche</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <aside>
          <PropertyFiltersForm cities={cities} propertyTypes={propertyTypes} current={params} />
        </aside>

        <div>
          {properties.length === 0 ? (
            <p className="rounded-2xl bg-domify-warm-white p-10 text-center text-domify-dark/60">
              Aucun bien ne correspond à vos critères. Essayez d&apos;élargir votre recherche.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {properties.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
