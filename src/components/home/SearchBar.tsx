"use client";

import { ArrowRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";

type SearchValues = {
  city: string;
  propertyType: string;
  priceMax: string;
  reference: string;
};

type SearchOption = { slug: string; name: string };

export function SearchBar({ cities, propertyTypes }: { cities: SearchOption[]; propertyTypes: SearchOption[] }) {
  const router = useRouter();
  const { register, handleSubmit } = useForm<SearchValues>({
    defaultValues: { city: "", propertyType: "", priceMax: "", reference: "" },
  });

  function submitSearch(values: SearchValues) {
    const query = new URLSearchParams();
    if (values.city) query.set("city", values.city);
    if (values.propertyType) query.set("propertyType", values.propertyType);
    if (values.priceMax && Number(values.priceMax) > 0) query.set("priceMax", values.priceMax);
    if (values.reference.trim()) query.set("reference", values.reference.trim());

    const suffix = query.toString();
    router.push(suffix ? `/proprietes?${suffix}` : "/proprietes");
  }

  return (
    <form onSubmit={handleSubmit(submitSearch)} className="luxury-surface luxury-surface-strong grid grid-cols-1 gap-3 rounded-[1.65rem] p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-[1.05fr_1.05fr_0.92fr_0.92fr_0.9fr] lg:items-end lg:gap-3 lg:p-4">
      <Field label="Localisation">
        <select {...register("city")} className="domify-select" aria-label="Ville">
          <option value="">Toutes les villes</option>
          {cities.map((city) => (
            <option key={city.slug} value={city.slug}>{city.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Type de bien">
        <select {...register("propertyType")} className="domify-select" aria-label="Type de bien">
          <option value="">Tous les types</option>
          {propertyTypes.map((propertyType) => (
            <option key={propertyType.slug} value={propertyType.slug}>{propertyType.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Prix maximum">
        <input {...register("priceMax")} type="number" min="0" inputMode="numeric" className="domify-select" placeholder="Ex. 2 500 000" aria-label="Prix maximum" />
      </Field>
      <Field label="Référence">
        <input {...register("reference")} className="domify-select" placeholder="Ex. DOM-101" aria-label="Référence du bien" />
      </Field>
      <Button type="submit" size="lg" className="group h-[52px] w-full rounded-[0.95rem] hover:-translate-y-0.5 hover:shadow-[0_19px_30px_-16px_rgba(16,47,66,0.9)]">
        <Search size={16} strokeWidth={2.4} />
        <span>Rechercher</span>
        <ArrowRight size={15} className="rtl-mirror transition-transform duration-300 group-hover:translate-x-0.5" />
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="group block text-left">
      <span className="mb-2 block text-[0.66rem] font-bold uppercase tracking-[0.15em] text-domify-dark/55 transition-colors duration-200 group-focus-within:text-domify-primary">{label}</span>
      {children}
    </label>
  );
}
