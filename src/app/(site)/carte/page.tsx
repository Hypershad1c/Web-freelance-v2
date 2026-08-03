import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Bed, Bath, Square } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PropertyMapClient } from "@/components/map/PropertyMapClient";
import { formatMAD } from "@/lib/utils";

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

  const mapProperties = properties
    .filter((p) => p.latitude !== null && p.longitude !== null)
    .map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      listingType: p.listingType,
      latitude: p.latitude as number,
      longitude: p.longitude as number,
    }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-2">
        <MapPin className="text-domify-gold" size={22} />
        <div>
          <h1 className="font-display text-2xl font-bold text-domify-dark">Recherche sur la carte</h1>
          <p className="text-sm text-domify-dark/60">{mapProperties.length} bien(s) géolocalisé(s)</p>
        </div>
      </div>

      {mapProperties.length === 0 ? (
        <p className="rounded-2xl bg-domify-warm-white p-10 text-center text-domify-dark/60">
          Aucun bien géolocalisé pour le moment. Les biens publiés apparaîtront ici dès qu&apos;une localisation leur
          sera assignée depuis l&apos;admin.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
          <PropertyMapClient properties={mapProperties} zoom={6} height={640} />

          <div className="max-h-[640px] space-y-3 overflow-y-auto pr-1">
            {properties
              .filter((p) => p.latitude !== null && p.longitude !== null)
              .map((p) => (
                <Link
                  key={p.id}
                  href={`/proprietes/${p.id}`}
                  className="flex gap-3 rounded-xl bg-white p-3 shadow-luxury transition-luxury hover:shadow-luxury-hover"
                >
                  <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg">
                    <Image src={p.media[0]?.url ?? FALLBACK_IMAGE} alt={p.title} fill className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-domify-dark">{p.title}</p>
                    <p className="text-xs text-domify-dark/50">{p.city.name}</p>
                    <p className="mt-1 text-sm font-bold text-domify-gold">{formatMAD(p.price)}</p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-domify-dark/50">
                      <span className="flex items-center gap-1"><Bed size={11} /> {p.bedrooms}</span>
                      <span className="flex items-center gap-1"><Bath size={11} /> {p.bathrooms}</span>
                      <span className="flex items-center gap-1"><Square size={11} /> {p.surfaceArea}m²</span>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
