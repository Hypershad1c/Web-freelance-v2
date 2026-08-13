import { redirect } from "next/navigation";
import { Eye, TrendingUp, FileText, Inbox } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { PageViewsChart } from "@/components/admin/PageViewsChart";

type DailyCount = { day: Date; count: bigint };

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/admin");

  const [totalViews, todayViews, topPagesRaw, dailyRaw, leadsCount, appointmentsCount, attributionRaw, valuationsCount, financingCount] = await Promise.all([
    prisma.analyticsEvent.count({ where: { type: "page_view" } }),
    prisma.analyticsEvent.count({
      where: { type: "page_view", createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["path"],
      where: { type: "page_view", path: { not: null } },
      _count: { path: true },
      orderBy: { _count: { path: "desc" } },
      take: 10,
    }),
    prisma.$queryRaw<DailyCount[]>`
      SELECT date_trunc('day', "createdAt") as day, count(*)::bigint as count
      FROM "AnalyticsEvent"
      WHERE type = 'page_view' AND "createdAt" >= now() - interval '14 days'
      GROUP BY day
      ORDER BY day ASC
    `,
    prisma.lead.count(),
    prisma.appointment.count(),
    prisma.analyticsEvent.groupBy({ by: ["source"], where: { source: { not: null }, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }, _count: { source: true }, orderBy: { _count: { source: "desc" } }, take: 8 }),
    prisma.lead.count({ where: { source: "valuation_funnel" } }),
    prisma.lead.count({ where: { source: "financing_readiness" } }),
  ]);

  const dailyData = dailyRaw.map((d) => ({
    date: new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "2-digit" }).format(new Date(d.day)),
    vues: Number(d.count),
  }));

  const stats = [
    { label: "Vues totales", value: totalViews, icon: Eye },
    { label: "Vues aujourd'hui", value: todayViews, icon: TrendingUp },
    { label: "Leads (total)", value: leadsCount, icon: Inbox },
    { label: "Rendez-vous (total)", value: appointmentsCount, icon: FileText },
    { label: "Estimations", value: valuationsCount, icon: TrendingUp },
    { label: "Préqualifications", value: financingCount, icon: Inbox },
  ];

  return (
    <>
      <AdminTopbar title="Analytique" />
      <div className="p-6 lg:p-10">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-white p-6 shadow-luxury">
              <s.icon className="text-domify-gold" size={22} />
              <p className="mt-4 font-display text-3xl font-bold text-domify-dark">{s.value}</p>
              <p className="text-sm text-domify-dark/60">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-luxury">
          <h2 className="mb-4 font-display text-lg font-semibold text-domify-dark">Vues des 14 derniers jours</h2>
          {dailyData.length === 0 ? (
            <p className="text-sm text-domify-dark/50">
              Pas encore de données. Les vues de page sont enregistrées automatiquement à chaque visite.
            </p>
          ) : (
            <PageViewsChart data={dailyData} />
          )}
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-2"><section className="rounded-2xl bg-white p-6 shadow-luxury"><h2 className="mb-4 font-display text-lg font-semibold text-domify-dark">Canaux d’acquisition — 30 jours</h2>{attributionRaw.length === 0 ? <p className="text-sm text-domify-dark/50">Aucune campagne attribuée pour le moment. Les visites avec des paramètres UTM apparaîtront ici.</p> : <div className="space-y-3">{attributionRaw.map((item) => <div key={item.source} className="flex items-center justify-between rounded-xl bg-domify-warm-white px-4 py-3"><span className="text-sm font-medium text-domify-dark">{item.source}</span><span className="text-sm font-semibold text-domify-primary">{item._count.source}</span></div>)}</div>}</section>
        <section className="rounded-2xl bg-white p-6 shadow-luxury">
          <h2 className="mb-4 font-display text-lg font-semibold text-domify-dark">Pages les plus consultées</h2>
          {topPagesRaw.length === 0 ? (
            <p className="text-sm text-domify-dark/50">Aucune donnée pour le moment.</p>
          ) : (
            <div className="divide-y divide-black/5">
              {topPagesRaw.map((p) => (
                <div key={p.path} className="flex items-center justify-between py-2.5">
                  <span className="font-mono text-sm text-domify-dark">{p.path}</span>
                  <span className="text-sm font-medium text-domify-dark/60">{p._count.path} vue(s)</span>
                </div>
              ))}
            </div>
          )}
        </section></div>
      </div>
    </>
  );
}
