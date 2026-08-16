import Link from "next/link";
import { Building2, Users, Inbox, CalendarClock, Newspaper, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

export default async function AdminDashboardPage() {
  const session = await auth();
  const role = session?.user?.role ?? "USER";

  if (role === "AGENT") {
    return <AgentDashboard userId={session!.user.id} />;
  }

  return <StaffDashboard role={role as "ADMIN" | "EDITOR"} />;
}

// ---------- Admin & Editor ----------

async function StaffDashboard({ role }: { role: "ADMIN" | "EDITOR" }) {
  const [propertiesCount, usersCount, postsCount, leadsCount, appointmentsCount, recentLeads] = await Promise.all([
    prisma.property.count(),
    role === "ADMIN" ? prisma.user.count() : Promise.resolve(null),
    prisma.blogPost.count({ where: { published: true } }),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.appointment.count({ where: { status: "PENDING" } }),
    prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { property: true } }),
  ]);

  const stats = [
    { label: "Propriétés", value: propertiesCount, icon: Building2 },
    ...(usersCount !== null ? [{ label: "Utilisateurs", value: usersCount, icon: Users }] : []),
    { label: "Articles publiés", value: postsCount, icon: Newspaper },
    { label: "Nouveaux leads", value: leadsCount, icon: Inbox },
    { label: "RDV en attente", value: appointmentsCount, icon: CalendarClock },
  ];

  return (
    <>
      <AdminTopbar title={role === "ADMIN" ? "Tableau de bord" : "Tableau de bord — Éditeur"} />
      <div className="admin-page-shell p-4 sm:p-6 lg:p-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {stats.map((s) => (
            <div key={s.label} className="admin-panel-interactive relative overflow-hidden rounded-[1.35rem] p-5 sm:p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-domify-warm-white text-domify-gold ring-1 ring-domify-gold/10">
                <s.icon size={19} strokeWidth={1.9} />
              </span>
              <p className="mt-5 font-display text-3xl font-bold leading-none text-domify-dark">{s.value}</p>
              <p className="mt-2 text-sm font-medium text-domify-dark/58">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="admin-panel mt-7 rounded-[1.5rem] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 border-b border-domify-dark/7 pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-domify-gold">Activité récente</p>
              <h2 className="mt-1 font-display text-lg font-semibold text-domify-dark">Derniers leads</h2>
            </div>
          </div>
          {recentLeads.length === 0 ? (
            <p className="mt-5 rounded-xl bg-domify-warm-white/70 px-4 py-4 text-sm text-domify-dark/55">Aucun lead pour le moment.</p>
          ) : (
            <div className="mt-4 divide-y divide-black/5">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex flex-col items-start gap-2 py-4 first:pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-domify-dark">{lead.name}</p>
                    <p className="text-xs text-domify-dark/50">
                      {lead.email} {lead.property ? `— ${lead.property.title}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full border border-domify-dark/8 bg-domify-warm-white px-3 py-1 text-[11px] font-semibold text-domify-dark/70">
                    {lead.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ---------- Agent ----------

async function AgentDashboard({ userId }: { userId: string }) {
  const agent = await prisma.agent.findUnique({ where: { userId } });

  if (!agent) {
    return (
      <>
        <AdminTopbar title="Mon tableau de bord" />
        <div className="admin-page-shell p-4 sm:p-6 lg:p-10">
          <div className="rounded-2xl bg-domify-warm-white p-10 text-center">
            <p className="text-domify-dark/70">
              Votre compte n&apos;est pas encore relié à une fiche Agent. Demandez à un administrateur de vous associer
              depuis <span className="font-medium">Admin → Agents</span>.
            </p>
          </div>
        </div>
      </>
    );
  }

  const [propertiesCount, publishedCount, appointmentsCount, newLeadsCount, upcomingAppointments, recentLeads] =
    await Promise.all([
      prisma.property.count({ where: { agentId: agent.id } }),
      prisma.property.count({ where: { agentId: agent.id, status: "PUBLISHED" } }),
      prisma.appointment.count({ where: { agentId: agent.id, status: "PENDING" } }),
      prisma.lead.count({ where: { property: { agentId: agent.id }, status: "NEW" } }),
      prisma.appointment.findMany({
        where: { agentId: agent.id, status: "PENDING" },
        orderBy: { date: "asc" },
        take: 5,
        include: { property: { select: { title: true } } },
      }),
      prisma.lead.findMany({
        where: { property: { agentId: agent.id } },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { property: { select: { title: true } } },
      }),
    ]);

  const stats = [
    { label: "Mes propriétés", value: propertiesCount, icon: Building2 },
    { label: "Publiées", value: publishedCount, icon: Star },
    { label: "RDV en attente", value: appointmentsCount, icon: CalendarClock },
    { label: "Nouveaux leads", value: newLeadsCount, icon: Inbox },
  ];

  return (
    <>
      <AdminTopbar title={`Bonjour, ${agent.name.split(" ")[0]}`} />
      <div className="admin-page-shell p-4 sm:p-6 lg:p-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="admin-panel-interactive relative overflow-hidden rounded-[1.35rem] p-5 sm:p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-domify-warm-white text-domify-gold ring-1 ring-domify-gold/10">
                <s.icon size={19} strokeWidth={1.9} />
              </span>
              <p className="mt-5 font-display text-3xl font-bold leading-none text-domify-dark">{s.value}</p>
              <p className="mt-2 text-sm font-medium text-domify-dark/58">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-7 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="admin-panel rounded-[1.5rem] p-5 sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-domify-gold">À venir</p>
            <h2 className="mt-1 font-display text-lg font-semibold text-domify-dark">Mes prochains rendez-vous</h2>
            {upcomingAppointments.length === 0 ? (
              <p className="mt-4 text-sm text-domify-dark/50">Aucun rendez-vous en attente.</p>
            ) : (
              <div className="mt-4 divide-y divide-black/5">
                {upcomingAppointments.map((appt) => (
                  <div key={appt.id} className="rounded-xl bg-domify-warm-white/55 px-3 py-3 sm:bg-transparent sm:px-0">
                    <p className="text-sm font-medium text-domify-dark">{appt.name}</p>
                    <p className="text-xs text-domify-dark/50">
                      {appt.property?.title ?? "—"} ·{" "}
                      {new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(appt.date)}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <Link href="/admin/appointments" className="mt-4 inline-block text-xs font-semibold text-domify-primary">
              Voir tous mes rendez-vous →
            </Link>
          </div>

          <div className="admin-panel rounded-[1.5rem] p-5 sm:p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-domify-gold">À traiter</p>
            <h2 className="mt-1 font-display text-lg font-semibold text-domify-dark">Mes derniers leads</h2>
            {recentLeads.length === 0 ? (
              <p className="mt-5 rounded-xl bg-domify-warm-white/70 px-4 py-4 text-sm text-domify-dark/55">Aucun lead pour le moment.</p>
            ) : (
              <div className="mt-4 divide-y divide-black/5">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="rounded-xl bg-domify-warm-white/55 px-3 py-3 sm:bg-transparent sm:px-0">
                    <p className="text-sm font-medium text-domify-dark">{lead.name}</p>
                    <p className="text-xs text-domify-dark/50">{lead.property?.title ?? "—"}</p>
                  </div>
                ))}
              </div>
            )}
            <Link href="/admin/leads" className="mt-4 inline-block text-xs font-semibold text-domify-primary">
              Voir tous mes leads →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
