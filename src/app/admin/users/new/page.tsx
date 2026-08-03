import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { UserForm } from "@/components/admin/UserForm";
import { createUser } from "@/lib/actions/users";

export default async function NewUserPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/admin");

  return (
    <>
      <AdminTopbar title="Nouvel utilisateur" />
      <div className="p-6 lg:p-10">
        <UserForm action={createUser} submitLabel="Créer l'utilisateur" passwordRequired />
      </div>
    </>
  );
}
