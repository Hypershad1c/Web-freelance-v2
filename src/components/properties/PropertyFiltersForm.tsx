import Link from "next/link";
import { SlidersHorizontal, Sparkles } from "lucide-react";

type CityOption = { slug: string; name: string; _count: { properties: number } };
type TypeOption = { slug: string; name: string };
type NeighborhoodOption = { slug: string; name: string; city: { name: string } };
type AmenityOption = { slug: string; name: string };

type CurrentFilters = {
  city?: string;
  neighborhood?: string;
  listingType?: string;
  propertyType?: string;
  priceMin?: string;
  priceMax?: string;
  bedrooms?: string;
  surfaceMin?: string;
  amenity?: string;
  reference?: string;
  sort?: string;
};

export function PropertyFiltersForm({
  cities,
  propertyTypes,
  neighborhoods,
  amenities,
  current,
}: {
  cities: CityOption[];
  propertyTypes: TypeOption[];
  neighborhoods: NeighborhoodOption[];
  amenities: AmenityOption[];
  current: CurrentFilters;
}) {
  return (
    <form method="get" className="sticky top-24 space-y-5 rounded-[1.35rem] border border-domify-dark/8 bg-[#fcfbf8] p-5 shadow-[0_18px_38px_-30px_rgba(16,47,66,0.35)] sm:p-6">
      <div className="flex items-center justify-between border-b border-domify-dark/8 pb-4">
        <p className="flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-domify-primary"><SlidersHorizontal size={15} /> Filtres avancés</p>
        <Sparkles size={15} className="text-domify-gold" />
      </div>

      <div>
        <p className="mb-3 text-[0.66rem] font-bold uppercase tracking-[0.13em] text-domify-dark/48">Transaction</p>
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-domify-dark/8 bg-white p-1">
          {[{ value: "", label: "Tous" }, { value: "VENTE", label: "Acheter" }, { value: "LOCATION", label: "Louer" }].map((option) => {
            const selected = (current.listingType ?? "") === option.value;
            return <label key={option.value} className={`cursor-pointer rounded-lg px-2 py-2 text-center text-xs font-semibold transition-luxury ${selected ? "bg-domify-primary text-white shadow-sm" : "text-domify-dark/62 hover:bg-domify-warm-white"}`}>
              <input type="radio" name="listingType" value={option.value} defaultChecked={selected} className="sr-only" />{option.label}
            </label>;
          })}
        </div>
      </div>

      <FilterField label="Ville"><select name="city" defaultValue={current.city ?? ""} className="domify-select"><option value="">Toutes les villes</option>{cities.map((city) => <option key={city.slug} value={city.slug}>{city.name} ({city._count.properties})</option>)}</select></FilterField>
      <FilterField label="Quartier"><select name="neighborhood" defaultValue={current.neighborhood ?? ""} className="domify-select"><option value="">Tous les quartiers</option>{neighborhoods.map((neighborhood) => <option key={neighborhood.slug} value={neighborhood.slug}>{neighborhood.name} · {neighborhood.city.name}</option>)}</select></FilterField>
      <FilterField label="Type de bien"><select name="propertyType" defaultValue={current.propertyType ?? ""} className="domify-select"><option value="">Tous les types</option>{propertyTypes.map((propertyType) => <option key={propertyType.slug} value={propertyType.slug}>{propertyType.name}</option>)}</select></FilterField>

      <div className="grid grid-cols-2 gap-3">
        <FilterField label="Prix min. (MAD)"><input name="priceMin" type="number" min="0" inputMode="numeric" defaultValue={current.priceMin ?? ""} className="domify-select" placeholder="0" /></FilterField>
        <FilterField label="Prix max. (MAD)"><input name="priceMax" type="number" min="0" inputMode="numeric" defaultValue={current.priceMax ?? ""} className="domify-select" placeholder="Sans limite" /></FilterField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FilterField label="Chambres min."><select name="bedrooms" defaultValue={current.bedrooms ?? ""} className="domify-select"><option value="">Indifférent</option>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}{value === 5 ? "+" : ""}</option>)}</select></FilterField>
        <FilterField label="Surface min. (m²)"><input name="surfaceMin" type="number" min="0" inputMode="numeric" defaultValue={current.surfaceMin ?? ""} className="domify-select" placeholder="Ex. 120" /></FilterField>
      </div>
      <FilterField label="Équipement"><select name="amenity" defaultValue={current.amenity ?? ""} className="domify-select"><option value="">Tous les équipements</option>{amenities.map((amenity) => <option key={amenity.slug} value={amenity.slug}>{amenity.name}</option>)}</select></FilterField>
      <FilterField label="Référence"><input name="reference" defaultValue={current.reference ?? ""} className="domify-select" placeholder="Ex. DOM-101" /></FilterField>
      <FilterField label="Trier par"><select name="sort" defaultValue={current.sort ?? "recent"} className="domify-select"><option value="recent">Plus récents</option><option value="price-asc">Prix croissant</option><option value="price-desc">Prix décroissant</option></select></FilterField>

      <button type="submit" className="w-full rounded-xl bg-domify-primary py-3 text-sm font-semibold text-white shadow-[0_14px_22px_-16px_rgba(16,47,66,0.9)] transition-luxury hover:-translate-y-0.5 hover:bg-domify-primary-dark">Voir les résultats</button>
      <Link href="/proprietes" className="block text-center text-xs font-semibold text-domify-dark/50 transition-colors hover:text-domify-primary">Réinitialiser les critères</Link>
    </form>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-2 block text-[0.62rem] font-bold uppercase tracking-[0.13em] text-domify-dark/48">{label}</label>{children}</div>;
}
