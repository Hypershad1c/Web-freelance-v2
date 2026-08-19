"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Clock3, GripVertical, LoaderCircle, Mail, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateLeadStatus } from "@/lib/actions/inbox";

type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "LOST";

type LeadCard = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  status: LeadStatus;
  createdAt: Date;
  property: { id: string; title: string } | null;
};

const COLUMNS: Array<{ status: LeadStatus; label: string; tone: string; marker: string }> = [
  { status: "NEW", label: "Nouveaux", tone: "border-sky-200/70 bg-sky-50/70", marker: "bg-sky-500" },
  { status: "CONTACTED", label: "Contactés", tone: "border-violet-200/70 bg-violet-50/70", marker: "bg-violet-500" },
  { status: "QUALIFIED", label: "Qualifiés", tone: "border-amber-200/70 bg-amber-50/70", marker: "bg-amber-500" },
  { status: "CONVERTED", label: "Convertis", tone: "border-emerald-200/70 bg-emerald-50/70", marker: "bg-emerald-500" },
  { status: "LOST", label: "Perdus", tone: "border-stone-200/70 bg-stone-50/70", marker: "bg-stone-400" },
];

export function LeadKanbanBoard({ leads, canOpenProperty }: { leads: LeadCard[]; canOpenProperty: boolean }) {
  const [items, setItems] = useState(leads);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const byStatus = useMemo(() => Object.fromEntries(COLUMNS.map(({ status }) => [status, items.filter((lead) => lead.status === status)])) as Record<LeadStatus, LeadCard[]>, [items]);

  function moveLead(id: string, nextStatus: LeadStatus) {
    const current = items.find((lead) => lead.id === id);
    if (!current || current.status === nextStatus) return;

    setItems((previous) => previous.map((lead) => lead.id === id ? { ...lead, status: nextStatus } : lead));
    startTransition(async () => {
      try {
        await updateLeadStatus(id, nextStatus);
        router.refresh();
      } catch {
        setItems(leads);
      }
    });
  }

  return (
    <div className="relative admin-table-scroll pb-2">
      {isPending && <div className="absolute right-2 top-2 z-10 flex items-center gap-2 rounded-full bg-domify-primary px-3 py-1.5 text-xs font-semibold text-white shadow-lg"><LoaderCircle size={13} className="animate-spin" /> Mise à jour…</div>}
      <div className="grid min-w-[1100px] grid-cols-5 gap-3.5">
        {COLUMNS.map((column) => (
          <section
            key={column.status}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (draggedId) moveLead(draggedId, column.status);
              setDraggedId(null);
            }}
            className={`min-h-[30rem] rounded-[1.25rem] border p-3 ${column.tone}`}
          >
            <div className="mb-3 flex items-center justify-between px-1.5">
              <h2 className="flex items-center gap-2 font-display text-base font-semibold text-domify-dark"><span className={`h-2 w-2 rounded-full ${column.marker}`} />{column.label}</h2>
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-domify-dark/65 shadow-sm">{byStatus[column.status].length}</span>
            </div>
            <div className="space-y-3">
              {byStatus[column.status].map((lead) => (
                <article
                  key={lead.id}
                  draggable={!isPending}
                  onDragStart={() => setDraggedId(lead.id)}
                  onDragEnd={() => setDraggedId(null)}
                  className="cursor-grab rounded-xl border border-black/7 bg-white p-3 shadow-[0_10px_22px_-18px_rgba(16,47,66,0.5)] transition-luxury hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-domify-dark">{lead.name}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-domify-dark/55"><Mail size={11} /> {lead.email}</p>
                    </div>
                    <GripVertical size={15} className="mt-0.5 text-domify-dark/30" />
                  </div>
                  {lead.phone && <p className="mt-1 flex items-center gap-1 text-xs text-domify-dark/55"><Phone size={11} /> {lead.phone}</p>}
                  {lead.property && (
                    canOpenProperty ? (
                      <Link href={`/admin/properties/${lead.property.id}`} className="mt-3 block truncate text-xs font-semibold text-domify-primary hover:text-domify-gold">{lead.property.title}</Link>
                    ) : <p className="mt-3 truncate text-xs font-semibold text-domify-primary">{lead.property.title}</p>
                  )}
                  {lead.message && <p className="mt-2 line-clamp-3 text-xs leading-5 text-domify-dark/60">{lead.message}</p>}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><p className="text-[0.66rem] font-medium uppercase tracking-wide text-domify-dark/38">{new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium" }).format(new Date(lead.createdAt))}</p>{lead.status === "NEW" && (() => { const ageHours = Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / 3600000); return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${ageHours >= 24 ? "bg-red-100 text-red-700" : ageHours >= 1 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}><Clock3 size={11} /> {ageHours >= 24 ? "SLA > 24 h" : ageHours >= 1 ? "SLA dépassé" : "À traiter"}</span>; })()}</div>
                </article>
              ))}
              {byStatus[column.status].length === 0 && <p className="rounded-xl border border-dashed border-black/10 bg-white/35 px-3 py-5 text-center text-xs text-domify-dark/40">Déposez un lead ici</p>}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
