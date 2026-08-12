"use client";

import { useState, useTransition } from "react";
import { Check, LoaderCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { reviewPropertyApproval } from "@/lib/actions/properties";

export function ApprovalActions({ id }: { id: string }) {
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function decide(decision: "approve" | "reject") {
    startTransition(async () => {
      try {
        await reviewPropertyApproval(id, decision, decision === "reject" ? reason : undefined);
        setMessage(decision === "approve" ? "Propriété approuvée et publiée." : "Propriété retournée à l’éditeur.");
        setShowReject(false);
        setReason("");
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <div className="mt-5 border-t border-black/7 pt-4">
      {message && <p className="mb-3 rounded-lg bg-domify-warm-white px-3 py-2 text-xs text-domify-dark">{message}</p>}
      {!showReject ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => decide("approve")}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            {isPending ? <LoaderCircle size={13} className="animate-spin" /> : <Check size={14} />} Approuver
          </button>
          <button
            type="button"
            onClick={() => setShowReject(true)}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-60"
          >
            <X size={14} /> Retourner
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-domify-dark/65">Motif de retour à l&apos;éditeur</label>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            placeholder="Indiquez les corrections attendues…"
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => decide("reject")} disabled={isPending || !reason.trim()} className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
              {isPending && <LoaderCircle size={13} className="animate-spin" />} Confirmer le retour
            </button>
            <button type="button" onClick={() => setShowReject(false)} disabled={isPending} className="rounded-lg px-3 py-2 text-xs font-semibold text-domify-dark/60 hover:bg-domify-warm-white">Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}
