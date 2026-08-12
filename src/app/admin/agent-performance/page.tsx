import { redirect } from "next/navigation";
import { BarChart3, Building2, Eye, Target, CalendarCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

export default async function AgentPerformancePage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/admin");

  const agents = await prisma.agent.findMany({
    include: {
      agency: { select: { name: true } },
      properties: {
        select: {
          id: true,
          status: true,
          viewsCount: true,
          leads: { select: { status: true } },
        },
      },
      appointments: { select: { status: true } },
    },
    orderBy: { name: "asc" },
  });

  const performance = agents.map((agent) => {
    const leads = agent.properties.flatMap((property) => property.leads);
    const convertedLeads = leads.filter((lead) => lead.status === "CONVERTED").length;
    const openLeads = leads.filter((lead) => ["NEW", "CONTACTED", "QUALIFIED"].includes(lead.status)).length;
    const activeListings = agent.properties.filter((property) => ["PUBLISHED", "UNDER_OFFER"].includes(property.status)).length;
    const totalViews = agent.properties.reduce((sum, property) => sum + property.viewsCount, 0);
    const completedVisits = agent.appointments.filter((appointment) => appointment.status === "COMPLETED").length;
    return {
      agent,
      activeListings,
      totalViews,
      leadCount: leads.length,
      openLeads,
      convertedLeads,
      completedVisits,
      conversionRate: leads.length ? Math.round((convertedLeads / leads.length) * 100) : 0,
    };
  });

  const totals = performance.reduce((accumulator, item) => ({
    activeListings: accumulator.activeListings + item.activeListings,
    totalViews: accumulator.totalViews + item.totalViews,
    openLeads: accumulator.openLeads + item.openLeads,
    completedVisits: accumulator.completedVisits + item.completedVisits,
  }), { activeListings: 0, totalViews: 0, openLeads: 0, completedVisits: 0 });

  return (
    <>
      <AdminTopbar title="Performance des agents" />
      <div className="p-6 lg:p-10">
        <div className="mb-7">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-domify-gold"><BarChart3 size={15} /> Pilotage du réseau</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-domify-dark">Performance commerciale</h2>
          <p className="mt-2 text-sm text-domify-dark/60">Suivez l&apos;activité de chaque agent à partir de ses biens, leads et visites.</p>
        </div>

        <div className="mb-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Metric icon={Building2} label="Annonces actives" value={totals.activeListings} />
          <Metric icon={Eye} label="Vues cumulées" value={totals.totalViews.toLocaleString("fr-MA")} />
          <Metric icon={Target} label="Leads ouverts" value={totals.openLeads} />
          <Metric icon={CalendarCheck} label="Visites réalisées" value={totals.completedVisits} />
        </div>

        <div className="overflow-hidden rounded-2xl border border-black/7 bg-white shadow-luxury">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/5 bg-domify-warm-white/50 text-xs uppercase tracking-wide text-domify-dark/50">
                <tr><th className="px-5 py-3 font-medium">Agent</th><th className="px-5 py-3 font-medium">Biens actifs</th><th className="px-5 py-3 font-medium">Vues</th><th className="px-5 py-3 font-medium">Leads ouverts</th><th className="px-5 py-3 font-medium">Conversion</th><th className="px-5 py-3 font-medium">Visites réalisées</th></tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {performance.length === 0 ? <tr><td colSpan={6} className="px-5 py-10 text-center text-domify-dark/50">Aucun agent créé pour le moment.</td></tr> : performance.map((item) => (
                  <tr key={item.agent.id} className="hover:bg-domify-warm-white/30">
                    <td className="px-5 py-4"><p className="font-semibold text-domify-dark">{item.agent.name}</p><p className="mt-0.5 text-xs text-domify-dark/50">{item.agent.agency?.name ?? "Indépendant"}</p></td>
                    <td className="px-5 py-4 font-medium text-domify-dark">{item.activeListings}</td>
                    <td className="px-5 py-4 text-domify-dark/70">{item.totalViews.toLocaleString("fr-MA")}</td>
                    <td className="px-5 py-4 text-domify-dark/70">{item.openLeads}</td>
                    <td className="px-5 py-4"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">{item.conversionRate}%</span></td>
                    <td className="px-5 py-4 text-domify-dark/70">{item.completedVisits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof BarChart3; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-black/7 bg-white p-4 shadow-luxury">
      <Icon size={18} className="text-domify-gold" />
      <p className="mt-4 font-display text-2xl font-semibold text-domify-dark">{value}</p>
      <p className="mt-1 text-xs font-medium text-domify-dark/55">{label}</p>
    </div>
  );
}
