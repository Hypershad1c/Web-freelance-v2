import Link from "next/link";
import { Plus, Pencil, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminEmptyState, AdminPageLead } from "@/components/admin/AdminPageLead";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteSeoEntry } from "@/lib/actions/seo";

export default async function AdminSeoPage() {
  const entries = await prisma.seoEntry.findMany({ orderBy: { path: "asc" } });

  return (
    <>
      <AdminTopbar title="SEO" />
      <div className="space-y-6 p-6 lg:p-10">
        <AdminPageLead eyebrow="Visibilité organique" title="Gardez la promesse Domify cohérente dans les résultats" description="Créez des titres et descriptions sur mesure uniquement là où les valeurs par défaut ne suffisent pas." icon={Search} metric={{ value: entries.length, label: "entrée(s)" }}>
          <Link href="/admin/seo/new" className="pressable inline-flex items-center gap-2 rounded-xl bg-domify-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_28px_-21px_rgba(16,47,66,0.75)] hover:bg-domify-primary-dark"><Plus size={16} /> Nouvelle entrée</Link>
        </AdminPageLead>

        <div className="admin-guidance-note">Définissez une entrée par chemin, par exemple <code>/</code>, <code>/proprietes</code> ou <code>/blog</code>. Une page sans entrée personnalisée conserve ses métadonnées par défaut.</div>

        {entries.length === 0 ? <AdminEmptyState icon={Search} title="Aucune optimisation personnalisée pour le moment" description="Créez une première entrée pour cibler une page stratégique, comme l’accueil ou le catalogue de propriétés." /> : <div className="admin-data-panel overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 bg-domify-warm-white/50 text-xs uppercase tracking-wide text-domify-dark/50">
              <tr>
                <th className="px-5 py-3 font-medium">Chemin</th>
                <th className="px-5 py-3 font-medium">Titre</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-domify-warm-white/30">
                  <td className="px-5 py-3 font-mono text-xs text-domify-dark">{e.path}</td>
                  <td className="max-w-xs truncate px-5 py-3 text-domify-dark/80">{e.title}</td>
                  <td className="max-w-sm truncate px-5 py-3 text-domify-dark/60">{e.description}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/seo/${e.id}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-domify-dark/40 hover:bg-domify-warm-white hover:text-domify-primary" aria-label="Modifier">
                        <Pencil size={15} />
                      </Link>
                      <DeleteButton action={deleteSeoEntry.bind(null, e.id)} confirmLabel={`Supprimer l'entrée SEO pour ${e.path} ?`} />
                    </div>
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
