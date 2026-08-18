"use client";

import { ArrowRight, Building2, Home, KeyRound, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/locales";
import { recordClientAnalyticsEvent } from "@/lib/client-analytics";

type SearchValues = {
  listingType: string;
  city: string;
  propertyType: string;
  priceMax: string;
  reference: string;
};

type SearchOption = { slug: string; name: string };

export function SearchBar({ cities, propertyTypes, locale = "fr" }: { cities: SearchOption[]; propertyTypes: SearchOption[]; locale?: Locale }) {
  const router = useRouter();
  const labels = locale === "ar" ? { location: "الموقع", allCities: "جميع المدن", type: "نوع العقار", allTypes: "جميع الأنواع", maxPrice: "السعر الأقصى", reference: "المرجع", search: "بحث", referencePlaceholder: "مثال DOM-101", all: "الكل", buy: "شراء", rent: "كراء" } : locale === "en" ? { location: "Location", allCities: "All cities", type: "Property type", allTypes: "All types", maxPrice: "Maximum price", reference: "Reference", search: "Search", referencePlaceholder: "e.g. DOM-101", all: "All", buy: "Buy", rent: "Rent" } : { location: "Localisation", allCities: "Toutes les villes", type: "Type de bien", allTypes: "Tous les types", maxPrice: "Prix maximum", reference: "Référence", search: "Rechercher", referencePlaceholder: "Ex. DOM-101", all: "Tout", buy: "Acheter", rent: "Louer" };
  const { register, handleSubmit, setValue, watch } = useForm<SearchValues>({
    defaultValues: { listingType: "", city: "", propertyType: "", priceMax: "", reference: "" },
  });
  const listingType = watch("listingType");

  function submitSearch(values: SearchValues) {
    const query = new URLSearchParams();
    if (values.listingType) query.set("listingType", values.listingType);
    if (values.city) query.set("city", values.city);
    if (values.propertyType) query.set("propertyType", values.propertyType);
    if (values.priceMax && Number(values.priceMax) > 0) query.set("priceMax", values.priceMax);
    if (values.reference.trim()) query.set("reference", values.reference.trim());

    const suffix = query.toString();
    recordClientAnalyticsEvent("search", { path: "/proprietes", meta: { filters: Object.fromEntries(query.entries()) } });
    router.push(suffix ? `/proprietes?${suffix}` : "/proprietes");
  }

  return (
    <form onSubmit={handleSubmit(submitSearch)} dir={locale === "ar" ? "rtl" : "ltr"} className="luxury-surface luxury-surface-strong rounded-[1.65rem] p-3 text-start sm:p-4">
      <input type="hidden" {...register("listingType")} />
      <div className="mb-3 inline-flex w-full rounded-xl bg-domify-warm-white/85 p-1 sm:w-auto">
        {[
          { value: "", label: labels.all, icon: Building2 },
          { value: "VENTE", label: labels.buy, icon: Home },
          { value: "LOCATION", label: labels.rent, icon: KeyRound },
        ].map(({ value, label, icon: Icon }) => (
          <button key={value || "all"} type="button" onClick={() => setValue("listingType", value)} className={`pressable inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-luxury sm:flex-none ${listingType === value ? "bg-domify-primary text-white shadow-[0_10px_18px_-14px_rgba(16,47,66,0.8)]" : "text-domify-dark/55 hover:bg-white hover:text-domify-primary"}`}><Icon size={14} /> {label}</button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1.05fr_1.05fr_0.92fr_0.92fr_0.9fr] lg:items-end lg:gap-3">
      <Field label={labels.location}>
        <select {...register("city")} className="domify-select" aria-label={labels.location}>
          <option value="">{labels.allCities}</option>
          {cities.map((city) => (
            <option key={city.slug} value={city.slug}>{city.name}</option>
          ))}
        </select>
      </Field>
      <Field label={labels.type}>
        <select {...register("propertyType")} className="domify-select" aria-label={labels.type}>
          <option value="">{labels.allTypes}</option>
          {propertyTypes.map((propertyType) => (
            <option key={propertyType.slug} value={propertyType.slug}>{propertyType.name}</option>
          ))}
        </select>
      </Field>
      <Field label={labels.maxPrice}>
        <input {...register("priceMax")} type="number" min="0" inputMode="numeric" className="domify-select" placeholder="Ex. 2 500 000" aria-label={labels.maxPrice} />
      </Field>
      <Field label={labels.reference}>
        <input {...register("reference")} className="domify-select" placeholder={labels.referencePlaceholder} aria-label={labels.reference} />
      </Field>
      <Button type="submit" size="lg" className="group h-[52px] w-full rounded-[0.95rem] hover:-translate-y-0.5 hover:shadow-[0_19px_30px_-16px_rgba(16,47,66,0.9)]">
        <Search size={16} strokeWidth={2.4} />
        <span>{labels.search}</span>
        <ArrowRight size={15} className="rtl-mirror transition-transform duration-300 group-hover:translate-x-0.5" />
      </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="group block text-start">
      <span className="mb-2 block text-[0.66rem] font-bold uppercase tracking-[0.15em] text-domify-dark/55 transition-colors duration-200 group-focus-within:text-domify-primary">{label}</span>
      {children}
    </label>
  );
}
