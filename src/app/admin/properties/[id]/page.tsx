import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { updateProperty } from "@/lib/actions/properties";
import { SubmitForApprovalButton } from "@/components/admin/SubmitForApprovalButton";

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const [property, cities, neighborhoods, propertyTypes, agencies, agents, amenities] = await Promise.all([
    prisma.property.findUnique({ where: { id }, include: { amenities: true, media: { orderBy: { order: "asc" } } } }),
    prisma.city.findMany({ orderBy: { name: "asc" } }),
    prisma.neighborhood.findMany({ orderBy: { name: "asc" } }),
    prisma.propertyType.findMany({ orderBy: { name: "asc" } }),
    prisma.agency.findMany({ orderBy: { name: "asc" } }),
    prisma.agent.findMany({ orderBy: { name: "asc" } }),
    prisma.amenity.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!property) notFound();
  if (session?.user?.role === "AGENT") {
    const agent = await prisma.agent.findUnique({ where: { userId: session.user.id }, select: { id: true } });
    if (!agent || property.agentId !== agent.id) redirect("/admin/properties");
  }

  const updateWithId = updateProperty.bind(null, id);

  return (
    <>
      <AdminTopbar title={`Modifier — ${property.title}`} />
      <div className="p-6 lg:p-10">
        {(session?.user?.role === "EDITOR" || session?.user?.role === "AGENT") && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-domify-gold/25 bg-domify-warm-white/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-domify-dark">Validation administrative</p>
              <p className="mt-1 text-xs text-domify-dark/60">
                {property.approvalStatus === "PENDING" ? "Ce brouillon est déjà en attente d’approbation." : property.approvalStatus === "REJECTED" ? `Corrections demandées : ${property.rejectionReason ?? "voir le journal d’audit"}` : "Enregistrez vos modifications puis soumettez le brouillon à l’administrateur."}
              </p>
            </div>
            <SubmitForApprovalButton id={property.id} pending={property.approvalStatus === "PENDING"} />
          </div>
        )}
        <PropertyForm
          action={updateWithId}
          cities={cities}
          neighborhoods={neighborhoods}
          propertyTypes={propertyTypes}
          agencies={agencies}
          agents={agents}
          amenities={amenities}
          defaultValues={{
            ...property,
            floors: property.floors,
            yearBuilt: property.yearBuilt,
            amenityIds: property.amenities.map((a) => a.id),
            imageUrls: property.media.map((m) => m.url).join("\n"),
          }}
          submitLabel="Enregistrer les modifications"
        />
      </div>
    </>
  );
}
