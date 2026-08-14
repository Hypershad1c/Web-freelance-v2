import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { MapDiscoveryView, type DiscoveryProperty } from "@/components/map/MapDiscoveryView";

export const metadata: Metadata = {
  title: "Recherche sur la carte | Domify",
  description: "Explorez les biens disponibles directement sur la carte, partout au Maroc.",
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop";

export default async function MapSearchPage() {
  const properties = await prisma.property.findMany({
    where: { status: "PUBLISHED", latitude: { not: null }, longitude: { not: null } },
    include: { city: true, media: { orderBy: { order: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  const discoveryProperties: DiscoveryProperty[] = properties
    .filter((property) => property.latitude !== null && property.longitude !== null)
    .map((property) => ({
      id: property.id,
      title: property.title,
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
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="luxury-eyebrow flex items-center gap-3 text-domify-gold"><span className="h-px w-8 bg-domify-gold" /> Explorer le Maroc</p><h1 className="mt-3 font-display text-4xl font-semibold text-domify-dark sm:text-5xl">Trouvez votre adresse sur la carte</h1><p className="mt-3 max-w-2xl text-base leading-7 text-domify-dark/60">Comparez les opportunités par quartier et laissez la carte vous guider vers les lieux qui correspondent à votre projet.</p></div>
        <div className="flex items-center gap-2 text-sm text-domify-dark/55"><MapPin size={17} className="text-domify-gold" /> {discoveryProperties.length} bien(s) géolocalisé(s)</div>
      </header>

      {discoveryProperties.length === 0 ? <p className="rounded-[1.5rem] bg-domify-warm-white p-10 text-center text-domify-dark/60">Aucun bien géolocalisé pour le moment. Les biens publiés apparaîtront ici dès qu&apos;une localisation leur sera assignée depuis l&apos;admin.</p> : <MapDiscoveryView properties={discoveryProperties} />}
    </main>
  );
}
