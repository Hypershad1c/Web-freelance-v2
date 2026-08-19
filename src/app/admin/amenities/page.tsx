import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminEmptyState, AdminPageLead } from "@/components/admin/AdminPageLead";
import { InlineCreateForm } from "@/components/admin/InlineCreateForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { createAmenity, deleteAmenity } from "@/lib/actions/taxonomy";
import { Sparkles } from "lucide-react";

export default async function AdminAmenitiesPage() {
  const amenities = await prisma.amenity.findMany({
    include: { _count: { select: { properties: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <AdminTopbar title="Équipements" />
      <div className="space-y-6 p-6 lg:p-10">
        <AdminPageLead eyebrow="Attributs de valeur" title="Rendez les biens plus faciles à comparer" description="Les équipements améliorent la recherche, les filtres et la perception de valeur dans chaque fiche." icon={Sparkles} metric={{ value: amenities.length, label: "équipement(s)" }} />
        <section className="admin-form-section"><div><p className="admin-eyebrow">Nouvel attribut</p><h3>Ajouter un équipement</h3><p>Gardez des intitulés courts et cohérents afin de faciliter le filtrage du catalogue.</p></div>
        <InlineCreateForm action={createAmenity} submitLabel="Ajouter l'équipement">
          <input name="name" placeholder="Nom (ex. Ascenseur)" required className="w-full" />
          <input name="slug" placeholder="slug (optionnel, auto-généré)" className="w-full" />
          <input name="icon" placeholder="Icône (optionnel, ex. lucide name)" className="w-full" />
        </InlineCreateForm>
        </section>

        {amenities.length === 0 ? <AdminEmptyState icon={Sparkles} title="Aucun équipement n’est encore défini" description="Créez des équipements pour enrichir les filtres et les fiches de propriété." /> : <div className="admin-data-panel overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 bg-domify-warm-white/50 text-xs uppercase tracking-wide text-domify-dark/50">
              <tr>
                <th className="px-5 py-3 font-medium">Équipement</th>
                <th className="px-5 py-3 font-medium">Slug</th>
                <th className="px-5 py-3 font-medium">Propriétés</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {amenities.map((a) => (
                <tr key={a.id} className="hover:bg-domify-warm-white/30">
                  <td className="px-5 py-3 font-medium text-domify-dark">{a.name}</td>
                  <td className="px-5 py-3 text-domify-dark/60">{a.slug}</td>
                  <td className="px-5 py-3 text-domify-dark/70">{a._count.properties}</td>
                  <td className="px-5 py-3 text-right">
                    <DeleteButton
                      action={deleteAmenity.bind(null, a.id)}
                      confirmLabel={`Supprimer ${a.name} ? Il sera retiré de ${a._count.properties} bien(s).`}
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
