"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import type { SimpleFormState } from "@/lib/actions/network";

const initialState: SimpleFormState = {};

export function AgencyForm({
  action,
  defaultValues = {},
  submitLabel,
}: {
  action: (prevState: SimpleFormState, formData: FormData) => Promise<SimpleFormState>;
  defaultValues?: Partial<{
    name: string;
    slug: string;
    description: string | null;
    logo: string | null;
    coverImage: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    verified: boolean;
  }>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const router = useRouter();

  return (
    <form action={formAction} className="space-y-6">
      {state.message && <div className="rounded-xl bg-domify-warm-white p-4 text-sm text-domify-dark">{state.message}</div>}

      <div className="rounded-2xl bg-white p-6 shadow-luxury">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nom" error={state.errors?.name}>
            <input name="name" defaultValue={defaultValues.name} className="input" required />
          </Field>
          <Field label="Slug" error={state.errors?.slug}>
            <input name="slug" defaultValue={defaultValues.slug} className="input" required />
          </Field>
          <Field label="Téléphone">
            <input name="phone" defaultValue={defaultValues.phone ?? ""} className="input" />
          </Field>
          <Field label="Email" error={state.errors?.email}>
            <input name="email" type="email" defaultValue={defaultValues.email ?? ""} className="input" />
          </Field>
          <Field label="Adresse" full>
            <input name="address" defaultValue={defaultValues.address ?? ""} className="input" />
          </Field>
          <Field label="Logo (URL)">
            <input name="logo" defaultValue={defaultValues.logo ?? ""} className="input" />
          </Field>
          <Field label="Image de couverture (URL)">
            <input name="coverImage" defaultValue={defaultValues.coverImage ?? ""} className="input" />
          </Field>
          <Field label="Description" full>
            <textarea name="description" defaultValue={defaultValues.description ?? ""} rows={3} className="input" />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="verified" defaultChecked={defaultValues.verified} className="h-4 w-4" />
            Agence vérifiée
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-domify-gold px-6 py-3 text-sm font-semibold text-white shadow-luxury transition-luxury hover:bg-domify-soft-gold hover:text-domify-dark disabled:opacity-60"
        >
          {pending ? "Enregistrement..." : submitLabel}
        </button>
        <button type="button" onClick={() => router.push("/admin/agencies")} className="rounded-xl border border-black/10 px-6 py-3 text-sm font-medium text-domify-dark/70">
          Annuler
        </button>
      </div>

      <style>{`
        .input { width: 100%; border-radius: 0.75rem; border: 1px solid rgba(31,41,55,0.12); padding: 0.65rem 0.9rem; font-size: 0.875rem; background: white; }
      `}</style>
    </form>
  );
}

function Field({ label, children, error, full }: { label: string; children: React.ReactNode; error?: string[]; full?: boolean }) {
  return (
    <label className={full ? "sm:col-span-2" : ""}>
      <span className="mb-1.5 block text-xs font-medium text-domify-dark/60">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error[0]}</span>}
    </label>
  );
}
