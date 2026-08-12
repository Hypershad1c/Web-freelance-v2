"use client";

import { useState, useTransition } from "react";
import { Bell, CheckCheck, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
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
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-domify-warm-white text-domify-dark/60 transition-luxury hover:bg-domify-primary hover:text-white"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-domify-gold px-1 text-[9px] font-bold text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-[min(92vw,24rem)] overflow-hidden rounded-2xl border border-black/8 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-black/7 px-4 py-3">
            <div>
              <p className="font-display text-base font-semibold text-domify-dark">Notifications</p>
              <p className="text-xs text-domify-dark/50">{unreadCount ? `${unreadCount} non lue(s)` : "Tout est à jour"}</p>
            </div>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0 || isPending}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-domify-primary transition-luxury hover:bg-domify-warm-white disabled:opacity-40"
            >
              {isPending ? <LoaderCircle size={13} className="animate-spin" /> : <CheckCheck size={14} />} Tout lire
            </button>
          </div>
          <div className="max-h-[24rem] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-domify-dark/50">Aucune notification pour le moment.</p>
            ) : notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => openNotification(notification)}
                disabled={isPending}
                className={`block w-full border-b border-black/5 px-4 py-3 text-left transition-colors hover:bg-domify-warm-white/65 ${notification.readAt ? "bg-white" : "bg-domify-warm-white/55"}`}
              >
                <span className="flex items-start gap-2">
                  {!notification.readAt && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-domify-gold" />}
                  <span className={notification.readAt ? "pl-3.5" : ""}>
                    <span className="block text-sm font-semibold text-domify-dark">{notification.title}</span>
                    {notification.body && <span className="mt-1 block text-xs leading-5 text-domify-dark/60">{notification.body}</span>}
                    <span className="mt-1.5 block text-[0.68rem] text-domify-dark/40">{new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(notification.createdAt))}</span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
