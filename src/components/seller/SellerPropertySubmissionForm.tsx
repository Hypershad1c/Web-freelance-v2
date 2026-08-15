"use client";

import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, FileCheck2, Home, Loader2, ShieldCheck, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { Turnstile } from "@/components/Turnstile";

type Option = { id: string; name: string; cityId?: string };
type SellerPropertySubmissionFormProps = {
  user: { name: string; email: string; phone: string };
  cities: Option[];
  neighborhoods: Option[];
  propertyTypes: Option[];
};

type FormState = {
  transaction: "VENTE" | "LOCATION";
  propertyTypeId: string;
  cityId: string;
  neighborhoodId: string;
  title: string;
  description: string;
  price: string;
  surfaceArea: string;
  bedrooms: string;
  bathrooms: string;
  address: string;
  phone: string;
  imageUrls: string[];
  consent: boolean;
};

export function SellerPropertySubmissionForm({ user, cities, neighborhoods, propertyTypes }: SellerPropertySubmissionFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ reference: string; title: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    transaction: "VENTE",
    propertyTypeId: propertyTypes[0]?.id ?? "",
    cityId: cities[0]?.id ?? "",
    neighborhoodId: "",
    title: "",
    description: "",
    price: "",
    surfaceArea: "",
    bedrooms: "0",
    bathrooms: "0",
    address: "",
    phone: user.phone,
    imageUrls: [],
    consent: false,
  });

  const visibleNeighborhoods = useMemo(
    () => neighborhoods.filter((item) => !item.cityId || item.cityId === form.cityId),
    [form.cityId, neighborhoods]
  );
  const handleImageUrlsChange = useCallback((urls: string[]) => {
    setForm((current) => current.imageUrls.join("\n") === urls.join("\n") ? current : { ...current, imageUrls: urls });
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: [] }));
    setError(null);
  }

  function validateCurrentStep() {
    const errors: Record<string, string[]> = {};
    if (step === 1) {
      if (!form.propertyTypeId) errors.propertyTypeId = ["Choisissez un type de bien."];
      if (!form.cityId) errors.cityId = ["Choisissez une ville."];
      if (form.title.trim().length < 3) errors.title = ["Ajoutez un titre d’au moins 3 caractères."];
    }
    if (step === 2) {
      if (!Number(form.price) || Number(form.price) <= 0) errors.price = ["Indiquez un prix positif."];
      if (!Number(form.surfaceArea) || Number(form.surfaceArea) <= 0) errors.surfaceArea = ["Indiquez une surface positive."];
      if (form.description.trim().length < 20) errors.description = ["Décrivez votre bien en au moins 20 caractères."];
    }
    if (step === 3 && form.phone.trim().length < 8) errors.phone = ["Indiquez un numéro de téléphone valide."];
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function nextStep() {
    if (validateCurrentStep()) setStep((current) => Math.min(3, current + 1));
  }

  function previousStep() {
    setError(null);
    setStep((current) => Math.max(1, current - 1));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateCurrentStep() || !form.consent) {
      if (!form.consent) setError("Veuillez accepter les conditions de dépôt avant de continuer.");
      return;
    }
    setSending(true);
    setError(null);
    setFieldErrors({});

    try {
      const response = await fetch("/api/seller/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          listingType: form.transaction,
          propertyTypeId: form.propertyTypeId,
          cityId: form.cityId,
          neighborhoodId: form.neighborhoodId || null,
          price: form.price,
          surfaceArea: form.surfaceArea,
          bedrooms: form.bedrooms,
          bathrooms: form.bathrooms,
          address: form.address,
          phone: form.phone,
          imageUrls: form.imageUrls,
          consent: form.consent,
          turnstileToken,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.error && typeof data.error === "object") setFieldErrors(data.error);
        else setError(typeof data.error === "string" ? data.error : "Impossible de soumettre votre bien.");
        return;
      }
      setSent({ reference: data.property.reference, title: data.property.title });
      router.refresh();
    } catch {
      setError("Une erreur réseau est survenue. Merci de réessayer.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-[1.8rem] bg-white p-7 shadow-luxury sm:p-10">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={32} /></span>
          <p className="luxury-eyebrow mt-6 text-domify-gold">Dépôt reçu</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-domify-dark">Votre annonce est en cours de vérification.</h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-domify-dark/60">Notre équipe va contrôler les informations, les médias et le prix avant toute publication. Vous pourrez suivre la décision depuis votre espace vendeur.</p>
          <div className="mt-6 w-full rounded-2xl bg-domify-warm-white/70 p-5 text-start"><p className="text-xs font-bold uppercase tracking-[0.14em] text-domify-gold">Référence de dépôt</p><p className="mt-2 font-display text-2xl font-semibold text-domify-dark">{sent.reference}</p><p className="mt-1 text-sm text-domify-dark/55">{sent.title}</p></div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link href="/espace-vendeur" className="pressable inline-flex items-center justify-center gap-2 rounded-full bg-domify-primary px-5 py-3 text-sm font-semibold text-white hover:bg-domify-primary-dark"><FileCheck2 size={16} /> Ouvrir mon espace vendeur</Link><Link href="/proprietes" className="pressable inline-flex items-center justify-center gap-2 rounded-full border border-domify-dark/10 px-5 py-3 text-sm font-semibold text-domify-dark hover:bg-domify-warm-white"><Home size={16} /> Explorer les biens</Link></div>
        </div>
      </div>
    );
  }

  const progress = [
    { number: 1, label: "Projet" },
    { number: 2, label: "Bien" },
    { number: 3, label: "Contact & médias" },
  ];

  return (
    <form onSubmit={submit} className="rounded-[1.8rem] bg-white p-5 shadow-luxury sm:p-8">
      <div className="mb-8 flex items-center justify-between gap-3">
        {progress.map((item) => <div key={item.number} className="flex flex-1 items-center gap-2"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${step >= item.number ? "bg-domify-primary text-white" : "bg-domify-warm-white text-domify-dark/45"}`}>{item.number}</span><span className={`hidden text-xs font-semibold sm:block ${step >= item.number ? "text-domify-primary" : "text-domify-dark/40"}`}>{item.label}</span>{item.number < 3 && <span className={`h-px flex-1 ${step > item.number ? "bg-domify-primary" : "bg-black/10"}`} />}</div>)}
      </div>

      {step === 1 && <div className="space-y-6"><div><p className="luxury-eyebrow text-domify-gold">Votre projet</p><h2 className="mt-2 font-display text-2xl font-semibold text-domify-dark">Que souhaitez-vous proposer ?</h2><p className="mt-2 text-sm leading-6 text-domify-dark/55">Une annonce complète aide notre équipe à vérifier plus rapidement votre bien.</p></div><div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => update("transaction", "VENTE")} className={`rounded-2xl border p-5 text-start transition-luxury ${form.transaction === "VENTE" ? "border-domify-gold bg-domify-warm-white/60 shadow-luxury" : "border-domify-dark/10 hover:border-domify-gold/40"}`}><span className="font-display text-lg font-semibold text-domify-dark">Je veux vendre</span><span className="mt-1 block text-sm text-domify-dark/55">Maison, appartement, villa ou terrain.</span></button><button type="button" onClick={() => update("transaction", "LOCATION")} className={`rounded-2xl border p-5 text-start transition-luxury ${form.transaction === "LOCATION" ? "border-domify-gold bg-domify-warm-white/60 shadow-luxury" : "border-domify-dark/10 hover:border-domify-gold/40"}`}><span className="font-display text-lg font-semibold text-domify-dark">Je veux louer</span><span className="mt-1 block text-sm text-domify-dark/55">Proposez votre bien à des locataires qualifiés.</span></button></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Type de bien" error={fieldErrors.propertyTypeId?.[0]}><select value={form.propertyTypeId} onChange={(e) => update("propertyTypeId", e.target.value)} className="domify-select">{propertyTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Ville" error={fieldErrors.cityId?.[0]}><select value={form.cityId} onChange={(e) => { update("cityId", e.target.value); update("neighborhoodId", ""); }} className="domify-select">{cities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field></div><Field label="Titre de l’annonce" error={fieldErrors.title?.[0]}><input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Ex. Villa contemporaine avec jardin à Casablanca" className="domify-select" /></Field></div>}

      {step === 2 && <div className="space-y-6"><div><p className="luxury-eyebrow text-domify-gold">Les informations du bien</p><h2 className="mt-2 font-display text-2xl font-semibold text-domify-dark">Décrivez votre propriété</h2></div><div className="grid gap-4 sm:grid-cols-2"><Field label={form.transaction === "VENTE" ? "Prix de vente (MAD)" : "Loyer mensuel (MAD)"} error={fieldErrors.price?.[0]}><input required type="number" min="1" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="Ex. 2 500 000" className="domify-select" /></Field><Field label="Surface (m²)" error={fieldErrors.surfaceArea?.[0]}><input required type="number" min="1" value={form.surfaceArea} onChange={(e) => update("surfaceArea", e.target.value)} placeholder="Ex. 180" className="domify-select" /></Field><Field label="Chambres"><input type="number" min="0" value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)} className="domify-select" /></Field><Field label="Salles de bain"><input type="number" min="0" value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value)} className="domify-select" /></Field></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Quartier"><select value={form.neighborhoodId} onChange={(e) => update("neighborhoodId", e.target.value)} className="domify-select"><option value="">Sélectionner si disponible</option>{visibleNeighborhoods.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="Adresse ou secteur"><input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Adresse approximative acceptée" className="domify-select" /></Field></div><Field label="Description" error={fieldErrors.description?.[0]}><textarea rows={7} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Décrivez l’état, les points forts, la disponibilité et les informations utiles pour la vérification." className="min-h-40 w-full rounded-xl border border-domify-dark/10 px-4 py-3 text-sm text-domify-dark outline-none transition focus:border-domify-secondary focus:ring-4 focus:ring-domify-secondary/10" /></Field></div>}

      {step === 3 && <div className="space-y-6"><div><p className="luxury-eyebrow text-domify-gold">Dernière étape</p><h2 className="mt-2 font-display text-2xl font-semibold text-domify-dark">Vos coordonnées et vos images</h2><p className="mt-2 text-sm leading-6 text-domify-dark/55">Ces informations restent liées à votre compte et servent au suivi de la vérification.</p></div><div className="rounded-2xl bg-domify-warm-white/65 p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-domify-gold">Compte propriétaire</p><p className="mt-2 font-semibold text-domify-dark">{user.name}</p><p className="mt-1 text-sm text-domify-dark/55">{user.email}</p></div><Field label="Téléphone de contact" error={fieldErrors.phone?.[0]}><input required type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+212 6 00 00 00 00" className="domify-select" /></Field><div><div className="flex items-center justify-between gap-3"><div><label className="block text-sm font-semibold text-domify-dark">Photos du bien</label><p className="mt-1 text-xs text-domify-dark/50">Ajoutez jusqu’à 20 images, 10 Mo maximum par image.</p></div><UploadCloud size={20} className="text-domify-gold" /></div><div className="mt-3 rounded-2xl border border-domify-dark/8 bg-domify-warm-white/35 p-4"><MediaUploader name="sellerImages" signEndpoint="/api/seller/media/sign" maxImages={20} maxFileSizeMb={10} onUrlsChange={handleImageUrlsChange} /><input type="hidden" name="imageUrls" value={form.imageUrls.join("\n")} readOnly /></div></div><div className="flex items-start gap-3 rounded-2xl border border-domify-dark/8 p-4"><input id="seller-consent" type="checkbox" checked={form.consent} onChange={(e) => update("consent", e.target.checked)} className="mt-1 h-4 w-4 accent-domify-primary" /><label htmlFor="seller-consent" className="text-sm leading-6 text-domify-dark/65">J’autorise Domify à examiner les informations et les images transmises afin de vérifier et traiter cette annonce. Je comprends que le bien ne sera pas publié avant validation.</label></div><Turnstile action="seller_property" onTokenChange={setTurnstileToken} /></div>}

      {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
      <div className="mt-8 flex flex-col-reverse justify-between gap-3 sm:flex-row"><button type="button" onClick={previousStep} disabled={step === 1 || sending} className="inline-flex items-center justify-center gap-2 rounded-xl border border-domify-dark/10 px-5 py-3 text-sm font-semibold text-domify-dark disabled:cursor-not-allowed disabled:opacity-35"><ChevronLeft size={16} /> Retour</button>{step < 3 ? <button type="button" onClick={nextStep} className="inline-flex items-center justify-center gap-2 rounded-xl bg-domify-primary px-6 py-3 text-sm font-semibold text-white shadow-luxury hover:bg-domify-primary-dark">Continuer <ChevronRight size={16} /></button> : <button type="submit" disabled={sending || !form.consent || (Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) && !turnstileToken)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-domify-gold px-6 py-3 text-sm font-semibold text-white shadow-luxury hover:bg-domify-soft-gold hover:text-domify-dark disabled:cursor-not-allowed disabled:opacity-55">{sending ? <><Loader2 size={16} className="animate-spin" /> Envoi en cours...</> : <><ShieldCheck size={16} /> Soumettre à vérification</>}</button>}</div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div><label className="mb-2 block text-sm font-semibold text-domify-dark">{label}</label>{children}{error && <p className="mt-1 text-xs text-red-600">{error}</p>}</div>;
}
