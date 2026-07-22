import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { deleteUser, updateUserRole } from "@/lib/actions/users";

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "EDITOR", label: "Éditeur" },
  { value: "AGENT", label: "Agent" },
  { value: "USER", label: "Utilisateur" },
];

export default async function AdminUsersPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/admin");

  const users = await prisma.user.findMany({
    include: { _count: { select: { favorites: true, leads: true, appointments: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <AdminTopbar title="Utilisateurs" />
      <div className="p-6 lg:p-10">
        <div className="mb-6 flex justify-end">
          <Link href="/admin/users/new" className="flex items-center gap-2 rounded-xl bg-domify-gold px-4 py-2.5 text-sm font-semibold text-white shadow-luxury">
            <Plus size={16} /> Nouvel utilisateur
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-luxury">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 bg-domify-warm-white/50 text-xs uppercase tracking-wide text-domify-dark/50">
              <tr>
                <th className="px-5 py-3 font-medium">Utilisateur</th>
                <th className="px-5 py-3 font-medium">Activité</th>
                <th className="px-5 py-3 font-medium">Rôle</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-domify-warm-white/30">
                  <td className="px-5 py-3">
                    <p className="font-medium text-domify-dark">
                      {u.name ?? "—"} {u.id === session?.user?.id && <span className="text-xs text-domify-dark/40">(vous)</span>}
                    </p>
                    <p className="text-xs text-domify-dark/50">{u.email}</p>
                  </td>
                  <td className="px-5 py-3 text-xs text-domify-dark/60">
                    {u._count.favorites} favoris · {u._count.leads} leads · {u._count.appointments} RDV
                  </td>
                  <td className="px-5 py-3">
                    <StatusSelect value={u.role} options={ROLE_OPTIONS} action={updateUserRole.bind(null, u.id)} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/users/${u.id}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-domify-dark/40 hover:bg-domify-warm-white hover:text-domify-primary" aria-label="Modifier">
                        <Pencil size={15} />
                      </Link>
                      {u.id !== session?.user?.id && (
                        <DeleteButton action={deleteUser.bind(null, u.id)} confirmLabel={`Supprimer le compte de ${u.name ?? u.email} ?`} />
                      )}
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
