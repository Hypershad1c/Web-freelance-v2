import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { updateLeadStatus, deleteLead } from "@/lib/actions/inbox";

const STATUS_OPTIONS = [
  { value: "NEW", label: "Nouveau" },
  { value: "CONTACTED", label: "Contacté" },
  { value: "QUALIFIED", label: "Qualifié" },
  { value: "CONVERTED", label: "Converti" },
  { value: "LOST", label: "Perdu" },
];

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const session = await auth();
  const isAgent = session?.user?.role === "AGENT";

  const agent = isAgent ? await prisma.agent.findUnique({ where: { userId: session!.user.id } }) : null;

  const leads = await prisma.lead.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(isAgent ? { property: { agentId: agent?.id ?? "__none__" } } : {}),
    },
    include: { property: { select: { title: true, id: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <AdminTopbar title={isAgent ? "Mes leads" : "Leads"} />
      <div className="p-6 lg:p-10">
        <form className="mb-6 flex items-center gap-3">
          <select name="status" defaultValue={status ?? ""} className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm">
            <option value="">Tous les statuts</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button className="rounded-xl bg-domify-primary px-4 py-2.5 text-sm font-semibold text-white">Filtrer</button>
        </form>

        <div className="overflow-hidden rounded-2xl bg-white shadow-luxury">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 bg-domify-warm-white/50 text-xs uppercase tracking-wide text-domify-dark/50">
              <tr>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Propriété</th>
                <th className="px-5 py-3 font-medium">Message</th>
                <th className="px-5 py-3 font-medium">Reçu le</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                {!isAgent && <th className="px-5 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {leads.length === 0 ? (
                <tr><td colSpan={isAgent ? 5 : 6} className="px-5 py-10 text-center text-domify-dark/50">Aucun lead.</td></tr>
              ) : leads.map((lead) => (
                <tr key={lead.id} className="align-top hover:bg-domify-warm-white/30">
                  <td className="px-5 py-3">
                    <p className="font-medium text-domify-dark">{lead.name}</p>
                    <p className="text-xs text-domify-dark/50">{lead.email}</p>
                    {lead.phone && <p className="text-xs text-domify-dark/50">{lead.phone}</p>}
                  </td>
                  <td className="px-5 py-3 text-domify-dark/70">
                    {lead.property ? (
                      isAgent ? (
                        lead.property.title
                      ) : (
                        <Link href={`/admin/properties/${lead.property.id}`} className="text-domify-primary hover:text-domify-gold">
                          {lead.property.title}
                        </Link>
                      )
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="max-w-xs px-5 py-3 text-domify-dark/60">
                    <p className="line-clamp-2">{lead.message || "—"}</p>
                  </td>
                  <td className="px-5 py-3 text-xs text-domify-dark/50">
                    {new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(lead.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusSelect value={lead.status} options={STATUS_OPTIONS} action={updateLeadStatus.bind(null, lead.id)} />
                  </td>
                  {!isAgent && (
                    <td className="px-5 py-3 text-right">
                      <DeleteButton action={deleteLead.bind(null, lead.id)} confirmLabel={`Supprimer le lead de ${lead.name} ?`} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
