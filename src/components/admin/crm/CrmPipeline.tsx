"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, GripVertical, LoaderCircle, Phone, TrendingUp } from "lucide-react";
import { updateCrmDealStage } from "@/lib/actions/crm";

type Stage = "NEW" | "QUALIFIED" | "VIEWING" | "OFFER" | "NEGOTIATION" | "WON" | "LOST";

type Deal = {
  id: string;
  title: string;
  stage: Stage;
  value: number | null;
  probability: number;
  contact: { id: string; name: string; email: string; phone: string | null };
  property: { id: string; title: string; reference: string } | null;
  owner: { id: string; name: string | null } | null;
};

type Column = { value: Stage; label: string; tone: string };

export function CrmPipeline({ deals, columns }: { deals: Deal[]; columns: Column[] }) {
  const router = useRouter();
  const [items, setItems] = useState(deals);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const grouped = useMemo(() => Object.fromEntries(columns.map((column) => [column.value, items.filter((deal) => deal.stage === column.value)])) as Record<Stage, Deal[]>, [columns, items]);

  function moveDeal(id: string, stage: Stage) {
    const current = items.find((item) => item.id === id);
    if (!current || current.stage === stage) return;
    const previous = items;
    const probability = { NEW: 10, QUALIFIED: 30, VIEWING: 55, OFFER: 70, NEGOTIATION: 85, WON: 100, LOST: 0 }[stage];
    setItems((existing) => existing.map((deal) => (deal.id === id ? { ...deal, stage, probability } : deal)));

    startTransition(async () => {
      try {
        await updateCrmDealStage(id, stage);
        router.refresh();
      } catch {
        setItems(previous);
      }
    });
  }

  return (
    <div className="relative overflow-x-auto pb-3">
      {isPending && <div className="absolute right-3 top-3 z-10 flex items-center gap-2 rounded-full bg-domify-primary px-3 py-1.5 text-xs font-semibold text-white shadow-lg"><LoaderCircle size={13} className="animate-spin" /> Mise à jour…</div>}
      <div className="grid min-w-[1510px] grid-cols-7 gap-4">
        {columns.map((column) => {
          const columnDeals = grouped[column.value] || [];
          const total = columnDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
          return (
            <section key={column.value} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedId) moveDeal(draggedId, column.value); setDraggedId(null); }} className={`min-h-[24rem] rounded-[1.3rem] border p-3 shadow-[0_16px_34px_-28px_rgba(16,47,66,0.55)] transition-colors ${column.tone}`}>
              <header className="mb-3 flex items-start justify-between gap-2 px-1">
                <div>
                  <h3 className="font-display text-base font-semibold text-domify-dark">{column.label}</h3>
                  <p className="mt-0.5 text-[0.64rem] font-bold uppercase tracking-[0.1em] text-domify-dark/45">{columnDeals.length} opportunité(s)</p>
                </div>
                <span className="rounded-full bg-white px-2 py-1 text-[0.68rem] font-bold text-domify-dark/65">{formatMad(total)}</span>
              </header>
              <div className="space-y-3">
                {columnDeals.map((deal) => (
                  <article key={deal.id} draggable={!isPending} onDragStart={() => setDraggedId(deal.id)} onDragEnd={() => setDraggedId(null)} aria-label={`Déplacer l'opportunité ${deal.title}`} className="group cursor-grab rounded-xl border border-black/7 bg-white p-3 shadow-[0_10px_22px_-18px_rgba(16,47,66,0.5)] transition-luxury hover:-translate-y-0.5 hover:border-domify-gold/30 hover:shadow-md active:cursor-grabbing">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-sm font-semibold leading-5 text-domify-dark">{deal.title}</p>
                      <GripVertical size={15} className="shrink-0 text-domify-dark/28" />
                    </div>
                    <Link href={`/admin/crm/contacts/${deal.contact.id}`} className="mt-3 block text-xs font-semibold text-domify-primary hover:text-domify-gold">{deal.contact.name}</Link>
                    {deal.property && <p className="mt-1 flex items-center gap-1 text-[0.68rem] text-domify-dark/52"><Building2 size={11} /> <span className="truncate">{deal.property.title}</span></p>}
                    {deal.contact.phone && <p className="mt-1 flex items-center gap-1 text-[0.68rem] text-domify-dark/52"><Phone size={11} /> {deal.contact.phone}</p>}
                    <div className="mt-3 flex items-center justify-between border-t border-domify-dark/7 pt-2.5">
                      <span className="font-display text-base font-semibold text-domify-dark">{formatMad(deal.value || 0)}</span>
                      <span className="inline-flex items-center gap-1 text-[0.68rem] font-bold text-domify-primary"><TrendingUp size={11} /> {deal.probability}%</span>
                    </div>
                    <div className="mt-2 h-1 overflow-hidden rounded-full bg-domify-dark/8"><div className="h-full rounded-full bg-domify-gold transition-all duration-300" style={{ width: `${deal.probability}%` }} /></div>
                  </article>
                ))}
                {columnDeals.length === 0 && <p className="rounded-xl border border-dashed border-black/10 px-3 py-6 text-center text-xs leading-5 text-domify-dark/42">Déposez une opportunité ici</p>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function formatMad(value: number) {
  if (!value) return "—";
  return new Intl.NumberFormat("fr-MA", { notation: "compact", maximumFractionDigits: 1 }).format(value) + " MAD";
}
