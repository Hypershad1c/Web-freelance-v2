import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Bed, Bath, Square, MapPin, Calendar, Hash, Check } from "lucide-react";
import { getPropertyById, getSimilarProperties, incrementPropertyViews } from "@/lib/data/properties";
import { PropertyGallery } from "@/components/properties/PropertyGallery";
import { ContactAgentCard } from "@/components/properties/ContactAgentCard";
import { PropertyActionButtons } from "@/components/properties/PropertyActionButtons";
import { PropertyCard } from "@/components/home/PropertyCard";
import { PropertyMapClient } from "@/components/map/PropertyMapClient";
import { formatMAD } from "@/lib/utils";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const property = await getPropertyById(id);
  if (!property) return {};
  return {
    title: property.seoTitle || `${property.title} — ${property.city.name} | Domify`,
    description: property.seoDescription || property.description.slice(0, 155),
  };
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getPropertyById(id);
  if (!property) notFound();

  // Fire-and-forget — never await this, a slow view-count write should never
  // hold up the page. generateMetadata() above deliberately does NOT call
  // this, since crawlers/social previews would otherwise inflate the count.
  incrementPropertyViews(property.id).catch((e) => console.error("[property view] increment failed:", e));

  const similar = await getSimilarProperties(property);
  const images = property.media.length > 0 ? property.media.map((m) => m.url) : [FALLBACK_IMAGE];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-domify-dark/50">
        <Link href="/" className="hover:text-domify-primary">Accueil</Link> /
        <Link href="/proprietes" className="hover:text-domify-primary">Propriétés</Link> /
        <span className="text-domify-dark/80">{property.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <PropertyGallery images={images} title={property.title} />

          {/* Header */}
          <div className="mt-8 flex flex-col justify-between gap-4 border-b border-black/5 pb-8 sm:flex-row sm:items-start">
            <div>
              <span className="mb-2 inline-block rounded-full bg-domify-gold/10 px-3 py-1 text-xs font-semibold text-domify-gold">
                {property.propertyType.name}
              </span>
              <h1 className="font-display text-3xl font-bold text-domify-dark">{property.title}</h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-domify-dark/60">
                <MapPin size={15} /> {property.neighborhood ? `${property.neighborhood.name}, ` : ""}{property.city.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <PropertyActionButtons propertyId={property.id} />
              <p className="text-2xl font-bold text-domify-gold whitespace-nowrap">
                {formatMAD(property.price)}
                {property.listingType === "LOCATION" && <span className="text-sm font-normal text-domify-dark/50"> /mois</span>}
              </p>
            </div>
          </div>

          {/* Key facts */}
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Fact icon={Bed} label="Chambres" value={property.bedrooms} />
            <Fact icon={Bath} label="Salles de bain" value={property.bathrooms} />
            <Fact icon={Square} label="Surface" value={`${property.surfaceArea} m²`} />
            <Fact icon={Calendar} label="Année" value={property.yearBuilt ?? "—"} />
          </div>

          {/* Description */}
          <div className="mt-10">
            <h2 className="font-display text-xl font-semibold text-domify-dark">Description</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-domify-dark/70">{property.description}</p>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-domify-dark/40">
              <Hash size={12} /> Référence {property.reference}
            </p>
          </div>

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <div className="mt-10">
              <h2 className="font-display text-xl font-semibold text-domify-dark">Équipements</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {property.amenities.map((a) => (
                  <span key={a.id} className="flex items-center gap-2 rounded-lg bg-domify-warm-white px-3 py-2.5 text-sm text-domify-dark/80">
                    <Check size={14} className="text-domify-gold" /> {a.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Map */}
          <div className="mt-10">
            <h2 className="font-display text-xl font-semibold text-domify-dark">Localisation</h2>
            {property.latitude && property.longitude ? (
              <div className="mt-4">
                <PropertyMapClient
                  properties={[
                    {
                      id: property.id,
                      title: property.title,
                      price: property.price,
                      listingType: property.listingType,
                      latitude: property.latitude,
                      longitude: property.longitude,
                    },
                  ]}
                  center={[property.latitude, property.longitude]}
                  zoom={14}
                  height={360}
                />
              </div>
            ) : (
              <div className="mt-4 flex h-64 items-center justify-center rounded-2xl bg-domify-warm-white text-sm text-domify-dark/50">
                Localisation approximative — {property.address || `${property.neighborhood?.name ?? ""} ${property.city.name}`}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <ContactAgentCard property={property} />
        </div>
      </div>

      {/* Similar properties */}
      {similar.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-bold text-domify-dark">Biens similaires</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof Bed; label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-domify-warm-white p-4 text-center">
      <Icon className="mx-auto text-domify-gold" size={20} />
      <p className="mt-2 font-display text-lg font-semibold text-domify-dark">{value}</p>
      <p className="text-xs text-domify-dark/50">{label}</p>
    </div>
  );
}
