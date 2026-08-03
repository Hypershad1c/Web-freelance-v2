"use client";

import { Search } from "lucide-react";

export function SearchBar() {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 shadow-luxury sm:grid-cols-2 lg:grid-cols-5 lg:items-end lg:gap-4 lg:p-5">
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
      <button className="flex h-[46px] items-center justify-center gap-2 rounded-xl bg-domify-primary text-sm font-semibold text-white shadow-luxury transition-luxury hover:bg-domify-primary-dark">
        <Search size={16} /> Rechercher
      </button>

      <style>{`
        .domify-select {
          width: 100%;
          height: 46px;
          border-radius: 0.75rem;
          border: 1px solid rgba(31,41,55,0.12);
          padding: 0 0.9rem;
          font-size: 0.875rem;
          color: #1F2937;
          background: #fff;
        }
        .domify-select:focus { outline: 2px solid #6699CC; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-left">
      <span className="mb-1.5 block text-xs font-medium text-domify-dark/60">{label}</span>
      {children}
    </label>
  );
}
