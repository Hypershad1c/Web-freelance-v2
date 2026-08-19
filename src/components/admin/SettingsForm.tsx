"use client";

import { useActionState, useMemo } from "react";
import { AlertCircle, CheckCircle2, ExternalLink, LoaderCircle, Save, ShieldCheck } from "lucide-react";
import { type SettingsFormState } from "@/lib/actions/settings";
import { SETTINGS_FIELDS } from "@/lib/settings-fields";

const initialState: SettingsFormState = {};

const SECTIONS: { title: string; description: string; keys: string[] }[] = [
  { title: "Identité", description: "Les éléments de marque visibles dans les principaux espaces Domify.", keys: ["site_name", "site_tagline"] },
  { title: "Contact", description: "Coordonnées affichées sur le site et utilisées comme destination de secours des demandes.", keys: ["contact_phone", "contact_email", "contact_address", "whatsapp_number"] },
  { title: "Liens sociaux", description: "Seuls les liens web valides seront publiés dans le pied de page public.", keys: ["social_facebook", "social_instagram", "social_linkedin"] },
];

export function SettingsForm({
  action,
  defaultValues,
}: {
  action: (prevState: SettingsFormState, formData: FormData) => Promise<SettingsFormState>;
  defaultValues: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const fieldErrors = state.errors ?? {};
  const hasErrors = Object.keys(fieldErrors).length > 0;
  const socialPreview = useMemo(() => SETTINGS_FIELDS.filter((field) => field.kind === "url").map((field) => ({ label: field.label.replace(" (URL)", ""), value: defaultValues[field.key] ?? "" })), [defaultValues]);

  return (
    <form action={formAction} className="max-w-4xl space-y-5" noValidate>
      <section className="admin-settings-hero"><div><p className="admin-eyebrow text-domify-soft-gold">Configuration protégée</p><h2>Modifiez vos informations sans fragiliser le site.</h2><p>Les emails et liens sont contrôlés avant enregistrement. Les URLs incomplètes sont normalisées automatiquement en HTTPS.</p></div><span><ShieldCheck size={18} /> Réservé ADMIN</span></section>
      {state.message && <div className="admin-settings-feedback admin-settings-feedback--success"><CheckCircle2 size={18} /><span>{state.message}</span></div>}
      {hasErrors && <div className="admin-settings-feedback admin-settings-feedback--error"><AlertCircle size={18} /><div><strong>Vérifiez les champs signalés.</strong>{fieldErrors.form && <p>{fieldErrors.form}</p>}</div></div>}

      {SECTIONS.map((section) => (
        <section key={section.title} className="admin-settings-section">
          <div className="mb-5"><h2>{section.title}</h2><p>{section.description}</p></div>
          <div className="grid gap-4 sm:grid-cols-2">
            {SETTINGS_FIELDS.filter((f) => section.keys.includes(f.key)).map((field) => (
              <label key={field.key} className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-[0.1em] text-domify-dark/58">{field.label}</span>
                <input
                  name={field.key}
                  defaultValue={defaultValues[field.key] ?? field.defaultValue}
                  type={field.kind === "email" ? "email" : "text"}
                  inputMode={field.kind === "phone" ? "tel" : field.kind === "url" ? "url" : "text"}
                  placeholder={field.kind === "url" ? "https://…" : field.help}
                  aria-invalid={Boolean(fieldErrors[field.key])}
                  aria-describedby={fieldErrors[field.key] ? `${field.key}-error` : `${field.key}-help`}
                  className={`w-full px-4 py-3 text-sm ${fieldErrors[field.key] ? "border-red-400 bg-red-50/50" : ""}`}
                />
                {fieldErrors[field.key] ? <span id={`${field.key}-error`} className="mt-1.5 block text-xs font-medium text-red-700">{fieldErrors[field.key]}</span> : <span id={`${field.key}-help`} className="mt-1.5 block text-xs text-domify-dark/45">{field.help}</span>}
              </label>
            ))}
          </div>
        </section>
      ))}

      <div className="flex flex-col gap-3 rounded-2xl border border-domify-dark/8 bg-white/82 p-4 shadow-[0_16px_34px_-30px_rgba(16,47,66,0.45)] sm:flex-row sm:items-center sm:justify-between"><div className="text-xs leading-5 text-domify-dark/56"><p className="font-semibold text-domify-dark">Conseil : utilisez l’URL complète de vos profils sociaux.</p><p>Exemple : https://www.instagram.com/domify</p></div><button type="submit" disabled={pending} className="pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-domify-primary px-5 text-sm font-semibold text-white shadow-[0_16px_26px_-20px_rgba(16,47,66,0.8)] hover:bg-domify-primary-dark disabled:cursor-not-allowed disabled:opacity-60">{pending ? <><LoaderCircle size={16} className="animate-spin" /> Enregistrement…</> : <><Save size={16} /> Enregistrer en sécurité</>}</button></div>
      {socialPreview.some((item) => item.value) && <p className="flex items-center gap-1.5 text-xs text-domify-dark/42"><ExternalLink size={13} /> Les liens sociaux enregistrés sont ouverts dans un nouvel onglet depuis le site public.</p>}
    </form>
  );
}
