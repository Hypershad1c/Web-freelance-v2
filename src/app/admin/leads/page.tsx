import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { LeadKanbanBoard } from "@/components/admin/LeadKanbanBoard";

const STATUS_OPTIONS = [
  { value: "", label: "Toutes les étapes" },
  { value: "NEW", label: "Nouveaux" },
  { value: "CONTACTED", label: "Contactés" },
  { value: "QUALIFIED", label: "Qualifiés" },
  { value: "CONVERTED", label: "Convertis" },
  { value: "LOST", label: "Perdus" },
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
    orderBy: [{ status: "asc" }, { position: "asc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <AdminTopbar title={isAgent ? "Mes leads" : "Pipeline des leads"} />
      <div className="p-6 lg:p-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-xl font-semibold text-domify-dark">Faites progresser chaque opportunité</p>
            <p className="mt-1 text-sm text-domify-dark/60">Glissez un lead d&apos;une étape à une autre. Chaque mouvement est historisé.</p>
          </div>
          <form className="flex items-center gap-2">
            <select name="status" defaultValue={status ?? ""} className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm">
              {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <button className="rounded-xl bg-domify-primary px-4 py-2.5 text-sm font-semibold text-white">Filtrer</button>
          </form>
        </div>
        <LeadKanbanBoard leads={leads} canOpenProperty={!isAgent} />
      </div>
    </>
  );
}
