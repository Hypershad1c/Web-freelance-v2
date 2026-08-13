"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Save, UserPlus } from "lucide-react";
import { createCrmContact, updateCrmContact } from "@/lib/actions/crm";
import { Button } from "@/components/ui/button";

type ContactFormValues = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string | null;
  source?: string | null;
  preferredLocation?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  notes?: string | null;
};

export function CrmContactForm({ contact, compact = false }: { contact?: ContactFormValues; compact?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function submit(formData: FormData) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        if (contact?.id) {
          await updateCrmContact(contact.id, formData);
          setSaved(true);
          router.refresh();
        } else {
          const id = await createCrmContact(formData);
          router.push(`/admin/crm/contacts/${id}`);
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Impossible d’enregistrer le contact.");
      }
    });
  }

  return (
    <form action={submit} className={compact ? "space-y-3" : "space-y-5"}>
      <div className={compact ? "grid grid-cols-1 gap-3 sm:grid-cols-2" : "grid grid-cols-1 gap-4 sm:grid-cols-2"}>
        <Field label="Nom complet" required><input name="name" required defaultValue={contact?.name || ""} className="domify-select" placeholder="Ex. Salma Bennani" /></Field>
        <Field label="Email" required><input name="email" required type="email" defaultValue={contact?.email || ""} className="domify-select" placeholder="salma@email.com" /></Field>
        <Field label="Téléphone"><input name="phone" defaultValue={contact?.phone || ""} className="domify-select" placeholder="+212 ..." /></Field>
        <Field label="Source"><input name="source" defaultValue={contact?.source || ""} className="domify-select" placeholder="Portail, recommandation, appel…" /></Field>
        <Field label="Ville ou zone recherchée"><input name="preferredLocation" defaultValue={contact?.preferredLocation || ""} className="domify-select" placeholder="Rabat, Souissi…" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Budget min. (MAD)"><input name="budgetMin" type="number" min="0" defaultValue={contact?.budgetMin || ""} className="domify-select" /></Field>
          <Field label="Budget max. (MAD)"><input name="budgetMax" type="number" min="0" defaultValue={contact?.budgetMax || ""} className="domify-select" /></Field>
        </div>
      </div>
      {!compact && <Field label="Notes internes"><textarea name="notes" defaultValue={contact?.notes || ""} rows={5} className="min-h-32 w-full rounded-[0.9rem] border border-domify-dark/11 bg-white px-4 py-3 text-sm text-domify-dark transition-luxury placeholder:text-domify-muted/70 focus:border-domify-secondary focus:outline-none focus:ring-4 focus:ring-domify-secondary/15" placeholder="Préférences, contexte, prochaines informations à confirmer…" /></Field>}
      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {saved && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Contact enregistré.</p>}
      <Button type="submit" variant={contact?.id ? "primary" : "gold"} disabled={isPending} className="min-w-40">
        {isPending ? <LoaderCircle size={16} className="animate-spin" /> : contact?.id ? <Save size={16} /> : <UserPlus size={16} />}
        {isPending ? "Enregistrement…" : contact?.id ? "Enregistrer" : "Créer le contact"}
      </Button>
    </form>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return <label className="block"><span className="mb-2 block text-[0.68rem] font-bold uppercase tracking-[0.13em] text-domify-dark/52">{label}{required && <span className="text-domify-gold"> *</span>}</span>{children}</label>;
}
