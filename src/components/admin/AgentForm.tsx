"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import type { SimpleFormState } from "@/lib/actions/network";

const initialState: SimpleFormState = {};

export function AgentForm({
  action,
  agencies,
  defaultValues = {},
  submitLabel,
}: {
  action: (prevState: SimpleFormState, formData: FormData) => Promise<SimpleFormState>;
  agencies: { id: string; name: string }[];
  defaultValues?: Partial<{
    name: string;
    slug: string;
    bio: string | null;
    photo: string | null;
    phone: string | null;
    email: string | null;
    agencyId: string | null;
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
          <Field label="Photo (URL)">
            <input name="photo" defaultValue={defaultValues.photo ?? ""} className="input" />
          </Field>
          <Field label="Agence">
            <select name="agencyId" defaultValue={defaultValues.agencyId ?? ""} className="input">
              <option value="">Indépendant</option>
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Bio" full>
            <textarea name="bio" defaultValue={defaultValues.bio ?? ""} rows={3} className="input" />
          </Field>
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
        <button type="button" onClick={() => router.push("/admin/agents")} className="rounded-xl border border-black/10 px-6 py-3 text-sm font-medium text-domify-dark/70">
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
