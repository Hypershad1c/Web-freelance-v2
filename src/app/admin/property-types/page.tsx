import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { InlineCreateForm } from "@/components/admin/InlineCreateForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { createPropertyType, deletePropertyType } from "@/lib/actions/taxonomy";

export default async function AdminPropertyTypesPage() {
  const propertyTypes = await prisma.propertyType.findMany({
    include: { _count: { select: { properties: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <AdminTopbar title="Types de biens" />
      <div className="space-y-6 p-6 lg:p-10">
        <InlineCreateForm action={createPropertyType} submitLabel="Ajouter le type">
          <input name="name" placeholder="Nom (ex. Chalet)" required className="input" />
          <input name="slug" placeholder="slug (optionnel, auto-généré)" className="input" />
          <input name="icon" placeholder="Icône (optionnel, ex. lucide name)" className="input" />
        </InlineCreateForm>

        <div className="overflow-hidden rounded-2xl bg-white shadow-luxury">
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
              {propertyTypes.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-domify-dark/50">Aucun type de bien.</td></tr>
              ) : propertyTypes.map((t) => (
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
      </div>

      <style>{`
        .input { width: 100%; border-radius: 0.75rem; border: 1px solid rgba(31,41,55,0.12); padding: 0.65rem 0.9rem; font-size: 0.875rem; background: white; }
      `}</style>
    </>
  );
}
