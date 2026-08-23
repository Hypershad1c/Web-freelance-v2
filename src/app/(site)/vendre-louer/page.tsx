import Link from "next/link";
import { ArrowUpRight, FileCheck2, Home, ShieldCheck, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SellerPropertySubmissionForm } from "@/components/seller/SellerPropertySubmissionForm";
import { getLocale } from "@/i18n/get-locale";
import type { Locale } from "@/i18n/locales";

const SELLER_COPY = {
  fr: { eyebrow: "Dépôt propriétaire", title: "Vendez ou louez votre bien avec une vérification à la hauteur.", body: "Créez votre compte, ajoutez votre propriété, indiquez votre prix et transmettez vos coordonnées. Notre équipe vérifie chaque annonce avant sa publication.", journey: "Un parcours simple", journeyOne: "Créez ou utilisez votre compte", journeyTwo: "Déposez votre bien et vos images", journeyThree: "Recevez la décision de vérification", account: "Un compte propriétaire", accountBody: "Votre dépôt, vos coordonnées et les décisions de vérification restent liés à un espace personnel.", review: "Un contrôle avant publication", reviewBody: "Un administrateur, un éditeur ou un agent examine les informations, le prix et les images avant toute mise en ligne.", followUp: "Un suivi transparent", followUpBody: "Retrouvez la référence, le statut, les corrections demandées et les prochaines étapes dans votre espace vendeur.", help: "Besoin d’aide ?", helpBody: "Si vous préférez être accompagné, contactez Domify avant de déposer votre annonce.", advisor: "Parler à un conseiller", accountSpace: "Espace propriétaire", loginTitle: "Connectez-vous pour déposer votre bien.", loginBody: "Un compte est nécessaire pour protéger vos coordonnées, suivre la vérification et recevoir les demandes de correction ou d’approbation.", login: "Se connecter", create: "Créer mon compte", owner: "Propriétaire Domify" },
  en: { eyebrow: "Owner submission", title: "Sell or rent your property with thorough verification.", body: "Create your account, add your property, enter your price, and share your contact details. Our team verifies every listing before publication.", journey: "A simple journey", journeyOne: "Create or use your account", journeyTwo: "Submit your property and images", journeyThree: "Receive the review decision", account: "An owner account", accountBody: "Your submission, contact details, and review decisions remain linked to a personal space.", review: "Review before publication", reviewBody: "An administrator, editor, or agent reviews the information, price, and images before a listing goes live.", followUp: "Transparent follow-up", followUpBody: "Find the reference, status, required corrections, and next steps in your seller space.", help: "Need help?", helpBody: "If you prefer guidance, contact Domify before submitting your listing.", advisor: "Speak to an advisor", accountSpace: "Owner space", loginTitle: "Sign in to submit your property.", loginBody: "An account is required to protect your details, follow the review, and receive correction or approval requests.", login: "Sign in", create: "Create my account", owner: "Domify owner" },
  ar: { eyebrow: "تقديم عقار المالك", title: "بع أو أجر عقارك مع تحقق يليق به.", body: "أنشئ حسابك، أضف عقارك، حدد سعرك، وأرسل بيانات التواصل. يتحقق فريقنا من كل إعلان قبل نشره.", journey: "مسار بسيط", journeyOne: "أنشئ حسابك أو استخدمه", journeyTwo: "أرسل عقارك وصوره", journeyThree: "استلم قرار المراجعة", account: "حساب مالك", accountBody: "يبقى طلبك وبيانات التواصل وقرارات المراجعة مرتبطة بمساحتك الشخصية.", review: "مراجعة قبل النشر", reviewBody: "يراجع مسؤول أو محرر أو مستشار المعلومات والسعر والصور قبل نشر الإعلان.", followUp: "متابعة شفافة", followUpBody: "ستجد المرجع والحالة والتعديلات المطلوبة والخطوات التالية في مساحة البائع.", help: "هل تحتاج إلى مساعدة؟", helpBody: "إذا كنت تفضل المرافقة، تواصل مع دوميفاي قبل تقديم إعلانك.", advisor: "تحدث مع مستشار", accountSpace: "مساحة المالك", loginTitle: "سجّل الدخول لتقديم عقارك.", loginBody: "يلزم حساب لحماية بياناتك ومتابعة المراجعة واستلام طلبات التصحيح أو الموافقة.", login: "تسجيل الدخول", create: "أنشئ حسابي", owner: "مالك دوميفاي" },
} as const;

export default async function SellOrRentPage() {
  const locale = await getLocale();
  const copy = SELLER_COPY[locale];
  const isRtl = locale === "ar";
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
    <div dir={isRtl ? "rtl" : "ltr"} className={isRtl ? "text-right" : ""}>
      <section className="relative overflow-hidden bg-domify-primary-dark py-16 text-white sm:py-20">
        <div className="pointer-events-none absolute -end-24 -top-32 h-80 w-80 rounded-full border border-domify-soft-gold/20 bg-domify-primary/50 blur-3xl" />
        <div className="pointer-events-none absolute -start-24 bottom-[-12rem] h-96 w-96 rounded-full border border-white/10" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="luxury-eyebrow flex items-center gap-3 text-domify-soft-gold"><span className="h-px w-8 bg-domify-soft-gold" /> {copy.eyebrow}</p>
          <div className={`mt-5 grid gap-8 lg:items-end ${isRtl ? "lg:grid-cols-[0.9fr_1.1fr]" : "lg:grid-cols-[1.1fr_0.9fr]"}`}>
            <div><h1 className="max-w-3xl font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">{copy.title}</h1><p className="mt-5 max-w-2xl text-base leading-8 text-white/68 sm:text-lg">{copy.body}</p></div>
            <div className="rounded-2xl border border-white/12 bg-white/8 p-5 backdrop-blur-md"><p className="text-xs font-bold uppercase tracking-[0.14em] text-domify-soft-gold">{copy.journey}</p><div className="mt-4 space-y-3 text-sm text-white/75"><p className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-domify-soft-gold font-bold text-domify-primary-dark">1</span> {copy.journeyOne}</p><p className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-domify-soft-gold font-bold text-domify-primary-dark">2</span> {copy.journeyTwo}</p><p className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-domify-soft-gold font-bold text-domify-primary-dark">3</span> {copy.journeyThree}</p></div></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {!user ? <AccountRequired locale={locale} /> : <div className={`grid gap-10 lg:items-start ${isRtl ? "lg:grid-cols-[1.28fr_0.72fr]" : "lg:grid-cols-[0.72fr_1.28fr]"}`}><div className="space-y-5 lg:sticky lg:top-28"><Benefit icon={Users} title={copy.account} desc={copy.accountBody} /><Benefit icon={ShieldCheck} title={copy.review} desc={copy.reviewBody} /><Benefit icon={FileCheck2} title={copy.followUp} desc={copy.followUpBody} /><div className="rounded-2xl bg-domify-warm-white p-5"><p className="text-xs font-bold uppercase tracking-[0.14em] text-domify-gold">{copy.help}</p><p className="mt-2 text-sm leading-6 text-domify-dark/60">{copy.helpBody}</p><Link href="/contact" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-domify-primary hover:text-domify-gold">{copy.advisor} <ArrowUpRight size={15} className={isRtl ? "-scale-x-100" : undefined} /></Link></div></div><SellerPropertySubmissionForm locale={locale} user={{ name: user.name || copy.owner, email: user.email, phone: user.phone || "" }} cities={cities} neighborhoods={neighborhoods} propertyTypes={propertyTypes} /></div>}
      </section>
    </div>
  );
}

function AccountRequired({ locale }: { locale: Locale }) {
  const copy = SELLER_COPY[locale];
  const isRtl = locale === "ar";
  const callbackUrl = encodeURIComponent("/vendre-louer");
  return <div className="mx-auto max-w-2xl rounded-[1.8rem] border border-domify-dark/8 bg-white p-7 text-center shadow-luxury sm:p-12"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-domify-warm-white text-domify-gold"><Home size={28} /></span><p className="luxury-eyebrow mt-6 text-domify-gold">{copy.accountSpace}</p><h2 className="mt-3 font-display text-3xl font-semibold text-domify-dark">{copy.loginTitle}</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-domify-dark/60">{copy.loginBody}</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href={`/connexion?callbackUrl=${callbackUrl}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-domify-primary px-6 py-3 text-sm font-semibold text-white shadow-luxury hover:bg-domify-primary-dark">{copy.login} <ArrowUpRight size={16} className={isRtl ? "-scale-x-100" : undefined} /></Link><Link href={`/inscription?callbackUrl=${callbackUrl}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-domify-gold px-6 py-3 text-sm font-semibold text-white shadow-luxury hover:bg-domify-soft-gold hover:text-domify-dark">{copy.create} <ArrowUpRight size={16} className={isRtl ? "-scale-x-100" : undefined} /></Link></div></div>;
}

function Benefit({ icon: Icon, title, desc }: { icon: typeof Home; title: string; desc: string }) {
  return <div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-domify-warm-white text-domify-gold"><Icon size={18} /></span><div><p className="font-display text-base font-semibold text-domify-dark">{title}</p><p className="mt-0.5 text-sm leading-6 text-domify-dark/60">{desc}</p></div></div>;
}
