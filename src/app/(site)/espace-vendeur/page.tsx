import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, BarChart3, CalendarClock, ClipboardList, FileText, Handshake, Home, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMAD } from "@/lib/utils";

const CASE_STAGES: Record<string, string> = {
  VALUATION_REQUESTED: "Demande reçue",
  VALUATION_SCHEDULED: "Estimation en préparation",
  MANDATE_PENDING: "Mandat à finaliser",
  ONBOARDING: "Dossier en préparation",
  MEDIA_PREPARATION: "Mise en valeur du bien",
  PUBLISHED: "Bien publié",
  OFFER_RECEIVED: "Offre reçue",
  NEGOTIATION: "Négociation en cours",
  SOLD: "Vendu",
  LOST: "Dossier clôturé",
};

const OFFER_STAGES: Record<string, { label: string; tone: string }> = {
  SUBMITTED: { label: "Reçue", tone: "bg-amber-50 text-amber-700" },
  COUNTERED: { label: "Contre-proposée", tone: "bg-violet-50 text-violet-700" },
  ACCEPTED: { label: "Acceptée", tone: "bg-emerald-50 text-emerald-700" },
  DECLINED: { label: "Refusée", tone: "bg-red-50 text-red-700" },
  WITHDRAWN: { label: "Retirée", tone: "bg-stone-100 text-stone-600" },
  EXPIRED: { label: "Expirée", tone: "bg-stone-100 text-stone-600" },
};

export default async function SellerPortalPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/connexion?callbackUrl=/espace-vendeur");

  const contact = await prisma.crmContact.findUnique({
    where: { email: session.user.email.toLowerCase() },
    include: {
      sellerCases: {
        include: {
          property: { select: { id: true, title: true, reference: true, price: true, status: true, viewsCount: true } },
          offers: { select: { id: true, amount: true, status: true, expiresAt: true, submittedAt: true }, orderBy: { submittedAt: "desc" } },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  const propertyIds = contact?.sellerCases.flatMap((item) => item.propertyId ? [item.propertyId] : []) ?? [];
  const properties = propertyIds.length ? await prisma.property.findMany({
    where: { id: { in: propertyIds } },
    select: { id: true, title: true, reference: true, price: true, status: true, viewsCount: true, _count: { select: { favorites: true, leads: true, appointments: true } } },
    orderBy: { updatedAt: "desc" },
  }) : [];

  const offers = contact?.sellerCases.flatMap((item) => item.offers.map((offer) => ({ ...offer, sellerCaseTitle: item.title, property: item.property }))) ?? [];
  const activeCases = contact?.sellerCases.filter((item) => !["SOLD", "LOST"].includes(item.stage)).length ?? 0;
  const pendingOffers = offers.filter((offer) => ["SUBMITTED", "COUNTERED"].includes(offer.status)).length;
  const totalViews = properties.reduce((total, property) => total + property.viewsCount, 0);

  return (
    <main className="min-h-screen bg-[#faf9f6] pb-16">
      <section className="relative overflow-hidden bg-domify-primary-dark py-12 text-white sm:py-16">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full border border-domify-soft-gold/25" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="luxury-eyebrow text-domify-soft-gold">Espace propriétaire</p>
          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="font-display text-4xl font-semibold">Bonjour, {session.user.name?.split(" ")[0] || "propriétaire"}.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-white/70">Suivez votre estimation, vos biens et les étapes clés de votre projet avec Domify.</p></div><Link href="/estimation" className="pressable inline-flex w-fit items-center gap-2 rounded-xl bg-domify-gold px-4 py-3 text-sm font-semibold text-white hover:bg-domify-soft-gold hover:text-domify-dark"><Sparkles size={16} /> Demander une nouvelle estimation</Link></div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {!contact || contact.sellerCases.length === 0 ? (
          <section className="rounded-[1.5rem] border border-domify-dark/8 bg-white p-8 text-center shadow-[0_20px_42px_-34px_rgba(16,47,66,0.45)] sm:p-12"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-domify-warm-white text-domify-gold"><Home size={25} /></span><h2 className="mt-5 font-display text-2xl font-semibold text-domify-dark">Votre projet vendeur commence ici.</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-domify-dark/60">Demandez une estimation personnalisée pour ouvrir votre dossier propriétaire. Vous retrouverez ensuite les étapes, les performances et les offres directement dans cet espace.</p><Link href="/estimation" className="pressable mt-6 inline-flex items-center gap-2 rounded-xl bg-domify-primary px-5 py-3 text-sm font-semibold text-white hover:bg-domify-primary-dark">Obtenir mon estimation <ArrowUpRight size={16} /></Link></section>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Stat icon={ClipboardList} label="Dossiers actifs" value={activeCases} /><Stat icon={Home} label="Biens suivis" value={properties.length} /><Stat icon={BarChart3} label="Vues cumulées" value={totalViews} /><Stat icon={Handshake} label="Offres en cours" value={pendingOffers} /></section>

            <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <article className="rounded-[1.45rem] border border-domify-dark/8 bg-white p-5 shadow-[0_20px_42px_-34px_rgba(16,47,66,0.45)] sm:p-6"><div className="flex items-center justify-between"><div><p className="luxury-eyebrow text-domify-gold">Vos dossiers</p><h2 className="mt-2 font-display text-2xl font-semibold text-domify-dark">Avancement de votre projet</h2></div><CalendarClock className="text-domify-gold" size={21} /></div><div className="mt-6 space-y-4">{contact.sellerCases.map((item) => <article key={item.id} className="rounded-2xl bg-domify-warm-white/70 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-domify-dark">{item.title}</p><p className="mt-1 text-xs text-domify-dark/55">{item.property ? `${item.property.reference} · ${item.property.title}` : "Bien en cours de qualification"}</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-domify-primary shadow-sm">{CASE_STAGES[item.stage] || item.stage}</span></div><div className="mt-4 flex flex-wrap gap-4 text-xs text-domify-dark/60"><span>Mis à jour le {new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium" }).format(item.updatedAt)}</span>{item.estimatedValue && <span>Estimation : {formatMAD(item.estimatedValue)}</span>}{item.nextActionAt && <span>Prochaine étape : {new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium" }).format(item.nextActionAt)}</span>}</div></article>)}</div></article>

              <article className="rounded-[1.45rem] border border-domify-dark/8 bg-white p-5 shadow-[0_20px_42px_-34px_rgba(16,47,66,0.45)] sm:p-6"><p className="luxury-eyebrow text-domify-gold">Propositions</p><h2 className="mt-2 font-display text-2xl font-semibold text-domify-dark">Offres et négociations</h2><div className="mt-6 space-y-3">{offers.length === 0 ? <p className="rounded-2xl bg-domify-warm-white p-5 text-sm leading-6 text-domify-dark/60">Les offres reçues sur vos biens apparaîtront ici dès qu&apos;elles seront enregistrées par votre conseiller.</p> : offers.map((offer) => { const stage = OFFER_STAGES[offer.status] || OFFER_STAGES.SUBMITTED; return <article key={offer.id} className="rounded-2xl bg-domify-warm-white/70 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-domify-dark">{formatMAD(offer.amount)}</p><p className="mt-1 text-xs text-domify-dark/55">{offer.property?.title || offer.sellerCaseTitle}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stage.tone}`}>{stage.label}</span></div><p className="mt-3 text-xs text-domify-dark/52">Reçue le {new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium" }).format(offer.submittedAt)}{offer.expiresAt ? ` · valable jusqu’au ${new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium" }).format(offer.expiresAt)}` : ""}</p></article> })}</div></article>
            </section>

            <section className="mt-8 rounded-[1.45rem] border border-domify-dark/8 bg-white p-5 shadow-[0_20px_42px_-34px_rgba(16,47,66,0.45)] sm:p-6"><div className="flex items-center justify-between"><div><p className="luxury-eyebrow text-domify-gold">Visibilité</p><h2 className="mt-2 font-display text-2xl font-semibold text-domify-dark">Performance de vos biens</h2></div><FileText className="text-domify-gold" size={21} /></div><div className="mt-6 grid gap-4 md:grid-cols-2">{properties.length === 0 ? <p className="text-sm text-domify-dark/60">Vos biens apparaîtront ici dès qu&apos;ils seront rattachés à votre dossier et publiés.</p> : properties.map((property) => <article key={property.id} className="rounded-2xl bg-domify-warm-white/70 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-domify-dark">{property.title}</p><p className="mt-1 text-xs text-domify-dark/55">{property.reference} · {property.status}</p></div><Link href={`/proprietes/${property.id}`} className="rounded-lg bg-white p-2 text-domify-primary shadow-sm hover:text-domify-gold" aria-label={`Voir ${property.title}`}><ArrowUpRight size={15} /></Link></div><div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs"><Metric label="Vues" value={property.viewsCount} /><Metric label="Favoris" value={property._count.favorites} /><Metric label="Demandes" value={property._count.leads + property._count.appointments} /></div></article>)}</div></section>
          </>
        )}
      </div>
    </main>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Home; label: string; value: number }) { return <article className="rounded-2xl border border-domify-dark/8 bg-white p-4 shadow-sm"><Icon size={18} className="text-domify-gold" /><p className="mt-3 font-display text-2xl font-semibold text-domify-dark">{new Intl.NumberFormat("fr-MA").format(value)}</p><p className="mt-1 text-xs text-domify-dark/55">{label}</p></article>; }
function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-white px-2 py-2.5"><p className="font-semibold text-domify-dark">{value}</p><p className="mt-0.5 text-[0.62rem] uppercase tracking-wide text-domify-dark/48">{label}</p></div>; }
