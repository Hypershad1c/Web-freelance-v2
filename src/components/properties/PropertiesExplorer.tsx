"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { PropertyCard } from "@/components/home/PropertyCard";
import type { PropertyWithRelations } from "@/lib/data/properties";

type CityOption = { id: string; name: string; slug: string };
type PropertyTypeOption = { id: string; name: string; slug: string };

export function PropertiesExplorer({
  initialProperties,
  cities,
  propertyTypes,
}: {
  initialProperties: PropertyWithRelations[];
  cities: CityOption[];
  propertyTypes: PropertyTypeOption[];
}) {
  const [city, setCity] = useState("Toutes les villes");
  const [type, setType] = useState<"tous" | "VENTE" | "LOCATION">("tous");
  const [propertyType, setPropertyType] = useState("Tous les types");
  const [sort, setSort] = useState<"recent" | "price-asc" | "price-desc">("recent");
  const [showFilters, setShowFilters] = useState(false);

  const results = useMemo(() => {
    let list = initialProperties;
    if (city !== "Toutes les villes") list = list.filter((p) => p.city.name === city);
    if (type !== "tous") list = list.filter((p) => p.listingType === type);
    if (propertyType !== "Tous les types") list = list.filter((p) => p.propertyType.name === propertyType);

    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);

    return list;
  }, [initialProperties, city, type, propertyType, sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-domify-dark">Nos propriétés</h1>
          <p className="mt-1 text-sm text-domify-dark/60">{results.length} biens correspondent à votre recherche</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 self-start rounded-full border border-domify-primary/30 px-4 py-2 text-sm font-medium text-domify-primary lg:hidden"
        >
          <SlidersHorizontal size={15} /> Filtres
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <aside className={`${showFilters ? "block" : "hidden"} lg:block`}>
          <div className="sticky top-24 space-y-6 rounded-2xl bg-domify-warm-white p-6">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-domify-dark/50">Transaction</p>
              <div className="flex flex-col gap-2">
                {(["tous", "VENTE", "LOCATION"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition-luxury ${
                      type === t ? "bg-domify-primary text-white" : "bg-white text-domify-dark/70 hover:bg-white/70"
                    }`}
                  >
                    {t === "tous" ? "Tous" : t === "VENTE" ? "Acheter" : "Louer"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-domify-dark/50">Ville</p>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
              >
                <option>Toutes les villes</option>
                {cities.map((c) => (
                  <option key={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-domify-dark/50">Type de bien</p>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
              >
                <option>Tous les types</option>
                {propertyTypes.map((t) => (
                  <option key={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-domify-dark/50">Trier par</p>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
              >
                <option value="recent">Plus récents</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
              </select>
            </div>
          </div>
        </aside>

        <div>
          {results.length === 0 ? (
            <p className="rounded-2xl bg-domify-warm-white p-10 text-center text-domify-dark/60">
              Aucun bien ne correspond à vos critères. Essayez d&apos;élargir votre recherche.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}