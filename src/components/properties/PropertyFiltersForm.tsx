import { SlidersHorizontal } from "lucide-react";

type CityOption = { slug: string; name: string; _count: { properties: number } };
type TypeOption = { slug: string; name: string };

export function PropertyFiltersForm({
  cities,
  propertyTypes,
  current,
}: {
  cities: CityOption[];
  propertyTypes: TypeOption[];
  current: { city?: string; listingType?: string; propertyType?: string; sort?: string };
}) {
  return (
    <form method="get" className="sticky top-24 space-y-6 rounded-2xl bg-domify-warm-white p-6">
      <div>
        <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-domify-dark/50">
          <SlidersHorizontal size={13} /> Filtres
        </p>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-domify-dark/50">Transaction</p>
        <div className="flex flex-col gap-2">
          {[
            { value: "", label: "Tous" },
            { value: "VENTE", label: "Acheter" },
            { value: "LOCATION", label: "Louer" },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="listingType"
                value={opt.value}
                defaultChecked={(current.listingType ?? "") === opt.value}
                className="h-4 w-4"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-domify-dark/50">Ville</label>
        <select name="city" defaultValue={current.city ?? ""} className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm">
          <option value="">Toutes les villes</option>
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name} ({c._count.properties})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-domify-dark/50">Type de bien</label>
        <select name="propertyType" defaultValue={current.propertyType ?? ""} className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm">
          <option value="">Tous les types</option>
          {propertyTypes.map((t) => (
            <option key={t.slug} value={t.slug}>{t.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-domify-dark/50">Trier par</label>
        <select name="sort" defaultValue={current.sort ?? "recent"} className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm">
          <option value="recent">Plus récents</option>
          <option value="price-asc">Prix croissant</option>
          <option value="price-desc">Prix décroissant</option>
        </select>
      </div>

      <button type="submit" className="w-full rounded-xl bg-domify-primary py-2.5 text-sm font-semibold text-white transition-luxury hover:bg-domify-primary-dark">
        Appliquer
      </button>
    </form>
  );
}
