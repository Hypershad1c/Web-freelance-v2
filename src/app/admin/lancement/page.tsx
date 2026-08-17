import Link from "next/link";
import { AlertTriangle, ArrowRight, BarChart3, CheckCircle2, DatabaseBackup, Gauge, Globe2, KeyRound, Mail, Megaphone, ShieldCheck, Smartphone, Timer, WalletCards } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isPayTabsCheckoutEnabled, isPayTabsConfigured, isPayTabsLiveEnabled } from "@/lib/paytabs";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-MA").format(value);
}

type Check = { label: string; ok: boolean; detail: string; href?: string; icon: React.ReactNode };

export default async function LaunchControlPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/admin");

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [publishedProperties, pendingApprovals, activeSubscriptions, pastDueSubscriptions, newLeads, staleLeads, recentAnalytics, openConversations] = await Promise.all([
    prisma.property.findMany({ where: { status: "PUBLISHED" }, select: { id: true, title: true, description: true, descriptionEn: true, descriptionAr: true, titleEn: true, titleAr: true, price: true, surfaceArea: true, cityId: true, media: { select: { id: true }, take: 1 } } }),
    prisma.property.count({ where: { approvalStatus: "PENDING" } }),
    prisma.agencySubscription.count({ where: { status: "ACTIVE" } }),
    prisma.agencySubscription.count({ where: { status: { in: ["PAST_DUE", "EXPIRED"] } } }),
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.lead.count({ where: { status: "NEW", createdAt: { lt: oneHourAgo } } }),
    prisma.analyticsEvent.count({ where: { type: "page_view", createdAt: { gte: oneDayAgo } } }),
    prisma.portalConversation.count({ where: { status: "OPEN" } }),
  ]);

  const quality = publishedProperties.reduce((result, property) => {
    if (!property.media.length) result.missingImages += 1;
    if (!property.price || property.price <= 0) result.missingPrice += 1;
    if (!property.surfaceArea || property.surfaceArea <= 0) result.missingSurface += 1;
    if (!property.description || property.description.trim().length < 120) result.shortDescriptions += 1;
    if (!property.titleEn || !property.descriptionEn || !property.titleAr || !property.descriptionAr) result.missingTranslations += 1;
    return result;
  }, { missingImages: 0, missingPrice: 0, missingSurface: 0, shortDescriptions: 0, missingTranslations: 0 });

  const qualityIssues = Object.values(quality).reduce((sum, value) => sum + value, 0);
  const checks: Check[] = [
    { label: "Analytics et consentement", ok: true, detail: "Suivi anonymisé actif, rôles internes exclus", href: "/admin/analytics", icon: <BarChart3 size={18} /> },
    { label: "Email transactionnel", ok: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM), detail: process.env.RESEND_API_KEY && process.env.EMAIL_FROM ? "Resend et expéditeur configurés" : "RESEND_API_KEY ou EMAIL_FROM manquant", href: "/admin/settings", icon: <Mail size={18} /> },
    { label: "Temps réel Pusher", ok: Boolean(process.env.PUSHER_SECRET && process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.NEXT_PUBLIC_PUSHER_CLUSTER), detail: process.env.PUSHER_SECRET ? "Canal serveur et clé publique détectés" : "PUSHER_SECRET ou clés publiques manquants", href: "/admin/messagerie", icon: <Globe2 size={18} /> },
    { label: "Protection des crons", ok: Boolean(process.env.CRON_SECRET), detail: process.env.CRON_SECRET ? "CRON_SECRET configuré" : "Ajouter CRON_SECRET dans Vercel Production", href: "/admin/settings", icon: <KeyRound size={18} /> },
    { label: "PayTabs sécurisé", ok: isPayTabsCheckoutEnabled(), detail: !isPayTabsConfigured() ? "PAYTABS_PROFILE_ID et PAYTABS_SERVER_KEY manquants" : !isPayTabsCheckoutEnabled() ? "Checkout désactivé jusqu’à configuration sandbox" : isPayTabsLiveEnabled() ? "Checkout actif en mode production explicite" : "Checkout actif en mode non-live", href: "/admin/business", icon: <WalletCards size={18} /> },
    { label: "Sauvegarde de données", ok: Boolean(process.env.BACKUP_VERIFIED_AT), detail: process.env.BACKUP_VERIFIED_AT ? `Dernière vérification : ${process.env.BACKUP_VERIFIED_AT}` : "Vérifier la sauvegarde PostgreSQL et documenter la restauration", icon: <DatabaseBackup size={18} /> },
    { label: "Mobile et PWA", ok: true, detail: "Safe areas, mode standalone, navigation mobile et thème vérifiés", icon: <Smartphone size={18} /> },
    { label: "Protection anti-bot", ok: Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY), detail: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY ? "Cloudflare Turnstile configuré" : "Clés Turnstile manquantes", href: "/admin/settings", icon: <ShieldCheck size={18} /> },
    { label: "Monitoring erreurs", ok: Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN), detail: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN ? "Sentry détecté" : "Configurer Sentry pour recevoir les erreurs serveur et client", icon: <Gauge size={18} /> },
  ];

  return (
    <>
      <AdminTopbar title="Contrôle de lancement" />
      <main className="admin-page-shell min-w-0 p-4 sm:p-6 lg:p-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="admin-eyebrow">Préparation commerciale</p><h1 className="font-display text-3xl font-bold text-domify-dark dark:text-white">Finaliser Domify en confiance</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-domify-dark/60 dark:text-white/60">Cette vue rassemble les signaux essentiels avant une campagne, une ouverture PayTabs ou une mise en exploitation quotidienne. Les clés secrètes ne sont jamais affichées.</p></div><span className="inline-flex items-center gap-2 self-start rounded-full bg-domify-warm-white px-3 py-2 text-xs font-semibold text-domify-primary dark:bg-white/10 dark:text-domify-soft-gold"><Gauge size={15} /> Contrôle ADMIN</span></div>

        <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4"><Kpi label="Biens publiés" value={publishedProperties.length} href="/admin/properties" /><Kpi label="Problèmes qualité" value={qualityIssues} href="/admin/properties" tone={qualityIssues ? "warning" : "good"} /><Kpi label="Leads nouveaux" value={newLeads} href="/admin/leads" /><Kpi label="Leads > 1 h" value={staleLeads} href="/admin/leads" tone={staleLeads ? "warning" : "good"} /></section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]"><section className="rounded-2xl bg-white p-4 shadow-luxury dark:bg-[#102436] sm:p-6"><div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="font-display text-lg font-semibold text-domify-dark dark:text-white">Checklist de lancement</h2><p className="mt-1 text-xs text-domify-dark/50 dark:text-white/50">Les éléments rouges nécessitent une configuration ou une vérification externe.</p></div><span className="rounded-full bg-domify-warm-white px-3 py-1.5 text-xs font-semibold text-domify-primary dark:bg-white/10 dark:text-domify-soft-gold">{checks.filter((check) => check.ok).length}/{checks.length} prêts</span></div><div className="grid gap-3 sm:grid-cols-2">{checks.map((check) => <div key={check.label} className={`rounded-xl border p-4 ${check.ok ? "border-emerald-200 bg-emerald-50/70" : "border-amber-200 bg-amber-50/80"}`}><div className="flex items-start justify-between gap-3"><span className={check.ok ? "text-emerald-700" : "text-amber-700"}>{check.icon}</span>{check.ok ? <CheckCircle2 size={17} className="text-emerald-600" /> : <AlertTriangle size={17} className="text-amber-600" />}</div><p className="mt-3 text-sm font-semibold text-domify-dark">{check.label}</p><p className="mt-1 text-xs leading-5 text-domify-dark/60">{check.detail}</p>{check.href && <Link href={check.href} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-domify-primary">Ouvrir <ArrowRight size={12} /></Link>}</div>)}</div></section><section className="rounded-2xl bg-white p-4 shadow-luxury dark:bg-[#102436] sm:p-6"><div className="flex items-center gap-2 text-domify-gold"><Timer size={18} /><h2 className="font-display text-lg font-semibold text-domify-dark dark:text-white">Supervision du jour</h2></div><div className="mt-5 space-y-3"><Signal label="Pages vues 24 h" value={formatNumber(recentAnalytics)} /><Signal label="Conversations ouvertes" value={formatNumber(openConversations)} href="/admin/messagerie" /><Signal label="Validations en attente" value={formatNumber(pendingApprovals)} href="/admin/approvals" /><Signal label="Abonnements actifs" value={formatNumber(activeSubscriptions)} href="/admin/business" /><Signal label="Abonnements à risque" value={formatNumber(pastDueSubscriptions)} href="/admin/business" warning={pastDueSubscriptions > 0} /></div><div className="mt-6 rounded-xl bg-domify-warm-white p-4 dark:bg-white/5"><p className="text-xs leading-5 text-domify-dark/60 dark:text-white/60">Le rapport analytics quotidien et les alertes de leads s’exécutent via les crons Vercel. Une valeur `CRON_SECRET` est nécessaire pour que les appels automatiques soient autorisés.</p></div></section></div>

        <section className="mt-8 rounded-2xl bg-white p-4 shadow-luxury dark:bg-[#102436] sm:p-6"><div className="mb-5 flex items-center justify-between gap-3"><div><h2 className="font-display text-lg font-semibold text-domify-dark dark:text-white">Qualité des annonces publiées</h2><p className="mt-1 text-xs text-domify-dark/50 dark:text-white/50">Une fiche complète améliore la confiance, le SEO et le taux de contact.</p></div><Link href="/admin/properties" className="inline-flex items-center gap-1 text-xs font-semibold text-domify-primary">Ouvrir les propriétés <ArrowRight size={13} /></Link></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-5"><Quality label="Images principales" value={quality.missingImages} /><Quality label="Prix manquant" value={quality.missingPrice} /><Quality label="Surface manquante" value={quality.missingSurface} /><Quality label="Description courte" value={quality.shortDescriptions} /><Quality label="Traductions EN/AR" value={quality.missingTranslations} /></div></section>

        <section className="mt-8 grid gap-6 md:grid-cols-3"><ActionCard title="Analytics" text="Sources UTM, rétention, funnel par bien et export enrichi." href="/admin/analytics" icon={<BarChart3 size={18} />} /><ActionCard title="Leads et SLA" text="Traiter les nouveaux leads en priorité et surveiller les délais." href="/admin/leads" icon={<Timer size={18} />} /><ActionCard title="Campagnes" text="Utiliser les paramètres UTM pour Instagram, Google, WhatsApp et partenaires." href="/admin/analytics" icon={<Megaphone size={18} />} /></section>
      </main>
    </>
  );
}

function Kpi({ label, value, href, tone = "normal" }: { label: string; value: number; href: string; tone?: "normal" | "warning" | "good" }) { return <Link href={href} className="rounded-2xl bg-white p-4 shadow-luxury transition hover:-translate-y-0.5 dark:bg-[#102436] sm:p-5"><p className={`font-display text-2xl font-bold ${tone === "warning" ? "text-amber-600" : tone === "good" ? "text-emerald-700" : "text-domify-primary dark:text-domify-soft-gold"}`}>{formatNumber(value)}</p><p className="mt-1 text-xs text-domify-dark/55 dark:text-white/55">{label}</p></Link>; }
function Signal({ label, value, href, warning = false }: { label: string; value: string; href?: string; warning?: boolean }) { const content = <div className="flex items-center justify-between gap-3 rounded-xl bg-domify-warm-white px-3 py-3 dark:bg-white/5"><span className="text-sm text-domify-dark/70 dark:text-white/70">{label}</span><span className={`font-semibold ${warning ? "text-amber-700" : "text-domify-primary dark:text-domify-soft-gold"}`}>{value}</span></div>; return href ? <Link href={href}>{content}</Link> : content; }
function Quality({ label, value }: { label: string; value: number }) { return <div className={`rounded-xl p-3 ${value ? "bg-amber-50" : "bg-emerald-50"}`}><p className={`font-display text-2xl font-bold ${value ? "text-amber-700" : "text-emerald-700"}`}>{formatNumber(value)}</p><p className="mt-1 text-xs leading-4 text-domify-dark/60">{label}</p></div>; }
function ActionCard({ title, text, href, icon }: { title: string; text: string; href: string; icon: React.ReactNode }) { return <Link href={href} className="rounded-2xl bg-white p-5 shadow-luxury transition hover:-translate-y-0.5 dark:bg-[#102436]"><span className="text-domify-gold">{icon}</span><h2 className="mt-3 font-display text-lg font-semibold text-domify-dark dark:text-white">{title}</h2><p className="mt-1 text-sm leading-6 text-domify-dark/60 dark:text-white/60">{text}</p></Link>; }
