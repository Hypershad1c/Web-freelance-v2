import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AdminEmptyState, AdminPageLead } from "@/components/admin/AdminPageLead";
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
        <AdminPageLead eyebrow="Gouvernance des accès" title="Donnez à chacun le bon niveau de contrôle" description="Les rôles définissent les espaces accessibles, tandis que les permissions individuelles couvrent les exceptions précises." icon={ShieldCheck} metric={{ value: permissions.length, label: "permission(s)" }} />
        <div>
          <div className="mb-4"><p className="admin-eyebrow">Accès standardisés</p><h2 className="mt-1 font-display text-xl font-semibold text-domify-dark">Rôles de la plateforme</h2></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(ROLE_DESCRIPTIONS).map(([role, desc]) => (
              <div key={role} className="admin-role-card">
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

        <section className="admin-form-section"><div><p className="admin-eyebrow">Exceptions contrôlées</p><h3>Permissions individuelles</h3><p>Utilisez-les pour les droits ciblés, par exemple <code>blog.publish</code> ou <code>properties.delete</code>, en complément du rôle principal.</p></div>
          <InlineCreateForm action={createPermission} submitLabel="Ajouter la permission">
            <input name="key" placeholder="Clé (ex. blog.publish)" required className="w-full" />
            <input name="label" placeholder="Libellé (ex. Publier des articles)" required className="w-full" />
          </InlineCreateForm>
        </section>

        {permissions.length === 0 ? <AdminEmptyState icon={ShieldCheck} title="Aucune permission individuelle n’est définie" description="Créez une permission seulement lorsqu’un rôle standard ne couvre pas le besoin métier." /> : <div className="admin-data-panel overflow-hidden">
            <div className="overflow-x-auto">
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
                {permissions.map((p) => (
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
          </div>}
      </div>
    </>
  );
}
