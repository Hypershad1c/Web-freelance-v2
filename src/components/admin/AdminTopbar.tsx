import { auth } from "@/lib/auth";
import { signOutAction } from "@/lib/actions/auth";
import { LogOut } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { NotificationBell } from "@/components/admin/NotificationBell";

export async function AdminTopbar({ title }: { title: string }) {
  const session = await auth();
  const notifications = session?.user?.id
    ? await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, title: true, body: true, href: true, readAt: true, createdAt: true },
      })
    : [];

  return (
    <header className="relative flex min-h-16 items-center justify-between border-b border-domify-dark/7 bg-white/88 px-4 backdrop-blur-xl lg:min-h-20 lg:px-10">
      <div className="min-w-0">
        <p className="mb-1 hidden text-[10px] font-bold uppercase tracking-[0.18em] text-domify-gold sm:block">Espace de gestion</p>
        <h1 className="truncate font-display text-lg font-semibold text-domify-dark sm:text-2xl">{title}</h1>
      </div>
      <div className="ml-4 flex shrink-0 items-center gap-2.5 sm:gap-4">
        <NotificationBell notifications={notifications} />
        <div className="hidden items-center gap-2.5 border-l border-domify-dark/8 pl-4 sm:flex">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-domify-gold/25 bg-domify-warm-white font-display text-sm font-semibold text-domify-primary">
            {(session?.user?.name ?? session?.user?.email ?? "A").charAt(0).toUpperCase()}
          </span>
          <div className="max-w-36 text-left">
            <p className="truncate text-sm font-semibold text-domify-dark">{session?.user?.name ?? session?.user?.email}</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.13em] text-domify-dark/48">{session?.user?.role}</p>
          </div>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="pressable flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-domify-dark/8 bg-white text-domify-dark/60 shadow-[0_9px_18px_-16px_rgba(16,47,66,0.65)] hover:border-domify-gold/35 hover:text-domify-primary"
            aria-label="Se déconnecter"
          >
            <LogOut size={15} />
          </button>
        </form>
      </div>
    </header>
  );
}
