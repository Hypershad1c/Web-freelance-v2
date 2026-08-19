import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminEmptyState, AdminPageLead } from "@/components/admin/AdminPageLead";
import { InlineCreateForm } from "@/components/admin/InlineCreateForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { createNeighborhood, deleteNeighborhood } from "@/lib/actions/locations";
import { MapPin } from "lucide-react";

export default async function AdminNeighborhoodsPage() {
  const [neighborhoods, cities] = await Promise.all([
    prisma.neighborhood.findMany({
      include: { city: true, _count: { select: { properties: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.city.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <AdminTopbar title="Quartiers" />
      <div className="space-y-6 p-6 lg:p-10">
        <AdminPageLead eyebrow="Découverte locale" title="Donnez du relief à chaque quartier" description="Les quartiers connectent les propriétés aux pages de destination et aux recherches précises des acquéreurs." icon={MapPin} metric={{ value: neighborhoods.length, label: "quartier(s)" }} />
        <section className="admin-form-section"><div><p className="admin-eyebrow">Nouvelle zone</p><h3>Ajouter un quartier</h3><p>Associez chaque quartier à une ville existante afin de préserver la cohérence du catalogue.</p></div>
        <InlineCreateForm action={createNeighborhood} submitLabel="Ajouter le quartier">
          <input name="name" placeholder="Nom (ex. Anfa)" required className="w-full" />
          <input name="slug" placeholder="slug (ex. anfa)" required className="w-full" />
          <select name="cityId" required className="w-full" defaultValue="">
            <option value="">Ville...</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input name="description" placeholder="Description (optionnel)" className="w-full" />
        </InlineCreateForm>
        </section>

        {neighborhoods.length === 0 ? <AdminEmptyState icon={MapPin} title="Aucun quartier n’est encore défini" description="Ajoutez un quartier pour enrichir les pages locales et les recherches de précision." /> : <div className="admin-data-panel overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 bg-domify-warm-white/50 text-xs uppercase tracking-wide text-domify-dark/50">
              <tr>
                <th className="px-5 py-3 font-medium">Quartier</th>
                <th className="px-5 py-3 font-medium">Ville</th>
                <th className="px-5 py-3 font-medium">Propriétés</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {neighborhoods.map((n) => (
                <tr key={n.id} className="hover:bg-domify-warm-white/30">
                  <td className="px-5 py-3 font-medium text-domify-dark">{n.name}</td>
                  <td className="px-5 py-3 text-domify-dark/60">{n.city.name}</td>
                  <td className="px-5 py-3 text-domify-dark/70">{n._count.properties}</td>
                  <td className="px-5 py-3 text-right">
                    <DeleteButton
                      action={deleteNeighborhood.bind(null, n.id)}
                      confirmLabel={`Supprimer ${n.name} ?`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>}
      </div>
    </>
  );
}
