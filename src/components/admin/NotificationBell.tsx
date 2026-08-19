"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Bell, CheckCheck, ChevronRight, Inbox, LoaderCircle, MessageCircle, ShieldCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export function NotificationBell({ notifications }: { notifications: NotificationItem[] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;
  const unreadNotifications = useMemo(() => notifications.filter((notification) => !notification.readAt), [notifications]);
  const earlierNotifications = useMemo(() => notifications.filter((notification) => notification.readAt), [notifications]);

  useEffect(() => setMounted(true), []);

  function openNotification(notification: NotificationItem) {
    startTransition(async () => {
      if (!notification.readAt) await markNotificationRead(notification.id);
      setOpen(false);
      if (notification.href) router.push(notification.href);
      else router.refresh();
    });
  }

  function markAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="pressable relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-domify-dark/8 bg-white text-domify-dark/60 shadow-[0_9px_18px_-16px_rgba(16,47,66,0.65)] hover:border-domify-gold/35 hover:bg-domify-primary hover:text-white"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-domify-gold px-1 text-[9px] font-bold text-white shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {mounted && createPortal(<AnimatePresence>{open && <><motion.button type="button" aria-label="Fermer les notifications" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduceMotion ? undefined : { opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 z-[120] cursor-default bg-domify-primary-dark/32 backdrop-blur-[2px]" /><motion.aside initial={reduceMotion ? false : { opacity: 0, x: 34 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: 34 }} transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }} className="fixed inset-y-0 right-0 z-[121] flex w-full max-w-[26rem] flex-col border-l border-domify-dark/8 bg-[#fcfbf8]/98 shadow-[-24px_0_60px_-34px_rgba(16,47,66,0.5)] backdrop-blur-xl">
        <div className="admin-safe-top border-b border-domify-dark/7 px-5 pb-4 pt-5 sm:px-6"><div className="flex items-start justify-between gap-3"><div><p className="admin-eyebrow">Centre de notifications</p><h2 className="mt-1 font-display text-2xl font-semibold text-domify-dark">À suivre</h2><p className="mt-2 text-sm text-domify-dark/55">{unreadCount ? `${unreadCount} alerte${unreadCount > 1 ? "s" : ""} demande${unreadCount > 1 ? "nt" : ""} votre attention.` : "Votre espace est à jour."}</p></div><button type="button" onClick={() => setOpen(false)} className="pressable flex h-10 w-10 items-center justify-center rounded-xl border border-domify-dark/8 bg-white text-domify-dark/60 hover:text-domify-primary" aria-label="Fermer"><X size={17} /></button></div><button type="button" onClick={markAllRead} disabled={unreadCount === 0 || isPending} className="pressable mt-4 inline-flex items-center gap-2 rounded-xl bg-domify-primary px-3 py-2 text-xs font-semibold text-white hover:bg-domify-primary-dark disabled:opacity-40">{isPending ? <LoaderCircle size={13} className="animate-spin" /> : <CheckCheck size={14} />} Tout marquer comme lu</button></div>
        <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-4">{notifications.length === 0 ? <div className="admin-empty-state m-2"><Inbox size={20} /><p><strong>Aucune notification.</strong><span>Les alertes opérationnelles apparaîtront ici.</span></p></div> : <>{unreadNotifications.length > 0 && <NotificationGroup label="À traiter" notifications={unreadNotifications} onOpen={openNotification} pending={isPending} />}{earlierNotifications.length > 0 && <NotificationGroup label="Historique récent" notifications={earlierNotifications} onOpen={openNotification} pending={isPending} muted />}</>}</div>
      </motion.aside></>}</AnimatePresence>, document.body)}
    </div>
  );
}

function NotificationGroup({ label, notifications, onOpen, pending, muted = false }: { label: string; notifications: NotificationItem[]; onOpen: (notification: NotificationItem) => void; pending: boolean; muted?: boolean }) {
  return <section className="mb-6"><p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-domify-dark/42">{label}</p><div className="space-y-2">{notifications.map((notification) => { const Icon = notification.type === "MESSAGE" ? MessageCircle : notification.type === "APPROVAL_REQUEST" ? ShieldCheck : Inbox; return <button key={notification.id} type="button" onClick={() => onOpen(notification)} disabled={pending} className={`pressable flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left ${muted ? "border-domify-dark/6 bg-white/65" : "border-domify-gold/20 bg-domify-warm-white/80 shadow-[0_16px_28px_-26px_rgba(16,47,66,0.45)]"}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${muted ? "bg-domify-warm-white text-domify-dark/45" : "bg-domify-primary text-domify-soft-gold"}`}><Icon size={16} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-domify-dark">{notification.title}</span>{notification.body && <span className="mt-1 block text-xs leading-5 text-domify-dark/58">{notification.body}</span>}<span className="mt-2 block text-[0.68rem] font-medium text-domify-dark/40">{new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(notification.createdAt))}</span></span><ChevronRight size={15} className="mt-1 shrink-0 text-domify-dark/35" /></button>; })}</div></section>;
}
