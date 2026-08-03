import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { UserForm } from "@/components/admin/UserForm";
import { PermissionsPanel } from "@/components/admin/PermissionsPanel";
import { updateUser } from "@/lib/actions/users";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/admin");

  const [user, permissions] = await Promise.all([
    prisma.user.findUnique({ where: { id }, include: { permissions: true } }),
    prisma.permission.findMany({ orderBy: { key: "asc" } }),
  ]);
  if (!user) notFound();

  const updateWithId = updateUser.bind(null, id);
  const grantedIds = user.permissions.map((p) => p.permissionId);

  return (
    <>
      <AdminTopbar title={`Modifier — ${user.name ?? user.email}`} />
      <div className="space-y-8 p-6 lg:p-10">
        <UserForm
          action={updateWithId}
          defaultValues={user}
          submitLabel="Enregistrer"
          passwordLabel="Nouveau mot de passe"
          passwordRequired={false}
        />

        <div className="rounded-2xl bg-white p-6 shadow-luxury">
          <h2 className="mb-1 font-display text-lg font-semibold text-domify-dark">Permissions individuelles</h2>
          <p className="mb-4 text-xs text-domify-dark/50">
            Optionnel — le rôle ci-dessus détermine l&apos;accès général. Ces permissions s&apos;y ajoutent pour des cas
            précis (ex. autoriser un Agent à publier des articles de blog).
          </p>
          <PermissionsPanel userId={user.id} permissions={permissions} grantedIds={grantedIds} />
        </div>
      </div>
    </>
  );
}
