"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, Clock3, Columns3, Eye, GripVertical, List, LoaderCircle, Mail, MapPin, MessageSquareText, Phone, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateLeadStatus } from "@/lib/actions/inbox";

type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "LOST";
type WorkspaceView = "board" | "list";

type LeadCard = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  source: string | null;
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

const statusMeta = Object.fromEntries(COLUMNS.map((column) => [column.status, column])) as Record<LeadStatus, (typeof COLUMNS)[number]>;

export function LeadKanbanBoard({ leads, canOpenProperty, canDelete }: { leads: LeadCard[]; canOpenProperty: boolean; canDelete: boolean }) {
  const [items, setItems] = useState(leads);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [view, setView] = useState<WorkspaceView>("board");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const selectedLead = items.find((lead) => lead.id === selectedLeadId) ?? null;
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

  async function deleteLead(lead: LeadCard) {
    if (!window.confirm(`Supprimer définitivement le lead de ${lead.name} ? Cette action ne peut pas être annulée.`)) return;
    setDeletingLeadId(lead.id);
    try {
      const response = await fetch(`/api/admin/leads/${lead.id}`, { method: "DELETE" });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error || "La suppression du lead a échoué.");
      setItems((previous) => previous.filter((item) => item.id !== lead.id));
      setSelectedLeadId(null);
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "La suppression du lead a échoué.");
    } finally {
      setDeletingLeadId(null);
    }
  }

  return (
    <div className="relative">
      {isPending && <div className="absolute right-2 top-2 z-20 flex items-center gap-2 rounded-full bg-domify-primary px-3 py-1.5 text-xs font-semibold text-white shadow-lg"><LoaderCircle size={13} className="animate-spin" /> Mise à jour…</div>}
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-domify-dark/8 bg-white p-3.5 shadow-[0_14px_30px_-26px_rgba(16,47,66,0.5)] sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-sm font-semibold text-domify-dark">Consultez chaque demande sans déplacer le pipeline.</p><p className="mt-0.5 text-xs leading-5 text-domify-dark/55">Ouvrez un lead pour lire l’intégralité de son projet, contacter la personne et changer son étape.</p></div>
        <div className="inline-flex rounded-xl bg-domify-warm-white p-1" role="group" aria-label="Mode d’affichage des leads">
          <button type="button" onClick={() => setView("board")} aria-pressed={view === "board"} className={`pressable inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-luxury ${view === "board" ? "bg-domify-primary text-white shadow-sm" : "text-domify-dark/65 hover:text-domify-primary"}`}><Columns3 size={15} /> Pipeline</button>
          <button type="button" onClick={() => setView("list")} aria-pressed={view === "list"} className={`pressable inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-luxury ${view === "list" ? "bg-domify-primary text-white shadow-sm" : "text-domify-dark/65 hover:text-domify-primary"}`}><List size={16} /> Liste complète</button>
        </div>
      </div>

      {view === "board" ? (
        <div className="admin-table-scroll pb-2">
          <div className="grid min-w-[1100px] grid-cols-5 gap-3.5">
            {COLUMNS.map((column) => (
              <section key={column.status} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedId) moveLead(draggedId, column.status); setDraggedId(null); }} className={`min-h-[30rem] rounded-[1.25rem] border p-3 ${column.tone}`}>
                <div className="mb-3 flex items-center justify-between px-1.5"><h2 className="flex items-center gap-2 font-display text-base font-semibold text-domify-dark"><span className={`h-2 w-2 rounded-full ${column.marker}`} />{column.label}</h2><span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-domify-dark/65 shadow-sm">{byStatus[column.status].length}</span></div>
                <div className="space-y-3">
                  {byStatus[column.status].map((lead) => <LeadBoardCard key={lead.id} lead={lead} canOpenProperty={canOpenProperty} disabled={isPending} onDragStart={() => setDraggedId(lead.id)} onDragEnd={() => setDraggedId(null)} onOpen={() => setSelectedLeadId(lead.id)} />)}
                  {byStatus[column.status].length === 0 && <p className="rounded-xl border border-dashed border-black/10 bg-white/35 px-3 py-5 text-center text-xs text-domify-dark/40">Déposez un lead ici</p>}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : <LeadList leads={items} canOpenProperty={canOpenProperty} onOpen={setSelectedLeadId} />}

      {selectedLead && <LeadDetailPanel lead={selectedLead} canOpenProperty={canOpenProperty} canDelete={canDelete} busy={isPending || deletingLeadId === selectedLead.id} onClose={() => setSelectedLeadId(null)} onStatusChange={(status) => moveLead(selectedLead.id, status)} onDelete={() => void deleteLead(selectedLead)} />}
    </div>
  );
}

function LeadBoardCard({ lead, canOpenProperty, disabled, onDragStart, onDragEnd, onOpen }: { lead: LeadCard; canOpenProperty: boolean; disabled: boolean; onDragStart: () => void; onDragEnd: () => void; onOpen: () => void }) {
  return <article draggable={!disabled} onDragStart={onDragStart} onDragEnd={onDragEnd} className="cursor-grab rounded-xl border border-black/7 bg-white p-3 shadow-[0_10px_22px_-18px_rgba(16,47,66,0.5)] transition-luxury hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing"><div className="flex items-start justify-between gap-2"><div><p className="font-semibold text-domify-dark">{lead.name}</p><p className="mt-0.5 flex items-center gap-1 text-xs text-domify-dark/55"><Mail size={11} /> {lead.email}</p></div><GripVertical size={15} className="mt-0.5 text-domify-dark/30" /></div>{lead.phone && <p className="mt-1 flex items-center gap-1 text-xs text-domify-dark/55"><Phone size={11} /> {lead.phone}</p>}{lead.property && (canOpenProperty ? <Link href={`/admin/properties/${lead.property.id}`} className="mt-3 block truncate text-xs font-semibold text-domify-primary hover:text-domify-gold">{lead.property.title}</Link> : <p className="mt-3 truncate text-xs font-semibold text-domify-primary">{lead.property.title}</p>)}{lead.message && <p className="mt-2 line-clamp-3 text-xs leading-5 text-domify-dark/60">{lead.message}</p>}<div className="mt-3 flex items-center justify-between gap-2"><p className="text-[0.66rem] font-medium uppercase tracking-wide text-domify-dark/38">{formatDate(lead.createdAt)}</p><button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={onOpen} className="pressable inline-flex items-center gap-1 rounded-lg bg-domify-primary/8 px-2 py-1.5 text-[11px] font-bold text-domify-primary hover:bg-domify-primary hover:text-white"><Eye size={12} /> Voir</button></div>{lead.status === "NEW" && <LeadSla createdAt={lead.createdAt} />}</article>;
}

function LeadList({ leads, canOpenProperty, onOpen }: { leads: LeadCard[]; canOpenProperty: boolean; onOpen: (id: string) => void }) {
  return <div className="admin-table-scroll overflow-hidden rounded-[1.25rem] border border-domify-dark/8 bg-white shadow-[0_16px_34px_-28px_rgba(16,47,66,0.45)]"><table className="min-w-[920px] w-full text-left"><thead className="bg-domify-warm-white text-[11px] uppercase tracking-[0.12em] text-domify-dark/50"><tr><th className="px-5 py-4 font-bold">Contact</th><th className="px-5 py-4 font-bold">Projet</th><th className="px-5 py-4 font-bold">Source</th><th className="px-5 py-4 font-bold">Étape</th><th className="px-5 py-4 font-bold">Reçu le</th><th className="px-5 py-4 text-right font-bold">Action</th></tr></thead><tbody className="divide-y divide-domify-dark/7">{leads.map((lead) => <tr key={lead.id} className="transition-colors hover:bg-domify-warm-white/55"><td className="px-5 py-4"><p className="font-semibold text-domify-dark">{lead.name}</p><p className="mt-1 text-xs text-domify-dark/55">{lead.email}{lead.phone ? ` · ${lead.phone}` : ""}</p></td><td className="max-w-[260px] px-5 py-4"><p className="line-clamp-2 text-sm leading-5 text-domify-dark/70">{lead.message || "Sans message"}</p>{lead.property && (canOpenProperty ? <Link href={`/admin/properties/${lead.property.id}`} className="mt-1.5 block truncate text-xs font-semibold text-domify-primary hover:text-domify-gold">{lead.property.title}</Link> : <p className="mt-1.5 truncate text-xs font-semibold text-domify-primary">{lead.property.title}</p>)}</td><td className="px-5 py-4"><span className="rounded-full bg-domify-primary/8 px-2.5 py-1 text-xs font-semibold text-domify-primary">{sourceLabel(lead.source)}</span></td><td className="px-5 py-4"><StatusPill status={lead.status} /></td><td className="px-5 py-4 text-sm text-domify-dark/60">{formatDate(lead.createdAt)}</td><td className="px-5 py-4 text-right"><button type="button" onClick={() => onOpen(lead.id)} className="pressable inline-flex items-center gap-1.5 rounded-xl border border-domify-primary/15 bg-white px-3 py-2 text-xs font-bold text-domify-primary hover:bg-domify-primary hover:text-white"><Eye size={14} /> Ouvrir</button></td></tr>)}</tbody></table>{leads.length === 0 && <div className="p-10 text-center text-sm text-domify-dark/50">Aucun lead ne correspond au filtre sélectionné.</div>}</div>;
}

function LeadDetailPanel({ lead, canOpenProperty, canDelete, busy, onClose, onStatusChange, onDelete }: { lead: LeadCard; canOpenProperty: boolean; canDelete: boolean; busy: boolean; onClose: () => void; onStatusChange: (status: LeadStatus) => void; onDelete: () => void }) {
  return <div role="dialog" aria-modal="true" aria-label={`Détails du lead ${lead.name}`} className="fixed inset-0 z-[110] flex items-end bg-domify-dark/45 p-0 backdrop-blur-[1px] sm:items-center sm:justify-center sm:p-5" onMouseDown={onClose}><section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[2rem] bg-white shadow-[0_30px_90px_-36px_rgba(16,47,66,0.7)] sm:rounded-[2rem]" onMouseDown={(event) => event.stopPropagation()}><div className="sticky top-0 z-10 flex items-start justify-between border-b border-domify-dark/8 bg-white/95 p-5 backdrop-blur sm:p-7"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-domify-gold">Détail du lead</p><h2 className="mt-1 font-display text-2xl font-semibold text-domify-dark">{lead.name}</h2><p className="mt-1 text-sm text-domify-dark/55">Reçu le {formatDate(lead.createdAt)}</p></div><button type="button" onClick={onClose} className="pressable rounded-full p-2 text-domify-dark/50 hover:bg-domify-warm-white hover:text-domify-dark" aria-label="Fermer"><X size={20} /></button></div><div className="space-y-6 p-5 sm:p-7"><div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4" style={{ borderColor: "color-mix(in srgb, var(--color-domify-primary) 12%, transparent)" }}><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-domify-dark/45">Étape du pipeline</p><StatusPill status={lead.status} /></div><select disabled={busy} value={lead.status} onChange={(event) => onStatusChange(event.target.value as LeadStatus)} className="rounded-xl border border-domify-dark/12 bg-white px-3 py-2.5 text-sm font-semibold text-domify-dark disabled:opacity-60">{COLUMNS.map((column) => <option key={column.status} value={column.status}>{column.label}</option>)}</select></div><section><p className="text-xs font-bold uppercase tracking-[0.14em] text-domify-dark/45">Coordonnées</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><a href={`mailto:${lead.email}`} className="pressable flex items-center gap-3 rounded-xl border border-domify-dark/8 bg-domify-warm-white/55 p-3 text-sm text-domify-dark hover:border-domify-primary/25"><Mail size={16} className="text-domify-primary" /><span className="min-w-0 truncate">{lead.email}</span></a>{lead.phone ? <a href={`tel:${lead.phone}`} className="pressable flex items-center gap-3 rounded-xl border border-domify-dark/8 bg-domify-warm-white/55 p-3 text-sm text-domify-dark hover:border-domify-primary/25"><Phone size={16} className="text-domify-primary" /><span>{lead.phone}</span></a> : <div className="flex items-center gap-3 rounded-xl border border-dashed border-domify-dark/10 p-3 text-sm text-domify-dark/45"><Phone size={16} /> Téléphone non renseigné</div>}</div></section><section><p className="text-xs font-bold uppercase tracking-[0.14em] text-domify-dark/45">Projet et demande</p><div className="mt-3 rounded-2xl border border-domify-dark/8 bg-domify-warm-white/45 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><span className="inline-flex items-center gap-2 text-sm font-semibold text-domify-dark"><MessageSquareText size={16} className="text-domify-gold" /> {sourceLabel(lead.source)}</span>{lead.property && (canOpenProperty ? <Link href={`/admin/properties/${lead.property.id}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-domify-primary hover:text-domify-gold"><MapPin size={13} /> {lead.property.title}</Link> : <span className="inline-flex items-center gap-1.5 text-xs font-bold text-domify-primary"><MapPin size={13} /> {lead.property.title}</span>)}</div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-domify-dark/70">{lead.message || "Aucun message n’a été fourni."}</p></div></section><div className="flex flex-col gap-3 rounded-2xl bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-sm text-emerald-800"><CheckCircle2 size={17} className="shrink-0" /> Les changements d’étape sont enregistrés dans l’historique commercial.</div>{canDelete && <button type="button" disabled={busy} onClick={onDelete} className="pressable inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 hover:border-red-600 hover:bg-red-600 hover:text-white disabled:cursor-wait disabled:opacity-60"><Trash2 size={15} /> {busy ? "Suppression…" : "Supprimer le lead"}</button>}</div></div></section></div>;
}

function StatusPill({ status }: { status: LeadStatus }) {
  const meta = statusMeta[status];
  return <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${meta.tone}`}><span className={`h-1.5 w-1.5 rounded-full ${meta.marker}`} /> {meta.label}</span>;
}

function LeadSla({ createdAt }: { createdAt: Date }) {
  const ageHours = Math.floor((Date.now() - new Date(createdAt).getTime()) / 3600000);
  return <span className={`mt-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${ageHours >= 24 ? "bg-red-100 text-red-700" : ageHours >= 1 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}><Clock3 size={11} /> {ageHours >= 24 ? "SLA > 24 h" : ageHours >= 1 ? "SLA dépassé" : "À traiter"}</span>;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium" }).format(new Date(value));
}

function sourceLabel(source: string | null) {
  if (source === "mortgage_calculator_purchase") return "Calculateur crédit — Achat";
  if (source === "valuation_funnel") return "Estimation";
  if (source === "property_detail") return "Fiche propriété";
  return source?.replace(/_/g, " ") || "Demande générale";
}
