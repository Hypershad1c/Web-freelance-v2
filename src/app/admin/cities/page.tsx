import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { InlineCreateForm } from "@/components/admin/InlineCreateForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { createCity, deleteCity } from "@/lib/actions/locations";

export default async function AdminCitiesPage() {
  const cities = await prisma.city.findMany({
    include: { _count: { select: { properties: true, neighborhoods: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <AdminTopbar title="Villes" />
      <div className="space-y-6 p-6 lg:p-10">
        <InlineCreateForm action={createCity} submitLabel="Ajouter la ville">
          <input name="name" placeholder="Nom (ex. Essaouira)" required className="input" />
          <input name="slug" placeholder="slug (ex. essaouira)" required className="input" />
          <input name="image" placeholder="URL image (optionnel)" className="input" />
          <input name="description" placeholder="Description (optionnel)" className="input" />
        </InlineCreateForm>

        <div className="overflow-hidden rounded-2xl bg-white shadow-luxury">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 bg-domify-warm-white/50 text-xs uppercase tracking-wide text-domify-dark/50">
              <tr>
                <th className="px-5 py-3 font-medium">Ville</th>
                <th className="px-5 py-3 font-medium">Slug</th>
                <th className="px-5 py-3 font-medium">Propriétés</th>
                <th className="px-5 py-3 font-medium">Quartiers</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {cities.map((c) => (
                <tr key={c.id} className="hover:bg-domify-warm-white/30">
                  <td className="px-5 py-3 font-medium text-domify-dark">{c.name}</td>
                  <td className="px-5 py-3 text-domify-dark/60">{c.slug}</td>
                  <td className="px-5 py-3 text-domify-dark/70">{c._count.properties}</td>
                  <td className="px-5 py-3 text-domify-dark/70">{c._count.neighborhoods}</td>
                  <td className="px-5 py-3 text-right">
                    <DeleteButton
                      action={deleteCity.bind(null, c.id)}
                      confirmLabel={`Supprimer ${c.name} ? Cela échouera si des propriétés y sont rattachées.`}
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
