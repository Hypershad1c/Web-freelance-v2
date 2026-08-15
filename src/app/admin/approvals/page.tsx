import { redirect } from "next/navigation";
import { ClipboardCheck, Clock3 } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ApprovalActions } from "@/components/admin/ApprovalActions";

export default async function AdminApprovalsPage() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "EDITOR", "AGENT"].includes(session.user.role)) redirect("/admin");

  const properties = await prisma.property.findMany({
    where: { approvalStatus: "PENDING" },
    include: {
      city: { select: { name: true } },
      propertyType: { select: { name: true } },
      submittedBy: { select: { name: true, email: true } },
      agent: { select: { name: true } },
    },
    orderBy: { submittedAt: "asc" },
  });

  return (
    <>
      <AdminTopbar title="Validations" />
      <div className="p-6 lg:p-10">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-domify-gold"><ClipboardCheck size={15} /> Gouvernance éditoriale</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-domify-dark">Propriétés en attente</h2>
            <p className="mt-2 text-sm text-domify-dark/60">Chaque dépôt vendeur ou bailleur doit être vérifié par un administrateur, un éditeur ou un agent avant publication.</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-domify-warm-white font-display text-lg font-semibold text-domify-primary">{properties.length}</span>
        </div>

        {properties.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-domify-dark/15 bg-white p-12 text-center">
            <Clock3 className="mx-auto text-domify-gold" size={28} />
            <p className="mt-4 font-display text-xl font-semibold text-domify-dark">Aucune propriété à valider</p>
            <p className="mt-2 text-sm text-domify-dark/55">Les nouvelles soumissions apparaîtront ici.</p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {properties.map((property) => (
              <article key={property.id} className="rounded-2xl border border-black/7 bg-white p-5 shadow-luxury">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.13em] text-domify-primary/70">{property.city.name} · {property.propertyType.name}</p>
                    <h3 className="mt-2 font-display text-xl font-semibold leading-6 text-domify-dark">{property.title}</h3>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">À valider</span>
                </div>
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-domify-dark/60">{property.description}</p>
                <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-domify-warm-white/60 p-3 text-xs">
                  <div><dt className="text-domify-dark/45">Soumis par</dt><dd className="mt-1 font-semibold text-domify-dark">{property.submittedBy?.name ?? property.submittedBy?.email ?? "—"}</dd></div>
                  <div><dt className="text-domify-dark/45">Agent</dt><dd className="mt-1 font-semibold text-domify-dark">{property.agent?.name ?? "—"}</dd></div>
                </dl>
                <ApprovalActions id={property.id} />
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
