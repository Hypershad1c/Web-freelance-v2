import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { InlineCreateForm } from "@/components/admin/InlineCreateForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { createNeighborhood, deleteNeighborhood } from "@/lib/actions/locations";

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
        <InlineCreateForm action={createNeighborhood} submitLabel="Ajouter le quartier">
          <input name="name" placeholder="Nom (ex. Anfa)" required className="input" />
          <input name="slug" placeholder="slug (ex. anfa)" required className="input" />
          <select name="cityId" required className="input" defaultValue="">
            <option value="">Ville...</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input name="description" placeholder="Description (optionnel)" className="input" />
        </InlineCreateForm>

        <div className="overflow-hidden rounded-2xl bg-white shadow-luxury">
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
      </div>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(31,41,55,0.12);
          padding: 0.65rem 0.9rem;
          font-size: 0.875rem;
          background: white;
        }
      `}</style>
    </>
  );
}
