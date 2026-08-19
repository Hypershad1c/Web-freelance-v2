import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminEmptyState, AdminPageLead } from "@/components/admin/AdminPageLead";
import { InlineCreateForm } from "@/components/admin/InlineCreateForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { createPropertyType, deletePropertyType } from "@/lib/actions/taxonomy";
import { Building2 } from "lucide-react";

export default async function AdminPropertyTypesPage() {
  const propertyTypes = await prisma.propertyType.findMany({
    include: { _count: { select: { properties: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <AdminTopbar title="Types de biens" />
      <div className="space-y-6 p-6 lg:p-10">
        <AdminPageLead eyebrow="Taxonomie du catalogue" title="Clarifiez chaque type de propriété" description="Les types de biens structurent les recherches, les cartes de catalogue et les parcours de comparaison." icon={Building2} metric={{ value: propertyTypes.length, label: "type(s)" }} />
        <section className="admin-form-section"><div><p className="admin-eyebrow">Nouvelle catégorie</p><h3>Ajouter un type de bien</h3><p>Préférez une dénomination claire, courte et facile à comprendre pour les visiteurs.</p></div>
        <InlineCreateForm action={createPropertyType} submitLabel="Ajouter le type">
          <input name="name" placeholder="Nom (ex. Chalet)" required className="w-full" />
          <input name="slug" placeholder="slug (optionnel, auto-généré)" className="w-full" />
          <input name="icon" placeholder="Icône (optionnel, ex. lucide name)" className="w-full" />
        </InlineCreateForm>
        </section>

        {propertyTypes.length === 0 ? <AdminEmptyState icon={Building2} title="Le catalogue a besoin de ses premiers types" description="Ajoutez des types de biens pour rendre la navigation et les filtres plus précis." /> : <div className="admin-data-panel overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 bg-domify-warm-white/50 text-xs uppercase tracking-wide text-domify-dark/50">
              <tr>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Slug</th>
                <th className="px-5 py-3 font-medium">Propriétés</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {propertyTypes.map((t) => (
                <tr key={t.id} className="hover:bg-domify-warm-white/30">
                  <td className="px-5 py-3 font-medium text-domify-dark">{t.name}</td>
                  <td className="px-5 py-3 text-domify-dark/60">{t.slug}</td>
                  <td className="px-5 py-3 text-domify-dark/70">{t._count.properties}</td>
                  <td className="px-5 py-3 text-right">
                    <DeleteButton
                      action={deletePropertyType.bind(null, t.id)}
                      confirmLabel={
                        t._count.properties > 0
                          ? `${t.name} est utilisé par ${t._count.properties} bien(s) — la suppression échouera tant qu'ils y sont rattachés. Continuer ?`
                          : `Supprimer ${t.name} ?`
                      }
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
