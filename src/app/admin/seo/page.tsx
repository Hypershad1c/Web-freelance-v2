import Link from "next/link";
import { Plus, Pencil, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteSeoEntry } from "@/lib/actions/seo";

export default async function AdminSeoPage() {
  const entries = await prisma.seoEntry.findMany({ orderBy: { path: "asc" } });

  return (
    <>
      <AdminTopbar title="SEO" />
      <div className="p-6 lg:p-10">
        <div className="mb-6 rounded-xl bg-domify-warm-white p-4 text-sm text-domify-dark/70">
          Définissez un titre et une description personnalisés pour n&apos;importe quelle page du site (identifiée
          par son chemin, ex. <code>/</code>, <code>/proprietes</code>, <code>/blog</code>). Une page sans entrée ici
          utilise ses valeurs par défaut.
        </div>

        <div className="mb-6 flex justify-end">
          <Link href="/admin/seo/new" className="flex items-center gap-2 rounded-xl bg-domify-gold px-4 py-2.5 text-sm font-semibold text-white shadow-luxury">
            <Plus size={16} /> Nouvelle entrée SEO
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-luxury">
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
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-domify-dark/50">
                    <Search className="mx-auto mb-2 text-domify-dark/20" size={24} />
                    Aucune entrée SEO personnalisée pour le moment.
                  </td>
                </tr>
              ) : entries.map((e) => (
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
      </div>
    </>
  );
}
