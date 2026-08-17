import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDownToLine, BarChart3, Building2, Eye, FileText, Globe2, Inbox, Laptop, MapPin, MessageCircle, Repeat2, Search, TrendingUp, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { VisitorTrendChart } from "@/components/admin/VisitorTrendChart";

type DailyTrendRow = { day: Date; visitors: number; sessions: number; pageViews: number };
type SummaryRow = { visitors: number; sessions: number; pageViews: number; leads: number; searches: number; favorites: number; appointments: number; whatsapp: number; valuations: number; financing: number };
type PropertyFunnelRow = { propertyId: string; views: number; favorites: number; leads: number; appointments: number; whatsapp: number };
type CampaignRow = { source: string | null; medium: string | null; campaign: string | null; events: number };
type CityRow = { city: string; views: number };
type RetentionRow = { newVisitors: number; returningVisitors: number };
type SearchParams = Promise<{ range?: string }>;

const RANGE_OPTIONS = [7, 30, 90, 365] as const;

function parseRange(value: string | undefined) {
  const parsed = Number(value);
  return RANGE_OPTIONS.includes(parsed as (typeof RANGE_OPTIONS)[number]) ? parsed : 30;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-MA").format(value);
}

function periodDelta(current: number, previous: number) {
  if (previous === 0) return current === 0 ? "—" : "Nouveau";
  const percent = Math.round(((current - previous) / previous) * 100);
  return `${percent > 0 ? "+" : ""}${percent}%`;
}

export default async function AdminAnalyticsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/admin");

  const range = parseRange((await searchParams).range);
  const end = new Date();
  const start = new Date(end.getTime() - range * 24 * 60 * 60 * 1000);
  const previousStart = new Date(start.getTime() - range * 24 * 60 * 60 * 1000);
  const pageViewWhere = { type: "page_view", createdAt: { gte: start, lt: end } };

  const [currentSummaryRaw, previousSummaryRaw, dailyRaw, topPagesRaw, deviceRaw, localeRaw, sourceRaw, propertyFunnelRaw, cityRaw, retentionRaw, openConversations, unreadMessages, ownerListingsApproved, ownerListingsRejected, partnerRequests] = await Promise.all([
    prisma.$queryRaw<SummaryRow[]>`
      SELECT
        COUNT(*) FILTER (WHERE type = 'page_view')::int AS "pageViews",
        COUNT(DISTINCT "visitorId") FILTER (WHERE type = 'page_view' AND "visitorId" IS NOT NULL)::int AS visitors,
        COUNT(DISTINCT "sessionId") FILTER (WHERE type = 'page_view' AND "sessionId" IS NOT NULL)::int AS sessions,
        COUNT(*) FILTER (WHERE type = 'lead')::int AS leads,
        COUNT(*) FILTER (WHERE type = 'search')::int AS searches,
        COUNT(*) FILTER (WHERE type = 'favorite')::int AS favorites,
        COUNT(*) FILTER (WHERE type = 'appointment')::int AS appointments,
        COUNT(*) FILTER (WHERE type = 'whatsapp')::int AS whatsapp,
        COUNT(*) FILTER (WHERE type = 'valuation')::int AS valuations,
        COUNT(*) FILTER (WHERE type = 'lead' AND path = '/financement')::int AS financing
      FROM "AnalyticsEvent" WHERE "createdAt" >= ${start} AND "createdAt" < ${end}
    `,
    prisma.$queryRaw<SummaryRow[]>`
      SELECT
        COUNT(*) FILTER (WHERE type = 'page_view')::int AS "pageViews",
        COUNT(DISTINCT "visitorId") FILTER (WHERE type = 'page_view' AND "visitorId" IS NOT NULL)::int AS visitors,
        COUNT(DISTINCT "sessionId") FILTER (WHERE type = 'page_view' AND "sessionId" IS NOT NULL)::int AS sessions,
        COUNT(*) FILTER (WHERE type = 'lead')::int AS leads,
        COUNT(*) FILTER (WHERE type = 'search')::int AS searches,
        COUNT(*) FILTER (WHERE type = 'favorite')::int AS favorites,
        COUNT(*) FILTER (WHERE type = 'appointment')::int AS appointments,
        COUNT(*) FILTER (WHERE type = 'whatsapp')::int AS whatsapp,
        COUNT(*) FILTER (WHERE type = 'valuation')::int AS valuations,
        COUNT(*) FILTER (WHERE type = 'lead' AND path = '/financement')::int AS financing
      FROM "AnalyticsEvent" WHERE "createdAt" >= ${previousStart} AND "createdAt" < ${start}
    `,
    prisma.$queryRaw<DailyTrendRow[]>`
      SELECT date_trunc('day', "createdAt") AS day,
        COUNT(DISTINCT "visitorId") FILTER (WHERE type = 'page_view')::int AS visitors,
        COUNT(DISTINCT "sessionId") FILTER (WHERE type = 'page_view')::int AS sessions,
        COUNT(*) FILTER (WHERE type = 'page_view')::int AS "pageViews"
      FROM "AnalyticsEvent"
      WHERE "createdAt" >= ${start} AND "createdAt" < ${end}
      GROUP BY 1 ORDER BY 1 ASC
    `,
    prisma.analyticsEvent.groupBy({ by: ["path"], where: { ...pageViewWhere, path: { not: null } }, _count: { path: true }, orderBy: { _count: { path: "desc" } }, take: 10 }),
    prisma.analyticsEvent.groupBy({ by: ["deviceType"], where: { ...pageViewWhere, deviceType: { not: null } }, _count: { deviceType: true }, orderBy: { _count: { deviceType: "desc" } } }),
    prisma.analyticsEvent.groupBy({ by: ["locale"], where: { ...pageViewWhere, locale: { not: null } }, _count: { locale: true }, orderBy: { _count: { locale: "desc" } } }),
    prisma.$queryRaw<CampaignRow[]>`
      SELECT NULLIF(source, '') AS source, NULLIF(medium, '') AS medium, NULLIF(campaign, '') AS campaign, COUNT(*)::int AS events
      FROM "AnalyticsEvent"
      WHERE "createdAt" >= ${start} AND "createdAt" < ${end} AND (source IS NOT NULL OR medium IS NOT NULL OR campaign IS NOT NULL)
      GROUP BY 1, 2, 3 ORDER BY events DESC LIMIT 10
    `,
    prisma.$queryRaw<PropertyFunnelRow[]>`
      SELECT "propertyId",
        COUNT(*) FILTER (WHERE type = 'page_view')::int AS views,
        COUNT(*) FILTER (WHERE type = 'favorite')::int AS favorites,
        COUNT(*) FILTER (WHERE type = 'lead')::int AS leads,
        COUNT(*) FILTER (WHERE type = 'appointment')::int AS appointments,
        COUNT(*) FILTER (WHERE type = 'whatsapp')::int AS whatsapp
      FROM "AnalyticsEvent"
      WHERE "createdAt" >= ${start} AND "createdAt" < ${end} AND "propertyId" IS NOT NULL
      GROUP BY "propertyId" ORDER BY views DESC LIMIT 10
    `,
    prisma.$queryRaw<CityRow[]>`
      SELECT c.name AS city, COUNT(*)::int AS views
      FROM "AnalyticsEvent" ae
      JOIN "Property" p ON p.id = ae."propertyId"
      JOIN "City" c ON c.id = p."cityId"
      WHERE ae.type = 'page_view' AND ae."createdAt" >= ${start} AND ae."createdAt" < ${end}
      GROUP BY c.name ORDER BY views DESC LIMIT 8
    `,
    prisma.$queryRaw<RetentionRow[]>`
      WITH active AS (
        SELECT "visitorId" FROM "AnalyticsEvent"
        WHERE type = 'page_view' AND "visitorId" IS NOT NULL AND "createdAt" >= ${start} AND "createdAt" < ${end}
        GROUP BY "visitorId"
      ), first_seen AS (
        SELECT "visitorId", MIN("createdAt") AS first_seen FROM "AnalyticsEvent"
        WHERE type = 'page_view' AND "visitorId" IS NOT NULL GROUP BY "visitorId"
      )
      SELECT
        COUNT(*) FILTER (WHERE first_seen >= ${start})::int AS "newVisitors",
        COUNT(*) FILTER (WHERE first_seen < ${start})::int AS "returningVisitors"
      FROM active JOIN first_seen USING ("visitorId")
    `,
    prisma.portalConversation.count({ where: { status: "OPEN" } }),
    prisma.portalMessage.count({ where: { readAt: null } }),
    prisma.property.count({ where: { submittedById: { not: null }, approvalStatus: "APPROVED" } }),
    prisma.property.count({ where: { submittedById: { not: null }, approvalStatus: "REJECTED" } }),
    prisma.message.count({ where: { subject: { startsWith: "Intérêt agence" } } }),
  ]);

  const current = currentSummaryRaw[0] ?? { visitors: 0, sessions: 0, pageViews: 0, leads: 0, searches: 0, favorites: 0, appointments: 0, whatsapp: 0, valuations: 0, financing: 0 };
  const previous = previousSummaryRaw[0] ?? { visitors: 0, sessions: 0, pageViews: 0, leads: 0, searches: 0, favorites: 0, appointments: 0, whatsapp: 0, valuations: 0, financing: 0 };
  const propertyIds = propertyFunnelRaw.map((item) => item.propertyId).filter(Boolean);
  const properties = await prisma.property.findMany({ where: { id: { in: propertyIds } }, select: { id: true, title: true, reference: true } });
  const propertyMap = new Map(properties.map((property) => [property.id, property]));
  const retention = retentionRaw[0] ?? { newVisitors: 0, returningVisitors: 0 };
  const conversionRate = current.visitors > 0 ? ((current.leads / current.visitors) * 100).toFixed(1) : "0.0";
  const trendData = dailyRaw.map((row) => ({ date: new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "2-digit" }).format(new Date(row.day)), visitors: Number(row.visitors), sessions: Number(row.sessions), pageViews: Number(row.pageViews) }));
  const stats = [
    { label: "Visiteurs uniques", value: current.visitors, previous: previous.visitors, icon: Users, accent: "text-domify-primary" },
    { label: "Sessions", value: current.sessions, previous: previous.sessions, icon: TrendingUp, accent: "text-domify-gold" },
    { label: "Pages vues", value: current.pageViews, previous: previous.pageViews, icon: Eye, accent: "text-sky-700" },
    { label: "Taux visite → lead", value: `${conversionRate}%`, previous: previous.visitors > 0 ? Number(((previous.leads / previous.visitors) * 100).toFixed(1)) : 0, icon: BarChart3, accent: "text-emerald-700" },
    { label: "Leads générés", value: current.leads, previous: previous.leads, icon: Inbox, accent: "text-violet-700" },
    { label: "Recherches", value: current.searches, previous: previous.searches, icon: Search, accent: "text-orange-700" },
  ];

  return (
    <>
      <AdminTopbar title="Analytics visiteurs" />
      <main className="admin-page-shell min-w-0 p-4 sm:p-6 lg:p-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="admin-eyebrow">Audience publique</p><h1 className="font-display text-3xl font-bold text-domify-dark dark:text-white">Comprendre la demande immobilière</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-domify-dark/60 dark:text-white/60">Les statistiques excluent automatiquement les comptes ADMIN, EDITOR et AGENT. Les données restent anonymes et soumises au consentement analytics.</p></div>
          <div className="flex flex-wrap items-center gap-2">{RANGE_OPTIONS.map((option) => <Link key={option} href={`/admin/analytics?range=${option}`} className={`rounded-full px-3 py-2 text-xs font-semibold transition ${range === option ? "bg-domify-primary text-white" : "bg-white text-domify-dark/65 shadow-sm dark:bg-[#102436] dark:text-white/65"}`}>{option === 365 ? "12 mois" : `${option} jours`}</Link>)}<a href={`/api/admin/analytics/export?range=${range}`} className="inline-flex items-center gap-2 rounded-full border border-domify-primary/15 bg-white px-3 py-2 text-xs font-semibold text-domify-primary shadow-sm dark:border-white/10 dark:bg-[#102436] dark:text-domify-soft-gold"><ArrowDownToLine size={14} /> Export enrichi</a></div>
        </div>

        <section className="mt-8 grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{stats.map((stat) => <div key={stat.label} className="min-w-0 rounded-2xl bg-white p-4 shadow-luxury dark:bg-[#102436] sm:p-5"><stat.icon size={20} className={stat.accent} /><p className="mt-3 truncate font-display text-2xl font-bold text-domify-dark dark:text-white">{typeof stat.value === "number" ? formatNumber(stat.value) : stat.value}</p><p className="mt-1 text-xs leading-4 text-domify-dark/55 dark:text-white/55">{stat.label}</p><p className={`mt-2 text-[11px] font-semibold ${periodDelta(stat.value === `${conversionRate}%` ? Number(conversionRate) : Number(stat.value), stat.previous).startsWith("-") ? "text-red-600" : "text-emerald-700"}`}>{periodDelta(stat.value === `${conversionRate}%` ? Number(conversionRate) : Number(stat.value), stat.previous)} vs période précédente</p></div>)}</section>

        <section className="mt-8 min-w-0 rounded-2xl bg-white p-4 shadow-luxury dark:bg-[#102436] sm:p-6"><div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-display text-lg font-semibold text-domify-dark dark:text-white">Audience dans le temps</h2><p className="mt-1 text-xs text-domify-dark/50 dark:text-white/50">Visiteurs uniques, sessions et pages vues sur la période sélectionnée.</p></div><span className="rounded-full bg-domify-warm-white px-3 py-1.5 text-xs font-semibold text-domify-primary dark:bg-white/10 dark:text-domify-soft-gold">{range} jours</span></div>{trendData.length === 0 ? <p className="py-12 text-center text-sm text-domify-dark/50 dark:text-white/50">Les premières visites consenties apparaîtront ici.</p> : <VisitorTrendChart data={trendData} />}</section>

        <div className="mt-8 grid min-w-0 gap-6 xl:grid-cols-3"><AnalyticsList title="Appareils" icon={<Laptop size={17} />} items={deviceRaw.map((item) => ({ label: item.deviceType === "mobile" ? "Mobile" : item.deviceType === "tablet" ? "Tablette" : "Ordinateur", value: item._count.deviceType }))} empty="Aucune donnée appareil." /><AnalyticsList title="Langues" icon={<Globe2 size={17} />} items={localeRaw.map((item) => ({ label: item.locale === "ar" ? "العربية" : item.locale === "en" ? "English" : "Français", value: item._count.locale }))} empty="Aucune donnée de langue." /><AnalyticsList title="Campagnes UTM" icon={<TrendingUp size={17} />} items={sourceRaw.map((item) => ({ label: [item.source, item.medium, item.campaign].filter(Boolean).join(" / ") || "Direct", value: Number(item.events) }))} empty="Aucune campagne attribuée." /></div>

        <div className="mt-8 grid min-w-0 gap-6 xl:grid-cols-3"><MetricPanel title="Nouveaux visiteurs" value={retention.newVisitors} icon={<Users size={17} />} caption="Première visite connue sur la période" /><MetricPanel title="Visiteurs récurrents" value={retention.returningVisitors} icon={<Repeat2 size={17} />} caption="Déjà vus avant la période" /><MetricPanel title="Taux de retour" value={`${current.visitors > 0 ? Math.round((retention.returningVisitors / current.visitors) * 100) : 0}%`} icon={<TrendingUp size={17} />} caption="Rétention de l’audience active" /></div>

        <div className="mt-8 grid min-w-0 gap-6 xl:grid-cols-2"><section className="min-w-0 rounded-2xl bg-white p-4 shadow-luxury dark:bg-[#102436] sm:p-6"><div className="mb-4 flex items-center gap-2"><Building2 size={18} className="text-domify-gold" /><h2 className="font-display text-lg font-semibold text-domify-dark dark:text-white">Performance par bien</h2></div>{propertyFunnelRaw.length === 0 ? <p className="text-sm text-domify-dark/50 dark:text-white/50">Les conversions par bien apparaîtront après les prochaines visites consenties.</p> : <div className="space-y-3">{propertyFunnelRaw.map((item) => { const property = propertyMap.get(item.propertyId); return <div key={item.propertyId} className="rounded-xl bg-domify-warm-white p-3 dark:bg-white/5"><div className="flex min-w-0 items-center justify-between gap-4"><div className="min-w-0"><p className="truncate text-sm font-semibold text-domify-dark dark:text-white">{property?.title ?? "Bien immobilier"}</p><p className="truncate font-mono text-[11px] text-domify-dark/45 dark:text-white/45">{property?.reference ?? item.propertyId}</p></div><span className="shrink-0 text-sm font-semibold text-domify-primary dark:text-domify-soft-gold">{formatNumber(Number(item.views))} vues</span></div><div className="mt-3 grid grid-cols-4 gap-2 text-[11px] text-domify-dark/60 dark:text-white/60"><span>Favoris <strong>{item.favorites}</strong></span><span>Leads <strong>{item.leads}</strong></span><span>Visites <strong>{item.appointments}</strong></span><span>WhatsApp <strong>{item.whatsapp}</strong></span></div></div>; })}</div>}</section><section className="min-w-0 rounded-2xl bg-white p-4 shadow-luxury dark:bg-[#102436] sm:p-6"><div className="mb-4 flex items-center gap-2"><MapPin size={18} className="text-domify-gold" /><h2 className="font-display text-lg font-semibold text-domify-dark dark:text-white">Villes les plus demandées</h2></div>{cityRaw.length === 0 ? <p className="text-sm text-domify-dark/50 dark:text-white/50">Aucune ville attribuée pour le moment.</p> : <div className="space-y-2">{cityRaw.map((item) => <div key={item.city} className="flex items-center justify-between rounded-xl bg-domify-warm-white px-3 py-2.5 dark:bg-white/5"><span className="text-sm text-domify-dark/70 dark:text-white/70">{item.city}</span><span className="text-sm font-semibold text-domify-primary dark:text-domify-soft-gold">{formatNumber(Number(item.views))} vues</span></div>)}</div>}</section></div>

        <div className="mt-8 grid min-w-0 gap-6 xl:grid-cols-2"><section className="min-w-0 rounded-2xl bg-white p-4 shadow-luxury dark:bg-[#102436] sm:p-6"><div className="mb-4 flex items-center gap-2"><FileText size={18} className="text-domify-gold" /><h2 className="font-display text-lg font-semibold text-domify-dark dark:text-white">Pages les plus consultées</h2></div>{topPagesRaw.length === 0 ? <p className="text-sm text-domify-dark/50 dark:text-white/50">Aucune donnée pour le moment.</p> : <div className="space-y-2">{topPagesRaw.map((item) => <div key={item.path} className="flex min-w-0 items-center justify-between gap-4 rounded-xl bg-domify-warm-white px-3 py-3 dark:bg-white/5"><span className="min-w-0 truncate font-mono text-xs text-domify-dark dark:text-white">{item.path}</span><span className="shrink-0 text-xs font-semibold text-domify-primary dark:text-domify-soft-gold">{formatNumber(item._count.path)} vues</span></div>)}</div>}</section><section className="min-w-0 rounded-2xl bg-white p-4 shadow-luxury dark:bg-[#102436] sm:p-6"><div className="mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-domify-gold" /><h2 className="font-display text-lg font-semibold text-domify-dark dark:text-white">Tunnel de conversion</h2></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[["Visiteurs", current.visitors], ["Recherches", current.searches], ["Favoris", current.favorites], ["Leads", current.leads], ["Rendez-vous", current.appointments], ["WhatsApp", current.whatsapp]].map(([label, value]) => <FunnelStep key={String(label)} label={String(label)} value={Number(value)} />)}</div></section></div>

        <div className="mt-8 grid min-w-0 gap-6 xl:grid-cols-2"><section className="rounded-2xl bg-white p-4 shadow-luxury dark:bg-[#102436] sm:p-6"><h2 className="font-display text-lg font-semibold text-domify-dark dark:text-white">Performance business</h2><div className="mt-4 grid grid-cols-2 gap-3"><BusinessMetric label="Estimations" value={current.valuations} /><BusinessMetric label="Préqualifications" value={current.financing} /><BusinessMetric label="Biens propriétaires approuvés" value={ownerListingsApproved} /><BusinessMetric label="Demandes agences" value={partnerRequests} /></div></section><section className="rounded-2xl bg-white p-4 shadow-luxury dark:bg-[#102436] sm:p-6"><h2 className="font-display text-lg font-semibold text-domify-dark dark:text-white">Priorités opérationnelles</h2><div className="mt-4 space-y-2"><Priority label="Messages propriétaires non lus" value={unreadMessages} href="/admin/messagerie" icon={<MessageCircle size={16} />} /><Priority label="Conversations ouvertes" value={openConversations} href="/admin/messagerie" icon={<MessageCircle size={16} />} /><Priority label="Biens rejetés à revoir" value={ownerListingsRejected} href="/admin/approvals" icon={<Building2 size={16} />} /></div></section></div>
      </main>
    </>
  );
}

function AnalyticsList({ title, icon, items, empty }: { title: string; icon: React.ReactNode; items: { label: string; value: number }[]; empty: string }) { return <section className="min-w-0 rounded-2xl bg-white p-4 shadow-luxury dark:bg-[#102436] sm:p-6"><div className="mb-4 flex items-center gap-2 text-domify-gold">{icon}<h2 className="font-display text-lg font-semibold text-domify-dark dark:text-white">{title}</h2></div>{items.length === 0 ? <p className="text-sm text-domify-dark/50 dark:text-white/50">{empty}</p> : <div className="space-y-2">{items.map((item) => <div key={item.label} className="flex items-center justify-between rounded-xl bg-domify-warm-white px-3 py-2.5 dark:bg-white/5"><span className="text-sm text-domify-dark/70 dark:text-white/70">{item.label}</span><span className="text-sm font-semibold text-domify-primary dark:text-domify-soft-gold">{formatNumber(item.value)}</span></div>)}</div>}</section>; }
function MetricPanel({ title, value, caption, icon }: { title: string; value: number | string; caption: string; icon: React.ReactNode }) { return <section className="rounded-2xl bg-white p-4 shadow-luxury dark:bg-[#102436] sm:p-6"><div className="flex items-center gap-2 text-domify-gold">{icon}<h2 className="font-display text-sm font-semibold text-domify-dark dark:text-white">{title}</h2></div><p className="mt-4 font-display text-3xl font-bold text-domify-primary dark:text-domify-soft-gold">{typeof value === "number" ? formatNumber(value) : value}</p><p className="mt-1 text-xs text-domify-dark/55 dark:text-white/55">{caption}</p></section>; }
function FunnelStep({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-domify-primary/10 bg-domify-warm-white p-3 dark:border-white/10 dark:bg-white/5"><p className="font-display text-2xl font-bold text-domify-primary dark:text-domify-soft-gold">{formatNumber(value)}</p><p className="mt-1 text-xs text-domify-dark/55 dark:text-white/55">{label}</p></div>; }
function BusinessMetric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-domify-warm-white p-3 dark:bg-white/5"><p className="font-display text-2xl font-semibold text-domify-primary dark:text-domify-soft-gold">{formatNumber(value)}</p><p className="mt-1 text-xs leading-4 text-domify-dark/55 dark:text-white/55">{label}</p></div>; }
function Priority({ label, value, href, icon }: { label: string; value: number; href: string; icon: React.ReactNode }) { return <Link href={href} className="flex items-center justify-between rounded-xl bg-domify-warm-white px-4 py-3 transition hover:bg-domify-gold/10 dark:bg-white/5"><span className="flex items-center gap-2 text-sm text-domify-dark/70 dark:text-white/70">{icon}{label}</span><span className="font-semibold text-domify-primary dark:text-domify-soft-gold">{formatNumber(value)}</span></Link>; }
