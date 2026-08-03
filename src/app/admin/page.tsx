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
      <div className="p-6 lg:p-10">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-white p-6 shadow-luxury">
              <s.icon className="text-domify-gold" size={22} />
              <p className="mt-4 font-display text-3xl font-bold text-domify-dark">{s.value}</p>
              <p className="text-sm text-domify-dark/60">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-luxury">
          <h2 className="font-display text-lg font-semibold text-domify-dark">Derniers leads</h2>
          {recentLeads.length === 0 ? (
            <p className="mt-4 text-sm text-domify-dark/50">Aucun lead pour le moment.</p>
          ) : (
            <div className="mt-4 divide-y divide-black/5">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-domify-dark">{lead.name}</p>
                    <p className="text-xs text-domify-dark/50">
                      {lead.email} {lead.property ? `— ${lead.property.title}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-domify-warm-white px-3 py-1 text-xs font-medium text-domify-dark/70">
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
        <div className="p-6 lg:p-10">
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
      <div className="p-6 lg:p-10">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-white p-6 shadow-luxury">
              <s.icon className="text-domify-gold" size={22} />
              <p className="mt-4 font-display text-3xl font-bold text-domify-dark">{s.value}</p>
              <p className="text-sm text-domify-dark/60">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-luxury">
            <h2 className="font-display text-lg font-semibold text-domify-dark">Mes prochains rendez-vous</h2>
            {upcomingAppointments.length === 0 ? (
              <p className="mt-4 text-sm text-domify-dark/50">Aucun rendez-vous en attente.</p>
            ) : (
              <div className="mt-4 divide-y divide-black/5">
                {upcomingAppointments.map((appt) => (
                  <div key={appt.id} className="py-3">
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

          <div className="rounded-2xl bg-white p-6 shadow-luxury">
            <h2 className="font-display text-lg font-semibold text-domify-dark">Mes derniers leads</h2>
            {recentLeads.length === 0 ? (
              <p className="mt-4 text-sm text-domify-dark/50">Aucun lead pour le moment.</p>
            ) : (
              <div className="mt-4 divide-y divide-black/5">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="py-3">
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
