"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import type { SimpleFormState } from "@/lib/actions/seo";

const initialState: SimpleFormState = {};

const COMMON_PATHS = ["/", "/proprietes", "/agences", "/blog", "/a-propos", "/contact", "/carte", "/estimation"];

export function SeoEntryForm({
  action,
  defaultValues = {},
  submitLabel,
}: {
  action: (prevState: SimpleFormState, formData: FormData) => Promise<SimpleFormState>;
  defaultValues?: Partial<{ path: string; title: string; description: string; ogImage: string | null }>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const router = useRouter();

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {state.message && <div className="rounded-xl bg-domify-warm-white p-4 text-sm text-domify-dark">{state.message}</div>}

      <div className="rounded-2xl bg-white p-6 shadow-luxury">
        <div className="space-y-4">
          <label>
            <span className="mb-1.5 block text-xs font-medium text-domify-dark/60">Chemin (ex. /proprietes)</span>
            <input name="path" defaultValue={defaultValues.path} list="common-paths" className="input" placeholder="/" required />
            <datalist id="common-paths">
              {COMMON_PATHS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
            {state.errors?.path && <span className="mt-1 block text-xs text-red-600">{state.errors.path[0]}</span>}
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-domify-dark/60">Titre (balise &lt;title&gt;)</span>
            <input name="title" defaultValue={defaultValues.title} className="input" required />
            {state.errors?.title && <span className="mt-1 block text-xs text-red-600">{state.errors.title[0]}</span>}
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-domify-dark/60">Meta description</span>
            <textarea name="description" defaultValue={defaultValues.description} rows={3} className="input" required />
            {state.errors?.description && <span className="mt-1 block text-xs text-red-600">{state.errors.description[0]}</span>}
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-domify-dark/60">Image Open Graph (URL, optionnel)</span>
            <input name="ogImage" defaultValue={defaultValues.ogImage ?? ""} className="input" />
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
        <button type="button" onClick={() => router.push("/admin/seo")} className="rounded-xl border border-black/10 px-6 py-3 text-sm font-medium text-domify-dark/70">
          Annuler
        </button>
      </div>

      <style>{`
        .input { width: 100%; border-radius: 0.75rem; border: 1px solid rgba(31,41,55,0.12); padding: 0.65rem 0.9rem; font-size: 0.875rem; background: white; }
      `}</style>
    </form>
  );
}
