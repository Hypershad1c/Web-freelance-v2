"use client";

import { ArrowRight, Search } from "lucide-react";

export function SearchBar() {
  return (
    <div className="luxury-surface grid grid-cols-1 gap-3 rounded-[1.45rem] p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-[1.05fr_1.05fr_0.92fr_0.92fr_0.9fr] lg:items-end lg:gap-3 lg:p-4">
      <Field label="Localisation">
        <select className="domify-select">
          <option>Toutes les villes</option>
          <option>Casablanca</option>
          <option>Rabat</option>
          <option>Marrakech</option>
          <option>Tanger</option>
        </select>
      </Field>
      <Field label="Type de bien">
        <select className="domify-select">
          <option>Tous les types</option>
          <option>Appartement</option>
          <option>Villa</option>
          <option>Duplex</option>
          <option>Terrain</option>
        </select>
      </Field>
      <Field label="Prix max">
        <input className="domify-select" placeholder="Prix max" />
      </Field>
      <Field label="Référence">
        <input className="domify-select" placeholder="Référence" />
      </Field>
      <button className="group flex h-[52px] items-center justify-center gap-2 rounded-[0.9rem] bg-domify-primary px-4 text-sm font-semibold text-white shadow-[0_14px_24px_-14px_rgba(16,47,66,0.9)] transition-luxury hover:-translate-y-0.5 hover:bg-domify-primary-dark">
        <Search size={16} strokeWidth={2.4} />
        <span>Rechercher</span>
        <ArrowRight size={15} className="rtl-mirror transition-transform duration-300 group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-left">
      <span className="mb-2 block text-[0.66rem] font-bold uppercase tracking-[0.13em] text-domify-dark/55">{label}</span>
      {children}
    </label>
  );
}
