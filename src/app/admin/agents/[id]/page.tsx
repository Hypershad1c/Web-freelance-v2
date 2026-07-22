import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AgentForm } from "@/components/admin/AgentForm";
import { updateAgent } from "@/lib/actions/network";

export default async function EditAgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [agent, agencies] = await Promise.all([
    prisma.agent.findUnique({ where: { id } }),
    prisma.agency.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!agent) notFound();

  const updateWithId = updateAgent.bind(null, id);

  return (
    <>
      <AdminTopbar title={`Modifier — ${agent.name}`} />
      <div className="p-6 lg:p-10">
        <AgentForm action={updateWithId} agencies={agencies} defaultValues={agent} submitLabel="Enregistrer" />
      </div>
    </>
  );
}
