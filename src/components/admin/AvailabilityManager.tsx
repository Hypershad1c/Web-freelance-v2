"use client";

import { useState, useTransition } from "react";
import { CalendarPlus2, LoaderCircle, MapPin, Power } from "lucide-react";
import { createAgentAvailability, toggleAgentAvailability } from "@/lib/actions/inbox";

type Agent = { id: string; name: string };
type Slot = { id: string; agentId: string; startsAt: Date; endsAt: Date; capacity: number; active: boolean; location: string | null; agent: Agent; _count: { appointments: number } };

export function AvailabilityManager({ agents, slots, role }: { agents: Agent[]; slots: Slot[]; role: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canChooseAgent = role !== "AGENT";

  function submit(formData: FormData) {
    setMessage(null); setError(null);
    startTransition(async () => {
      try { await createAgentAvailability(formData); setMessage("Créneau ajouté à l’agenda public."); (document.getElementById("availability-form") as HTMLFormElement | null)?.reset(); }
      catch (cause) { setError(cause instanceof Error ? cause.message : "Impossible d’ajouter ce créneau."); }
    });
  }

  return <div className="grid gap-6 xl:grid-cols-[360px_1fr]"><section className="rounded-[1.35rem] border border-domify-dark/8 bg-white p-5 shadow-sm"><div className="flex items-center gap-2 text-domify-primary"><CalendarPlus2 size={18}/><h2 className="font-display text-xl font-semibold">Publier un créneau</h2></div><p className="mt-2 text-sm leading-6 text-domify-dark/58">Les créneaux actifs apparaissent automatiquement sur les biens de l’agent correspondant.</p><form id="availability-form" action={submit} className="mt-5 grid gap-3">{canChooseAgent ? <select name="agentId" required className="domify-select"><option value="">Choisir un conseiller</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select> : <input type="hidden" name="agentId" value={agents[0]?.id || ""}/>}<label className="grid gap-1 text-xs font-semibold text-domify-dark/65">Début<input required type="datetime-local" name="startsAt" className="domify-select"/></label><label className="grid gap-1 text-xs font-semibold text-domify-dark/65">Fin<input required type="datetime-local" name="endsAt" className="domify-select"/></label><div className="grid grid-cols-2 gap-3"><label className="grid gap-1 text-xs font-semibold text-domify-dark/65">Capacité<input required name="capacity" defaultValue="1" min="1" max="12" type="number" className="domify-select"/></label><label className="grid gap-1 text-xs font-semibold text-domify-dark/65">Lieu<input name="location" placeholder="Bureau / sur place" className="domify-select"/></label></div>{error && <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}{message && <p className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">{message}</p>}<button disabled={pending || !agents.length} className="pressable rounded-xl bg-domify-primary px-4 py-3 text-sm font-semibold text-white">{pending && <LoaderCircle size={14} className="mr-2 inline animate-spin"/>}Publier le créneau</button></form></section><section className="rounded-[1.35rem] border border-domify-dark/8 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="luxury-eyebrow text-domify-gold">Agenda public</p><h2 className="mt-1 font-display text-xl font-semibold text-domify-dark">Créneaux à venir</h2></div><span className="rounded-full bg-domify-warm-white px-3 py-1 text-xs font-semibold text-domify-dark/60">{slots.filter((slot) => slot.active).length} actifs</span></div><div className="mt-5 space-y-3">{slots.length === 0 ? <p className="rounded-xl bg-domify-warm-white p-6 text-center text-sm text-domify-dark/60">Aucun créneau publié pour le moment.</p> : slots.map((slot) => <SlotRow key={slot.id} slot={slot}/>)}</div></section></div>;
}

function SlotRow({ slot }: { slot: Slot }) {
  const [pending, startTransition] = useTransition();
  return <article className="flex flex-col gap-3 rounded-2xl bg-domify-warm-white/70 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-domify-dark">{slot.agent.name}</p><p className="mt-1 text-sm text-domify-dark/68">{new Intl.DateTimeFormat("fr-MA", { dateStyle: "full", timeStyle: "short" }).format(new Date(slot.startsAt))} — {new Intl.DateTimeFormat("fr-MA", { timeStyle: "short" }).format(new Date(slot.endsAt))}</p><p className="mt-1 flex flex-wrap gap-x-3 text-xs text-domify-dark/50"><span>{slot._count.appointments}/{slot.capacity} réservations</span>{slot.location && <span className="inline-flex items-center gap-1"><MapPin size={12}/>{slot.location}</span>}</p></div><button onClick={() => startTransition(async () => { await toggleAgentAvailability(slot.id, !slot.active); })} disabled={pending} className={`pressable inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${slot.active ? "bg-white text-domify-primary" : "bg-domify-dark/8 text-domify-dark/55"}`}><Power size={13}/>{pending ? "…" : slot.active ? "Retirer" : "Réactiver"}</button></article>;
}
