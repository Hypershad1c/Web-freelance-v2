import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Inbox,
  MessageCircle,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

type MetricTone = "gold" | "blue" | "rose" | "green" | "slate";

const LEAD_STATUS: Record<string, { label: string; tone: string }> = {
  NEW: { label: "Nouveau", tone: "admin-status-chip admin-status-chip--gold" },
  CONTACTED: { label: "Contacté", tone: "admin-status-chip admin-status-chip--blue" },
  QUALIFIED: { label: "Qualifié", tone: "admin-status-chip admin-status-chip--green" },
  CONVERTED: { label: "Converti", tone: "admin-status-chip admin-status-chip--green" },
  LOST: { label: "Perdu", tone: "admin-status-chip admin-status-chip--slate" },
};

function MetricCard({ label, value, detail, href, icon: Icon, tone }: { label: string; value: number; detail: string; href: string; icon: typeof Building2; tone: MetricTone }) {
  return (
    <Link href={href} className={`admin-metric-card admin-metric-card--${tone} group`}>
      <div className="flex items-start justify-between gap-3">
        <span className="admin-metric-card__icon"><Icon size={18} strokeWidth={2} /></span>
        <ArrowUpRight size={16} className="mt-1 text-domify-dark/32 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>
      <p className="mt-6 font-display text-3xl font-semibold leading-none text-domify-dark sm:text-[2rem]">{value}</p>
      <p className="mt-2 text-sm font-semibold text-domify-dark">{label}</p>
      <p className="mt-1 text-xs leading-5 text-domify-dark/52">{detail}</p>
    </Link>
  );
}

function SectionHeading({ eyebrow, title, href, action }: { eyebrow: string; title: string; href?: string; action?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="admin-eyebrow">{eyebrow}</p>
        <h2 className="mt-1 font-display text-xl font-semibold text-domify-dark">{title}</h2>
      </div>
      {href && action && <Link href={href} className="admin-link-action">{action} <ArrowUpRight size={14} /></Link>}
    </div>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-MA", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(value);
}

export default async function AdminDashboardPage() {
  const session = await auth();
  const role = session?.user?.role ?? "USER";

  if (role === "AGENT") return <AgentDashboard userId={session!.user.id} />;
  return <StaffDashboard role={role as "ADMIN" | "EDITOR"} />;
}

async function StaffDashboard({ role }: { role: "ADMIN" | "EDITOR" }) {
  const [propertiesCount, publishedProperties, pendingApprovals, usersCount, postsCount, leadsCount, appointmentsCount, unreadMessages, recentLeads, approvalQueue] = await Promise.all([
    prisma.property.count(),
    prisma.property.count({ where: { status: "PUBLISHED" } }),
    prisma.property.count({ where: { approvalStatus: "PENDING" } }),
    role === "ADMIN" ? prisma.user.count() : Promise.resolve(null),
    prisma.blogPost.count({ where: { published: true } }),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.appointment.count({ where: { status: "PENDING" } }),
    prisma.message.count({ where: { read: false } }),
    prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { property: { select: { title: true } } } }),
    prisma.property.findMany({
      where: { approvalStatus: "PENDING" },
      take: 4,
      orderBy: { submittedAt: "asc" },
      select: { id: true, title: true, reference: true, createdAt: true, city: { select: { name: true } } },
    }),
  ]);

  const publishedRate = propertiesCount ? Math.round((publishedProperties / propertiesCount) * 100) : 0;
  const attentionCount = pendingApprovals + leadsCount + appointmentsCount + unreadMessages;
  const metrics = [
    { label: "Catalogue publié", value: publishedProperties, detail: `${propertiesCount} biens au total`, href: "/admin/properties", icon: Building2, tone: "gold" as const },
    { label: "Validations", value: pendingApprovals, detail: pendingApprovals ? "dossiers à examiner" : "aucun dossier en attente", href: "/admin/approvals", icon: ClipboardCheck, tone: "rose" as const },
    { label: "Nouveaux leads", value: leadsCount, detail: leadsCount ? "à contacter rapidement" : "boîte de réception à jour", href: "/admin/leads", icon: Inbox, tone: "blue" as const },
    { label: "Rendez-vous", value: appointmentsCount, detail: appointmentsCount ? "en attente de confirmation" : "aucun rendez-vous à confirmer", href: "/admin/appointments", icon: CalendarClock, tone: "green" as const },
    ...(usersCount !== null ? [{ label: "Utilisateurs", value: usersCount, detail: `${postsCount} articles publiés`, href: "/admin/users", icon: Users, tone: "slate" as const }] : []),
  ];

  return (
    <>
      <AdminTopbar title={role === "ADMIN" ? "Tableau de bord" : "Tableau de bord — Éditeur"} />
      <main className="admin-page-shell admin-command-page p-4 sm:p-6 lg:p-8 xl:p-10">
        <section className="admin-command-hero">
          <div className="relative z-10 max-w-2xl">
            <p className="admin-eyebrow text-domify-soft-gold">Centre de pilotage</p>
            <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-[1.05] text-white sm:text-4xl">Une lecture nette de ce qui mérite votre attention.</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/70 sm:text-base">Suivez le catalogue, la relation client et les validations prioritaires depuis un même espace opérationnel.</p>
          </div>
          <div className="relative z-10 mt-7 grid grid-cols-2 gap-2.5 sm:mt-0 sm:w-[22rem] sm:grid-cols-1">
            <Link href="/admin/approvals" className="admin-command-hero__action"><span className="admin-command-hero__action-icon"><ClipboardCheck size={17} /></span><span><strong>{pendingApprovals} validation{pendingApprovals > 1 ? "s" : ""}</strong><small>À examiner</small></span><ArrowUpRight size={15} /></Link>
            <Link href="/admin/leads" className="admin-command-hero__action"><span className="admin-command-hero__action-icon"><Inbox size={17} /></span><span><strong>{leadsCount} lead{leadsCount > 1 ? "s" : ""} nouveau{leadsCount > 1 ? "x" : ""}</strong><small>À traiter rapidement</small></span><ArrowUpRight size={15} /></Link>
          </div>
          <div className="pointer-events-none absolute -right-14 -top-20 h-64 w-64 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute bottom-[-6rem] left-[34%] h-52 w-52 rounded-full bg-domify-gold/20 blur-3xl" />
        </section>

        <section className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
          {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
        </section>

        <section className="mt-7 grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="admin-panel rounded-[1.55rem] p-5 sm:p-6">
            <SectionHeading eyebrow="Priorités du jour" title="File de validation" href="/admin/approvals" action="Ouvrir les validations" />
            {approvalQueue.length === 0 ? (
              <div className="admin-empty-state mt-5"><CheckCircle2 size={20} /><p><strong>La file est à jour.</strong><span>Aucune propriété n’attend de validation.</span></p></div>
            ) : (
              <div className="mt-5 space-y-2">
                {approvalQueue.map((property, index) => (
                  <Link key={property.id} href={`/admin/properties/${property.id}`} className="admin-priority-row group">
                    <span className="admin-priority-row__index">0{index + 1}</span>
                    <span className="min-w-0 flex-1"><strong className="truncate">{property.title}</strong><small>{property.city.name} · {property.reference}</small></span>
                    <span className="hidden text-xs text-domify-dark/44 sm:block">{formatDate(property.createdAt)}</span>
                    <ArrowUpRight size={15} className="text-domify-dark/36 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <aside className="admin-panel relative overflow-hidden rounded-[1.55rem] p-5 sm:p-6">
            <p className="admin-eyebrow">Santé opérationnelle</p>
            <h2 className="mt-1 font-display text-xl font-semibold text-domify-dark">Le portefeuille aujourd’hui</h2>
            <div className="mt-6 space-y-5">
              <div><div className="flex items-center justify-between gap-3 text-sm"><span className="font-semibold text-domify-dark">Publication du catalogue</span><strong className="text-domify-primary">{publishedRate}%</strong></div><div className="admin-progress-track mt-2"><span style={{ width: `${publishedRate}%` }} /></div><p className="mt-2 text-xs text-domify-dark/52">{publishedProperties} bien{publishedProperties > 1 ? "s" : ""} visible{publishedProperties > 1 ? "s" : ""} sur le site.</p></div>
              <div className="grid grid-cols-2 gap-3"><Link href="/admin/messages" className="admin-mini-queue"><MessageCircle size={16} /><span><strong>{unreadMessages}</strong><small>messages non lus</small></span></Link><Link href="/admin/business" className="admin-mini-queue"><BadgeCheck size={16} /><span><strong>{postsCount}</strong><small>contenus publiés</small></span></Link></div>
            </div>
            <div className="mt-6 border-t border-domify-dark/7 pt-4 text-xs leading-5 text-domify-dark/52"><Clock3 size={14} className="mr-1.5 inline text-domify-gold" /> {attentionCount ? `${attentionCount} élément${attentionCount > 1 ? "s" : ""} actif${attentionCount > 1 ? "s" : ""} dans vos files de travail.` : "Aucune action bloquante détectée."}</div>
          </aside>
        </section>

        <section className="admin-panel mt-7 rounded-[1.55rem] p-5 sm:p-6">
          <SectionHeading eyebrow="Relation client" title="Derniers leads" href="/admin/leads" action="Voir le pipeline" />
          {recentLeads.length === 0 ? (
            <div className="admin-empty-state mt-5"><Inbox size={20} /><p><strong>Aucun lead récent.</strong><span>Les nouvelles demandes apparaîtront ici.</span></p></div>
          ) : (
            <div className="admin-lead-grid mt-5">
              {recentLeads.map((lead) => {
                const state = LEAD_STATUS[lead.status] ?? LEAD_STATUS.NEW;
                return <Link key={lead.id} href="/admin/leads" className="admin-lead-row group"><span className="admin-lead-avatar">{lead.name.charAt(0).toUpperCase()}</span><span className="min-w-0 flex-1"><strong className="truncate">{lead.name}</strong><small className="truncate">{lead.property?.title ?? lead.email}</small></span><span className={state.tone}>{state.label}</span><ArrowUpRight size={14} className="hidden text-domify-dark/35 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:block" /></Link>;
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

async function AgentDashboard({ userId }: { userId: string }) {
  const agent = await prisma.agent.findUnique({ where: { userId } });
  if (!agent) {
    return <><AdminTopbar title="Mon tableau de bord" /><main className="admin-page-shell p-4 sm:p-6 lg:p-10"><div className="admin-empty-state max-w-2xl"><ShieldCheck size={22} /><p><strong>Votre profil agent est en cours de liaison.</strong><span>Demandez à un administrateur de vous associer depuis Admin → Agents.</span></p></div></main></>;
  }

  const [propertiesCount, publishedCount, appointmentsCount, newLeadsCount, upcomingAppointments, recentLeads] = await Promise.all([
    prisma.property.count({ where: { agentId: agent.id } }),
    prisma.property.count({ where: { agentId: agent.id, status: "PUBLISHED" } }),
    prisma.appointment.count({ where: { agentId: agent.id, status: "PENDING" } }),
    prisma.lead.count({ where: { property: { agentId: agent.id }, status: "NEW" } }),
    prisma.appointment.findMany({ where: { agentId: agent.id, status: "PENDING" }, orderBy: { date: "asc" }, take: 5, include: { property: { select: { title: true } } } }),
    prisma.lead.findMany({ where: { property: { agentId: agent.id } }, orderBy: { createdAt: "desc" }, take: 5, include: { property: { select: { title: true } } } }),
  ]);

  const metrics = [
    { label: "Mes propriétés", value: propertiesCount, detail: `${publishedCount} publiées`, href: "/admin/properties", icon: Building2, tone: "gold" as const },
    { label: "Nouveaux leads", value: newLeadsCount, detail: "à contacter", href: "/admin/leads", icon: Inbox, tone: "blue" as const },
    { label: "Rendez-vous", value: appointmentsCount, detail: "à confirmer", href: "/admin/appointments", icon: CalendarClock, tone: "green" as const },
    { label: "Mes validations", value: 0, detail: "suivi de vos dossiers", href: "/admin/approvals", icon: Star, tone: "slate" as const },
  ];

  return <><AdminTopbar title={`Bonjour, ${agent.name.split(" ")[0]}`} /><main className="admin-page-shell admin-command-page p-4 sm:p-6 lg:p-8 xl:p-10"><section className="admin-command-hero"><div className="relative z-10"><p className="admin-eyebrow text-domify-soft-gold">Espace agent</p><h2 className="mt-3 font-display text-3xl font-semibold text-white">Vos priorités commerciales, au même endroit.</h2></div><div className="pointer-events-none absolute -right-14 -top-20 h-64 w-64 rounded-full border border-white/10" /></section><section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">{metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</section><section className="mt-7 grid grid-cols-1 gap-5 lg:grid-cols-2"><div className="admin-panel rounded-[1.55rem] p-5 sm:p-6"><SectionHeading eyebrow="À venir" title="Mes prochains rendez-vous" href="/admin/appointments" action="Voir l’agenda" />{upcomingAppointments.length === 0 ? <div className="admin-empty-state mt-5"><CalendarClock size={20} /><p><strong>Votre agenda est dégagé.</strong><span>Aucun rendez-vous en attente.</span></p></div> : <div className="mt-5 space-y-2">{upcomingAppointments.map((appointment, index) => <Link href="/admin/appointments" key={appointment.id} className="admin-priority-row"><span className="admin-priority-row__index">0{index + 1}</span><span className="min-w-0 flex-1"><strong>{appointment.name}</strong><small>{appointment.property?.title ?? "Sans bien associé"}</small></span><span className="text-xs text-domify-dark/44">{formatDate(appointment.date)}</span></Link>)}</div>}</div><div className="admin-panel rounded-[1.55rem] p-5 sm:p-6"><SectionHeading eyebrow="À traiter" title="Mes derniers leads" href="/admin/leads" action="Ouvrir les leads" />{recentLeads.length === 0 ? <div className="admin-empty-state mt-5"><Inbox size={20} /><p><strong>La boîte de réception est à jour.</strong><span>Les nouveaux leads apparaîtront ici.</span></p></div> : <div className="mt-5 space-y-2">{recentLeads.map((lead, index) => <Link href="/admin/leads" key={lead.id} className="admin-priority-row"><span className="admin-priority-row__index">0{index + 1}</span><span className="min-w-0 flex-1"><strong>{lead.name}</strong><small>{lead.property?.title ?? "Sans bien associé"}</small></span><ArrowUpRight size={15} className="text-domify-dark/36" /></Link>)}</div>}</div></section></main></>;
}
