import Link from "next/link";
import { ArrowUpRight, FileCheck2, Home, ShieldCheck, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SellerPropertySubmissionForm } from "@/components/seller/SellerPropertySubmissionForm";

export default async function SellOrRentPage() {
  const session = await auth();
  const user = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true, phone: true } })
    : null;

  const [cities, neighborhoods, propertyTypes] = user
    ? await Promise.all([
        prisma.city.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
        prisma.neighborhood.findMany({ select: { id: true, name: true, cityId: true }, orderBy: { name: "asc" } }),
        prisma.propertyType.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
      ])
    : [[], [], []];

  return (
    <div>
      <section className="relative overflow-hidden bg-domify-primary-dark py-16 text-white sm:py-20">
        <div className="pointer-events-none absolute -end-24 -top-32 h-80 w-80 rounded-full border border-domify-soft-gold/20 bg-domify-primary/50 blur-3xl" />
        <div className="pointer-events-none absolute -start-24 bottom-[-12rem] h-96 w-96 rounded-full border border-white/10" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="luxury-eyebrow flex items-center gap-3 text-domify-soft-gold"><span className="h-px w-8 bg-domify-soft-gold" /> Dépôt propriétaire</p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div><h1 className="max-w-3xl font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">Vendez ou louez votre bien avec une vérification à la hauteur.</h1><p className="mt-5 max-w-2xl text-base leading-8 text-white/68 sm:text-lg">Créez votre compte, ajoutez votre propriété, indiquez votre prix et transmettez vos coordonnées. Notre équipe vérifie chaque annonce avant sa publication.</p></div>
            <div className="rounded-2xl border border-white/12 bg-white/8 p-5 backdrop-blur-md"><p className="text-xs font-bold uppercase tracking-[0.14em] text-domify-soft-gold">Un parcours simple</p><div className="mt-4 space-y-3 text-sm text-white/75"><p className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-domify-soft-gold font-bold text-domify-primary-dark">1</span> Créez ou utilisez votre compte</p><p className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-domify-soft-gold font-bold text-domify-primary-dark">2</span> Déposez votre bien et vos images</p><p className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-domify-soft-gold font-bold text-domify-primary-dark">3</span> Recevez la décision de vérification</p></div></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {!user ? <AccountRequired /> : <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start"><div className="space-y-5 lg:sticky lg:top-28"><Benefit icon={Users} title="Un compte propriétaire" desc="Votre dépôt, vos coordonnées et les décisions de vérification restent liés à un espace personnel." /><Benefit icon={ShieldCheck} title="Un contrôle avant publication" desc="Un administrateur, un éditeur ou un agent examine les informations, le prix et les images avant toute mise en ligne." /><Benefit icon={FileCheck2} title="Un suivi transparent" desc="Retrouvez la référence, le statut, les corrections demandées et les prochaines étapes dans votre espace vendeur." /><div className="rounded-2xl bg-domify-warm-white p-5"><p className="text-xs font-bold uppercase tracking-[0.14em] text-domify-gold">Besoin d’aide ?</p><p className="mt-2 text-sm leading-6 text-domify-dark/60">Si vous préférez être accompagné, contactez Domify avant de déposer votre annonce.</p><Link href="/contact" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-domify-primary hover:text-domify-gold">Parler à un conseiller <ArrowUpRight size={15} /></Link></div></div><SellerPropertySubmissionForm user={{ name: user.name || "Propriétaire Domify", email: user.email, phone: user.phone || "" }} cities={cities} neighborhoods={neighborhoods} propertyTypes={propertyTypes} /></div>}
      </section>
    </div>
  );
}

function AccountRequired() {
  const callbackUrl = encodeURIComponent("/vendre-louer");
  return <div className="mx-auto max-w-2xl rounded-[1.8rem] border border-domify-dark/8 bg-white p-7 text-center shadow-luxury sm:p-12"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-domify-warm-white text-domify-gold"><Home size={28} /></span><p className="luxury-eyebrow mt-6 text-domify-gold">Espace propriétaire</p><h2 className="mt-3 font-display text-3xl font-semibold text-domify-dark">Connectez-vous pour déposer votre bien.</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-domify-dark/60">Un compte est nécessaire pour protéger vos coordonnées, suivre la vérification et recevoir les demandes de correction ou d’approbation.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href={`/connexion?callbackUrl=${callbackUrl}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-domify-primary px-6 py-3 text-sm font-semibold text-white shadow-luxury hover:bg-domify-primary-dark">Se connecter <ArrowUpRight size={16} /></Link><Link href={`/inscription?callbackUrl=${callbackUrl}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-domify-gold px-6 py-3 text-sm font-semibold text-white shadow-luxury hover:bg-domify-soft-gold hover:text-domify-dark">Créer mon compte <ArrowUpRight size={16} /></Link></div></div>;
}

function Benefit({ icon: Icon, title, desc }: { icon: typeof Home; title: string; desc: string }) {
  return <div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-domify-warm-white text-domify-gold"><Icon size={18} /></span><div><p className="font-display text-base font-semibold text-domify-dark">{title}</p><p className="mt-0.5 text-sm leading-6 text-domify-dark/60">{desc}</p></div></div>;
}
