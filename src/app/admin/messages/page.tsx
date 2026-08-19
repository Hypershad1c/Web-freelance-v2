import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminEmptyState, AdminPageLead } from "@/components/admin/AdminPageLead";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ToggleReadButton } from "@/components/admin/ToggleReadButton";
import { toggleMessageRead, deleteMessage } from "@/lib/actions/inbox";
import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

export default async function AdminMessagesPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "EDITOR") redirect("/admin");

  const messages = await prisma.message.findMany({ orderBy: { createdAt: "desc" } });
  const unread = messages.filter((message) => !message.read).length;

  return (
    <>
      <AdminTopbar title="Messages" />
      <div className="space-y-6 p-6 lg:p-10">
        <AdminPageLead eyebrow="Boîte de réception" title="Gardez chaque demande à portée de vue" description="Les demandes envoyées depuis le site sont regroupées ici pour être lues, suivies et archivées rapidement." icon={Inbox} metric={{ value: unread, label: "non lu(s)" }} />

        <div className="admin-message-queue">
          {messages.length === 0 ? (
            <AdminEmptyState icon={Inbox} title="Votre boîte de réception est à jour" description="Les nouvelles demandes envoyées par les visiteurs apparaîtront ici immédiatement." />
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "admin-message-card",
                  !m.read && "admin-message-card--unread"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn("font-medium text-domify-dark", !m.read && "font-semibold")}>{m.name}</p>
                      {!m.read && <span className="admin-status-chip admin-status-chip--gold">Nouveau</span>}
                    </div>
                    <p className="mt-1 text-xs text-domify-dark/42">{m.email}</p>
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
