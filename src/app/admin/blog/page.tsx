import Link from "next/link";
import { Plus, Pencil, CheckCircle2, Circle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { InlineCreateForm } from "@/components/admin/InlineCreateForm";
import { createBlogCategory, deleteBlogCategory, deletePost } from "@/lib/actions/blog";

export default async function AdminBlogPage() {
  const [posts, categories] = await Promise.all([
    prisma.blogPost.findMany({ include: { category: true }, orderBy: { createdAt: "desc" } }),
    prisma.blogCategory.findMany({ include: { _count: { select: { posts: true } } }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <AdminTopbar title="Blog" />
      <div className="space-y-8 p-6 lg:p-10">
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-domify-dark">Articles</h2>
            <Link href="/admin/blog/new" className="flex items-center gap-2 rounded-xl bg-domify-gold px-4 py-2.5 text-sm font-semibold text-white shadow-luxury">
              <Plus size={16} /> Nouvel article
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-luxury">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/5 bg-domify-warm-white/50 text-xs uppercase tracking-wide text-domify-dark/50">
                <tr>
                  <th className="px-5 py-3 font-medium">Article</th>
                  <th className="px-5 py-3 font-medium">Catégorie</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {posts.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-domify-dark/50">Aucun article. <Link href="/admin/blog/new" className="font-medium text-domify-primary">Créer le premier →</Link></td></tr>
                ) : posts.map((post) => (
                  <tr key={post.id} className="hover:bg-domify-warm-white/30">
                    <td className="px-5 py-3 font-medium text-domify-dark">{post.title}</td>
                    <td className="px-5 py-3 text-domify-dark/70">{post.category?.name ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-domify-dark/70">
                        {post.published ? (
                          <><CheckCircle2 size={13} className="text-domify-primary" /> Publié</>
                        ) : (
                          <><Circle size={13} className="text-domify-dark/30" /> Brouillon</>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/blog/${post.id}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-domify-dark/40 hover:bg-domify-warm-white hover:text-domify-primary" aria-label="Modifier">
                          <Pencil size={15} />
                        </Link>
                        <DeleteButton action={deletePost.bind(null, post.id)} confirmLabel={`Supprimer « ${post.title} » ?`} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="mb-4 font-display text-lg font-semibold text-domify-dark">Catégories</h2>
          <InlineCreateForm action={createBlogCategory} submitLabel="Ajouter la catégorie">
            <input name="name" placeholder="Nom (ex. Investissement)" required className="input" />
            <input name="slug" placeholder="slug (optionnel, auto-généré)" className="input" />
          </InlineCreateForm>

          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span key={cat.id} className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-domify-dark/70 shadow-luxury">
                {cat.name} ({cat._count.posts})
                <DeleteButton action={deleteBlogCategory.bind(null, cat.id)} confirmLabel={`Supprimer la catégorie ${cat.name} ?`} />
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .input { width: 100%; border-radius: 0.75rem; border: 1px solid rgba(31,41,55,0.12); padding: 0.65rem 0.9rem; font-size: 0.875rem; background: white; }
      `}</style>
    </>
  );
}
