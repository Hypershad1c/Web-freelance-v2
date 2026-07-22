"use client";

import { useActionState } from "react";
import { type SettingsFormState } from "@/lib/actions/settings";
import { SETTINGS_FIELDS } from "@/lib/settings-fields";

const initialState: SettingsFormState = {};

const SECTIONS: { title: string; keys: string[] }[] = [
  { title: "Général", keys: ["site_name", "site_tagline"] },
  { title: "Contact", keys: ["contact_phone", "contact_email", "contact_address", "whatsapp_number"] },
  { title: "Réseaux sociaux", keys: ["social_facebook", "social_instagram", "social_linkedin"] },
];

export function SettingsForm({
  action,
  defaultValues,
}: {
  action: (prevState: SettingsFormState, formData: FormData) => Promise<SettingsFormState>;
  defaultValues: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {state.message && <div className="rounded-xl bg-domify-warm-white p-4 text-sm text-domify-dark">{state.message}</div>}

      {SECTIONS.map((section) => (
        <div key={section.title} className="rounded-2xl bg-white p-6 shadow-luxury">
          <h2 className="mb-4 font-display text-lg font-semibold text-domify-dark">{section.title}</h2>
          <div className="space-y-4">
            {SETTINGS_FIELDS.filter((f) => section.keys.includes(f.key)).map((field) => (
              <label key={field.key} className="block">
                <span className="mb-1.5 block text-xs font-medium text-domify-dark/60">{field.label}</span>
                <input
                  name={field.key}
                  defaultValue={defaultValues[field.key] ?? field.defaultValue}
                  className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm"
                />
              </label>
            ))}
          </div>
        </div>
      ))}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-domify-gold px-6 py-3 text-sm font-semibold text-white shadow-luxury transition-luxury hover:bg-domify-soft-gold hover:text-domify-dark disabled:opacity-60"
      >
        {pending ? "Enregistrement..." : "Enregistrer les paramètres"}
      </button>
    </form>
  );
}
