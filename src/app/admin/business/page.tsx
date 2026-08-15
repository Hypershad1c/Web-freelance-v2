import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeAlert,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  CreditCard,
  ExternalLink,
  Hourglass,
  ReceiptText,
  ShieldCheck,
  TrendingUp,
  Users,
  WalletCards,
  XCircle,
} from "lucide-react";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { ApprovalActions } from "@/components/admin/ApprovalActions";
import { MonthlyRevenueChart } from "@/components/admin/MonthlyRevenueChart";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMAD } from "@/lib/utils";

const PLAN_LABELS = {
  STARTER: "Starter",
  PRO: "Pro",
  PREMIUM: "Premium",
  ENTERPRISE: "Enterprise",
} as const;

const SUBSCRIPTION_STATUS_LABELS = {
  PENDING: "En attente",
  ACTIVE: "Active",
  PAST_DUE: "Impayée",
  CANCELED: "Annulée",
  EXPIRED: "Expirée",
} as const;

const PAYMENT_STATUS_LABELS = {
  INITIATED: "Initiée",
  PAID: "Payée",
  FAILED: "Échec",
  CANCELED: "Annulée",
} as const;

function formatDate(date: Date | null | undefined) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getDisplayName(user: { name: string | null; email: string | null }) {
  return user.name || user.email || "Utilisateur sans nom";
}

function buildRevenueTrend(payments: { amount: number; createdAt: Date }[], now: Date) {
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const revenue = payments
      .filter((payment) => `${payment.createdAt.getFullYear()}-${payment.createdAt.getMonth()}` === key)
      .reduce((total, payment) => total + payment.amount, 0);
    return {
      month: key,
      label: new Intl.DateTimeFormat("fr-MA", { month: "short" }).format(date).replace(".", ""),
      revenue,
    };
  });
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: typeof CreditCard;
  tone?: "primary" | "gold" | "emerald" | "rose" | "amber";
}) {
  const toneClasses = {
    primary: "bg-domify-primary/8 text-domify-primary",
    gold: "bg-domify-gold/15 text-domify-primary",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
  } as const;
  return (
    <article className="rounded-2xl border border-black/6 bg-white p-5 shadow-luxury transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-domify-dark/48">{label}</p>
          <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-domify-dark">{value}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
          <Icon size={19} strokeWidth={1.8} />
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-domify-dark/52">{detail}</p>
    </article>
  );
}

function SectionHeading({
  eyebrow,
  title,
  detail,
  href,
  hrefLabel,
}: {
  eyebrow: string;
  title: string;
  detail?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-domify-gold">{eyebrow}</p>
        <h2 className="mt-1.5 font-display text-2xl font-semibold text-domify-dark">{title}</h2>
        {detail && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-domify-dark/55">{detail}</p>}
      </div>
      {href && hrefLabel && (
        <a href={href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-domify-primary transition-colors hover:text-domify-gold">
          {hrefLabel} <ArrowUpRight size={15} />
        </a>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: keyof typeof PAYMENT_STATUS_LABELS | keyof typeof SUBSCRIPTION_STATUS_LABELS }) {
  const classes = {
    PAID: "bg-emerald-50 text-emerald-700",
    ACTIVE: "bg-emerald-50 text-emerald-700",
    INITIATED: "bg-amber-50 text-amber-800",
    PENDING: "bg-amber-50 text-amber-800",
    FAILED: "bg-rose-50 text-rose-700",
    PAST_DUE: "bg-rose-50 text-rose-700",
    CANCELED: "bg-slate-100 text-slate-600",
    EXPIRED: "bg-slate-100 text-slate-600",
  } as const;
  const label = status in PAYMENT_STATUS_LABELS
    ? PAYMENT_STATUS_LABELS[status as keyof typeof PAYMENT_STATUS_LABELS]
    : SUBSCRIPTION_STATUS_LABELS[status as keyof typeof SUBSCRIPTION_STATUS_LABELS];
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${classes[status]}`}>{label}</span>;
}

function RenewalRisk({ status, periodEnd, now }: { status: keyof typeof SUBSCRIPTION_STATUS_LABELS; periodEnd: Date | null; now: Date }) {
  if (status === "PAST_DUE") return <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700"><BadgeAlert size={14} /> Action immédiate</span>;
  if (status !== "ACTIVE" || !periodEnd) return <span className="text-xs text-domify-dark/45">—</span>;
  const days = Math.ceil((periodEnd.getTime() - now.getTime()) / 86_400_000);
  if (days <= 7) return <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700"><AlertTriangle size={14} /> {days <= 0 ? "À renouveler" : `${days} j. restants`}</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700"><CheckCircle2 size={14} /> Faible</span>;
}

export default async function AdminBusinessPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/admin");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 86_400_000);
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [
    activeSubscriptions,
    totalSubscriptions,
    planDistribution,
    totalPaidRevenue,
    monthlyRevenue,
    revenuePayments,
    failedPayments,
    pendingPayments,
    expiringSubscriptions,
    pastDueSubscriptions,
    recentPayments,
    pendingProperties,
    subscriptions,
  ] = await Promise.all([
    prisma.agencySubscription.count({ where: { status: "ACTIVE" } }),
    prisma.agencySubscription.count(),
    prisma.agencySubscription.groupBy({
      by: ["plan"],
      where: { status: "ACTIVE" },
      _count: { _all: true },
    }),
    prisma.agencyPayment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    prisma.agencyPayment.aggregate({ where: { status: "PAID", createdAt: { gte: startOfMonth } }, _sum: { amount: true } }),
    prisma.agencyPayment.findMany({ where: { status: "PAID", createdAt: { gte: twelveMonthsAgo } }, select: { amount: true, createdAt: true } }),
    prisma.agencyPayment.count({ where: { status: "FAILED" } }),
    prisma.agencyPayment.count({ where: { status: "INITIATED" } }),
    prisma.agencySubscription.count({
      where: {
        status: "ACTIVE",
        currentPeriodEnd: { gte: now, lte: sevenDaysFromNow },
      },
    }),
    prisma.agencySubscription.count({ where: { status: "PAST_DUE" } }),
    prisma.agencyPayment.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        plan: true,
        amount: true,
        currency: true,
        status: true,
        cartId: true,
        providerTransactionRef: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.property.findMany({
      where: { approvalStatus: "PENDING", submittedById: { not: null } },
      orderBy: { submittedAt: "asc" },
      select: {
        id: true,
        title: true,
        reference: true,
        city: { select: { name: true } },
        propertyType: { select: { name: true } },
        submittedAt: true,
        submittedBy: { select: { name: true, email: true } },
      },
    }),
    prisma.agencySubscription.findMany({
      orderBy: [{ status: "asc" }, { currentPeriodEnd: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        plan: true,
        status: true,
        amount: true,
        currency: true,
        currentPeriodEnd: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  const paidRevenue = totalPaidRevenue._sum.amount ?? 0;
  const thisMonthRevenue = monthlyRevenue._sum.amount ?? 0;
  const distribution = ["STARTER", "PRO", "PREMIUM", "ENTERPRISE"] as const;
  const maxPlanCount = Math.max(1, ...planDistribution.map((item) => item._count._all));
  const pendingVerificationCount = pendingProperties.length;
  const revenueTrend = buildRevenueTrend(revenuePayments, now);

  return (
    <>
      <AdminTopbar title="Tableau de bord business" />
      <main className="p-5 sm:p-6 lg:p-10">
        <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-domify-gold"><TrendingUp size={15} /> Pilotage commercial</p>
            <h1 className="mt-2 max-w-3xl font-display text-3xl font-semibold tracking-tight text-domify-dark sm:text-4xl">La performance business, en un seul regard.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-domify-dark/58">Suivez les abonnements agences, les encaissements PayTabs, les risques de renouvellement et les soumissions propriétaires à contrôler.</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-domify-gold/20 bg-white px-4 py-3 text-xs text-domify-dark/55 shadow-luxury"><Clock3 size={15} className="text-domify-gold" /> Actualisé le {formatDateTime(now)}</div>
        </div>

        <section aria-label="Indicateurs de revenus" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Revenus encaissés" value={formatMAD(paidRevenue)} detail="Total des paiements confirmés depuis le lancement." icon={WalletCards} tone="primary" />
          <MetricCard label="Revenus ce mois" value={formatMAD(thisMonthRevenue)} detail={`Paiements PayTabs confirmés depuis le ${formatDate(startOfMonth)}.`} icon={TrendingUp} tone="gold" />
          <MetricCard label="Paiements en attente" value={pendingPayments} detail="Checkout initié, confirmation encore attendue." icon={Hourglass} tone="amber" />
          <MetricCard label="Paiements en échec" value={failedPayments} detail="Transactions à surveiller ou à relancer." icon={XCircle} tone="rose" />
        </section>

        <section className="mt-8 rounded-2xl border border-black/6 bg-white p-6 shadow-luxury">
          <SectionHeading eyebrow="Évolution financière" title="Revenus mensuels" detail="Revenus confirmés sur les douze derniers mois, calculés à partir des paiements PayTabs marqués PAID." />
          <MonthlyRevenueChart data={revenueTrend} />
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-black/6 bg-white p-6 shadow-luxury">
            <SectionHeading eyebrow="Abonnements" title="Portefeuille actif" detail={`${activeSubscriptions} abonnement(s) actif(s) sur ${totalSubscriptions} abonnement(s) enregistré(s).`} href="#subscriptions" hrefLabel="Voir la liste" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-domify-warm-white p-4"><div className="flex items-center justify-between"><span className="text-sm text-domify-dark/60">Actifs</span><Users size={16} className="text-domify-primary" /></div><p className="mt-2 font-display text-3xl font-semibold text-domify-primary">{activeSubscriptions}</p></div>
              <div className="rounded-xl bg-domify-warm-white p-4"><div className="flex items-center justify-between"><span className="text-sm text-domify-dark/60">Impayés</span><BadgeAlert size={16} className="text-rose-600" /></div><p className="mt-2 font-display text-3xl font-semibold text-rose-700">{pastDueSubscriptions}</p></div>
              <div className="rounded-xl bg-domify-warm-white p-4"><div className="flex items-center justify-between"><span className="text-sm text-domify-dark/60">Renouvellement sous 7 jours</span><AlertTriangle size={16} className="text-amber-600" /></div><p className="mt-2 font-display text-3xl font-semibold text-amber-700">{expiringSubscriptions}</p></div>
              <div className="rounded-xl bg-domify-warm-white p-4"><div className="flex items-center justify-between"><span className="text-sm text-domify-dark/60">Panier moyen confirmé</span><ReceiptText size={16} className="text-domify-gold" /></div><p className="mt-2 font-display text-3xl font-semibold text-domify-dark">{paidRevenue > 0 ? formatMAD(Math.round(paidRevenue / Math.max(1, recentPayments.filter((payment) => payment.status === "PAID").length))) : "0 MAD"}</p></div>
            </div>
          </div>
          <div className="rounded-2xl border border-black/6 bg-white p-6 shadow-luxury">
            <SectionHeading eyebrow="Mix commercial" title="Plans actifs" detail="Répartition des abonnements actuellement actifs." />
            <div className="space-y-4">
              {distribution.map((plan) => {
                const count = planDistribution.find((item) => item.plan === plan)?._count._all ?? 0;
                const width = `${Math.max(4, Math.round((count / maxPlanCount) * 100))}%`;
                return <div key={plan}><div className="mb-1.5 flex items-center justify-between text-sm"><span className="font-medium text-domify-dark">{PLAN_LABELS[plan]}</span><span className="font-semibold text-domify-primary">{count}</span></div><div className="h-2 overflow-hidden rounded-full bg-domify-warm-white"><div className="h-full rounded-full bg-gradient-to-r from-domify-primary to-domify-gold" style={{ width }} /></div></div>;
              })}
            </div>
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-domify-gold/20 bg-domify-gold/8 p-3 text-xs leading-5 text-domify-dark/62"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-domify-gold" /> Les montants sont affichés à partir des paiements marqués <strong className="font-semibold text-domify-dark">PAID</strong>.</div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-black/6 bg-white p-6 shadow-luxury">
          <SectionHeading eyebrow="Contrôle financier" title="Transactions récentes" detail="Les 20 derniers paiements enregistrés, avec leur état de confirmation PayTabs." href="/admin/business#subscriptions" hrefLabel="Gérer les abonnements" />
          <div className="overflow-x-auto">
            {recentPayments.length === 0 ? <EmptyState icon={CreditCard} title="Aucune transaction enregistrée" detail="Les paiements initiés depuis la page Tarifs apparaîtront ici." /> : <table className="w-full min-w-[850px] border-separate border-spacing-0 text-left"><thead><tr className="text-[10px] font-bold uppercase tracking-[0.13em] text-domify-dark/45"><th className="border-b border-black/7 px-3 py-3">Client</th><th className="border-b border-black/7 px-3 py-3">Plan</th><th className="border-b border-black/7 px-3 py-3">Montant</th><th className="border-b border-black/7 px-3 py-3">Statut</th><th className="border-b border-black/7 px-3 py-3">Référence</th><th className="border-b border-black/7 px-3 py-3">Date</th></tr></thead><tbody>{recentPayments.map((payment) => <tr key={payment.id} className="text-sm transition-colors hover:bg-domify-warm-white/60"><td className="border-b border-black/5 px-3 py-4"><p className="font-semibold text-domify-dark">{getDisplayName(payment.user)}</p><p className="mt-0.5 text-xs text-domify-dark/50">{payment.user.email ?? "—"}</p></td><td className="border-b border-black/5 px-3 py-4 font-medium text-domify-primary">{PLAN_LABELS[payment.plan]}</td><td className="border-b border-black/5 px-3 py-4 font-semibold text-domify-dark">{formatMAD(payment.amount)}</td><td className="border-b border-black/5 px-3 py-4"><StatusPill status={payment.status} /></td><td className="border-b border-black/5 px-3 py-4 font-mono text-xs text-domify-dark/50">{payment.providerTransactionRef ?? payment.cartId}</td><td className="border-b border-black/5 px-3 py-4 whitespace-nowrap text-xs text-domify-dark/55">{formatDateTime(payment.createdAt)}</td></tr>)}</tbody></table>}
          </div>
        </section>

        <section id="verifications" className="mt-8 rounded-2xl border border-black/6 bg-white p-6 shadow-luxury">
          <SectionHeading eyebrow="Gouvernance éditoriale" title="Vérifications propriétaires en attente" detail={`${pendingVerificationCount} soumission(s) déposée(s) par un propriétaire et en attente de décision.`} href="/admin/approvals" hrefLabel="Ouvrir la file complète" />
          {pendingProperties.length === 0 ? <EmptyState icon={BadgeCheck} title="File de vérification vide" detail="Aucune soumission propriétaire n’attend actuellement de validation." /> : <div className="space-y-3">{pendingProperties.map((property) => <article key={property.id} className="rounded-xl border border-black/6 bg-domify-warm-white/35 p-4"><div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-domify-primary/70"><span>{property.city.name}</span><span className="text-domify-dark/25">•</span><span>{property.propertyType.name}</span><span className="rounded-full bg-amber-50 px-2 py-1 text-amber-800">À valider</span></div><h3 className="mt-2 truncate font-display text-lg font-semibold text-domify-dark">{property.title}</h3><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-domify-dark/52"><span>Réf. {property.reference}</span><span>Soumis le {formatDate(property.submittedAt)}</span><span>Par {property.submittedBy ? getDisplayName(property.submittedBy) : "—"}</span></div></div><div className="flex shrink-0 flex-wrap items-center gap-2"><a href={`/admin/properties/${property.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-domify-dark/10 bg-white px-3 py-2 text-xs font-semibold text-domify-dark/65 transition-colors hover:border-domify-gold/40 hover:text-domify-primary"><ExternalLink size={13} /> Détails</a><ApprovalActions id={property.id} /></div></div></article>)}</div>}
        </section>

        <section id="subscriptions" className="mt-8 rounded-2xl border border-black/6 bg-white p-6 shadow-luxury">
          <SectionHeading eyebrow="Portefeuille clients" title="Toutes les souscriptions" detail="Vue opérationnelle des contrats, de leur échéance et de leur risque de renouvellement." />
          <div className="overflow-x-auto">
            {subscriptions.length === 0 ? <EmptyState icon={Users} title="Aucun abonnement" detail="Les abonnements créés depuis la page Tarifs seront listés ici." /> : <table className="w-full min-w-[920px] border-separate border-spacing-0 text-left"><thead><tr className="text-[10px] font-bold uppercase tracking-[0.13em] text-domify-dark/45"><th className="border-b border-black/7 px-3 py-3">Compte</th><th className="border-b border-black/7 px-3 py-3">Plan</th><th className="border-b border-black/7 px-3 py-3">Statut</th><th className="border-b border-black/7 px-3 py-3">Montant</th><th className="border-b border-black/7 px-3 py-3">Fin de période</th><th className="border-b border-black/7 px-3 py-3">Risque</th></tr></thead><tbody>{subscriptions.map((subscription) => <tr key={subscription.id} className="text-sm transition-colors hover:bg-domify-warm-white/60"><td className="border-b border-black/5 px-3 py-4"><p className="font-semibold text-domify-dark">{getDisplayName(subscription.user)}</p><p className="mt-0.5 text-xs text-domify-dark/50">{subscription.user.email ?? "—"}</p></td><td className="border-b border-black/5 px-3 py-4 font-medium text-domify-primary">{PLAN_LABELS[subscription.plan]}</td><td className="border-b border-black/5 px-3 py-4"><StatusPill status={subscription.status} /></td><td className="border-b border-black/5 px-3 py-4 font-semibold text-domify-dark">{formatMAD(subscription.amount)}</td><td className="border-b border-black/5 px-3 py-4 whitespace-nowrap text-xs text-domify-dark/55">{formatDate(subscription.currentPeriodEnd)}</td><td className="border-b border-black/5 px-3 py-4"><RenewalRisk status={subscription.status} periodEnd={subscription.currentPeriodEnd} now={now} /></td></tr>)}</tbody></table>}
          </div>
        </section>
      </main>
    </>
  );
}

function EmptyState({ icon: Icon, title, detail }: { icon: typeof CreditCard; title: string; detail: string }) {
  return <div className="rounded-xl border border-dashed border-domify-dark/12 bg-domify-warm-white/35 px-6 py-10 text-center"><Icon size={25} className="mx-auto text-domify-gold" /><p className="mt-3 font-display text-lg font-semibold text-domify-dark">{title}</p><p className="mt-1 text-sm text-domify-dark/52">{detail}</p></div>;
}
