import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { createProperty } from "@/lib/actions/properties";

export default async function NewPropertyPage() {
  const session = await auth();
  if (session?.user?.role === "AGENT") redirect("/admin/properties");

  const [cities, neighborhoods, propertyTypes, agencies, agents, amenities] = await Promise.all([
    prisma.city.findMany({ orderBy: { name: "asc" } }),
    prisma.neighborhood.findMany({ orderBy: { name: "asc" } }),
    prisma.propertyType.findMany({ orderBy: { name: "asc" } }),
    prisma.agency.findMany({ orderBy: { name: "asc" } }),
    prisma.agent.findMany({ orderBy: { name: "asc" } }),
    prisma.amenity.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <AdminTopbar title="Nouvelle propriété" />
      <div className="p-6 lg:p-10">
        <PropertyForm
          action={createProperty}
          cities={cities}
          neighborhoods={neighborhoods}
          propertyTypes={propertyTypes}
          agencies={agencies}
          agents={agents}
          amenities={amenities}
          submitLabel="Créer la propriété"
        />
      </div>
    </>
  );
}
