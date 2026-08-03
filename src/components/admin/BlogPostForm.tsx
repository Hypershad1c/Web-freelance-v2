"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import type { SimpleFormState } from "@/lib/actions/blog";
import { SingleImageUploader } from "@/components/admin/SingleImageUploader";

const initialState: SimpleFormState = {};

export function BlogPostForm({
  action,
  categories,
  defaultValues = {},
  submitLabel,
}: {
  action: (prevState: SimpleFormState, formData: FormData) => Promise<SimpleFormState>;
  categories: { id: string; name: string }[];
  defaultValues?: Partial<{
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    coverImage: string | null;
    published: boolean;
    categoryId: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
  }>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const router = useRouter();

  return (
    <form action={formAction} className="space-y-6">
      {state.message && <div className="rounded-xl bg-domify-warm-white p-4 text-sm text-domify-dark">{state.message}</div>}

      <div className="rounded-2xl bg-white p-6 shadow-luxury">
        <div className="grid grid-cols-1 gap-4">
          <Field label="Titre" error={state.errors?.title}>
            <input name="title" defaultValue={defaultValues.title} className="input" required />
          </Field>
          <Field label="Slug (laisser vide pour auto-générer)" error={state.errors?.slug}>
            <input name="slug" defaultValue={defaultValues.slug} className="input" placeholder="marche-immobilier-maroc-2026" />
          </Field>
          <Field label="Extrait (résumé court)">
            <textarea name="excerpt" defaultValue={defaultValues.excerpt ?? ""} rows={2} className="input" />
          </Field>
          <Field label="Contenu" error={state.errors?.content}>
            <textarea name="content" defaultValue={defaultValues.content} rows={14} className="input font-mono text-xs" required />
            <p className="mt-1.5 text-xs text-domify-dark/40">
              Texte brut — les paragraphes séparés par une ligne vide s&apos;afficheront comme des paragraphes distincts.
            </p>
          </Field>
          <Field label="Image de couverture">
            <SingleImageUploader name="coverImage" defaultUrl={defaultValues.coverImage ?? undefined} />
          </Field>
          <Field label="Catégorie">
            <select name="categoryId" defaultValue={defaultValues.categoryId ?? ""} className="input">
              <option value="">Aucune</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="published" defaultChecked={defaultValues.published} className="h-4 w-4" />
            Publié (visible sur le site)
          </label>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-luxury">
        <h2 className="mb-4 font-display text-lg font-semibold text-domify-dark">SEO</h2>
        <div className="grid grid-cols-1 gap-4">
          <Field label="Titre SEO">
            <input name="seoTitle" defaultValue={defaultValues.seoTitle ?? ""} className="input" />
          </Field>
          <Field label="Description SEO">
            <textarea name="seoDescription" defaultValue={defaultValues.seoDescription ?? ""} rows={2} className="input" />
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
        <button type="button" onClick={() => router.push("/admin/blog")} className="rounded-xl border border-black/10 px-6 py-3 text-sm font-medium text-domify-dark/70">
          Annuler
        </button>
      </div>

      <style>{`
        .input { width: 100%; border-radius: 0.75rem; border: 1px solid rgba(31,41,55,0.12); padding: 0.65rem 0.9rem; font-size: 0.875rem; background: white; }
      `}</style>
    </form>
  );
}

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string[] }) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-medium text-domify-dark/60">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error[0]}</span>}
    </label>
  );
}
