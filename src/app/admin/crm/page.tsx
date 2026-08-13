import Link from "next/link";
import { CalendarClock, ChevronRight, CircleDollarSign, Handshake, Plus, Target } from "lucide-react";
import { redirect } from "next/navigation";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { CrmContactForm } from "@/components/admin/crm/CrmContactForm";
import { CrmPipeline } from "@/components/admin/crm/CrmPipeline";
import { auth } from "@/lib/auth";
import { CRM_STAGES, getCrmWorkspace } from "@/lib/data/crm";

export default async function CrmPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "EDITOR" && role !== "AGENT")) redirect("/connexion?callbackUrl=/admin/crm");

  const access = { userId: session.user.id, role } as const;
  const workspace = await getCrmWorkspace(access);

  const dueNow = workspace.followUps.filter((activity) => activity.dueAt && new Date(activity.dueAt) < new Date()).length;

  return (
    <>
      <AdminTopbar title="CRM Domify" />
      <main className="min-h-full bg-[#faf9f6] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
        <section className="relative overflow-hidden rounded-[1.7rem] bg-[linear-gradient(115deg,#1f2937_0%,#336699_55%,#4b7199_100%)] p-6 text-white shadow-[0_28px_50px_-30px_rgba(16,47,66,0.75)] sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border border-domify-soft-gold/25" />
          <div className="pointer-events-none absolute bottom-[-7rem] left-[35%] h-48 w-48 rounded-full bg-domify-soft-gold/14 blur-3xl" />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl"><p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-domify-soft-gold">Relations & conversion</p><h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Transformez chaque échange en opportunité.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/72 sm:text-base">Centralisez les prospects, les visites, les messages et les suivis commerciaux dans un seul espace opérationnel.</p></div>
            <a href="#new-contact" className="pressable inline-flex w-fit items-center gap-2 rounded-xl bg-domify-gold px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-domify-soft-gold hover:text-domify-primary-dark"><Plus size={16} /> Nouveau contact</a>
          </div>
          <div className="relative mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric icon={Handshake} label="Opportunités actives" value={String(workspace.metrics.activeDeals)} />
            <Metric icon={CircleDollarSign} label="Valeur du pipeline" value={formatMad(workspace.metrics.activeValue)} />
            <Metric icon={Target} label="Prévision pondérée" value={formatMad(workspace.metrics.forecast)} />
            <Metric icon={CalendarClock} label="Suivis à traiter" value={String(dueNow || workspace.followUps.length)} note={dueNow ? "en retard" : "sur 7 jours"} />
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="overflow-hidden rounded-[1.5rem] border border-domify-dark/8 bg-white p-5 shadow-[0_18px_38px_-30px_rgba(16,47,66,0.35)] sm:p-6"><div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-domify-gold">Cycle commercial</p><h2 className="mt-1 font-display text-2xl font-semibold text-domify-dark">Pipeline des opportunités</h2></div><p className="text-sm text-domify-dark/55">Glissez une carte pour faire évoluer son étape.</p></div><CrmPipeline deals={workspace.deals} columns={CRM_STAGES} /></div>
          <aside className="rounded-[1.5rem] border border-domify-dark/8 bg-white p-5 shadow-[0_18px_38px_-30px_rgba(16,47,66,0.35)]"><div className="flex items-start justify-between"><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-domify-gold">À relancer</p><h2 className="mt-1 font-display text-xl font-semibold text-domify-dark">Prochains suivis</h2></div><CalendarClock size={20} className="text-domify-primary/45" /></div><div className="mt-5 space-y-3">{workspace.followUps.length === 0 ? <p className="rounded-xl bg-domify-warm-white p-4 text-sm leading-6 text-domify-dark/60">Aucun suivi planifié dans les sept prochains jours.</p> : workspace.followUps.map((activity) => <Link key={activity.id} href={`/admin/crm/contacts/${activity.contact.id}`} className="group block rounded-xl border border-domify-dark/7 p-3 transition-luxury hover:border-domify-gold/35 hover:bg-domify-warm-white/60"><p className="font-semibold text-domify-dark group-hover:text-domify-primary">{activity.contact.name}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-domify-dark/56">{activity.body}</p><div className="mt-3 flex items-center justify-between text-[0.68rem] font-semibold"><span className="text-domify-gold">{activity.dueAt ? new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(activity.dueAt)) : "À planifier"}</span><ChevronRight size={15} className="text-domify-primary" /></div></Link>)}</div></aside>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="rounded-[1.5rem] border border-domify-dark/8 bg-white p-5 shadow-[0_18px_38px_-30px_rgba(16,47,66,0.35)] sm:p-6"><div className="mb-5 flex items-end justify-between gap-3"><div><p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-domify-gold">Base relationnelle</p><h2 className="mt-1 font-display text-2xl font-semibold text-domify-dark">Contacts récents</h2></div><span className="rounded-full bg-domify-warm-white px-3 py-1.5 text-xs font-bold text-domify-primary">{workspace.contacts.length} contact(s)</span></div><div className="overflow-x-auto"><table className="min-w-[720px] w-full text-left text-sm"><thead className="border-b border-domify-dark/8 text-[0.66rem] font-bold uppercase tracking-[0.13em] text-domify-dark/44"><tr><th className="pb-3">Contact</th><th className="pb-3">Projet</th><th className="pb-3">Opportunités</th><th className="pb-3">Dernière activité</th><th className="pb-3" /></tr></thead><tbody>{workspace.contacts.map((contact) => <tr key={contact.id} className="border-b border-domify-dark/6 last:border-0"><td className="py-4"><Link href={`/admin/crm/contacts/${contact.id}`} className="font-semibold text-domify-dark hover:text-domify-primary">{contact.name}</Link><p className="mt-0.5 text-xs text-domify-dark/52">{contact.email}</p></td><td className="py-4 text-domify-dark/65">{contact.preferredLocation || "—"}<p className="mt-0.5 text-xs text-domify-dark/42">{formatBudget(contact.budgetMin, contact.budgetMax)}</p></td><td className="py-4"><span className="rounded-full bg-domify-warm-white px-2.5 py-1 text-xs font-bold text-domify-primary">{contact.deals.length}</span></td><td className="py-4 text-xs text-domify-dark/54">{new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium" }).format(new Date(contact.updatedAt))}</td><td className="py-4 text-right"><Link href={`/admin/crm/contacts/${contact.id}`} className="pressable inline-flex h-8 w-8 items-center justify-center rounded-lg text-domify-primary hover:bg-domify-warm-white"><ChevronRight size={16} /></Link></td></tr>)}{workspace.contacts.length === 0 && <tr><td colSpan={5} className="py-12 text-center text-domify-dark/55">Les nouveaux leads, visites et messages alimenteront automatiquement cette base.</td></tr>}</tbody></table></div></div>
          <section id="new-contact" className="rounded-[1.5rem] border border-domify-dark/8 bg-white p-5 shadow-[0_18px_38px_-30px_rgba(16,47,66,0.35)] sm:p-6"><p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-domify-gold">Prospection</p><h2 className="mt-1 font-display text-2xl font-semibold text-domify-dark">Créer un contact</h2><p className="mt-2 text-sm leading-6 text-domify-dark/58">Ajoutez un prospect issu d&apos;un appel, d&apos;une recommandation ou d&apos;un rendez-vous hors ligne.</p><div className="mt-5"><CrmContactForm compact /></div></section>
        </section>
      </main>
    </>
  );
}

function Metric({ icon: Icon, label, value, note }: { icon: typeof Handshake; label: string; value: string; note?: string }) { return <div className="rounded-xl border border-white/12 bg-white/[0.08] p-3.5 backdrop-blur-sm"><div className="flex items-center gap-2 text-[0.64rem] font-bold uppercase tracking-[0.13em] text-white/62"><Icon size={14} className="text-domify-soft-gold" /> {label}</div><p className="mt-3 font-display text-2xl font-semibold text-white">{value}</p>{note && <p className="mt-1 text-xs text-white/52">{note}</p>}</div>; }
function formatMad(value: number) { return value ? new Intl.NumberFormat("fr-MA", { notation: "compact", maximumFractionDigits: 1 }).format(value) + " MAD" : "—"; }
function formatBudget(min: number | null, max: number | null) { if (!min && !max) return "Budget à préciser"; const number = new Intl.NumberFormat("fr-MA", { notation: "compact", maximumFractionDigits: 1 }); return `${min ? number.format(min) : "0"} – ${max ? number.format(max) : "…"} MAD`; }
