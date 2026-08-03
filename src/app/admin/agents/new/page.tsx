import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AgentForm } from "@/components/admin/AgentForm";
import { createAgent } from "@/lib/actions/network";

export default async function NewAgentPage() {
  const agencies = await prisma.agency.findMany({ orderBy: { name: "asc" } });
  return (
    <>
      <AdminTopbar title="Nouvel agent" />
      <div className="p-6 lg:p-10">
        <AgentForm action={createAgent} agencies={agencies} submitLabel="Créer l'agent" />
      </div>
    </>
  );
}
