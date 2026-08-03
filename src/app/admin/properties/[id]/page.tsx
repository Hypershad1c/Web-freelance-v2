import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { updateProperty } from "@/lib/actions/properties";

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (session?.user?.role === "AGENT") redirect("/admin/properties");

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

  const updateWithId = updateProperty.bind(null, id);

  return (
    <>
      <AdminTopbar title={`Modifier — ${property.title}`} />
      <div className="p-6 lg:p-10">
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
