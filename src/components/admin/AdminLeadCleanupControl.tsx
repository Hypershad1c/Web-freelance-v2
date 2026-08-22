"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function AdminLeadCleanupControl({ count }: { count: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function clearLeads() {
    const confirmed = window.confirm(`Supprimer définitivement les ${count} lead(s) affichés dans toute la base ? Cette action ne supprime ni les propriétés, ni les rendez-vous, ni les contacts CRM.`);
    if (!confirmed) return;

    setPending(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/admin/leads/clear", { method: "POST", headers: { "x-domify-confirmation": "CLEAR_ALL_LEADS" } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "La suppression a échoué.");
      setResult(`${data.deleted} lead(s) supprimé(s). Il reste ${data.after} lead.`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "La suppression a échoué.");
    } finally {
      setPending(false);
    }
  }

  return (
    <aside className="mt-8 rounded-2xl border border-red-500/20 bg-red-50/70 p-5 text-red-950 shadow-[0_16px_36px_-30px_rgba(127,29,29,0.4)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700"><AlertTriangle size={19} /></span><div><p className="font-semibold">Suppression unique des leads</p><p className="mt-1 text-sm leading-6 text-red-900/68">Supprime les {count} lead(s) de manière définitive. Les propriétés, dossiers vendeur, contacts CRM, rendez-vous et messages restent intacts.</p></div></div>
        <button type="button" onClick={clearLeads} disabled={pending || count === 0} className="pressable inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-55">{pending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}{pending ? "Suppression..." : "Supprimer les leads"}</button>
      </div>
      {result && <p className="mt-4 rounded-xl bg-white/75 px-3 py-2 text-sm font-semibold text-emerald-700">{result}</p>}
      {error && <p className="mt-4 rounded-xl bg-white/75 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
    </aside>
  );
}
