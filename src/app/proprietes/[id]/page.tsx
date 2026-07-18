import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Bed,
  Bath,
  Square,
  MapPin,
  Calendar,
  Hash,
  Check,
  Heart,
  Scale,
} from "lucide-react";

import {
  getPropertyById,
  getSimilarProperties,
  properties,
} from "@/lib/mock-data";

import { PropertyGallery } from "@/components/properties/PropertyGallery";
import { ContactAgentCard } from "@/components/properties/ContactAgentCard";
import { PropertyCard } from "@/components/home/PropertyCard";
import { formatMAD } from "@/lib/utils";

export function generateStaticParams() {
  return properties.map((p) => ({
    id: p.id,
  }));
}

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;

  const property = getPropertyById(id);

  if (!property) {
    return {};
  }

  return {
    title: `${property.title} — ${property.city} | Domify`,
    description: property.description.slice(0, 155),
  };
}

export default async function PropertyDetailPage({
  params,
}: PageProps) {
  const { id } = await params;

  const property = getPropertyById(id);

  if (!property) {
    notFound();
  }

  const similar = getSimilarProperties(property);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-domify-dark/50">
        <Link href="/" className="hover:text-domify-primary">
          Accueil
        </Link>
        /
        <Link
          href="/proprietes"
          className="hover:text-domify-primary"
        >
          Propriétés
        </Link>
        /
        <span className="text-domify-dark/80">
          {property.title}
        </span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <PropertyGallery
            images={property.gallery}
            title={property.title}
          />

          <div className="mt-8 flex flex-col justify-between gap-4 border-b border-black/5 pb-8 sm:flex-row sm:items-start">
            <div>
              {property.badge && (
                <span className="mb-2 inline-block rounded-full bg-domify-gold/10 px-3 py-1 text-xs font-semibold text-domify-gold">
                  {property.badge}
                </span>
              )}

              <h1 className="font-display text-3xl font-bold text-domify-dark">
                {property.title}
              </h1>

              <p className="mt-2 flex items-center gap-1.5 text-sm text-domify-dark/60">
                <MapPin size={15} />
                {property.neighborhood}, {property.city}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-domify-dark/70 transition-luxury hover:border-domify-gold hover:text-domify-gold"
                aria-label="Ajouter aux favoris"
              >
                <Heart size={17} />
              </button>

              <button
                className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-domify-dark/70 transition-luxury hover:border-domify-primary hover:text-domify-primary"
                aria-label="Comparer"
              >
                <Scale size={17} />
              </button>

              <p className="whitespace-nowrap text-2xl font-bold text-domify-gold">
                {formatMAD(property.price)}

                {property.type === "location" && (
                  <span className="text-sm font-normal text-domify-dark/50">
                    {" "}
                    /mois
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Fact
              icon={Bed}
              label="Chambres"
              value={property.bedrooms}
            />
            <Fact
              icon={Bath}
              label="Salles de bain"
              value={property.bathrooms}
            />
            <Fact
              icon={Square}
              label="Surface"
              value={`${property.area} m²`}
            />
            <Fact
              icon={Calendar}
              label="Année"
              value={property.yearBuilt}
            />
          </div>

          <div className="mt-10">
            <h2 className="font-display text-xl font-semibold text-domify-dark">
              Description
            </h2>

            <p className="mt-3 leading-relaxed text-domify-dark/70">
              {property.description}
            </p>

            <p className="mt-3 flex items-center gap-1.5 text-xs text-domify-dark/40">
              <Hash size={12} />
              Référence {property.reference}
            </p>
          </div>

          <div className="mt-10">
            <h2 className="font-display text-xl font-semibold text-domify-dark">
              Équipements
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {property.amenities.map((a) => (
                <span
                  key={a}
                  className="flex items-center gap-2 rounded-lg bg-domify-warm-white px-3 py-2.5 text-sm text-domify-dark/80"
                >
                  <Check
                    size={14}
                    className="text-domify-gold"
                  />
                  {a}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <h2 className="font-display text-xl font-semibold text-domify-dark">
              Localisation
            </h2>

            <div className="mt-4 flex h-64 items-center justify-center rounded-2xl bg-domify-warm-white text-sm text-domify-dark/50">
              Carte interactive (Leaflet) — {property.neighborhood},{" "}
              {property.city}
            </div>
          </div>
        </div>

        <div>
          <ContactAgentCard property={property} />
        </div>
      </div>

      {similar.length > 0 && (
        <div className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-bold text-domify-dark">
            Biens similaires
          </h2>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Bed;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-domify-warm-white p-4 text-center">
      <Icon
        className="mx-auto text-domify-gold"
        size={20}
      />
      <p className="mt-2 font-display text-lg font-semibold text-domify-dark">
        {value}
      </p>
      <p className="text-xs text-domify-dark/50">
        {label}
      </p>
    </div>
  );
}