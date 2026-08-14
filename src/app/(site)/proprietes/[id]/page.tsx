import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Bed, Bath, Square, MapPin, Calendar, Hash, Check, Eye } from "lucide-react";
import { getPropertyById, getSimilarProperties, incrementPropertyViews } from "@/lib/data/properties";
import { PropertyGallery } from "@/components/properties/PropertyGallery";
import { ContactAgentCard } from "@/components/properties/ContactAgentCard";
import { WhatsAppConciergeButton } from "@/components/properties/WhatsAppConciergeButton";
import { PropertyActionButtons } from "@/components/properties/PropertyActionButtons";
import { PropertyCard } from "@/components/home/PropertyCard";
import { PropertyMapClient } from "@/components/map/PropertyMapClient";
import { JsonLd } from "@/components/JsonLd";
import { FadeIn, StaggerReveal, staggerItem } from "@/components/motion/FadeIn";
import { MotionDiv } from "@/components/motion/MotionPrimitives";
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

  incrementPropertyViews(id).catch(() => {});

  const similar = await getSimilarProperties(property);
  const images = property.media.length > 0 ? property.media.map((m) => m.url) : [FALLBACK_IMAGE];

  const baseUrl = process.env.NEXTAUTH_URL || "https://domify.ma";
  const propertyUrl = `${baseUrl}/proprietes/${property.id}`;

  const listingJsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    url: propertyUrl,
    name: property.title,
    description: property.description,
    image: images,
    datePosted: property.createdAt,
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address || undefined,
      addressLocality: property.city.name,
      addressCountry: "MA",
    },
    ...(property.latitude && property.longitude
      ? { geo: { "@type": "GeoCoordinates", latitude: property.latitude, longitude: property.longitude } }
      : {}),
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: "MAD",
      availability: "https://schema.org/InStock",
      businessFunction: property.listingType === "LOCATION" ? "https://schema.org/LeaseOut" : "https://schema.org/Sell",
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Propriétés", item: `${baseUrl}/proprietes` },
      { "@type": "ListItem", position: 3, name: property.title, item: propertyUrl },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <JsonLd data={listingJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-domify-dark/50">
        <Link href="/" className="hover:text-domify-primary">Accueil</Link> /
        <Link href="/proprietes" className="hover:text-domify-primary">Propriétés</Link> /
        <span className="text-domify-dark/80">{property.title}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div>
          <FadeIn><PropertyGallery images={images} title={property.title} /></FadeIn>

          {/* Header */}
          <div className="mt-8 flex flex-col justify-between gap-5 border-b border-black/5 pb-8 sm:flex-row sm:items-start">
            <div>
              <span className="mb-2 inline-block rounded-full bg-domify-gold/10 px-3 py-1 text-xs font-semibold text-domify-gold">
                {property.propertyType.name}
              </span>
              <h1 className="max-w-2xl font-display text-3xl font-bold leading-tight text-domify-dark sm:text-4xl">{property.title}</h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-domify-dark/60">
                <MapPin size={15} /> {property.neighborhood ? `${property.neighborhood.name}, ` : ""}{property.city.name}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-3">
                <PropertyActionButtons propertyId={property.id} />
                <p className="text-2xl font-bold text-domify-gold whitespace-nowrap">
                  {formatMAD(property.price)}
                  {property.listingType === "LOCATION" && <span className="text-sm font-normal text-domify-dark/50"> /mois</span>}
                </p>
              </div>
              <span className="flex items-center gap-1 text-xs text-domify-dark/40">
                <Eye size={13} /> {property.viewsCount} vue{property.viewsCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>
          <div className="mt-5 lg:hidden">
            <WhatsAppConciergeButton propertyId={property.id} placement="detail" variant="prominent" className="w-full" />
          </div>

          {/* Key facts */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
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
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-4 hidden rounded-2xl border border-domify-gold/15 bg-domify-warm-white/70 p-4 lg:block">
            <p className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-domify-gold">L&apos;accompagnement Domify</p>
            <p className="mt-2 font-display text-lg font-semibold leading-6 text-domify-dark">Un conseiller dédié pour vous guider à chaque étape.</p>
            <p className="mt-2 text-xs leading-5 text-domify-dark/56">Réponse rapide, visite privée et suivi personnalisé.</p>
          </div>
          <ContactAgentCard property={property} />
        </div>
      </div>

      {/* Similar properties */}
      {similar.length > 0 && (
        <FadeIn className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-bold text-domify-dark">Biens similaires</h2>
          <StaggerReveal className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
            {similar.map((p) => (
              <MotionDiv key={p.id} variants={staggerItem}>
                <PropertyCard property={p} />
              </MotionDiv>
            ))}
          </StaggerReveal>
        </FadeIn>
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
