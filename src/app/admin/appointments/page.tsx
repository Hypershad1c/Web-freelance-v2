import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { updateAppointmentStatus, deleteAppointment } from "@/lib/actions/inbox";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "En attente" },
  { value: "CONFIRMED", label: "Confirmé" },
  { value: "CANCELLED", label: "Annulé" },
  { value: "COMPLETED", label: "Terminé" },
];

export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const session = await auth();
  const isAgent = session?.user?.role === "AGENT";

  const agent = isAgent ? await prisma.agent.findUnique({ where: { userId: session!.user.id } }) : null;

  const appointments = await prisma.appointment.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(isAgent ? { agentId: agent?.id ?? "__none__" } : {}),
    },
    include: { property: { select: { title: true, id: true } }, agent: { select: { name: true } } },
    orderBy: { date: "asc" },
  });

  return (
    <>
      <AdminTopbar title={isAgent ? "Mes rendez-vous" : "Rendez-vous"} />
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
                {!isAgent && <th className="px-5 py-3 font-medium">Agent</th>}
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                {!isAgent && <th className="px-5 py-3 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {appointments.length === 0 ? (
                <tr><td colSpan={isAgent ? 4 : 6} className="px-5 py-10 text-center text-domify-dark/50">Aucun rendez-vous.</td></tr>
              ) : appointments.map((appt) => (
                <tr key={appt.id} className="align-top hover:bg-domify-warm-white/30">
                  <td className="px-5 py-3">
                    <p className="font-medium text-domify-dark">{appt.name}</p>
                    <p className="text-xs text-domify-dark/50">{appt.email}</p>
                    {appt.phone && <p className="text-xs text-domify-dark/50">{appt.phone}</p>}
                  </td>
                  <td className="px-5 py-3 text-domify-dark/70">
                    {appt.property ? (
                      isAgent ? (
                        appt.property.title
                      ) : (
                        <Link href={`/admin/properties/${appt.property.id}`} className="text-domify-primary hover:text-domify-gold">
                          {appt.property.title}
                        </Link>
                      )
                    ) : (
                      "—"
                    )}
                  </td>
                  {!isAgent && <td className="px-5 py-3 text-domify-dark/70">{appt.agent?.name ?? "—"}</td>}
                  <td className="px-5 py-3 text-xs text-domify-dark/50">
                    {new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(appt.date)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusSelect value={appt.status} options={STATUS_OPTIONS} action={updateAppointmentStatus.bind(null, appt.id)} />
                  </td>
                  {!isAgent && (
                    <td className="px-5 py-3 text-right">
                      <DeleteButton action={deleteAppointment.bind(null, appt.id)} confirmLabel={`Supprimer le RDV de ${appt.name} ?`} />
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
