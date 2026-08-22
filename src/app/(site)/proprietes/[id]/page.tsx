import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Bed, Bath, Square, MapPin, Calendar, Hash, Check, Eye, BadgeCheck, Landmark, ArrowUpRight } from "lucide-react";
import { getPropertyById, getSimilarProperties, incrementPropertyViews } from "@/lib/data/properties";
import { PropertyGallery } from "@/components/properties/PropertyGallery";
import { ContactAgentCard } from "@/components/properties/ContactAgentCard";
import { PropertyActionButtons } from "@/components/properties/PropertyActionButtons";
import { MobilePropertyActionBar } from "@/components/properties/MobilePropertyActionBar";
import { PropertyCard } from "@/components/home/PropertyCard";
import { PropertyMapClient } from "@/components/map/PropertyMapClient";
import { JsonLd } from "@/components/JsonLd";
import { FadeIn, StaggerReveal, staggerItem } from "@/components/motion/FadeIn";
import { MotionDiv } from "@/components/motion/MotionPrimitives";
import { formatMAD } from "@/lib/utils";
import { getLocale } from "@/i18n/get-locale";
import { getLocalizedPropertyContent } from "@/lib/data/property-localization";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop";

const DETAIL_COPY = {
  fr: { home: "Accueil", properties: "Propriétés", rent: "À louer", sale: "À vendre", verified: "Agence vérifiée", month: "/mois", views: "vue", bedrooms: "Chambres", bathrooms: "Salles de bain", surface: "Surface", year: "Année", description: "Description", reference: "Référence", finance: "Financement Domify", financeTitle: "Projetez votre mensualité.", financeBody: "Comparez les taux indicatifs des banques marocaines pour ce projet.", amenities: "Équipements", location: "Localisation", approximate: "Localisation approximative", support: "L’accompagnement Domify", supportTitle: "Un conseiller dédié pour vous guider à chaque étape.", supportBody: "Réponse rapide, visite privée et suivi personnalisé.", similar: "Biens similaires" },
  en: { home: "Home", properties: "Properties", rent: "For rent", sale: "For sale", verified: "Verified agency", month: "/month", views: "view", bedrooms: "Bedrooms", bathrooms: "Bathrooms", surface: "Area", year: "Year", description: "Description", reference: "Reference", finance: "Domify financing", financeTitle: "Estimate your monthly payment.", financeBody: "Compare indicative Moroccan bank rates for this project.", amenities: "Amenities", location: "Location", approximate: "Approximate location", support: "The Domify experience", supportTitle: "A dedicated advisor to guide you at every step.", supportBody: "Fast response, private visits, and tailored follow-up.", similar: "Similar properties" },
  ar: { home: "الرئيسية", properties: "العقارات", rent: "للإيجار", sale: "للبيع", verified: "وكالة موثقة", month: "/شهرياً", views: "مشاهدة", bedrooms: "غرف النوم", bathrooms: "الحمامات", surface: "المساحة", year: "سنة البناء", description: "الوصف", reference: "المرجع", finance: "تمويل دوميفاي", financeTitle: "احسب قسطك الشهري.", financeBody: "قارن الأسعار الاسترشادية للبنوك المغربية لمشروعك.", amenities: "المزايا", location: "الموقع", approximate: "الموقع التقريبي", support: "مرافقة دوميفاي", supportTitle: "مستشار مخصص لمرافقتك في كل خطوة.", supportBody: "استجابة سريعة، زيارات خاصة، ومتابعة شخصية.", similar: "عقارات مشابهة" },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const property = await getPropertyById(id);
  if (!property) return {};
  const locale = await getLocale();
  const content = getLocalizedPropertyContent(property, locale);
  return {
    title: `${content.seoTitle} — ${property.city.name} | Domify`,
    description: content.seoDescription.slice(0, 155),
  };
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getPropertyById(id);
  if (!property) notFound();
  const locale = await getLocale();
  const content = getLocalizedPropertyContent(property, locale);
  const copy = DETAIL_COPY[locale];
  const isRtl = locale === "ar";

  incrementPropertyViews(id).catch(() => {});

  const similar = await getSimilarProperties(property);
  const images = property.media.length > 0 ? property.media.map((m) => m.url) : [FALLBACK_IMAGE];
  const galleryMedia = property.media.length > 0 ? property.media.map((m) => ({ url: m.url, type: m.type, alt: m.alt || content.title })) : [{ url: FALLBACK_IMAGE, type: "image", alt: content.title }];

  const baseUrl = process.env.NEXTAUTH_URL || "https://domify.ma";
  const propertyUrl = `${baseUrl}/proprietes/${property.id}`;

  const listingJsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    url: propertyUrl,
    name: content.title,
    description: content.description,
    image: images,
    datePosted: property.createdAt,
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address || undefined,
      addressLocality: property.city.name,
      addressCountry: "MA",
    },
    ...(property.latitude && property.longitude
      ? { geo: { "@type": "GeoCoordinates", latitude: property.latitude, longitude: property.longitude } }
      : {}),
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: "MAD",
      availability: "https://schema.org/InStock",
      businessFunction: property.listingType === "LOCATION" ? "https://schema.org/LeaseOut" : "https://schema.org/Sell",
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Propriétés", item: `${baseUrl}/proprietes` },
      { "@type": "ListItem", position: 3, name: content.title, item: propertyUrl },
    ],
  };

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className={`mx-auto max-w-7xl bg-[radial-gradient(circle_at_85%_0%,rgba(232,203,145,0.12),transparent_24rem)] px-4 pb-28 pt-9 sm:px-6 lg:px-8 lg:py-12 ${isRtl ? "text-right" : ""}`}>
      <JsonLd data={listingJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      {/* Breadcrumb */}
      <nav className={`mb-7 flex items-center gap-2 text-xs text-domify-dark/50 ${isRtl ? "flex-row-reverse justify-end" : ""}`}>
        <Link href="/" className="hover:text-domify-primary">{copy.home}</Link> /
        <Link href="/proprietes" className="hover:text-domify-primary">{copy.properties}</Link> /
        <span className="text-domify-dark/80">{content.title}</span>
      </nav>

      <div className={`grid grid-cols-1 gap-10 lg:items-start ${isRtl ? "lg:grid-cols-[380px_minmax(0,1fr)]" : "lg:grid-cols-[minmax(0,1fr)_380px]"}`}>
        <div>
          <FadeIn><PropertyGallery media={galleryMedia} title={content.title} /></FadeIn>

          {/* Header */}
          <div className="mt-8 flex flex-col justify-between gap-5 border-b border-black/5 pb-8 sm:flex-row sm:items-start">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="inline-block rounded-full bg-domify-gold/10 px-3 py-1 text-xs font-semibold text-domify-gold">{property.propertyType.name}</span>
                <span className="rounded-full bg-domify-primary/8 px-3 py-1 text-xs font-semibold text-domify-primary">{property.listingType === "LOCATION" ? copy.rent : copy.sale}</span>
                {property.agency?.verified && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700"><BadgeCheck size={13} /> {copy.verified}</span>}
              </div>
              <h1 className="max-w-2xl font-display text-3xl font-semibold leading-[1.04] tracking-[-0.025em] text-domify-dark sm:text-5xl">{content.title}</h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-domify-dark/60">
                <MapPin size={15} /> {property.neighborhood ? `${property.neighborhood.name}, ` : ""}{property.city.name}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-3">
                <PropertyActionButtons propertyId={property.id} />
                <p className="text-2xl font-bold text-domify-gold whitespace-nowrap">
                  {formatMAD(property.price)}
                  {property.listingType === "LOCATION" && <span className="text-sm font-normal text-domify-dark/50"> {copy.month}</span>}
                </p>
              </div>
              <span className="flex items-center gap-1 text-xs text-domify-dark/40">
                <Eye size={13} /> {property.viewsCount} {copy.views}{locale === "fr" && property.viewsCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          {/* Key facts */}
          <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <Fact icon={Bed} label={copy.bedrooms} value={property.bedrooms} />
            <Fact icon={Bath} label={copy.bathrooms} value={property.bathrooms} />
            <Fact icon={Square} label={copy.surface} value={`${property.surfaceArea} m²`} />
            <Fact icon={Calendar} label={copy.year} value={property.yearBuilt ?? "—"} />
          </div>

          {/* Description */}
          <div className="mt-10">
            <h2 className="font-display text-xl font-semibold text-domify-dark">{copy.description}</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-domify-dark/70">{content.description}</p>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-domify-dark/40">
              <Hash size={12} /> {copy.reference} <bdi>{property.reference}</bdi>
            </p>
          </div>

          <Link href="/calculateur-credit" className="group mt-10 flex items-center gap-4 rounded-[1.35rem] border border-domify-gold/30 bg-[linear-gradient(135deg,rgba(232,203,145,0.24),rgba(255,255,255,0.95))] p-5 shadow-[0_18px_38px_-30px_rgba(16,47,66,0.45)] transition-luxury hover:-translate-y-0.5 hover:border-domify-gold/65">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-domify-primary text-domify-soft-gold shadow-[0_14px_24px_-16px_rgba(16,47,66,0.7)]"><Landmark size={21} /></span>
            <span className="min-w-0 flex-1"><span className="block text-[0.66rem] font-bold uppercase tracking-[0.16em] text-domify-gold">{copy.finance}</span><span className="mt-1 block font-display text-lg font-semibold text-domify-dark">{copy.financeTitle}</span><span className="mt-1 block text-sm text-domify-dark/58">{copy.financeBody}</span></span>
            <ArrowUpRight size={19} className={`shrink-0 text-domify-primary transition-transform group-hover:-translate-y-0.5 ${isRtl ? "-scale-x-100 group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5"}`} />
          </Link>

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <div className="mt-10">
              <h2 className="font-display text-xl font-semibold text-domify-dark">{copy.amenities}</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {property.amenities.map((a) => (
                  <span key={a.id} className="flex items-center gap-2 rounded-lg bg-domify-warm-white px-3 py-2.5 text-sm text-domify-dark/80">
                    <Check size={14} className="text-domify-gold" /> {a.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Map */}
          <div className="mt-10">
            <h2 className="font-display text-xl font-semibold text-domify-dark">{copy.location}</h2>
            {property.latitude && property.longitude ? (
              <div className="mt-4">
                <PropertyMapClient
                  properties={[
                    {
                      id: property.id,
                      title: content.title,
                      price: property.price,
                      listingType: property.listingType,
                      latitude: property.latitude,
                      longitude: property.longitude,
                    },
                  ]}
                  center={[property.latitude, property.longitude]}
                  zoom={14}
                  height={360}
                />
              </div>
            ) : (
              <div className="mt-4 flex h-64 items-center justify-center rounded-2xl bg-domify-warm-white text-sm text-domify-dark/50">
                {copy.approximate} — {property.address || `${property.neighborhood?.name ?? ""} ${property.city.name}`}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-4 hidden rounded-[1.35rem] border border-domify-gold/15 bg-domify-warm-white/70 p-5 lg:block">
            <p className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-domify-gold">{copy.support}</p>
            <p className="mt-2 font-display text-lg font-semibold leading-6 text-domify-dark">{copy.supportTitle}</p>
            <p className="mt-2 text-xs leading-5 text-domify-dark/56">{copy.supportBody}</p>
          </div>
          <div id="contact-property"><ContactAgentCard property={property} locale={locale} /></div>
        </div>
      </div>

      {/* Similar properties */}
      {similar.length > 0 && (
        <FadeIn className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-bold text-domify-dark">{copy.similar}</h2>
          <StaggerReveal className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
            {similar.map((p) => (
              <MotionDiv key={p.id} variants={staggerItem}>
                <PropertyCard property={p} locale={locale} />
              </MotionDiv>
            ))}
          </StaggerReveal>
        </FadeIn>
      )}
      <MobilePropertyActionBar propertyId={property.id} phone={property.agent?.phone ?? property.agency?.phone} />
    </div>
  );
}

function Fact({ icon: Icon, label, value }: { icon: typeof Bed; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-domify-dark/6 bg-white/90 p-4 text-center shadow-[0_14px_30px_-26px_rgba(16,47,66,0.36)]">
      <Icon className="mx-auto text-domify-gold" size={20} />
      <p className="mt-2 font-display text-lg font-semibold text-domify-dark">{value}</p>
      <p className="text-xs text-domify-dark/50">{label}</p>
    </div>
  );
}
