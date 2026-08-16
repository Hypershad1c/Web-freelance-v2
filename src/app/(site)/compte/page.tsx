import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, BellRing, BriefcaseBusiness, CalendarClock, ChevronRight, Heart, Inbox, MapPin, Search, Shield, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SavedSearchForm } from "@/components/account/SavedSearchForm";
import { BuyerOnboarding } from "@/components/account/BuyerOnboarding";
import { NotificationCenter } from "@/components/account/NotificationCenter";
import { MatchingRecommendations } from "@/components/account/MatchingRecommendations";

const LEAD_STATUS_LABELS: Record<string, string> = { NEW: "Nouveau", CONTACTED: "Contacté", QUALIFIED: "Qualifié", CONVERTED: "Converti", LOST: "Clôturé" };
const APPOINTMENT_STATUS_LABELS: Record<string, string> = { PENDING: "En attente", CONFIRMED: "Confirmé", CANCELLED: "Annulé", COMPLETED: "Terminé" };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion?callbackUrl=/compte");

  const [favoritesCount, leads, appointments, savedSearches, cities, propertyTypes] = await Promise.all([
    prisma.favorite.count({ where: { userId: session.user.id } }),
    prisma.lead.findMany({ where: { userId: session.user.id }, include: { property: { select: { title: true, id: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.appointment.findMany({ where: { userId: session.user.id }, include: { property: { select: { title: true, id: true } }, agent: { select: { name: true } } }, orderBy: { date: "asc" } }),
    prisma.crmSavedSearch.findMany({ where: { userId: session.user.id }, include: { city: { select: { name: true } }, propertyType: { select: { name: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.city.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.propertyType.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const firstName = session.user.name?.split(" ")[0] ?? "vous";
  const activeLeads = leads.filter((lead) => lead.status !== "LOST").length;
  const nextAppointment = appointments.find((appointment) => appointment.date >= new Date());

  return (
    <main className="mx-auto max-w-7xl bg-[radial-gradient(circle_at_85%_0%,rgba(232,203,145,0.12),transparent_24rem)] px-4 py-9 sm:px-6 lg:px-8 lg:py-14">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-domify-primary-dark p-6 text-white shadow-[0_32px_80px_-44px_rgba(16,47,66,0.8)] sm:p-10 lg:p-12">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-domify-soft-gold/20" /><div className="pointer-events-none absolute bottom-[-8rem] right-[28%] h-64 w-64 rounded-full bg-domify-primary/60 blur-3xl" />
        <div className="relative grid gap-9 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
          <div><p className="luxury-eyebrow flex items-center gap-3 text-domify-soft-gold"><span className="h-px w-8 bg-domify-soft-gold" /> Votre espace privé</p><h1 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-[1.04] sm:text-6xl">Bonjour, {firstName}.<br /><span className="text-domify-soft-gold">Votre prochaine adresse</span> commence ici.</h1><p className="mt-5 max-w-xl text-sm leading-7 text-white/68 sm:text-base">Retrouvez vos biens favoris, vos alertes et vos échanges avec les conseillers Domify dans un espace simple et confidentiel.</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/proprietes" className="pressable inline-flex items-center gap-2 rounded-full bg-domify-gold px-5 py-3 text-sm font-semibold text-white transition-luxury hover:bg-domify-soft-gold hover:text-domify-primary-dark">Explorer les biens <ArrowUpRight size={16} /></Link><Link href="/carte" className="pressable inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition-luxury hover:bg-white/15"><Search size={15} /> Explorer la carte</Link></div></div>
          <div className="rounded-2xl border border-white/12 bg-white/8 p-5 backdrop-blur-md"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-domify-soft-gold"><Sparkles size={15} /> Votre suivi</div><p className="mt-4 font-display text-2xl font-semibold">{activeLeads > 0 ? "Projet en cours" : "Prêt à commencer"}</p><p className="mt-2 text-sm leading-6 text-white/62">{activeLeads > 0 ? "Votre équipe suit vos demandes et reviendra vers vous rapidement." : "Enregistrez une recherche ou un favori pour personnaliser votre expérience."}</p><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/12"><div className="h-full w-2/3 rounded-full bg-domify-soft-gold" /></div><p className="mt-2 text-xs text-white/48">Profil actif · accompagnement premium</p></div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]"><BuyerOnboarding cities={cities} propertyTypes={propertyTypes} /><div className="rounded-[1.65rem] border border-domify-dark/8 bg-white/95 p-5 shadow-[0_22px_48px_-34px_rgba(16,47,66,0.4)] sm:p-7"><div className="flex items-center justify-between"><div><p className="luxury-eyebrow text-domify-gold">Restez informé</p><h2 className="mt-2 font-display text-2xl font-semibold text-domify-dark">Votre centre d&apos;activité</h2></div><NotificationCenter /></div><p className="mt-4 text-sm leading-6 text-domify-dark/55">Retrouvez ici les alertes, changements de rendez-vous et prochaines actions qui comptent pour votre projet.</p></div></div>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi href="/favoris" icon={Heart} value={favoritesCount} label="Biens favoris" accent="gold" />
        <Kpi icon={Inbox} value={leads.length} label="Demandes envoyées" />
        <Kpi icon={CalendarClock} value={appointments.length} label="Visites demandées" />
        <Kpi icon={BellRing} value={savedSearches.length} label="Alertes actives" />
      </section>

      <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4"><QuickAction href="/proprietes" icon={Search} title="Trouver un bien" text="Affinez votre recherche" /><QuickAction href="/carte" icon={MapPin} title="Explorer la carte" text="Par quartier et emplacement" /><QuickAction href="/estimation" icon={Sparkles} title="Estimer un bien" text="Une première valeur en ligne" /><QuickAction href="/espace-vendeur" icon={BriefcaseBusiness} title="Espace vendeur" text="Suivre votre projet" /></section>

      <MatchingRecommendations />

      <div className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section id="alertes" className="rounded-[1.65rem] border border-domify-dark/8 bg-white/95 p-5 shadow-[0_22px_48px_-34px_rgba(16,47,66,0.4)] sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="luxury-eyebrow text-domify-gold">Ne manquez rien</p><h2 className="mt-2 font-display text-2xl font-semibold text-domify-dark">Mes alertes de recherche</h2><p className="mt-2 text-sm leading-6 text-domify-dark/55">Recevez les nouvelles opportunités correspondant à vos critères.</p></div><BellRing size={20} className="mt-1 text-domify-primary/40" /></div><SavedSearchForm cities={cities} propertyTypes={propertyTypes}/>{savedSearches.length > 0 && <div className="mt-6 grid gap-2 sm:grid-cols-2">{savedSearches.map((search) => <div key={search.id} className="rounded-xl border border-domify-dark/7 bg-domify-warm-white/60 px-4 py-3"><div className="flex items-center justify-between gap-2"><b className="text-sm text-domify-dark">{search.name}</b><span className="h-2 w-2 rounded-full bg-emerald-500" /></div><p className="mt-1 text-xs text-domify-dark/55">{search.city?.name || "Toutes villes"} · {search.propertyType?.name || "Tous types"} · {search.channel}</p></div>)}</div>}</section>

        <aside className="rounded-[1.5rem] bg-domify-warm-white p-5 sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="luxury-eyebrow text-domify-gold">Prochaine étape</p><h2 className="mt-2 font-display text-2xl font-semibold text-domify-dark">Mes visites</h2></div><CalendarClock size={20} className="text-domify-primary/45" /></div>{nextAppointment ? <div className="mt-6 rounded-2xl bg-white p-4 shadow-[0_16px_32px_-28px_rgba(16,47,66,0.45)]"><p className="text-xs font-bold uppercase tracking-[0.12em] text-domify-gold">{APPOINTMENT_STATUS_LABELS[nextAppointment.status] ?? nextAppointment.status}</p><p className="mt-2 font-semibold text-domify-dark">{nextAppointment.property?.title ?? "Visite Domify"}</p><p className="mt-2 text-sm text-domify-dark/58">{new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(nextAppointment.date)}</p><Link href={nextAppointment.property ? `/proprietes/${nextAppointment.property.id}` : "/proprietes"} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-domify-primary hover:text-domify-gold">Voir le bien <ChevronRight size={15}/></Link></div> : <div className="mt-6 rounded-2xl border border-dashed border-domify-dark/15 p-5"><p className="text-sm font-semibold text-domify-dark">Aucune visite prévue</p><p className="mt-2 text-xs leading-5 text-domify-dark/55">Planifiez une découverte privée avec un conseiller Domify.</p><Link href="/proprietes" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-domify-primary">Explorer les biens <ChevronRight size={15}/></Link></div>}</aside>
      </div>

      <section className="mt-10 rounded-[1.65rem] border border-domify-dark/8 bg-white/95 p-5 shadow-[0_22px_48px_-34px_rgba(16,47,66,0.4)] sm:p-7"><div className="flex items-end justify-between gap-3"><div><p className="luxury-eyebrow text-domify-gold">Votre activité</p><h2 className="mt-2 font-display text-2xl font-semibold text-domify-dark">Mes demandes</h2></div><span className="rounded-full bg-domify-warm-white px-3 py-1.5 text-xs font-bold text-domify-primary">{leads.length} demande(s)</span></div>{leads.length === 0 ? <div className="mt-6 rounded-2xl bg-domify-warm-white p-8 text-center"><p className="text-sm font-semibold text-domify-dark">Votre historique apparaîtra ici.</p><p className="mt-2 text-sm text-domify-dark/55">Contactez-nous depuis une fiche bien pour commencer votre projet.</p></div> : <div className="mt-6 grid gap-3 md:grid-cols-2">{leads.map((lead) => <div key={lead.id} className="flex items-center justify-between gap-4 rounded-2xl border border-domify-dark/7 p-4"><div className="min-w-0"><p className="truncate text-sm font-semibold text-domify-dark">{lead.property ? <Link href={`/proprietes/${lead.property.id}`} className="hover:text-domify-primary">{lead.property.title}</Link> : "Demande générale"}</p>{lead.message && <p className="mt-1 line-clamp-1 text-xs text-domify-dark/50">{lead.message}</p>}</div><span className="shrink-0 rounded-full bg-domify-warm-white px-3 py-1 text-xs font-medium text-domify-dark/70">{LEAD_STATUS_LABELS[lead.status] ?? lead.status}</span></div>)}</div>}</section>

      {(session.user.role === "ADMIN" || session.user.role === "EDITOR" || session.user.role === "AGENT") && <Link href="/admin" className="mt-8 flex items-center justify-between rounded-2xl bg-domify-primary-dark p-5 text-sm font-medium text-white transition-luxury hover:bg-domify-primary"><span className="flex items-center gap-2"><Shield size={16} /> Accéder au back-office ({session.user.role})</span><ArrowUpRight size={17} /></Link>}
    </main>
  );
}

function Kpi({ href, icon: Icon, value, label, accent }: { href?: string; icon: typeof Heart; value: number; label: string; accent?: "gold" }) { const content = <><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent ? "bg-domify-gold/10 text-domify-gold" : "bg-domify-warm-white text-domify-primary"}`}><Icon size={18} /></span><span><span className="block font-display text-xl font-semibold text-domify-dark">{value}</span><span className="mt-0.5 block text-xs text-domify-dark/50">{label}</span></span></>; return href ? <Link href={href} className="pressable flex items-center gap-3 rounded-2xl border border-domify-dark/8 bg-white p-4 shadow-[0_14px_30px_-26px_rgba(16,47,66,0.4)] transition-luxury hover:-translate-y-0.5 hover:border-domify-gold/35">{content}</Link> : <div className="flex items-center gap-3 rounded-2xl border border-domify-dark/8 bg-white p-4 shadow-[0_14px_30px_-26px_rgba(16,47,66,0.4)]">{content}</div>; }
function QuickAction({ href, icon: Icon, title, text }: { href: string; icon: typeof Search; title: string; text: string }) { return <Link href={href} className="group rounded-2xl border border-domify-dark/8 bg-white p-4 transition-luxury hover:-translate-y-0.5 hover:border-domify-gold/35 hover:shadow-luxury"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-domify-warm-white text-domify-gold transition-luxury group-hover:bg-domify-primary group-hover:text-domify-soft-gold"><Icon size={16}/></span><span className="mt-3 block text-sm font-semibold text-domify-dark">{title}</span><span className="mt-1 block text-xs leading-5 text-domify-dark/50">{text}</span></Link>; }
