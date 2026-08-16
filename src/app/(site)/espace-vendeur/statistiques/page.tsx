import Link from "next/link";
import { ArrowLeft, BarChart3, Eye, Heart, Inbox, MousePointerClick } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMAD } from "@/lib/utils";

export default async function SellerStatisticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/espace-vendeur/statistiques");
  const properties = await prisma.property.findMany({
    where: { submittedById: session.user.id },
    select: { id: true, title: true, reference: true, status: true, viewsCount: true, price: true, city: { select: { name: true } }, _count: { select: { favorites: true, leads: true, appointments: true } } },
    orderBy: { updatedAt: "desc" },
  });
  const totals = properties.reduce((acc, property) => ({ views: acc.views + property.viewsCount, favorites: acc.favorites + property._count.favorites, leads: acc.leads + property._count.leads, appointments: acc.appointments + property._count.appointments }), { views: 0, favorites: 0, leads: 0, appointments: 0 });
  return <main className="mx-auto min-h-screen max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
    <Link href="/espace-vendeur" className="inline-flex items-center gap-2 text-sm font-semibold text-domify-primary hover:text-domify-gold"><ArrowLeft size={16} /> Retour à l’espace vendeur</Link>
    <section className="mt-6 rounded-[2rem] bg-domify-primary-dark p-7 text-white shadow-luxury sm:p-10"><p className="luxury-eyebrow text-domify-soft-gold">Analyse propriétaire</p><h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">La performance de vos biens</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Suivez la visibilité, l’intérêt et les demandes générées par vos annonces Domify.</p></section>
    <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric icon={Eye} label="Vues" value={totals.views} /><Metric icon={Heart} label="Favoris" value={totals.favorites} /><Metric icon={Inbox} label="Demandes" value={totals.leads} /><Metric icon={MousePointerClick} label="Visites" value={totals.appointments} /></section>
    <section className="mt-8 overflow-x-auto rounded-[1.5rem] border border-domify-dark/8 bg-white shadow-luxury"><div className="flex items-center gap-3 border-b border-domify-dark/8 p-5"><BarChart3 className="text-domify-gold" size={20} /><div><h2 className="font-display text-2xl font-semibold text-domify-dark">Détail par bien</h2><p className="mt-1 text-xs text-domify-dark/55">Les chiffres se mettent à jour avec l’activité publique.</p></div></div>{properties.length === 0 ? <p className="p-8 text-center text-sm text-domify-dark/55">Vos statistiques apparaîtront après le dépôt d’un bien.</p> : <table className="w-full min-w-[720px] text-left"><thead><tr className="border-b border-domify-dark/8 text-xs uppercase tracking-wide text-domify-dark/45"><th className="p-4">Bien</th><th className="p-4">Statut</th><th className="p-4">Prix</th><th className="p-4">Vues</th><th className="p-4">Favoris</th><th className="p-4">Demandes</th></tr></thead><tbody>{properties.map((property) => <tr key={property.id} className="border-b border-domify-dark/6 last:border-0"><td className="p-4"><Link href={`/proprietes/${property.id}`} className="font-semibold text-domify-dark hover:text-domify-primary">{property.title}</Link><p className="mt-1 text-xs text-domify-dark/45">{property.reference} · {property.city.name}</p></td><td className="p-4 text-sm text-domify-dark/65">{property.status}</td><td className="p-4 text-sm font-semibold text-domify-gold">{formatMAD(property.price)}</td><td className="p-4 text-sm text-domify-dark/65">{property.viewsCount}</td><td className="p-4 text-sm text-domify-dark/65">{property._count.favorites}</td><td className="p-4 text-sm text-domify-dark/65">{property._count.leads + property._count.appointments}</td></tr>)}</tbody></table>}</section>
  </main>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: number }) { return <article className="rounded-2xl border border-domify-dark/8 bg-white p-4 shadow-luxury"><Icon size={18} className="text-domify-gold" /><p className="mt-3 font-display text-2xl font-semibold text-domify-dark">{value}</p><p className="mt-1 text-xs text-domify-dark/50">{label}</p></article>; }
