"use client";

import Link from "next/link";
import { HeartOff } from "lucide-react";
import { useFavorites } from "@/lib/favorites-context";
import { properties } from "@/lib/mock-data";
import { PropertyCard } from "@/components/home/PropertyCard";

export default function FavoritesPage() {
  const { favoriteIds } = useFavorites();
  const favoriteProperties = properties.filter((p) => favoriteIds.includes(p.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-domify-dark">Mes favoris</h1>
      <p className="mt-1 text-sm text-domify-dark/60">{favoriteProperties.length} bien(s) enregistré(s)</p>

      {favoriteProperties.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl bg-domify-warm-white p-16 text-center">
          <HeartOff className="text-domify-dark/30" size={40} />
          <p className="mt-4 text-domify-dark/60">Vous n&apos;avez pas encore de favoris.</p>
          <Link
            href="/proprietes"
            className="mt-5 rounded-full bg-domify-primary px-6 py-2.5 text-sm font-semibold text-white transition-luxury hover:bg-domify-primary-dark"
          >
            Parcourir les biens
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favoriteProperties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
}
