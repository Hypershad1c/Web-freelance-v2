import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { SeoEntryForm } from "@/components/admin/SeoEntryForm";
import { createSeoEntry } from "@/lib/actions/seo";

export default function NewSeoEntryPage() {
  return (
    <>
      <AdminTopbar title="Nouvelle entrée SEO" />
      <div className="p-6 lg:p-10">
        <SeoEntryForm action={createSeoEntry} submitLabel="Créer l'entrée" />
      </div>
    </>
  );
}
