"use client";

import { useState, useTransition } from "react";
import { Bell, CheckCheck, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";

type NotificationItem = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export function NotificationBell({ notifications }: { notifications: NotificationItem[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

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

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute right-0 z-50 mt-3 w-[min(92vw,24rem)] origin-top-right overflow-hidden rounded-2xl border border-domify-dark/8 bg-white/98 shadow-[0_22px_46px_-24px_rgba(16,47,66,0.42)] backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-domify-dark/7 px-4 py-3.5">
              <div>
                <p className="font-display text-base font-semibold text-domify-dark">Notifications</p>
                <p className="mt-0.5 text-xs text-domify-dark/50">{unreadCount ? `${unreadCount} non lue(s)` : "Tout est à jour"}</p>
              </div>
              <button
                type="button"
                onClick={markAllRead}
                disabled={unreadCount === 0 || isPending}
                className="pressable flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-domify-primary hover:bg-domify-warm-white disabled:opacity-40"
              >
                {isPending ? <LoaderCircle size={13} className="animate-spin" /> : <CheckCheck size={14} />} Tout lire
              </button>
            </div>
            <div className="max-h-[24rem] overflow-y-auto p-1.5">
              {notifications.length === 0 ? (
                <p className="m-1 rounded-xl bg-domify-warm-white/70 px-4 py-8 text-center text-sm text-domify-dark/50">Aucune notification pour le moment.</p>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => openNotification(notification)}
                    disabled={isPending}
                    className={`pressable block w-full rounded-xl px-3 py-3 text-left ${notification.readAt ? "bg-white hover:bg-domify-warm-white/60" : "bg-domify-warm-white/70 hover:bg-domify-warm-white"}`}
                  >
                    <span className="flex items-start gap-2.5">
                      {!notification.readAt && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-domify-gold" />}
                      <span className={notification.readAt ? "pl-4" : ""}>
                        <span className="block text-sm font-semibold text-domify-dark">{notification.title}</span>
                        {notification.body && <span className="mt-1 block text-xs leading-5 text-domify-dark/60">{notification.body}</span>}
                        <span className="mt-1.5 block text-[0.68rem] text-domify-dark/40">{new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(notification.createdAt))}</span>
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
