"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import type { SimpleFormState } from "@/lib/actions/users";

const initialState: SimpleFormState = {};

const ROLES = [
  { value: "ADMIN", label: "Admin — accès complet, y compris utilisateurs & rôles" },
  { value: "EDITOR", label: "Éditeur — gère le contenu, pas les comptes" },
  { value: "AGENT", label: "Agent — accès limité (à affiner selon vos besoins)" },
  { value: "USER", label: "Utilisateur — aucun accès admin" },
];

export function UserForm({
  action,
  defaultValues = {},
  submitLabel,
  passwordLabel = "Mot de passe",
  passwordRequired = true,
}: {
  action: (prevState: SimpleFormState, formData: FormData) => Promise<SimpleFormState>;
  defaultValues?: Partial<{ name: string; email: string; phone: string | null; role: string }>;
  submitLabel: string;
  passwordLabel?: string;
  passwordRequired?: boolean;
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
          <Field label="Email" error={state.errors?.email}>
            <input name="email" type="email" defaultValue={defaultValues.email} className="input" required />
          </Field>
          <Field label="Téléphone">
            <input name="phone" defaultValue={defaultValues.phone ?? ""} className="input" />
          </Field>
          <Field label={passwordLabel} error={state.errors?.password}>
            <input name="password" type="password" className="input" required={passwordRequired} placeholder={passwordRequired ? "" : "Laisser vide pour ne pas changer"} />
          </Field>
          <Field label="Rôle" full>
            <select name="role" defaultValue={defaultValues.role ?? "USER"} className="input">
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
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
        <button type="button" onClick={() => router.push("/admin/users")} className="rounded-xl border border-black/10 px-6 py-3 text-sm font-medium text-domify-dark/70">
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
