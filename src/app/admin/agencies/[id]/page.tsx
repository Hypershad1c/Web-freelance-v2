import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AgencyForm } from "@/components/admin/AgencyForm";
import { updateAgency } from "@/lib/actions/network";

export default async function EditAgencyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agency = await prisma.agency.findUnique({ where: { id } });
  if (!agency) notFound();

  const updateWithId = updateAgency.bind(null, id);

  return (
    <>
      <AdminTopbar title={`Modifier — ${agency.name}`} />
      <div className="p-6 lg:p-10">
        <AgencyForm action={updateWithId} defaultValues={agency} submitLabel="Enregistrer" />
      </div>
    </>
  );
}
