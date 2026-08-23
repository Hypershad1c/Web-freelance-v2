"use client";

import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, FileCheck2, Home, Loader2, ShieldCheck, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { Turnstile } from "@/components/Turnstile";
import type { Locale } from "@/i18n/locales";

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

const SELLER_FORM_COPY = {
  fr: { typeRequired: "Choisissez un type de bien.", cityRequired: "Choisissez une ville.", titleRequired: "Ajoutez un titre d’au moins 3 caractères.", priceRequired: "Indiquez un prix positif.", surfaceRequired: "Indiquez une surface positive.", descriptionRequired: "Décrivez votre bien en au moins 20 caractères.", phoneRequired: "Indiquez un numéro de téléphone valide.", consentRequired: "Veuillez accepter les conditions de dépôt avant de continuer.", submitFailed: "Impossible de soumettre votre bien.", network: "Une erreur réseau est survenue. Merci de réessayer.", received: "Dépôt reçu", reviewing: "Votre annonce est en cours de vérification.", successBody: "Notre équipe va contrôler les informations, les médias et le prix avant toute publication. Vous pourrez suivre la décision depuis votre espace vendeur.", reference: "Référence de dépôt", sellerSpace: "Ouvrir mon espace vendeur", explore: "Explorer les biens", project: "Projet", property: "Bien", contactMedia: "Contact & médias", projectEyebrow: "Votre projet", projectTitle: "Que souhaitez-vous proposer ?", projectBody: "Une annonce complète aide notre équipe à vérifier plus rapidement votre bien.", sell: "Je veux vendre", sellBody: "Maison, appartement, villa ou terrain.", rent: "Je veux louer", rentBody: "Proposez votre bien à des locataires qualifiés.", type: "Type de bien", city: "Ville", title: "Titre de l’annonce", titlePlaceholder: "Ex. Villa contemporaine avec jardin à Casablanca", propertyEyebrow: "Les informations du bien", propertyTitle: "Décrivez votre propriété", salePrice: "Prix de vente (MAD)", rentPrice: "Loyer mensuel (MAD)", pricePlaceholder: "Ex. 2 500 000", surface: "Surface (m²)", surfacePlaceholder: "Ex. 180", bedrooms: "Chambres", bathrooms: "Salles de bain", neighborhood: "Quartier", optionalNeighborhood: "Sélectionner si disponible", address: "Adresse ou secteur", addressPlaceholder: "Adresse approximative acceptée", description: "Description", descriptionPlaceholder: "Décrivez l’état, les points forts, la disponibilité et les informations utiles pour la vérification.", finalEyebrow: "Dernière étape", contactTitle: "Vos coordonnées et vos images", contactBody: "Ces informations restent liées à votre compte et servent au suivi de la vérification.", ownerAccount: "Compte propriétaire", phone: "Téléphone de contact", photos: "Photos du bien", photosBody: "Ajoutez jusqu’à 20 images, 10 Mo maximum par image.", consent: "J’autorise Domify à examiner les informations et les images transmises afin de vérifier et traiter cette annonce. Je comprends que le bien ne sera pas publié avant validation.", back: "Retour", continue: "Continuer", sending: "Envoi en cours...", submit: "Soumettre à vérification" },
  ar: { typeRequired: "اختر نوع العقار.", cityRequired: "اختر مدينة.", titleRequired: "أضف عنواناً لا يقل عن ثلاثة أحرف.", priceRequired: "أدخل سعراً موجباً.", surfaceRequired: "أدخل مساحة موجبة.", descriptionRequired: "صف عقارك في 20 حرفاً على الأقل.", phoneRequired: "أدخل رقم هاتف صالحاً.", consentRequired: "يرجى الموافقة على شروط التقديم قبل المتابعة.", submitFailed: "تعذر تقديم عقارك.", network: "حدث خطأ في الشبكة. يرجى المحاولة مرة أخرى.", received: "تم استلام الطلب", reviewing: "إعلانك قيد المراجعة.", successBody: "سيراجع فريقنا المعلومات والصور والسعر قبل أي نشر. يمكنك متابعة القرار من مساحة البائع.", reference: "مرجع التقديم", sellerSpace: "افتح مساحة البائع", explore: "استكشف العقارات", project: "المشروع", property: "العقار", contactMedia: "التواصل والصور", projectEyebrow: "مشروعك", projectTitle: "ماذا تريد أن تعرض؟", projectBody: "يساعد الإعلان المكتمل فريقنا على التحقق من عقارك بسرعة أكبر.", sell: "أريد البيع", sellBody: "منزل أو شقة أو فيلا أو أرض.", rent: "أريد التأجير", rentBody: "اعرض عقارك على مستأجرين مؤهلين.", type: "نوع العقار", city: "المدينة", title: "عنوان الإعلان", titlePlaceholder: "مثال: فيلا عصرية بحديقة في الدار البيضاء", propertyEyebrow: "معلومات العقار", propertyTitle: "صف عقارك", salePrice: "سعر البيع (MAD)", rentPrice: "الإيجار الشهري (MAD)", pricePlaceholder: "مثال: 2 500 000", surface: "المساحة (م²)", surfacePlaceholder: "مثال: 180", bedrooms: "غرف النوم", bathrooms: "الحمامات", neighborhood: "الحي", optionalNeighborhood: "اختره إن توفر", address: "العنوان أو المنطقة", addressPlaceholder: "يمكن إدخال عنوان تقريبي", description: "الوصف", descriptionPlaceholder: "صف الحالة والمزايا والتوفر والمعلومات المفيدة للمراجعة.", finalEyebrow: "الخطوة الأخيرة", contactTitle: "بيانات التواصل والصور", contactBody: "تبقى هذه المعلومات مرتبطة بحسابك وتُستخدم لمتابعة المراجعة.", ownerAccount: "حساب المالك", phone: "هاتف التواصل", photos: "صور العقار", photosBody: "أضف حتى 20 صورة، بحد أقصى 10 ميغابايت للصورة.", consent: "أفوض دوميفاي لمراجعة المعلومات والصور المرسلة للتحقق من هذا الإعلان ومعالجته. أفهم أن العقار لن يُنشر قبل التحقق.", back: "رجوع", continue: "متابعة", sending: "جارٍ الإرسال...", submit: "أرسل للمراجعة" },
} as const;

export function SellerPropertySubmissionForm({ user, cities, neighborhoods, propertyTypes, locale = "fr" }: SellerPropertySubmissionFormProps & { locale?: Locale }) {
  const copy = locale === "ar" ? SELLER_FORM_COPY.ar : SELLER_FORM_COPY.fr;
  const isRtl = locale === "ar";
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
      if (!form.propertyTypeId) errors.propertyTypeId = [copy.typeRequired];
      if (!form.cityId) errors.cityId = [copy.cityRequired];
      if (form.title.trim().length < 3) errors.title = [copy.titleRequired];
    }
    if (step === 2) {
      if (!Number(form.price) || Number(form.price) <= 0) errors.price = [copy.priceRequired];
      if (!Number(form.surfaceArea) || Number(form.surfaceArea) <= 0) errors.surfaceArea = [copy.surfaceRequired];
      if (form.description.trim().length < 20) errors.description = [copy.descriptionRequired];
    }
    if (step === 3 && form.phone.trim().length < 8) errors.phone = [copy.phoneRequired];
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
      if (!form.consent) setError(copy.consentRequired);
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
        else setError(typeof data.error === "string" ? data.error : copy.submitFailed);
        return;
      }
      setSent({ reference: data.property.reference, title: data.property.title });
      router.refresh();
    } catch {
      setError(copy.network);
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div dir={isRtl ? "rtl" : "ltr"} className={`rounded-[1.8rem] bg-white p-7 shadow-luxury sm:p-10 ${isRtl ? "text-right" : ""}`}>
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={32} /></span>
          <p className="luxury-eyebrow mt-6 text-domify-gold">{copy.received}</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-domify-dark">{copy.reviewing}</h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-domify-dark/60">{copy.successBody}</p>
          <div className="mt-6 w-full rounded-2xl bg-domify-warm-white/70 p-5 text-start"><p className="text-xs font-bold uppercase tracking-[0.14em] text-domify-gold">{copy.reference}</p><p className="mt-2 font-display text-2xl font-semibold text-domify-dark"><bdi>{sent.reference}</bdi></p><p className="mt-1 text-sm text-domify-dark/55">{sent.title}</p></div>
          <div className={`mt-7 flex flex-col gap-3 sm:flex-row ${isRtl ? "sm:flex-row-reverse" : ""}`}><Link href="/espace-vendeur" className="pressable inline-flex items-center justify-center gap-2 rounded-full bg-domify-primary px-5 py-3 text-sm font-semibold text-white hover:bg-domify-primary-dark"><FileCheck2 size={16} /> {copy.sellerSpace}</Link><Link href="/proprietes" className="pressable inline-flex items-center justify-center gap-2 rounded-full border border-domify-dark/10 px-5 py-3 text-sm font-semibold text-domify-dark hover:bg-domify-warm-white"><Home size={16} /> {copy.explore}</Link></div>
        </div>
      </div>
    );
  }

  const progress = [
    { number: 1, label: copy.project },
    { number: 2, label: copy.property },
    { number: 3, label: copy.contactMedia },
  ];

  return (
    <form onSubmit={submit} dir={isRtl ? "rtl" : "ltr"} className={`rounded-[1.8rem] bg-white p-5 shadow-luxury sm:p-8 ${isRtl ? "text-right" : ""}`}>
      <div className="mb-8 flex items-center justify-between gap-3">
        {progress.map((item) => <div key={item.number} className="flex flex-1 items-center gap-2"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${step >= item.number ? "bg-domify-primary text-white" : "bg-domify-warm-white text-domify-dark/45"}`}>{item.number}</span><span className={`hidden text-xs font-semibold sm:block ${step >= item.number ? "text-domify-primary" : "text-domify-dark/40"}`}>{item.label}</span>{item.number < 3 && <span className={`h-px flex-1 ${step > item.number ? "bg-domify-primary" : "bg-black/10"}`} />}</div>)}
      </div>

      {step === 1 && <div className="space-y-6"><div><p className="luxury-eyebrow text-domify-gold">{copy.projectEyebrow}</p><h2 className="mt-2 font-display text-2xl font-semibold text-domify-dark">{copy.projectTitle}</h2><p className="mt-2 text-sm leading-6 text-domify-dark/55">{copy.projectBody}</p></div><div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => update("transaction", "VENTE")} className={`rounded-2xl border p-5 text-start transition-luxury ${form.transaction === "VENTE" ? "border-domify-gold bg-domify-warm-white/60 shadow-luxury" : "border-domify-dark/10 hover:border-domify-gold/40"}`}><span className="font-display text-lg font-semibold text-domify-dark">{copy.sell}</span><span className="mt-1 block text-sm text-domify-dark/55">{copy.sellBody}</span></button><button type="button" onClick={() => update("transaction", "LOCATION")} className={`rounded-2xl border p-5 text-start transition-luxury ${form.transaction === "LOCATION" ? "border-domify-gold bg-domify-warm-white/60 shadow-luxury" : "border-domify-dark/10 hover:border-domify-gold/40"}`}><span className="font-display text-lg font-semibold text-domify-dark">{copy.rent}</span><span className="mt-1 block text-sm text-domify-dark/55">{copy.rentBody}</span></button></div><div className="grid gap-4 sm:grid-cols-2"><Field label={copy.type} error={fieldErrors.propertyTypeId?.[0]}><select value={form.propertyTypeId} onChange={(e) => update("propertyTypeId", e.target.value)} className="domify-select">{propertyTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label={copy.city} error={fieldErrors.cityId?.[0]}><select value={form.cityId} onChange={(e) => { update("cityId", e.target.value); update("neighborhoodId", ""); }} className="domify-select">{cities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field></div><Field label={copy.title} error={fieldErrors.title?.[0]}><input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder={copy.titlePlaceholder} className="domify-select" /></Field></div>}

      {step === 2 && <div className="space-y-6"><div><p className="luxury-eyebrow text-domify-gold">{copy.propertyEyebrow}</p><h2 className="mt-2 font-display text-2xl font-semibold text-domify-dark">{copy.propertyTitle}</h2></div><div className="grid gap-4 sm:grid-cols-2"><Field label={form.transaction === "VENTE" ? copy.salePrice : copy.rentPrice} error={fieldErrors.price?.[0]}><input required type="number" min="1" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder={copy.pricePlaceholder} className="domify-select" /></Field><Field label={copy.surface} error={fieldErrors.surfaceArea?.[0]}><input required type="number" min="1" value={form.surfaceArea} onChange={(e) => update("surfaceArea", e.target.value)} placeholder={copy.surfacePlaceholder} className="domify-select" /></Field><Field label={copy.bedrooms}><input type="number" min="0" value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)} className="domify-select" /></Field><Field label={copy.bathrooms}><input type="number" min="0" value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value)} className="domify-select" /></Field></div><div className="grid gap-4 sm:grid-cols-2"><Field label={copy.neighborhood}><select value={form.neighborhoodId} onChange={(e) => update("neighborhoodId", e.target.value)} className="domify-select"><option value="">{copy.optionalNeighborhood}</option>{visibleNeighborhoods.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label={copy.address}><input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder={copy.addressPlaceholder} className="domify-select" /></Field></div><Field label={copy.description} error={fieldErrors.description?.[0]}><textarea rows={7} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder={copy.descriptionPlaceholder} className="min-h-40 w-full rounded-xl border border-domify-dark/10 px-4 py-3 text-sm text-domify-dark outline-none transition focus:border-domify-secondary focus:ring-4 focus:ring-domify-secondary/10" /></Field></div>}

      {step === 3 && <div className="space-y-6"><div><p className="luxury-eyebrow text-domify-gold">{copy.finalEyebrow}</p><h2 className="mt-2 font-display text-2xl font-semibold text-domify-dark">{copy.contactTitle}</h2><p className="mt-2 text-sm leading-6 text-domify-dark/55">{copy.contactBody}</p></div><div className="rounded-2xl bg-domify-warm-white/65 p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-domify-gold">{copy.ownerAccount}</p><p className="mt-2 font-semibold text-domify-dark">{user.name}</p><p className="mt-1 text-sm text-domify-dark/55"><bdi>{user.email}</bdi></p></div><Field label={copy.phone} error={fieldErrors.phone?.[0]}><input required type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+212 6 00 00 00 00" className="domify-select" /></Field><div><div className="flex items-center justify-between gap-3"><div><label className="block text-sm font-semibold text-domify-dark">{copy.photos}</label><p className="mt-1 text-xs text-domify-dark/50">{copy.photosBody}</p></div><UploadCloud size={20} className="text-domify-gold" /></div><div className="mt-3 rounded-2xl border border-domify-dark/8 bg-domify-warm-white/35 p-4"><MediaUploader name="sellerImages" signEndpoint="/api/seller/media/sign" maxImages={20} maxFileSizeMb={10} onUrlsChange={handleImageUrlsChange} /><input type="hidden" name="imageUrls" value={form.imageUrls.join("\n")} readOnly /></div></div><div className="flex items-start gap-3 rounded-2xl border border-domify-dark/8 p-4"><input id="seller-consent" type="checkbox" checked={form.consent} onChange={(e) => update("consent", e.target.checked)} className="mt-1 h-4 w-4 accent-domify-primary" /><label htmlFor="seller-consent" className="text-sm leading-6 text-domify-dark/65">{copy.consent}</label></div><Turnstile action="seller_property" onTokenChange={setTurnstileToken} /></div>}

      {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}
      <div className={`mt-8 flex flex-col-reverse justify-between gap-3 sm:flex-row ${isRtl ? "sm:flex-row-reverse" : ""}`}><button type="button" onClick={previousStep} disabled={step === 1 || sending} className="inline-flex items-center justify-center gap-2 rounded-xl border border-domify-dark/10 px-5 py-3 text-sm font-semibold text-domify-dark disabled:cursor-not-allowed disabled:opacity-35">{isRtl ? <ChevronRight size={16} /> : <ChevronLeft size={16} />} {copy.back}</button>{step < 3 ? <button type="button" onClick={nextStep} className="inline-flex items-center justify-center gap-2 rounded-xl bg-domify-primary px-6 py-3 text-sm font-semibold text-white shadow-luxury hover:bg-domify-primary-dark">{copy.continue} {isRtl ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}</button> : <button type="submit" disabled={sending || !form.consent || (Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) && !turnstileToken)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-domify-gold px-6 py-3 text-sm font-semibold text-white shadow-luxury hover:bg-domify-soft-gold hover:text-domify-dark disabled:cursor-not-allowed disabled:opacity-55">{sending ? <><Loader2 size={16} className="animate-spin" /> {copy.sending}</> : <><ShieldCheck size={16} /> {copy.submit}</>}</button>}</div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div><label className="mb-2 block text-sm font-semibold text-domify-dark">{label}</label>{children}{error && <p className="mt-1 text-xs text-red-600">{error}</p>}</div>;
}
