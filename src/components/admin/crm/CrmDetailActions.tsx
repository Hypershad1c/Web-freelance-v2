"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, CheckCircle2, LoaderCircle, Plus, StickyNote } from "lucide-react";
import { completeCrmActivity, createCrmActivity, createCrmDeal } from "@/lib/actions/crm";
import { Button } from "@/components/ui/button";

type DealOption = { id: string; title: string };
type PropertyOption = { id: string; title: string; reference: string };
type Activity = { id: string; type: string; body: string; dueAt: Date | null; completedAt: Date | null; createdAt: Date; actor: { name: string | null; email: string } | null; deal: { id: string; title: string } | null };

export function CrmDealForm({ contactId, properties }: { contactId: string; properties: PropertyOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(data: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createCrmDeal(contactId, data);
        setOpen(false);
        router.refresh();
      } catch (caught) { setError(caught instanceof Error ? caught.message : "Impossible de créer l’opportunité."); }
    });
  }

  return (
    <div className="rounded-[1.35rem] border border-domify-dark/8 bg-white p-5 shadow-[0_18px_38px_-30px_rgba(16,47,66,0.34)]">
      <div className="flex items-center justify-between gap-3"><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-domify-gold">Pipeline</p><h2 className="mt-1 font-display text-xl font-semibold text-domify-dark">Nouvelle opportunité</h2></div><Button variant="outline" size="sm" onClick={() => setOpen(!open)}><Plus size={15} /> Ajouter</Button></div>
      {open && <form action={submit} className="mt-5 space-y-3 border-t border-domify-dark/8 pt-5">
        <input name="title" required className="domify-select" placeholder="Ex. Acquisition villa Souissi" />
        <div className="grid grid-cols-2 gap-3"><input name="value" type="number" min="0" className="domify-select" placeholder="Valeur MAD" /><select name="stage" defaultValue="NEW" className="domify-select"><option value="NEW">Nouveau</option><option value="QUALIFIED">Qualifié</option><option value="VIEWING">Visite</option><option value="OFFER">Offre</option><option value="NEGOTIATION">Négociation</option></select></div>
        <select name="propertyId" className="domify-select"><option value="">Sans bien associé</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.reference} — {property.title}</option>)}</select>
        <label className="block text-[0.68rem] font-bold uppercase tracking-[0.13em] text-domify-dark/52">Prochain suivi<input name="nextFollowUpAt" type="datetime-local" className="domify-select mt-2" /></label>
        <label className="block text-[0.68rem] font-bold uppercase tracking-[0.13em] text-domify-dark/52">Clôture estimée<input name="expectedCloseAt" type="date" className="domify-select mt-2" /></label>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <Button type="submit" size="sm" disabled={isPending}>{isPending ? <LoaderCircle size={15} className="animate-spin" /> : <Plus size={15} />} Créer l’opportunité</Button>
      </form>}
    </div>
  );
}

export function CrmActivityForm({ contactId, deals }: { contactId: string; deals: DealOption[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(data: FormData) {
    setError(null);
    startTransition(async () => {
      try { await createCrmActivity(contactId, data); (document.getElementById("crm-activity-form") as HTMLFormElement | null)?.reset(); router.refresh(); }
      catch (caught) { setError(caught instanceof Error ? caught.message : "Impossible d’ajouter l’activité."); }
    });
  }

  return (
    <form id="crm-activity-form" action={submit} className="rounded-[1.35rem] border border-domify-dark/8 bg-white p-5 shadow-[0_18px_38px_-30px_rgba(16,47,66,0.34)]">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-domify-gold">Journal relationnel</p>
      <h2 className="mt-1 font-display text-xl font-semibold text-domify-dark">Ajouter une interaction</h2>
      <div className="mt-5 space-y-3"><div className="grid grid-cols-2 gap-3"><select name="type" defaultValue="NOTE" className="domify-select"><option value="NOTE">Note</option><option value="CALL">Appel</option><option value="EMAIL">Email</option><option value="WHATSAPP">WhatsApp</option><option value="MEETING">Réunion</option><option value="TASK">Tâche</option></select><select name="dealId" className="domify-select"><option value="">Toutes les opportunités</option>{deals.map((deal) => <option key={deal.id} value={deal.id}>{deal.title}</option>)}</select></div>
        <textarea name="body" required rows={4} className="min-h-28 w-full rounded-[0.9rem] border border-domify-dark/11 bg-white px-4 py-3 text-sm text-domify-dark focus:border-domify-secondary focus:outline-none focus:ring-4 focus:ring-domify-secondary/15" placeholder="Ajoutez le contexte de l’échange, les objections ou la prochaine action…" />
        <label className="block text-[0.68rem] font-bold uppercase tracking-[0.13em] text-domify-dark/52">Échéance de suivi (facultatif)<input name="dueAt" type="datetime-local" className="domify-select mt-2" /></label>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <Button type="submit" variant="gold" size="sm" disabled={isPending}>{isPending ? <LoaderCircle size={15} className="animate-spin" /> : <StickyNote size={15} />} Ajouter au journal</Button>
      </div>
    </form>
  );
}

export function CrmTimeline({ activities }: { activities: Activity[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setError(null);
    startTransition(async () => { try { await completeCrmActivity(id); router.refresh(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Mise à jour impossible."); } });
  }

  return (
    <section className="rounded-[1.35rem] border border-domify-dark/8 bg-white p-5 shadow-[0_18px_38px_-30px_rgba(16,47,66,0.34)]">
      <div className="flex items-center justify-between"><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-domify-gold">Historique</p><h2 className="mt-1 font-display text-xl font-semibold text-domify-dark">Timeline relationnelle</h2></div><CalendarPlus className="text-domify-primary/55" size={20} /></div>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      <div className="mt-5 space-y-4">{activities.length === 0 ? <p className="rounded-xl bg-domify-warm-white p-5 text-sm text-domify-dark/60">Aucune interaction enregistrée pour le moment.</p> : activities.map((activity) => <article key={activity.id} className={`relative border-l-2 pl-4 ${activity.completedAt ? "border-emerald-300" : activity.dueAt ? "border-domify-gold" : "border-domify-primary/25"}`}><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-domify-warm-white px-2 py-1 text-[0.62rem] font-bold uppercase tracking-wide text-domify-primary">{activity.type}</span>{activity.deal && <span className="text-xs font-semibold text-domify-dark/58">{activity.deal.title}</span>}{activity.completedAt && <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 size={13} /> Terminé</span>}</div><p className="mt-2 text-sm leading-6 text-domify-dark/78">{activity.body}</p><div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-domify-dark/48"><span>{new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(activity.createdAt))}{activity.actor?.name ? ` · ${activity.actor.name}` : ""}</span>{activity.dueAt && <span className={activity.completedAt ? "text-emerald-700" : "font-semibold text-domify-gold"}>Suivi : {new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(activity.dueAt))}</span>}</div>{activity.type === "TASK" && <button type="button" disabled={isPending} onClick={() => toggle(activity.id)} className="pressable mt-3 text-xs font-semibold text-domify-primary hover:text-domify-gold">{activity.completedAt ? "Rouvrir la tâche" : "Marquer comme terminée"}</button>}</article>)}</div>
    </section>
  );
}
