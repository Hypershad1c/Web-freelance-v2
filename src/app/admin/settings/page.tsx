import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getSiteSettings } from "@/lib/data/settings";
import { updateSettings } from "@/lib/actions/settings";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/admin");

  const settings = await getSiteSettings();

  return (
    <>
      <AdminTopbar title="Paramètres" />
      <div className="p-6 lg:p-10">
        <SettingsForm action={updateSettings} defaultValues={settings} />
      </div>
    </>
  );
}
