import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { CsvPropertyImport } from "@/components/admin/CsvPropertyImport";
import { PropertiesTable } from "@/components/admin/PropertiesTable";

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const session = await auth();
  const isAgent = session?.user?.role === "AGENT";

  const agent = isAgent ? await prisma.agent.findUnique({ where: { userId: session!.user.id } }) : null;

  const properties = await prisma.property.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { reference: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        status ? { status: status as never } : {},
        isAgent ? { agentId: agent?.id ?? "__none__" } : {},
      ],
    },
    include: { city: true, propertyType: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <AdminTopbar title={isAgent ? "Mes propriétés" : "Propriétés"} />
      <div className="p-6 lg:p-10">
        {isAgent && (
          <div className="mb-6 rounded-xl bg-domify-warm-white p-4 text-sm text-domify-dark/70">
            Gérez vos propres annonces et soumettez-les à validation. Un administrateur ou un éditeur devra approuver toute publication.
          </div>
        )}

        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <form className="flex flex-1 flex-col gap-3 sm:flex-row">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Rechercher par titre ou référence..."
              className="w-full max-w-sm rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm"
            />
            <select name="status" defaultValue={status ?? ""} className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm">
              <option value="">Tous les statuts</option>
              <option value="DRAFT">Brouillon</option>
              <option value="PUBLISHED">Publié</option>
              <option value="UNDER_OFFER">Sous offre</option>
              <option value="SOLD">Vendu</option>
              <option value="ARCHIVED">Archivé</option>
            </select>
            <button className="rounded-xl bg-domify-primary px-4 py-2.5 text-sm font-semibold text-white">Filtrer</button>
          </form>

          <div className="flex flex-wrap items-center gap-3">
            {!isAgent && <CsvPropertyImport />}
            <Link
              href="/admin/properties/new"
              className="flex items-center gap-2 whitespace-nowrap rounded-xl bg-domify-gold px-4 py-2.5 text-sm font-semibold text-white shadow-luxury transition-luxury hover:bg-domify-soft-gold hover:text-domify-dark"
            >
              <Plus size={16} /> Nouvelle propriété
            </Link>
          </div>
        </div>

        <PropertiesTable properties={properties} isAgent={isAgent} />
      </div>
    </>
  );
}
