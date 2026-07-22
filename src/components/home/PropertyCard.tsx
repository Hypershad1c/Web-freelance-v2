"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Bed, Bath, Square, Phone, Scale } from "lucide-react";
import { formatMAD, cn, whatsappLink, telLink } from "@/lib/utils";
import { useFavorites } from "@/lib/favorites-context";
import { useCompare } from "@/lib/compare-context";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import type { PropertyWithRelations } from "@/lib/data/properties";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop";

export function PropertyCard({ property }: { property: PropertyWithRelations }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isComparing, toggleCompare, maxReached } = useCompare();
  const favorited = isFavorite(property.id);
  const comparing = isComparing(property.id);
  const image = property.media[0]?.url ?? FALLBACK_IMAGE;
  const contactPhone = property.agent?.phone ?? property.agency?.phone;

  return (
    <Link
      href={`/proprietes/${property.id}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-luxury transition-luxury shadow-luxury-hover"
    >
      <div className="relative h-56 w-full overflow-hidden">
        <Image
          src={image}
          alt={property.title}
          fill
          className="object-cover transition-luxury group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-domify-gold px-3 py-1 text-xs font-semibold text-white shadow">
          {property.listingType === "LOCATION" ? "À louer" : property.propertyType.name}
        </span>
        <div className="absolute right-3 top-3 flex gap-2">
          <button
            aria-label={comparing ? "Retirer de la comparaison" : "Ajouter à la comparaison"}
            title={!comparing && maxReached ? "Maximum 4 biens à comparer" : undefined}
            disabled={!comparing && maxReached}
            onClick={(e) => {
              e.preventDefault();
              toggleCompare(property.id);
            }}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-luxury disabled:opacity-40",
              comparing ? "bg-domify-primary text-white" : "bg-white/90 text-domify-dark hover:bg-domify-primary hover:text-white"
            )}
          >
            <Scale size={14} />
          </button>
          <button
            aria-label="Ajouter aux favoris"
            onClick={(e) => {
              e.preventDefault();
              toggleFavorite(property.id);
            }}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-luxury",
              favorited ? "bg-domify-gold text-white" : "bg-white/90 text-domify-dark hover:bg-domify-gold hover:text-white"
            )}
          >
            <Heart size={15} fill={favorited ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
      <div className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-domify-primary/70">{property.city.name}</p>
        <h3 className="mt-1 font-display text-lg font-semibold text-domify-dark">{property.title}</h3>
        <p className="mt-1 text-lg font-bold text-domify-gold">
          {formatMAD(property.price)}
          {property.listingType === "LOCATION" && <span className="text-sm font-normal text-domify-dark/50"> /mois</span>}
        </p>
        <div className="mt-4 flex items-center gap-4 border-t border-black/5 pt-4 text-sm text-domify-dark/60">
          <span className="flex items-center gap-1.5"><Bed size={15} /> {property.bedrooms}</span>
          <span className="flex items-center gap-1.5"><Bath size={15} /> {property.bathrooms}</span>
          <span className="flex items-center gap-1.5"><Square size={15} /> {property.surfaceArea} m²</span>
        </div>

        {contactPhone && (
          <div className="mt-4 flex gap-2 border-t border-black/5 pt-4">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(
                  whatsappLink(contactPhone, `Bonjour, je suis intéressé(e) par « ${property.title} » (${property.reference}) sur Domify.`),
                  "_blank"
                );
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#25D366]/10 py-2 text-xs font-semibold text-[#128C4A] transition-luxury hover:bg-[#25D366] hover:text-white"
            >
              <WhatsAppIcon size={14} /> WhatsApp
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = telLink(contactPhone);
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-domify-primary/10 py-2 text-xs font-semibold text-domify-primary transition-luxury hover:bg-domify-primary hover:text-white"
            >
              <Phone size={13} /> Appeler
            </button>
          </div>
        )}
      </div>
    </Link>
  );
}
