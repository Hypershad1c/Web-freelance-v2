"use client";

import { useActionState } from "react";
import { Download, FileUp, LoaderCircle } from "lucide-react";
import { importPropertiesFromCsv, type CsvImportState } from "@/lib/actions/properties";

const initialState: CsvImportState = {};

export function CsvPropertyImport() {
  const [state, formAction, pending] = useActionState(importPropertiesFromCsv, initialState);

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-domify-primary/15 bg-white px-4 py-2.5 text-sm font-semibold text-domify-primary transition-luxury hover:border-domify-primary hover:bg-domify-warm-white [&::-webkit-details-marker]:hidden">
        <FileUp size={16} /> Importer / exporter CSV
      </summary>
      <div className="absolute right-0 z-20 mt-3 w-[min(92vw,32rem)] rounded-2xl border border-black/8 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-lg font-semibold text-domify-dark">Catalogue au format CSV</p>
            <p className="mt-1 text-xs leading-5 text-domify-dark/60">L&apos;export fournit un fichier compatible avec l&apos;import. Les références existantes sont mises à jour; les nouvelles sont créées.</p>
          </div>
          <a
            href="/api/admin/properties/export"
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-domify-warm-white px-3 py-2 text-xs font-semibold text-domify-primary transition-luxury hover:bg-domify-primary hover:text-white"
          >
            <Download size={14} /> Exporter
          </a>
        </div>

        <form action={formAction} className="mt-5 border-t border-black/7 pt-5">
          <label className="block text-xs font-semibold uppercase tracking-wide text-domify-dark/55">Fichier CSV</label>
          <input
            name="file"
            type="file"
            accept=".csv,text/csv"
            required
            className="mt-2 block w-full rounded-xl border border-dashed border-domify-primary/25 bg-domify-warm-white/55 px-3 py-3 text-sm text-domify-dark file:mr-3 file:rounded-lg file:border-0 file:bg-domify-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
          />
          <p className="mt-2 text-xs leading-5 text-domify-dark/50">Colonnes indispensables : reference, title, description, city, propertyType, price et surfaceArea. Utilisez la barre verticale pour plusieurs équipements ou images.</p>
          <button
            type="submit"
            disabled={pending}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-domify-primary py-2.5 text-sm font-semibold text-white transition-luxury hover:bg-domify-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? <LoaderCircle size={16} className="animate-spin" /> : <FileUp size={16} />}
            {pending ? "Import en cours..." : "Importer le fichier"}
          </button>
        </form>

        {state.message && (
          <div className={`mt-4 rounded-xl p-3 text-sm ${state.errors?.length ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-900"}`}>
            <p className="font-semibold">{state.message}</p>
            {(state.created !== undefined || state.updated !== undefined) && (
              <p className="mt-1 text-xs">{state.created ?? 0} créé(s), {state.updated ?? 0} mis à jour.</p>
            )}
            {state.errors && state.errors.length > 0 && (
              <ul className="mt-2 max-h-32 list-disc space-y-1 overflow-y-auto pl-4 text-xs">
                {state.errors.map((error) => <li key={error}>{error}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
    </details>
  );
}
