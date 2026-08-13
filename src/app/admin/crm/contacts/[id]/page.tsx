import Link from "next/link";
import { ArrowLeft, CalendarDays, Mail, MapPin, MessageSquareText, Phone, UserRound } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { CrmActivityForm, CrmDealForm, CrmTimeline } from "@/components/admin/crm/CrmDetailActions";
import { CrmContactForm } from "@/components/admin/crm/CrmContactForm";
import { CrmSalesTools } from "@/components/admin/crm/CrmSalesTools";
import { auth } from "@/lib/auth";
import { getCrmContactById } from "@/lib/data/crm";
import { prisma } from "@/lib/prisma";

export default async function CrmContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "EDITOR" && role !== "AGENT")) redirect(`/connexion?callbackUrl=/admin/crm/contacts/${id}`);
  const access = { userId: session.user.id, role } as const;
  const [contact, properties, sellerCases, documents] = await Promise.all([
    getCrmContactById(id, access),
    prisma.property.findMany({
      where: role === "AGENT" ? { agent: { userId: session.user.id } } : {},
      select: { id: true, title: true, reference: true },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    prisma.crmSellerCase.findMany({
      where: role === "AGENT" ? { OR: [{ ownerId: session.user.id }, { property: { agent: { userId: session.user.id } } }] } : {},
      select: { id: true, title: true },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    prisma.crmDocument.findMany({ where: { contactId: id, status: { not: "REQUESTED" } }, select: { id: true, name: true, url: true }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  if (!contact) notFound();

  return (
    <>
      <AdminTopbar title={contact.name} />
      <main className="min-h-full bg-[#faf9f6] px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
        <Link href="/admin/crm" className="pressable inline-flex items-center gap-2 text-sm font-semibold text-domify-primary hover:text-domify-gold"><ArrowLeft size={16} /> Retour au CRM</Link>
        <section className="mt-5 rounded-[1.55rem] border border-domify-dark/8 bg-white p-5 shadow-[0_18px_38px_-30px_rgba(16,47,66,0.35)] sm:p-7"><div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between"><div className="flex min-w-0 items-center gap-4"><span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-domify-warm-white text-domify-primary ring-1 ring-domify-gold/16"><UserRound size={28} /></span><div className="min-w-0"><p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-domify-gold">Fiche relationnelle</p><h1 className="mt-1 truncate font-display text-3xl font-semibold text-domify-dark">{contact.name}</h1><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-domify-dark/58"><span className="inline-flex items-center gap-1.5"><Mail size={14} /> {contact.email}</span>{contact.phone && <span className="inline-flex items-center gap-1.5"><Phone size={14} /> {contact.phone}</span>}{contact.preferredLocation && <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> {contact.preferredLocation}</span>}</div></div></div><div className="grid grid-cols-3 gap-2 text-center"><Stat label="Leads" value={contact._count.leads} /><Stat label="Visites" value={contact._count.appointments} /><Stat label="Messages" value={contact._count.messages} /></div></div></section>

        <section className="mt-7 grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1fr)_430px]">
          <div className="space-y-6"><CrmTimeline activities={contact.activities} /><section className="rounded-[1.35rem] border border-domify-dark/8 bg-white p-5 shadow-[0_18px_38px_-30px_rgba(16,47,66,0.34)]"><p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-domify-gold">Sources d&apos;origine</p><h2 className="mt-1 font-display text-xl font-semibold text-domify-dark">Demandes associées</h2><div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3"><InboundCard icon={MessageSquareText} title="Leads" items={contact.leads.map((lead) => ({ id: lead.id, title: lead.property?.title || "Demande générale", detail: lead.message || lead.status, date: lead.createdAt }))} /><InboundCard icon={CalendarDays} title="Visites" items={contact.appointments.map((appointment) => ({ id: appointment.id, title: appointment.property?.title || "Visite", detail: `${appointment.status} · ${appointment.agent?.name || "Sans agent"}`, date: appointment.date }))} /><InboundCard icon={Mail} title="Messages" items={contact.messages.map((message) => ({ id: message.id, title: message.subject || "Sans sujet", detail: message.body, date: message.createdAt }))} /></div></section></div>
          <aside className="space-y-6"><section className="rounded-[1.35rem] border border-domify-dark/8 bg-white p-5 shadow-[0_18px_38px_-30px_rgba(16,47,66,0.34)]"><p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-domify-gold">Profil</p><h2 className="mt-1 font-display text-xl font-semibold text-domify-dark">Informations du contact</h2><div className="mt-5"><CrmContactForm contact={contact} /></div></section><CrmDealForm contactId={contact.id} properties={properties} /><CrmActivityForm contactId={contact.id} deals={contact.deals.map((deal) => ({ id: deal.id, title: deal.title }))} /><CrmSalesTools contactId={contact.id} deals={contact.deals.map((deal) => ({ id: deal.id, title: deal.title }))} properties={properties} sellerCases={sellerCases} offers={contact.sellerCases.flatMap((item) => item.offers)} documents={documents} /></aside>
        </section>
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-domify-warm-white px-3 py-2.5"><p className="font-display text-xl font-semibold text-domify-dark">{value}</p><p className="mt-0.5 text-[0.62rem] font-bold uppercase tracking-wide text-domify-dark/48">{label}</p></div>; }
function InboundCard({ icon: Icon, title, items }: { icon: typeof Mail; title: string; items: Array<{ id: string; title: string; detail: string; date: Date }> }) { return <article className="rounded-xl bg-domify-warm-white/65 p-4"><div className="flex items-center gap-2 text-domify-primary"><Icon size={16} /><h3 className="font-semibold">{title}</h3></div><div className="mt-4 space-y-3">{items.length === 0 ? <p className="text-xs text-domify-dark/50">Aucun élément.</p> : items.slice(0, 4).map((item) => <div key={item.id} className="border-l-2 border-domify-gold/35 pl-3"><p className="truncate text-xs font-semibold text-domify-dark">{item.title}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-domify-dark/58">{item.detail}</p><p className="mt-1 text-[0.62rem] text-domify-dark/42">{new Intl.DateTimeFormat("fr-MA", { dateStyle: "medium" }).format(new Date(item.date))}</p></div>)}</div></article>; }
