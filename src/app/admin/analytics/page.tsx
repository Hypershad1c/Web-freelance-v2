import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDownToLine, BarChart3, Building2, Eye, FileText, Globe2, Inbox, Laptop, MessageCircle, TrendingUp, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { VisitorTrendChart } from "@/components/admin/VisitorTrendChart";

type DailyTrendRow = { day: Date; visitors: number; sessions: number; pageViews: number };
type SearchParams = Promise<{ range?: string }>;

const RANGE_OPTIONS = [7, 30, 90, 365] as const;

function parseRange(value: string | undefined) {
  const parsed = Number(value);
  return RANGE_OPTIONS.includes(parsed as (typeof RANGE_OPTIONS)[number]) ? parsed : 30;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-MA").format(value);
}

function toNumber(value: bigint | number) {
  return typeof value === "bigint" ? Number(value) : value;
}

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/admin");

  const range = parseRange((await searchParams).range);
  const start = new Date(Date.now() - range * 24 * 60 * 60 * 1000);
  const pageViewWhere = { type: "page_view", createdAt: { gte: start } };
  const eventWhere = { createdAt: { gte: start } };

  const [
    pageViews,
    uniqueVisitorsRaw,
    sessionsRaw,
    dailyRaw,
    topPagesRaw,
    topPropertiesRaw,
    deviceRaw,
    localeRaw,
    sourceRaw,
    leads,
    searches,
    favorites,
    appointments,
    whatsapp,
    valuations,
    financing,
    openConversations,
    unreadMessages,
    ownerListingsApproved,
    ownerListingsRejected,
    partnerRequests,
  ] = await Promise.all([
    prisma.analyticsEvent.count({ where: pageViewWhere }),
    prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(DISTINCT "visitorId")::bigint AS count FROM "AnalyticsEvent" WHERE type = 'page_view' AND "createdAt" >= ${start} AND "visitorId" IS NOT NULL`,
    prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(DISTINCT "sessionId")::bigint AS count FROM "AnalyticsEvent" WHERE type = 'page_view' AND "createdAt" >= ${start} AND "sessionId" IS NOT NULL`,
    prisma.$queryRaw<DailyTrendRow[]>`
      SELECT date_trunc('day', "createdAt") AS day,
        COUNT(DISTINCT "visitorId")::int AS visitors,
        COUNT(DISTINCT "sessionId")::int AS sessions,
        COUNT(*)::int AS "pageViews"
      FROM "AnalyticsEvent"
      WHERE type = 'page_view' AND "createdAt" >= ${start}
      GROUP BY 1 ORDER BY 1 ASC
    `,
    prisma.analyticsEvent.groupBy({ by: ["path"], where: { ...pageViewWhere, path: { not: null } }, _count: { path: true }, orderBy: { _count: { path: "desc" } }, take: 10 }),
    prisma.analyticsEvent.groupBy({ by: ["propertyId"], where: { ...pageViewWhere, propertyId: { not: null } }, _count: { propertyId: true }, orderBy: { _count: { propertyId: "desc" } }, take: 10 }),
    prisma.analyticsEvent.groupBy({ by: ["deviceType"], where: { ...pageViewWhere, deviceType: { not: null } }, _count: { deviceType: true }, orderBy: { _count: { deviceType: "desc" } } }),
    prisma.analyticsEvent.groupBy({ by: ["locale"], where: { ...pageViewWhere, locale: { not: null } }, _count: { locale: true }, orderBy: { _count: { locale: "desc" } } }),
    prisma.analyticsEvent.groupBy({ by: ["source"], where: { ...pageViewWhere, source: { not: null } }, _count: { source: true }, orderBy: { _count: { source: "desc" } }, take: 8 }),
    prisma.analyticsEvent.count({ where: { ...eventWhere, type: "lead" } }),
    prisma.analyticsEvent.count({ where: { ...eventWhere, type: "search" } }),
    prisma.analyticsEvent.count({ where: { ...eventWhere, type: "favorite" } }),
    prisma.analyticsEvent.count({ where: { ...eventWhere, type: "appointment" } }),
    prisma.analyticsEvent.count({ where: { ...eventWhere, type: "whatsapp" } }),
    prisma.analyticsEvent.count({ where: { ...eventWhere, type: "valuation" } }),
    prisma.analyticsEvent.count({ where: { ...eventWhere, type: "search", path: "/financement" } }),
    prisma.portalConversation.count({ where: { status: "OPEN" } }),
    prisma.portalMessage.count({ where: { readAt: null } }),
    prisma.property.count({ where: { submittedById: { not: null }, approvalStatus: "APPROVED" } }),
    prisma.property.count({ where: { submittedById: { not: null }, approvalStatus: "REJECTED" } }),
    prisma.message.count({ where: { subject: { startsWith: "Intérêt agence" } } }),
  ]);

  const propertyIds = topPropertiesRaw.map((item) => item.propertyId).filter((id): id is string => Boolean(id));
  const properties = await prisma.property.findMany({ where: { id: { in: propertyIds } }, select: { id: true, title: true, reference: true } });
  const propertyMap = new Map(properties.map((property) => [property.id, property]));
  const uniqueVisitors = toNumber(uniqueVisitorsRaw[0]?.count ?? 0);
  const sessions = toNumber(sessionsRaw[0]?.count ?? 0);
  const conversionRate = uniqueVisitors > 0 ? ((leads / uniqueVisitors) * 100).toFixed(1) : "0.0";
  const trendData = dailyRaw.map((row) => ({ date: new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "2-digit" }).format(new Date(row.day)), visitors: Number(row.visitors), sessions: Number(row.sessions), pageViews: Number(row.pageViews) }));

  const stats = [
    { label: "Visiteurs uniques", value: uniqueVisitors, icon: Users, accent: "text-domify-primary" },
    { label: "Sessions", value: sessions, icon: TrendingUp, accent: "text-domify-gold" },
    { label: "Pages vues", value: pageViews, icon: Eye, accent: "text-sky-700" },
    { label: "Taux visite → lead", value: `${conversionRate}%`, icon: BarChart3, accent: "text-emerald-700" },
    { label: "Leads générés", value: leads, icon: Inbox, accent: "text-violet-700" },
    { label: "Recherches", value: searches, icon: FileText, accent: "text-orange-700" },
  ];

  return (
    <>
      <AdminTopbar title="Analytics visiteurs" />
      <main className="admin-page-shell min-w-0 p-4 sm:p-6 lg:p-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="admin-eyebrow">Audience publique</p>
            <h1 className="font-display text-3xl font-bold text-domify-dark dark:text-white">Comprendre la demande immobilière</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-domify-dark/60 dark:text-white/60">Les statistiques excluent automatiquement les comptes ADMIN, EDITOR et AGENT. Les données visiteurs restent anonymes et soumises au consentement analytics.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {RANGE_OPTIONS.map((option) => <Link key={option} href={`/admin/analytics?range=${option}`} className={`rounded-full px-3 py-2 text-xs font-semibold transition ${range === option ? "bg-domify-primary text-white" : "bg-white text-domify-dark/65 shadow-sm dark:bg-[#102436] dark:text-white/65"}`}>{option === 365 ? "12 mois" : `${option} jours`}</Link>)}
            <a href={`/api/admin/analytics/export?range=${range}`} className="inline-flex items-center gap-2 rounded-full border border-domify-primary/15 bg-white px-3 py-2 text-xs font-semibold text-domify-primary shadow-sm dark:border-white/10 dark:bg-[#102436] dark:text-domify-soft-gold"><ArrowDownToLine size={14} /> Export CSV</a>
          </div>
        </div>

        <section className="mt-8 grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((stat) => <div key={stat.label} className="min-w-0 rounded-2xl bg-white p-4 shadow-luxury dark:bg-[#102436] sm:p-5"><stat.icon size={20} className={stat.accent} /><p className="mt-3 truncate font-display text-2xl font-bold text-domify-dark dark:text-white">{typeof stat.value === "number" ? formatNumber(stat.value) : stat.value}</p><p className="mt-1 text-xs leading-4 text-domify-dark/55 dark:text-white/55">{stat.label}</p></div>)}
        </section>

        <section className="mt-8 min-w-0 rounded-2xl bg-white p-4 shadow-luxury dark:bg-[#102436] sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-display text-lg font-semibold text-domify-dark dark:text-white">Audience dans le temps</h2><p className="mt-1 text-xs text-domify-dark/50 dark:text-white/50">Visiteurs uniques, sessions et pages vues sur la période sélectionnée.</p></div><span className="rounded-full bg-domify-warm-white px-3 py-1.5 text-xs font-semibold text-domify-primary dark:bg-white/10 dark:text-domify-soft-gold">{range} jours</span></div>
          {trendData.length === 0 ? <p className="py-12 text-center text-sm text-domify-dark/50 dark:text-white/50">Les premières visites consenties apparaîtront ici.</p> : <VisitorTrendChart data={trendData} />}
        </section>

        <div className="mt-8 grid min-w-0 gap-6 xl:grid-cols-3">
          <AnalyticsList title="Appareils" icon={<Laptop size={17} />} items={deviceRaw.map((item) => ({ label: item.deviceType === "mobile" ? "Mobile" : item.deviceType === "tablet" ? "Tablette" : "Ordinateur", value: item._count.deviceType }))} empty="Aucune donnée appareil." />
          <AnalyticsList title="Langues" icon={<Globe2 size={17} />} items={localeRaw.map((item) => ({ label: item.locale === "ar" ? "العربية" : item.locale === "en" ? "English" : "Français", value: item._count.locale }))} empty="Aucune donnée de langue." />
          <AnalyticsList title="Sources" icon={<TrendingUp size={17} />} items={sourceRaw.map((item) => ({ label: item.source ?? "Direct", value: item._count.source }))} empty="Aucune campagne attribuée." />
        </div>

        <div className="mt-8 grid min-w-0 gap-6 xl:grid-cols-2">
          <section className="min-w-0 rounded-2xl bg-white p-4 shadow-luxury dark:bg-[#102436] sm:p-6"><div className="mb-4 flex items-center gap-2"><Building2 size={18} className="text-domify-gold" /><h2 className="font-display text-lg font-semibold text-domify-dark dark:text-white">Biens les plus consultés</h2></div>{topPropertiesRaw.length === 0 ? <p className="text-sm text-domify-dark/50 dark:text-white/50">Les consultations de pages détail apparaîtront ici.</p> : <div className="space-y-2">{topPropertiesRaw.map((item) => { const property = item.propertyId ? propertyMap.get(item.propertyId) : null; return <div key={item.propertyId ?? "unknown"} className="flex min-w-0 items-center justify-between gap-4 rounded-xl bg-domify-warm-white px-3 py-3 dark:bg-white/5"><div className="min-w-0"><p className="truncate text-sm font-semibold text-domify-dark dark:text-white">{property?.title ?? "Bien immobilier"}</p><p className="truncate font-mono text-[11px] text-domify-dark/45 dark:text-white/45">{property?.reference ?? item.propertyId}</p></div><span className="shrink-0 text-sm font-semibold text-domify-primary dark:text-domify-soft-gold">{formatNumber(item._count.propertyId)} vues</span></div>; })}</div>}</section>
          <section className="min-w-0 rounded-2xl bg-white p-4 shadow-luxury dark:bg-[#102436] sm:p-6"><div className="mb-4 flex items-center gap-2"><FileText size={18} className="text-domify-gold" /><h2 className="font-display text-lg font-semibold text-domify-dark dark:text-white">Pages les plus consultées</h2></div>{topPagesRaw.length === 0 ? <p className="text-sm text-domify-dark/50 dark:text-white/50">Aucune donnée pour le moment.</p> : <div className="space-y-2">{topPagesRaw.map((item) => <div key={item.path} className="flex min-w-0 items-center justify-between gap-4 rounded-xl bg-domify-warm-white px-3 py-3 dark:bg-white/5"><span className="min-w-0 truncate font-mono text-xs text-domify-dark dark:text-white">{item.path}</span><span className="shrink-0 text-xs font-semibold text-domify-primary dark:text-domify-soft-gold">{formatNumber(item._count.path)} vues</span></div>)}</div>}</section>
        </div>

        <section className="mt-8 min-w-0 rounded-2xl bg-white p-4 shadow-luxury dark:bg-[#102436] sm:p-6"><div className="mb-5 flex items-center gap-2"><BarChart3 size={18} className="text-domify-gold" /><h2 className="font-display text-lg font-semibold text-domify-dark dark:text-white">Tunnel de conversion</h2></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6"><FunnelStep label="Visiteurs" value={uniqueVisitors} /><FunnelStep label="Recherches" value={searches} /><FunnelStep label="Favoris" value={favorites} /><FunnelStep label="Leads" value={leads} /><FunnelStep label="Rendez-vous" value={appointments} /><FunnelStep label="WhatsApp" value={whatsapp} /></div></section>

        <div className="mt-8 grid min-w-0 gap-6 xl:grid-cols-2"><section className="rounded-2xl bg-white p-4 shadow-luxury dark:bg-[#102436] sm:p-6"><h2 className="font-display text-lg font-semibold text-domify-dark dark:text-white">Performance business</h2><div className="mt-4 grid grid-cols-2 gap-3"><BusinessMetric label="Estimations" value={valuations} /><BusinessMetric label="Préqualifications" value={financing} /><BusinessMetric label="Biens propriétaires approuvés" value={ownerListingsApproved} /><BusinessMetric label="Demandes agences" value={partnerRequests} /></div></section><section className="rounded-2xl bg-white p-4 shadow-luxury dark:bg-[#102436] sm:p-6"><h2 className="font-display text-lg font-semibold text-domify-dark dark:text-white">Priorités opérationnelles</h2><div className="mt-4 space-y-2"><Priority label="Messages propriétaires non lus" value={unreadMessages} href="/admin/messagerie" icon={<MessageCircle size={16} />} /><Priority label="Conversations ouvertes" value={openConversations} href="/admin/messagerie" icon={<MessageCircle size={16} />} /><Priority label="Biens rejetés à revoir" value={ownerListingsRejected} href="/admin/approvals" icon={<Building2 size={16} />} /></div></section></div>
      </main>
    </>
  );
}

function AnalyticsList({ title, icon, items, empty }: { title: string; icon: React.ReactNode; items: { label: string; value: number }[]; empty: string }) { return <section className="min-w-0 rounded-2xl bg-white p-4 shadow-luxury dark:bg-[#102436] sm:p-6"><div className="mb-4 flex items-center gap-2 text-domify-gold">{icon}<h2 className="font-display text-lg font-semibold text-domify-dark dark:text-white">{title}</h2></div>{items.length === 0 ? <p className="text-sm text-domify-dark/50 dark:text-white/50">{empty}</p> : <div className="space-y-2">{items.map((item) => <div key={item.label} className="flex items-center justify-between rounded-xl bg-domify-warm-white px-3 py-2.5 dark:bg-white/5"><span className="text-sm text-domify-dark/70 dark:text-white/70">{item.label}</span><span className="text-sm font-semibold text-domify-primary dark:text-domify-soft-gold">{formatNumber(item.value)}</span></div>)}</div>}</section>; }
function FunnelStep({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-domify-primary/10 bg-domify-warm-white p-3 dark:border-white/10 dark:bg-white/5"><p className="font-display text-2xl font-bold text-domify-primary dark:text-domify-soft-gold">{formatNumber(value)}</p><p className="mt-1 text-xs text-domify-dark/55 dark:text-white/55">{label}</p></div>; }
function BusinessMetric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-domify-warm-white p-3 dark:bg-white/5"><p className="font-display text-2xl font-semibold text-domify-primary dark:text-domify-soft-gold">{formatNumber(value)}</p><p className="mt-1 text-xs leading-4 text-domify-dark/55 dark:text-white/55">{label}</p></div>; }
function Priority({ label, value, href, icon }: { label: string; value: number; href: string; icon: React.ReactNode }) { return <Link href={href} className="flex items-center justify-between rounded-xl bg-domify-warm-white px-4 py-3 transition hover:bg-domify-gold/10 dark:bg-white/5"><span className="flex items-center gap-2 text-sm text-domify-dark/70 dark:text-white/70">{icon}{label}</span><span className="font-semibold text-domify-primary dark:text-domify-soft-gold">{formatNumber(value)}</span></Link>; }
