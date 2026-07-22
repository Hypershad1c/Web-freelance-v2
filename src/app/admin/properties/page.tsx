import Link from "next/link";
import { Plus, Pencil, Star, Eye } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { DeletePropertyButton } from "@/components/admin/DeletePropertyButton";
import { formatMAD } from "@/lib/utils";

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
            Vue en lecture seule de vos propriétés. Pour toute modification, contactez un administrateur ou un éditeur.
          </div>
        )}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form className="flex flex-1 gap-3">
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
          {!isAgent && (
            <Link
              href="/admin/properties/new"
              className="flex items-center gap-2 whitespace-nowrap rounded-xl bg-domify-gold px-4 py-2.5 text-sm font-semibold text-white shadow-luxury transition-luxury hover:bg-domify-soft-gold hover:text-domify-dark"
            >
              <Plus size={16} /> Nouvelle propriété
            </Link>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-luxury">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 bg-domify-warm-white/50 text-xs uppercase tracking-wide text-domify-dark/50">
              <tr>
                <th className="px-5 py-3 font-medium">Bien</th>
                <th className="px-5 py-3 font-medium">Ville</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Prix</th>
                <th className="px-5 py-3 font-medium">Vues</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {properties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-domify-dark/50">
                    {isAgent ? (
                      "Aucune propriété ne vous est assignée pour le moment."
                    ) : (
                      <>Aucune propriété trouvée. <Link href="/admin/properties/new" className="text-domify-primary font-medium">Créer la première →</Link></>
                    )}
                  </td>
                </tr>
              ) : (
                properties.map((p) => (
                  <tr key={p.id} className="hover:bg-domify-warm-white/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {p.featured && <Star size={13} className="text-domify-gold" fill="currentColor" />}
                        <div>
                          <p className="font-medium text-domify-dark">{p.title}</p>
                          <p className="text-xs text-domify-dark/40">{p.reference}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-domify-dark/70">{p.city.name}</td>
                    <td className="px-5 py-3 text-domify-dark/70">{p.propertyType.name}</td>
                    <td className="px-5 py-3 font-medium text-domify-dark">{formatMAD(p.price)}</td>
                    <td className="px-5 py-3 text-domify-dark/70">
                      <span className="flex items-center gap-1.5"><Eye size={13} className="text-domify-dark/30" /> {p.viewsCount}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-domify-warm-white px-2.5 py-1 text-xs font-medium text-domify-dark/70">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {isAgent ? (
                          <Link
                            href={`/proprietes/${p.id}`}
                            target="_blank"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-domify-dark/40 hover:bg-domify-warm-white hover:text-domify-primary"
                            aria-label="Voir sur le site"
                          >
                            <Eye size={15} />
                          </Link>
                        ) : (
                          <>
                            <Link
                              href={`/admin/properties/${p.id}`}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-domify-dark/40 hover:bg-domify-warm-white hover:text-domify-primary"
                              aria-label="Modifier"
                            >
                              <Pencil size={15} />
                            </Link>
                            <DeletePropertyButton id={p.id} title={p.title} />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
