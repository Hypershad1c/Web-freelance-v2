"use client";

import { useTransition } from "react";
import { Pause, Play, Trash2 } from "lucide-react";
import { deleteCrmSavedSearch, toggleCrmSavedSearch } from "@/lib/actions/crm-operations";

export function SavedSearchActions({ id, active }: { id: string; active: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-1">
      <button type="button" disabled={pending} onClick={() => startTransition(() => void toggleCrmSavedSearch(id))} className="rounded-lg p-2 text-domify-primary hover:bg-white disabled:opacity-50" aria-label={active ? "Mettre l’alerte en pause" : "Réactiver l’alerte"}>
        {active ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <button type="button" disabled={pending} onClick={() => { if (window.confirm("Supprimer cette alerte de recherche ?")) startTransition(() => void deleteCrmSavedSearch(id)); }} className="rounded-lg p-2 text-red-600 hover:bg-white disabled:opacity-50" aria-label="Supprimer l’alerte">
        <Trash2 size={14} />
      </button>
    </div>
  );
}
