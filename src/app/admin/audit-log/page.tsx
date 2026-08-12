import { redirect } from "next/navigation";
import { ScrollText } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

export default async function AuditLogPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/admin");

  const logs = await prisma.auditLog.findMany({
    include: { actor: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <AdminTopbar title="Journal d’audit" />
      <div className="p-6 lg:p-10">
        <div className="mb-7">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-domify-gold"><ScrollText size={15} /> Traçabilité</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-domify-dark">Historique des opérations</h2>
          <p className="mt-2 text-sm text-domify-dark/60">Les 200 dernières actions sensibles sont conservées ici pour contrôle administratif.</p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-black/7 bg-white shadow-luxury">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/5 bg-domify-warm-white/50 text-xs uppercase tracking-wide text-domify-dark/50">
                <tr><th className="px-5 py-3 font-medium">Date</th><th className="px-5 py-3 font-medium">Acteur</th><th className="px-5 py-3 font-medium">Action</th><th className="px-5 py-3 font-medium">Cible</th><th className="px-5 py-3 font-medium">Résumé</th></tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {logs.length === 0 ? <tr><td colSpan={5} className="px-5 py-10 text-center text-domify-dark/50">Aucune activité auditée pour le moment.</td></tr> : logs.map((log) => (
                  <tr key={log.id} className="align-top hover:bg-domify-warm-white/30">
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-domify-dark/55">{new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(log.createdAt)}</td>
                    <td className="px-5 py-3 text-domify-dark/70">{log.actor?.name ?? log.actor?.email ?? "Système"}</td>
                    <td className="px-5 py-3"><span className="rounded-full bg-domify-warm-white px-2.5 py-1 text-xs font-semibold text-domify-primary">{log.action}</span></td>
                    <td className="px-5 py-3 text-xs text-domify-dark/55">{log.entityType} · {log.entityId}</td>
                    <td className="max-w-md px-5 py-3 text-domify-dark/65">{log.summary ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
