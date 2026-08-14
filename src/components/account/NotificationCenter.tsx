"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, ChevronRight } from "lucide-react";

type NotificationItem = { id: string; title: string; body?: string | null; href?: string | null; readAt?: string | null; createdAt: string };

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => { fetch("/api/notifications").then((response) => response.json()).then((data) => { setNotifications(data.notifications ?? []); setUnread(data.unread ?? 0); }).catch(() => undefined); }, []);

  async function markAllRead() { await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) }); setUnread(0); setNotifications((current) => current.map((item) => ({ ...item, readAt: new Date().toISOString() }))); }

  return <div className="relative"><button onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Ouvrir les notifications" className="relative flex h-11 w-11 items-center justify-center rounded-full border border-domify-dark/8 bg-white text-domify-primary transition-luxury hover:border-domify-gold/40"><Bell size={18} />{unread > 0 && <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-domify-gold px-1 text-[9px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}</button>{open && <div className="absolute right-0 top-14 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-domify-dark/8 bg-white shadow-[0_24px_60px_-24px_rgba(16,47,66,0.4)]"><div className="flex items-center justify-between border-b border-domify-dark/8 px-4 py-3"><div><p className="font-semibold text-domify-dark">Notifications</p><p className="text-xs text-domify-dark/50">Votre activité Domify</p></div>{unread > 0 && <button onClick={markAllRead} className="inline-flex items-center gap-1 text-xs font-semibold text-domify-primary"><CheckCheck size={14} /> Tout lire</button>}</div>{notifications.length === 0 ? <div className="px-5 py-8 text-center text-sm text-domify-dark/55">Aucune notification pour le moment.</div> : <div className="max-h-80 overflow-y-auto">{notifications.map((item) => { const content = <div className={`px-4 py-3 transition-colors hover:bg-domify-warm-white ${!item.readAt ? "bg-domify-gold/5" : ""}`}><div className="flex gap-3"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.readAt ? "bg-domify-dark/15" : "bg-domify-gold"}`} /><div className="min-w-0"><p className="text-sm font-semibold text-domify-dark">{item.title}</p>{item.body && <p className="mt-1 text-xs leading-5 text-domify-dark/55">{item.body}</p>}<p className="mt-1 text-[10px] text-domify-dark/35">{new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium" }).format(new Date(item.createdAt))}</p></div></div></div>; return item.href ? <Link key={item.id} href={item.href}>{content}</Link> : <div key={item.id}>{content}</div>; })}</div>}{notifications.length > 0 && <Link href="/compte" onClick={() => setOpen(false)} className="flex items-center justify-center gap-1 border-t border-domify-dark/8 px-4 py-3 text-xs font-semibold text-domify-primary">Voir mon suivi <ChevronRight size={14} /></Link>}</div>}</div>;
}
