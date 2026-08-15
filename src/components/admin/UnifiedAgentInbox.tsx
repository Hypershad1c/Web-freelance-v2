"use client";

import { useMemo, useState } from "react";
import { CalendarClock, ChevronRight, Inbox, Mail, MessageCircle, UserRound } from "lucide-react";
import Link from "next/link";

type InboxEvent = {
  id: string;
  kind: "portal" | "lead" | "appointment" | "contact";
  title: string;
  subtitle: string;
  createdAt: string;
  href: string;
  unread?: boolean;
};

const FILTERS = [
  { value: "all", label: "Tout" },
  { value: "portal", label: "Propriétaires" },
  { value: "lead", label: "Leads" },
  { value: "appointment", label: "Visites" },
  { value: "contact", label: "Contact" },
] as const;

const ICONS = { portal: MessageCircle, lead: UserRound, appointment: CalendarClock, contact: Mail };

export function UnifiedAgentInbox({ events }: { events: InboxEvent[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("all");
  const visibleEvents = useMemo(() => filter === "all" ? events : events.filter((event) => event.kind === filter), [events, filter]);
  const unreadCount = events.filter((event) => event.unread).length;

  return (
    <section className="rounded-[1.45rem] border border-domify-dark/8 bg-white p-5 shadow-[0_20px_42px_-34px_rgba(16,47,66,0.45)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="luxury-eyebrow text-domify-gold">Centre de pilotage</p><h2 className="mt-2 font-display text-2xl font-semibold text-domify-dark">Boîte de réception unifiée</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-domify-dark/60">Un seul endroit pour traiter les propriétaires, les leads, les visites et les demandes entrantes.</p></div><div className="inline-flex w-fit items-center gap-2 rounded-full bg-domify-warm-white px-3 py-2 text-xs font-semibold text-domify-primary"><Inbox size={14} /> {unreadCount} priorité(s)</div></div>
      <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Filtrer la boîte de réception">{FILTERS.map((item) => <button type="button" key={item.value} onClick={() => setFilter(item.value)} className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors ${filter === item.value ? "bg-domify-primary text-white" : "bg-domify-warm-white text-domify-dark/60 hover:bg-domify-gold/10 hover:text-domify-primary"}`} role="tab" aria-selected={filter === item.value}>{item.label}</button>)}</div>
      <div className="mt-5 space-y-2">{visibleEvents.length === 0 ? <div className="rounded-2xl bg-domify-warm-white p-6 text-center text-sm text-domify-dark/55">Aucun élément dans cette vue.</div> : visibleEvents.map((event) => { const Icon = ICONS[event.kind]; return <Link key={`${event.kind}-${event.id}`} href={event.href} className="group flex items-center gap-3 rounded-2xl border border-domify-dark/7 p-4 transition-colors hover:border-domify-gold/35 hover:bg-domify-warm-white/50"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${event.unread ? "bg-domify-gold/15 text-domify-gold" : "bg-domify-warm-white text-domify-primary/70"}`}><Icon size={18} /></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className={`truncate text-sm text-domify-dark ${event.unread ? "font-bold" : "font-semibold"}`}>{event.title}</span>{event.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-domify-gold" />}</span><span className="mt-1 block truncate text-xs text-domify-dark/55">{event.subtitle}</span><span className="mt-2 block text-[0.68rem] text-domify-dark/40">{new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.createdAt))}</span></span><ChevronRight className="shrink-0 text-domify-dark/25 transition-transform group-hover:translate-x-0.5 group-hover:text-domify-gold" size={17} /></Link>; })}</div>
    </section>
  );
}
