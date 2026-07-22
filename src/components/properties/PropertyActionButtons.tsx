"use client";

import { Heart, Scale } from "lucide-react";
import { useFavorites } from "@/lib/favorites-context";
import { useCompare } from "@/lib/compare-context";
import { cn } from "@/lib/utils";

export function PropertyActionButtons({ propertyId }: { propertyId: string }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isComparing, toggleCompare, maxReached } = useCompare();
  const favorited = isFavorite(propertyId);
  const comparing = isComparing(propertyId);

  return (
    <>
      <button
        onClick={() => toggleFavorite(propertyId)}
        aria-label={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full border transition-luxury",
          favorited
            ? "border-domify-gold bg-domify-gold text-white"
            : "border-black/10 text-domify-dark/70 hover:border-domify-gold hover:text-domify-gold"
        )}
      >
        <Heart size={17} fill={favorited ? "currentColor" : "none"} />
      </button>
      <button
        onClick={() => toggleCompare(propertyId)}
        disabled={!comparing && maxReached}
        title={!comparing && maxReached ? "Maximum 4 biens à comparer" : undefined}
        aria-label={comparing ? "Retirer de la comparaison" : "Ajouter à la comparaison"}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full border transition-luxury disabled:opacity-40",
          comparing
            ? "border-domify-primary bg-domify-primary text-white"
            : "border-black/10 text-domify-dark/70 hover:border-domify-primary hover:text-domify-primary"
        )}
      >
        <Scale size={17} />
      </button>
    </>
  );
}
