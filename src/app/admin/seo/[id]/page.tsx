import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { SeoEntryForm } from "@/components/admin/SeoEntryForm";
import { updateSeoEntry } from "@/lib/actions/seo";

export default async function EditSeoEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await prisma.seoEntry.findUnique({ where: { id } });
  if (!entry) notFound();

  const updateWithId = updateSeoEntry.bind(null, id);

  return (
    <>
      <AdminTopbar title={`Modifier — ${entry.path}`} />
      <div className="p-6 lg:p-10">
        <SeoEntryForm action={updateWithId} defaultValues={entry} submitLabel="Enregistrer" />
      </div>
    </>
  );
}
