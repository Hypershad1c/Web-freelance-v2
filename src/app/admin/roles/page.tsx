import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { InlineCreateForm } from "@/components/admin/InlineCreateForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { createPermission, deletePermission } from "@/lib/actions/permissions";

const ROLE_DESCRIPTIONS: Record<string, string> = {
  ADMIN: "Accès complet — catalogue, contenu, utilisateurs, rôles, paramètres.",
  EDITOR: "Gère le catalogue et le contenu (propriétés, blog, médiathèque) — pas les comptes utilisateurs.",
  AGENT: "Accès limité — pensé pour un agent immobilier suivant ses propres biens et rendez-vous.",
  USER: "Aucun accès admin — favoris, demandes de visite et messages côté public uniquement.",
};

export default async function AdminRolesPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/admin");

  const [permissions, roleCounts] = await Promise.all([
    prisma.permission.findMany({
      include: { _count: { select: { users: true } } },
      orderBy: { key: "asc" },
    }),
    prisma.user.groupBy({ by: ["role"], _count: { role: true } }),
  ]);

  const countByRole = Object.fromEntries(roleCounts.map((r) => [r.role, r._count.role]));

  return (
    <>
      <AdminTopbar title="Rôles & permissions" />
      <div className="space-y-8 p-6 lg:p-10">
        <div>
          <h2 className="mb-4 font-display text-lg font-semibold text-domify-dark">Rôles</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(ROLE_DESCRIPTIONS).map(([role, desc]) => (
              <div key={role} className="rounded-2xl bg-white p-5 shadow-luxury">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-domify-gold" />
                  <p className="font-display text-base font-semibold text-domify-dark">{role}</p>
                </div>
                <p className="mt-2 text-xs text-domify-dark/60">{desc}</p>
                <p className="mt-3 text-xs font-medium text-domify-dark/40">
                  {countByRole[role] ?? 0} utilisateur(s) —{" "}
                  <Link href={`/admin/users`} className="text-domify-primary">voir</Link>
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-4 font-display text-lg font-semibold text-domify-dark">Permissions individuelles</h2>
          <p className="mb-4 text-xs text-domify-dark/50">
            Un catalogue libre de permissions granulaires (ex. <code>blog.publish</code>, <code>properties.delete</code>)
            que vous pouvez accorder à des utilisateurs spécifiques depuis leur fiche, en plus de leur rôle.
          </p>
          <InlineCreateForm action={createPermission} submitLabel="Ajouter la permission">
            <input name="key" placeholder="Clé (ex. blog.publish)" required className="input" />
            <input name="label" placeholder="Libellé (ex. Publier des articles)" required className="input" />
          </InlineCreateForm>

          <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-luxury">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/5 bg-domify-warm-white/50 text-xs uppercase tracking-wide text-domify-dark/50">
                <tr>
                  <th className="px-5 py-3 font-medium">Clé</th>
                  <th className="px-5 py-3 font-medium">Libellé</th>
                  <th className="px-5 py-3 font-medium">Utilisateurs</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {permissions.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-domify-dark/50">Aucune permission définie.</td></tr>
                ) : permissions.map((p) => (
                  <tr key={p.id} className="hover:bg-domify-warm-white/30">
                    <td className="px-5 py-3 font-mono text-xs text-domify-dark">{p.key}</td>
                    <td className="px-5 py-3 text-domify-dark/70">{p.label}</td>
                    <td className="px-5 py-3 text-domify-dark/70">{p._count.users}</td>
                    <td className="px-5 py-3 text-right">
                      <DeleteButton action={deletePermission.bind(null, p.id)} confirmLabel={`Supprimer la permission ${p.key} ?`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        .input { width: 100%; border-radius: 0.75rem; border: 1px solid rgba(31,41,55,0.12); padding: 0.65rem 0.9rem; font-size: 0.875rem; background: white; }
      `}</style>
    </>
  );
}
