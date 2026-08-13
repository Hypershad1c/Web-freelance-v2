"use client";

import { useTransition } from "react";
import { Check, LoaderCircle, RotateCcw, X } from "lucide-react";
import { updateMediaWorkflow } from "@/lib/actions/media";

export function MediaWorkflowSelect({ id, status }: { id: string; status: "UPLOADED" | "IN_REVIEW" | "APPROVED" | "REJECTED" }) {
  const [pending, startTransition] = useTransition();
  const options = [
    { value: "IN_REVIEW", label: "À vérifier", icon: RotateCcw, tone: "text-amber-700" },
    { value: "APPROVED", label: "Approuver", icon: Check, tone: "text-emerald-700" },
    { value: "REJECTED", label: "Rejeter", icon: X, tone: "text-red-700" },
  ] as const;
  return <div className="flex gap-1">{options.map((option) => <button key={option.value} title={option.label} disabled={pending || status === option.value} onClick={() => startTransition(async () => { await updateMediaWorkflow(id, option.value); })} className={`rounded-lg bg-white/95 p-2 shadow-sm transition hover:scale-105 disabled:opacity-45 ${option.tone}`}>{pending ? <LoaderCircle size={13} className="animate-spin"/> : <option.icon size={13}/>}</button>)}</div>;
}
