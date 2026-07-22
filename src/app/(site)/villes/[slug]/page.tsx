import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCityBySlug } from "@/lib/data/network";
import { getProperties } from "@/lib/data/properties";
import { PropertyCard } from "@/components/home/PropertyCard";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const city = await getCityBySlug(slug);
  if (!city) return {};
  return {
    title: `Immobilier à ${city.name} | Domify`,
    description: city.description || `Découvrez nos biens à vendre et à louer à ${city.name}.`,
  };
}

export default async function CityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = await getCityBySlug(slug);
  if (!city) notFound();

  const properties = await getProperties({ city: slug });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-domify-dark">Immobilier à {city.name}</h1>
      {city.description && <p className="mt-2 max-w-2xl text-domify-dark/60">{city.description}</p>}
      <p className="mt-1 text-sm text-domify-dark/50">{properties.length} bien(s) disponible(s)</p>

      {properties.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-domify-warm-white p-10 text-center text-domify-dark/60">
          Aucun bien publié à {city.name} pour le moment.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
}
