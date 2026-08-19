import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminEmptyState, AdminPageLead } from "@/components/admin/AdminPageLead";
import { InlineCreateForm } from "@/components/admin/InlineCreateForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { createCity, deleteCity } from "@/lib/actions/locations";
import { MapPinned } from "lucide-react";

export default async function AdminCitiesPage() {
  const cities = await prisma.city.findMany({
    include: { _count: { select: { properties: true, neighborhoods: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <AdminTopbar title="Villes" />
      <div className="space-y-6 p-6 lg:p-10">
        <AdminPageLead eyebrow="Couverture géographique" title="Structurez les destinations de recherche" description="Chaque ville alimente les recherches, les pages éditoriales et le classement de vos biens publiés." icon={MapPinned} metric={{ value: cities.length, label: "ville(s)" }} />
        <section className="admin-form-section"><div><p className="admin-eyebrow">Nouvelle destination</p><h3>Ajouter une ville</h3><p>Utilisez une image ou une description pour enrichir les futures pages locales.</p></div>
        <InlineCreateForm action={createCity} submitLabel="Ajouter la ville">
          <input name="name" placeholder="Nom (ex. Essaouira)" required className="w-full" />
          <input name="slug" placeholder="slug (ex. essaouira)" required className="w-full" />
          <input name="image" placeholder="URL image (optionnel)" className="w-full" />
          <input name="description" placeholder="Description (optionnel)" className="w-full" />
        </InlineCreateForm>
        </section>

        {cities.length === 0 ? <AdminEmptyState icon={MapPinned} title="Votre carte de villes commence ici" description="Ajoutez votre première destination pour construire les recherches et pages locales." /> : <div className="admin-data-panel overflow-hidden">
          <div className="overflow-x-auto">
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
        </div>}
      </div>
    </>
  );
}
