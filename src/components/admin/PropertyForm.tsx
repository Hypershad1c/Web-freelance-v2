"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import type { PropertyFormState } from "@/lib/actions/properties";
import { MediaUploader } from "@/components/admin/MediaUploader";

type Option = { id: string; name: string };

type PropertyFormProps = {
  action: (prevState: PropertyFormState, formData: FormData) => Promise<PropertyFormState>;
  cities: Option[];
  neighborhoods: (Option & { cityId: string })[];
  propertyTypes: Option[];
  agencies: Option[];
  agents: Option[];
  amenities: Option[];
  defaultValues?: {
    reference?: string;
    title?: string;
    slug?: string;
    description?: string;
    listingType?: string;
    status?: string;
    price?: number;
    surfaceArea?: number;
    bedrooms?: number;
    bathrooms?: number;
    floors?: number | null;
    yearBuilt?: number | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    featured?: boolean;
    cityId?: string;
    neighborhoodId?: string | null;
    propertyTypeId?: string;
    agencyId?: string | null;
    agentId?: string | null;
    amenityIds?: string[];
    imageUrls?: string;
    seoTitle?: string | null;
    seoDescription?: string | null;
  };
  submitLabel: string;
};

const initialState: PropertyFormState = {};

export function PropertyForm({
  action,
  cities,
  neighborhoods,
  propertyTypes,
  agencies,
  agents,
  amenities,
  defaultValues = {},
  submitLabel,
}: PropertyFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const router = useRouter();

  return (
    <form action={formAction} className="space-y-8">
      {state.message && (
        <div className="rounded-xl bg-domify-warm-white p-4 text-sm text-domify-dark">{state.message}</div>
      )}

      <Section title="Informations générales">
        <Field label="Référence" error={state.errors?.reference}>
          <input name="reference" defaultValue={defaultValues.reference} className="input" required />
        </Field>
        <Field label="Titre" error={state.errors?.title}>
          <input name="title" defaultValue={defaultValues.title} className="input" required />
        </Field>
        <Field label="Slug (URL)" error={state.errors?.slug}>
          <input name="slug" defaultValue={defaultValues.slug} className="input" placeholder="villa-contemporaine-bouskoura" required />
        </Field>
        <Field label="Description" error={state.errors?.description} full>
          <textarea name="description" defaultValue={defaultValues.description} rows={4} className="input" required />
        </Field>
      </Section>

      <Section title="Transaction & statut">
        <Field label="Type de transaction">
          <select name="listingType" defaultValue={defaultValues.listingType ?? "VENTE"} className="input">
            <option value="VENTE">Vente</option>
            <option value="LOCATION">Location</option>
          </select>
        </Field>
        <Field label="Statut">
          <select name="status" defaultValue={defaultValues.status ?? "DRAFT"} className="input">
            <option value="DRAFT">Brouillon</option>
            <option value="PUBLISHED">Publié</option>
            <option value="UNDER_OFFER">Sous offre</option>
            <option value="SOLD">Vendu</option>
            <option value="ARCHIVED">Archivé</option>
          </select>
        </Field>
        <Field label="Prix (MAD)" error={state.errors?.price}>
          <input type="number" name="price" defaultValue={defaultValues.price} className="input" required />
        </Field>
        <Field label="Mis en avant">
          <label className="flex h-[46px] items-center gap-2 text-sm">
            <input type="checkbox" name="featured" defaultChecked={defaultValues.featured} className="h-4 w-4" />
            Afficher sur la page d&apos;accueil
          </label>
        </Field>
      </Section>

      <Section title="Caractéristiques">
        <Field label="Surface (m²)" error={state.errors?.surfaceArea}>
          <input type="number" step="0.01" name="surfaceArea" defaultValue={defaultValues.surfaceArea} className="input" required />
        </Field>
        <Field label="Chambres">
          <input type="number" name="bedrooms" defaultValue={defaultValues.bedrooms ?? 0} className="input" />
        </Field>
        <Field label="Salles de bain">
          <input type="number" name="bathrooms" defaultValue={defaultValues.bathrooms ?? 0} className="input" />
        </Field>
        <Field label="Étages">
          <input type="number" name="floors" defaultValue={defaultValues.floors ?? ""} className="input" />
        </Field>
        <Field label="Année de construction">
          <input type="number" name="yearBuilt" defaultValue={defaultValues.yearBuilt ?? ""} className="input" />
        </Field>
      </Section>

      <Section title="Localisation">
        <Field label="Ville" error={state.errors?.cityId}>
          <select name="cityId" defaultValue={defaultValues.cityId} className="input" required>
            <option value="">Sélectionner...</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Quartier">
          <select name="neighborhoodId" defaultValue={defaultValues.neighborhoodId ?? ""} className="input">
            <option value="">Aucun</option>
            {neighborhoods.map((n) => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Adresse" full>
          <input name="address" defaultValue={defaultValues.address ?? ""} className="input" />
        </Field>
        <Field label="Latitude">
          <input type="number" step="0.000001" name="latitude" defaultValue={defaultValues.latitude ?? ""} placeholder="33.5731" className="input" />
        </Field>
        <Field label="Longitude">
          <input type="number" step="0.000001" name="longitude" defaultValue={defaultValues.longitude ?? ""} placeholder="-7.5898" className="input" />
        </Field>
        <p className="text-xs text-domify-dark/40 sm:col-span-2">
          Optionnel — sans coordonnées, le bien n&apos;apparaît pas sur la recherche carte (/carte) mais reste
          visible partout ailleurs. Trouvez des coordonnées sur{" "}
          <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-domify-primary underline">
            Google Maps
          </a>{" "}
          (clic droit → coordonnées).
        </p>
      </Section>

      <Section title="Type & équipements">
        <Field label="Type de bien" error={state.errors?.propertyTypeId}>
          <select name="propertyTypeId" defaultValue={defaultValues.propertyTypeId} className="input" required>
            <option value="">Sélectionner...</option>
            {propertyTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Équipements" full>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {amenities.map((a) => (
              <label key={a.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="amenityIds"
                  value={a.id}
                  defaultChecked={defaultValues.amenityIds?.includes(a.id)}
                  className="h-4 w-4"
                />
                {a.name}
              </label>
            ))}
          </div>
        </Field>
      </Section>

      <Section title="Agence & agent">
        <Field label="Agence">
          <select name="agencyId" defaultValue={defaultValues.agencyId ?? ""} className="input">
            <option value="">Aucune</option>
            {agencies.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Agent">
          <select name="agentId" defaultValue={defaultValues.agentId ?? ""} className="input">
            <option value="">Aucun</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </Field>
      </Section>

      <Section title="Photos">
        <Field label="Images" full>
          <MediaUploader name="imageUrls" defaultUrls={defaultValues.imageUrls ? defaultValues.imageUrls.split("\n").filter(Boolean) : []} />
          <p className="mt-2 text-xs text-domify-dark/40">
            Cliquez sur « Ajouter » pour uploader directement (Cloudinary), ou collez une URL. La première image
            devient la photo principale.
          </p>
        </Field>
      </Section>

      <Section title="SEO">
        <Field label="Titre SEO" full>
          <input name="seoTitle" defaultValue={defaultValues.seoTitle ?? ""} className="input" />
        </Field>
        <Field label="Description SEO" full>
          <textarea name="seoDescription" defaultValue={defaultValues.seoDescription ?? ""} rows={2} className="input" />
        </Field>
      </Section>

      <div className="flex items-center gap-3 border-t border-black/5 pt-6">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-domify-gold px-6 py-3 text-sm font-semibold text-white shadow-luxury transition-luxury hover:bg-domify-soft-gold hover:text-domify-dark disabled:opacity-60"
        >
          {pending ? "Enregistrement..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/properties")}
          className="rounded-xl border border-black/10 px-6 py-3 text-sm font-medium text-domify-dark/70"
        >
          Annuler
        </button>
      </div>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(31,41,55,0.12);
          padding: 0.65rem 0.9rem;
          font-size: 0.875rem;
          background: white;
        }
        .input:focus { outline: 2px solid #6699CC; }
      `}</style>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-luxury">
      <h2 className="mb-4 font-display text-lg font-semibold text-domify-dark">{title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
  error,
  full,
}: {
  label: string;
  children: React.ReactNode;
  error?: string[];
  full?: boolean;
}) {
  return (
    <label className={full ? "sm:col-span-2" : ""}>
      <span className="mb-1.5 block text-xs font-medium text-domify-dark/60">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error[0]}</span>}
    </label>
  );
}
