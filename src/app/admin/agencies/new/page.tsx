import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { AgencyForm } from "@/components/admin/AgencyForm";
import { createAgency } from "@/lib/actions/network";

export default function NewAgencyPage() {
  return (
    <>
      <AdminTopbar title="Nouvelle agence" />
      <div className="p-6 lg:p-10">
        <AgencyForm action={createAgency} submitLabel="Créer l'agence" />
      </div>
    </>
  );
}
