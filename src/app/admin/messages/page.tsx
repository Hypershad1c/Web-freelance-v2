import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ToggleReadButton } from "@/components/admin/ToggleReadButton";
import { toggleMessageRead, deleteMessage } from "@/lib/actions/inbox";
import { cn } from "@/lib/utils";

export default async function AdminMessagesPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "EDITOR") redirect("/admin");

  const messages = await prisma.message.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <>
      <AdminTopbar title="Messages" />
      <div className="p-6 lg:p-10">
        <p className="mb-4 text-sm text-domify-dark/60">
          {messages.filter((m) => !m.read).length} non lu(s) sur {messages.length}
        </p>

        <div className="space-y-3">
          {messages.length === 0 ? (
            <p className="rounded-2xl bg-domify-warm-white p-10 text-center text-domify-dark/60">Aucun message.</p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "rounded-2xl bg-white p-5 shadow-luxury transition-luxury",
                  !m.read && "border-l-4 border-domify-gold"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn("font-medium text-domify-dark", !m.read && "font-semibold")}>{m.name}</p>
                      <span className="text-xs text-domify-dark/40">{m.email}</span>
                    </div>
                    {m.subject && <p className="mt-1 text-sm font-medium text-domify-dark/80">{m.subject}</p>}
                    <p className="mt-2 whitespace-pre-line text-sm text-domify-dark/60">{m.body}</p>
                    <p className="mt-2 text-xs text-domify-dark/40">
                      {new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(m.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <ToggleReadButton read={m.read} action={toggleMessageRead.bind(null, m.id)} />
                    <DeleteButton action={deleteMessage.bind(null, m.id)} confirmLabel={`Supprimer le message de ${m.name} ?`} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
