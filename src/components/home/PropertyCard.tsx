"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Bed, Bath, Square } from "lucide-react";
import { formatMAD, cn } from "@/lib/utils";
import { useFavorites } from "@/lib/favorites-context";
import type { Property } from "@/lib/mock-data";

export function PropertyCard({ property }: { property: Property }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(property.id);

  return (
    <Link
      href={`/proprietes/${property.id}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-luxury transition-luxury shadow-luxury-hover"
    >
      <div className="relative h-56 w-full overflow-hidden">
        <Image
          src={property.image}
          alt={property.title}
          fill
          className="object-cover transition-luxury group-hover:scale-105"
        />
        {property.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-domify-gold px-3 py-1 text-xs font-semibold text-white shadow">
            {property.badge}
          </span>
        )}
        <button
          aria-label="Ajouter aux favoris"
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite(property.id);
          }}
          className={cn(
            "absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full transition-luxury",
            favorited ? "bg-domify-gold text-white" : "bg-white/90 text-domify-dark hover:bg-domify-gold hover:text-white"
          )}
        >
          <Heart size={15} fill={favorited ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-domify-primary/70">{property.city}</p>
        <h3 className="mt-1 font-display text-lg font-semibold text-domify-dark">{property.title}</h3>
        <p className="mt-1 text-lg font-bold text-domify-gold">{formatMAD(property.price)}</p>
        <div className="mt-4 flex items-center gap-4 border-t border-black/5 pt-4 text-sm text-domify-dark/60">
          <span className="flex items-center gap-1.5"><Bed size={15} /> {property.bedrooms}</span>
          <span className="flex items-center gap-1.5"><Bath size={15} /> {property.bathrooms}</span>
          <span className="flex items-center gap-1.5"><Square size={15} /> {property.area} m²</span>
        </div>
      </div>
    </Link>
  );
}
