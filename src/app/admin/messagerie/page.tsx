import { redirect } from "next/navigation";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { PortalMessaging } from "@/components/portal/PortalMessaging";
import { auth } from "@/lib/auth";

export default async function AdminMessagingPage() {
  const session = await auth();
  if (!session?.user?.role || !["ADMIN", "EDITOR", "AGENT"].includes(session.user.role)) redirect("/admin");

  return (
    <>
      <AdminTopbar title="Messagerie portails" />
      <div className="p-4 sm:p-6 lg:p-10">
        <PortalMessaging mode="staff" />
      </div>
    </>
  );
}
