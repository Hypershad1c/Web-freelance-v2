"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Heart, Bed, Bath, Square, Phone, Scale, Eye } from "lucide-react";
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
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={reduceMotion ? undefined : { y: -6 }}
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
      className="h-full"
    >
      <Link
        href={`/proprietes/${property.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-domify-dark/8 bg-white shadow-[0_18px_38px_-28px_rgba(16,47,66,0.45)] transition-luxury hover:border-domify-gold/35 hover:shadow-[0_28px_48px_-28px_rgba(16,47,66,0.45)] focus-visible:ring-2 focus-visible:ring-domify-gold"
      >
        <div className="relative h-60 w-full overflow-hidden bg-domify-primary-dark">
          <Image
            src={image}
            alt={property.title}
            fill
            className="object-cover transition-transform duration-700 [transition-timing-function:var(--ease-snappy)] group-hover:scale-[1.045]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-domify-primary-dark/45 via-transparent to-transparent opacity-85" />
          <div className="absolute left-4 top-4 flex flex-col items-start gap-2">
            <span className="rounded-full bg-domify-gold px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.09em] text-white shadow-sm">
              {property.listingType === "LOCATION" ? "À louer" : property.propertyType.name}
            </span>
            {property.featured && (
              <span className="rounded-full border border-white/25 bg-domify-primary-dark/80 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-domify-soft-gold shadow-sm backdrop-blur-sm">
                Sélection Domify
              </span>
            )}
          </div>
          <div className="absolute right-4 top-4 flex gap-2">
            <button
              aria-label={comparing ? "Retirer de la comparaison" : "Ajouter à la comparaison"}
              title={!comparing && maxReached ? "Maximum 4 biens à comparer" : undefined}
              disabled={!comparing && maxReached}
              onClick={(event) => {
                event.preventDefault();
                toggleCompare(property.id);
              }}
              className={cn(
                "pressable flex h-9 w-9 items-center justify-center rounded-full border border-white/30 backdrop-blur-sm disabled:opacity-40",
                comparing ? "border-domify-primary bg-domify-primary text-white" : "bg-white/90 text-domify-dark hover:-translate-y-0.5 hover:bg-domify-primary hover:text-white"
              )}
            >
              <Scale size={14} />
            </button>
            <button
              aria-label="Ajouter aux favoris"
              onClick={(event) => {
                event.preventDefault();
                toggleFavorite(property.id);
              }}
              className={cn(
                "pressable flex h-9 w-9 items-center justify-center rounded-full border border-white/30 backdrop-blur-sm",
                favorited ? "border-domify-gold bg-domify-gold text-white" : "bg-white/90 text-domify-dark hover:-translate-y-0.5 hover:bg-domify-gold hover:text-white"
              )}
            >
              <Heart size={15} fill={favorited ? "currentColor" : "none"} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <p className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-domify-primary/70">{property.city.name}</p>
          <h3 className="mt-2 line-clamp-2 font-display text-xl font-semibold leading-6 text-domify-dark transition-colors duration-300 group-hover:text-domify-primary">{property.title}</h3>
          <div className="mt-4 flex items-end justify-between gap-3">
            <p className="font-display text-[1.35rem] font-bold leading-none text-domify-gold">
              {formatMAD(property.price)}
              {property.listingType === "LOCATION" && <span className="ml-1 font-sans text-xs font-medium text-domify-dark/45">/mois</span>}
            </p>
            <span className="flex items-center gap-1 text-xs text-domify-dark/42">
              <Eye size={13} /> {property.viewsCount}
            </span>
          </div>
          <div className="mt-5 flex items-center gap-3 border-t border-domify-dark/8 pt-4 text-sm text-domify-dark/62">
            <span className="flex items-center gap-1.5"><Bed size={15} className="text-domify-primary/72" /> {property.bedrooms}</span>
            <span className="flex items-center gap-1.5"><Bath size={15} className="text-domify-primary/72" /> {property.bathrooms}</span>
            <span className="flex items-center gap-1.5"><Square size={15} className="text-domify-primary/72" /> {property.surfaceArea} m²</span>
          </div>

          {contactPhone && (
            <div className="mt-5 flex gap-2 border-t border-domify-dark/8 pt-4">
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  window.open(
                    whatsappLink(contactPhone, `Bonjour, je suis intéressé(e) par « ${property.title} » (${property.reference}) sur Domify.`),
                    "_blank"
                  );
                }}
                className="pressable flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#25D366]/10 py-2.5 text-xs font-semibold text-[#128C4A] hover:bg-[#25D366] hover:text-white"
              >
                <WhatsAppIcon size={14} /> WhatsApp
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  window.location.href = telLink(contactPhone);
                }}
                className="pressable flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-domify-primary/9 py-2.5 text-xs font-semibold text-domify-primary hover:bg-domify-primary hover:text-white"
              >
                <Phone size={13} /> Appeler
              </button>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
