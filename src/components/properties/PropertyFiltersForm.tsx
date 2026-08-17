import Link from "next/link";
import { SlidersHorizontal, Sparkles } from "lucide-react";
import type { Locale } from "@/i18n/locales";
import { recordClientAnalyticsEvent } from "@/lib/client-analytics";

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
  locale = "fr",
}: {
  cities: CityOption[];
  propertyTypes: TypeOption[];
  neighborhoods: NeighborhoodOption[];
  amenities: AmenityOption[];
  current: CurrentFilters;
  locale?: Locale;
}) {
  const labels = locale === "ar" ? {
    advanced: "فلاتر متقدمة", transaction: "المعاملة", all: "الكل", buy: "شراء", rent: "إيجار", city: "المدينة", allCities: "جميع المدن", neighborhood: "الحي", allNeighborhoods: "جميع الأحياء", type: "نوع العقار", allTypes: "جميع الأنواع", minPrice: "الحد الأدنى للسعر", maxPrice: "الحد الأقصى للسعر", noLimit: "بدون حد", bedrooms: "الحد الأدنى للغرف", indifferent: "لا يهم", surface: "الحد الأدنى للمساحة", amenity: "التجهيزات", allAmenities: "جميع التجهيزات", reference: "المرجع", sort: "ترتيب حسب", recent: "الأحدث", priceAsc: "السعر تصاعدياً", priceDesc: "السعر تنازلياً", results: "عرض النتائج", reset: "إعادة ضبط المعايير"
  } : locale === "en" ? {
    advanced: "Advanced filters", transaction: "Transaction", all: "All", buy: "Buy", rent: "Rent", city: "City", allCities: "All cities", neighborhood: "Neighborhood", allNeighborhoods: "All neighborhoods", type: "Property type", allTypes: "All types", minPrice: "Min. price", maxPrice: "Max. price", noLimit: "No limit", bedrooms: "Min. bedrooms", indifferent: "Any", surface: "Min. surface", amenity: "Amenity", allAmenities: "All amenities", reference: "Reference", sort: "Sort by", recent: "Most recent", priceAsc: "Price ascending", priceDesc: "Price descending", results: "View results", reset: "Reset criteria"
  } : {
    advanced: "Filtres avancés", transaction: "Transaction", all: "Tous", buy: "Acheter", rent: "Louer", city: "Ville", allCities: "Toutes les villes", neighborhood: "Quartier", allNeighborhoods: "Tous les quartiers", type: "Type de bien", allTypes: "Tous les types", minPrice: "Prix min. (MAD)", maxPrice: "Prix max. (MAD)", noLimit: "Sans limite", bedrooms: "Chambres min.", indifferent: "Indifférent", surface: "Surface min. (m²)", amenity: "Équipement", allAmenities: "Tous les équipements", reference: "Référence", sort: "Trier par", recent: "Plus récents", priceAsc: "Prix croissant", priceDesc: "Prix décroissant", results: "Voir les résultats", reset: "Réinitialiser les critères"
  };
  return (
    <form method="get" onSubmit={(event) => { const formData = new FormData(event.currentTarget); const filters = Object.fromEntries(Array.from(formData.entries()).filter(([, value]) => String(value).length > 0)); recordClientAnalyticsEvent("search", { path: "/proprietes", meta: { filters } }); }} dir={locale === "ar" ? "rtl" : "ltr"} className="sticky top-24 space-y-5 rounded-[1.35rem] border border-domify-dark/8 bg-[#fcfbf8] p-5 text-start shadow-[0_18px_38px_-30px_rgba(16,47,66,0.35)] sm:p-6">
      <div className="flex items-center justify-between border-b border-domify-dark/8 pb-4">
        <p className="flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-domify-primary"><SlidersHorizontal size={15} /> {labels.advanced}</p>
        <Sparkles size={15} className="text-domify-gold" />
      </div>

      <div>
        <p className="mb-3 text-[0.66rem] font-bold uppercase tracking-[0.13em] text-domify-dark/48">{labels.transaction}</p>
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-domify-dark/8 bg-white p-1">
          {[{ value: "", label: labels.all }, { value: "VENTE", label: labels.buy }, { value: "LOCATION", label: labels.rent }].map((option) => {
            const selected = (current.listingType ?? "") === option.value;
            return <label key={option.value} className={`cursor-pointer rounded-lg px-2 py-2 text-center text-xs font-semibold transition-luxury ${selected ? "bg-domify-primary text-white shadow-sm" : "text-domify-dark/62 hover:bg-domify-warm-white"}`}>
              <input type="radio" name="listingType" value={option.value} defaultChecked={selected} className="sr-only" />{option.label}
            </label>;
          })}
        </div>
      </div>

      <FilterField label={labels.city}><select name="city" defaultValue={current.city ?? ""} className="domify-select"><option value="">{labels.allCities}</option>{cities.map((city) => <option key={city.slug} value={city.slug}>{city.name} ({city._count.properties})</option>)}</select></FilterField>
      <FilterField label={labels.neighborhood}><select name="neighborhood" defaultValue={current.neighborhood ?? ""} className="domify-select"><option value="">{labels.allNeighborhoods}</option>{neighborhoods.map((neighborhood) => <option key={neighborhood.slug} value={neighborhood.slug}>{neighborhood.name} · {neighborhood.city.name}</option>)}</select></FilterField>
      <FilterField label={labels.type}><select name="propertyType" defaultValue={current.propertyType ?? ""} className="domify-select"><option value="">{labels.allTypes}</option>{propertyTypes.map((propertyType) => <option key={propertyType.slug} value={propertyType.slug}>{propertyType.name}</option>)}</select></FilterField>

      <div className="grid grid-cols-2 gap-3">
        <FilterField label={labels.minPrice}><input name="priceMin" type="number" min="0" inputMode="numeric" defaultValue={current.priceMin ?? ""} className="domify-select" placeholder="0" /></FilterField>
        <FilterField label={labels.maxPrice}><input name="priceMax" type="number" min="0" inputMode="numeric" defaultValue={current.priceMax ?? ""} className="domify-select" placeholder={labels.noLimit} /></FilterField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FilterField label={labels.bedrooms}><select name="bedrooms" defaultValue={current.bedrooms ?? ""} className="domify-select"><option value="">{labels.indifferent}</option>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}{value === 5 ? "+" : ""}</option>)}</select></FilterField>
        <FilterField label={labels.surface}><input name="surfaceMin" type="number" min="0" inputMode="numeric" defaultValue={current.surfaceMin ?? ""} className="domify-select" placeholder="Ex. 120" /></FilterField>
      </div>
      <FilterField label={labels.amenity}><select name="amenity" defaultValue={current.amenity ?? ""} className="domify-select"><option value="">{labels.allAmenities}</option>{amenities.map((amenity) => <option key={amenity.slug} value={amenity.slug}>{amenity.name}</option>)}</select></FilterField>
      <FilterField label={labels.reference}><input name="reference" defaultValue={current.reference ?? ""} className="domify-select" placeholder="Ex. DOM-101" /></FilterField>
      <FilterField label={labels.sort}><select name="sort" defaultValue={current.sort ?? "recent"} className="domify-select"><option value="recent">{labels.recent}</option><option value="price-asc">{labels.priceAsc}</option><option value="price-desc">{labels.priceDesc}</option></select></FilterField>

      <button type="submit" className="w-full rounded-xl bg-domify-primary py-3 text-sm font-semibold text-white shadow-[0_14px_22px_-16px_rgba(16,47,66,0.9)] transition-luxury hover:-translate-y-0.5 hover:bg-domify-primary-dark">{labels.results}</button>
      <Link href="/proprietes" className="block text-center text-xs font-semibold text-domify-dark/50 transition-colors hover:text-domify-primary">{labels.reset}</Link>
    </form>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-2 block text-[0.62rem] font-bold uppercase tracking-[0.13em] text-domify-dark/48">{label}</label>{children}</div>;
}
