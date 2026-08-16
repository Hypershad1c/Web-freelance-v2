import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Check, Compass, Quote, ShieldCheck, Sparkles, TrendingUp, Users } from "lucide-react";
import { SearchBar } from "@/components/home/SearchBar";
import { PropertyCard } from "@/components/home/PropertyCard";
import { getHomepageProperties, getCitiesWithCounts, getPropertyTypes } from "@/lib/data/properties";
import { getSeoOverride } from "@/lib/data/seo";
import { getSiteSettings } from "@/lib/data/settings";
import { JsonLd } from "@/components/JsonLd";
import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/get-dictionary";
import { Prisma } from "@prisma/client";
import { prisma, isPrismaReady } from "@/lib/prisma";
import { FadeIn, StaggerReveal, staggerItem } from "@/components/motion/FadeIn";
import { MotionDiv } from "@/components/motion/MotionPrimitives";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoOverride("/");
  if (!seo) return {};
  return { title: seo.title, description: seo.description, openGraph: seo.ogImage ? { images: [seo.ogImage] } : undefined };
}

export default async function HomePage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const [featuredProperties, settings, cities, propertyTypes] = await Promise.all([
    getHomepageProperties(4),
    getSiteSettings(),
    getCitiesWithCounts(),
    getPropertyTypes(),
  ]);

  let testimonials: Array<{ id: string; name: string; quote: string; city?: string | null }> = [];
  if (await isPrismaReady()) {
    try {
      testimonials = await prisma.testimonial.findMany({ where: { published: true }, orderBy: { createdAt: "desc" }, take: 3 });
    } catch (error) {
      if ((error as Prisma.PrismaClientKnownRequestError)?.code !== "P2021") throw error;
    }
  }

  const trust = [
    { icon: ShieldCheck, title: dict.home.trust1Title, desc: dict.home.trust1Desc },
    { icon: Users, title: dict.home.trust2Title, desc: dict.home.trust2Desc },
    { icon: Sparkles, title: dict.home.trust3Title, desc: dict.home.trust3Desc },
    { icon: TrendingUp, title: dict.home.trust4Title, desc: dict.home.trust4Desc },
  ];
  const method = [
    { title: dict.home.why1Title, desc: dict.home.why1Desc },
    { title: dict.home.why2Title, desc: dict.home.why2Desc },
    { title: dict.home.why3Title, desc: dict.home.why3Desc },
    { title: dict.home.why4Title, desc: dict.home.why4Desc },
  ];
  const featuredCities = cities.filter((city) => city._count.properties > 0).slice(0, 4);
  const baseUrl = process.env.NEXTAUTH_URL || "https://domify.ma";
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: settings.site_name,
    description: settings.site_tagline,
    url: baseUrl,
    logo: `${baseUrl}/brand/domify-logo-horizontal.png`,
    telephone: settings.contact_phone,
    email: settings.contact_email,
    address: { "@type": "PostalAddress", streetAddress: settings.contact_address, addressCountry: "MA" },
    sameAs: [settings.social_facebook, settings.social_instagram, settings.social_linkedin].filter(Boolean),
  };

  return (
    <>
      <JsonLd data={organizationJsonLd} />

      <section className="relative isolate overflow-hidden bg-domify-primary-dark text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_74%_12%,rgba(232,203,145,0.18),transparent_24rem)]" />
        <div className="pointer-events-none absolute -right-48 top-[-12rem] h-[38rem] w-[38rem] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute bottom-[-12rem] left-[28%] h-[28rem] w-[28rem] rounded-full bg-domify-primary/50 blur-3xl" />

        <div className="relative mx-auto grid min-h-[720px] max-w-7xl items-center gap-10 px-4 pb-28 pt-14 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:gap-16 lg:px-8 lg:pb-36 lg:pt-20">
          <MotionDiv initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }} className="relative z-10 max-w-2xl">
            <p className="luxury-eyebrow flex items-center gap-3 text-domify-soft-gold"><span className="h-px w-10 bg-domify-soft-gold" /> Find Your Perfect Place</p>
            <h1 className="mt-7 max-w-2xl font-display text-[3.45rem] font-semibold leading-[0.93] tracking-[-0.055em] text-white sm:text-7xl lg:text-[6.2rem]">
              {dict.home.heroTitle1} <span className="italic text-domify-soft-gold">{dict.home.heroTitleHighlight}</span> {dict.home.heroTitle2}
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-white/70 sm:text-lg">{dict.home.heroSubtitle}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/proprietes" className="group pressable inline-flex items-center gap-2 rounded-full bg-domify-gold px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_36px_-22px_rgba(232,203,145,0.85)] transition-luxury hover:-translate-y-0.5 hover:bg-domify-soft-gold hover:text-domify-primary-dark">
                {dict.home.seeAll} <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link href="/estimation" className="pressable inline-flex items-center rounded-full border border-white/25 bg-white/[0.06] px-5 py-3 text-sm font-semibold text-white transition-luxury hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/[0.12]">{dict.home.valuationCta}</Link>
            </div>
            <div className="mt-12 grid max-w-lg grid-cols-3 border-t border-white/12 pt-5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white/48">
              <span>Selection privée</span><span className="border-l border-white/12 pl-4">Conseil sur mesure</span><span className="border-l border-white/12 pl-4">Maroc</span>
            </div>
          </MotionDiv>

          <MotionDiv initial={{ opacity: 0, scale: 0.97, x: 18 }} animate={{ opacity: 1, scale: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.12, ease: [0.23, 1, 0.32, 1] }} className="relative min-h-[470px] lg:min-h-[620px]">
            <div className="absolute inset-x-2 top-0 bottom-10 overflow-hidden rounded-[2.25rem] border border-white/15 bg-white/[0.06] shadow-[0_36px_90px_-42px_rgba(0,0,0,0.9)] lg:inset-x-7">
              <Image src="https://images.unsplash.com/photo-1613977257363-707ba9348227?q=85&w=2160&auto=format&fit=crop" alt="Villa moderne au Maroc" fill priority className="object-cover object-center" sizes="(max-width: 1024px) 94vw, 52vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-domify-primary-dark/80 via-domify-primary-dark/8 to-domify-primary-dark/10" />
              <div className="absolute left-5 top-5 rounded-full border border-white/20 bg-domify-primary-dark/35 px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white/80 backdrop-blur-md">Domify collection</div>
            </div>
            <div className="absolute bottom-0 left-0 w-[min(20rem,86%)] rounded-[1.35rem] border border-white/16 bg-white/[0.1] p-5 shadow-[0_26px_64px_-34px_rgba(0,0,0,0.9)] backdrop-blur-xl lg:left-0">
              <div className="flex items-center justify-between"><span className="luxury-eyebrow text-domify-soft-gold">{dict.home.heroPanelEyebrow}</span><Compass size={18} className="text-domify-soft-gold" strokeWidth={1.6} /></div>
              <p className="mt-4 font-display text-2xl font-semibold leading-8 text-white">{dict.home.heroPanelTitle}</p>
              <div className="mt-5 space-y-2 border-t border-white/15 pt-4 text-sm text-white/76"><p className="flex items-center gap-2"><Check size={15} className="text-domify-soft-gold" /> {dict.home.heroPanelPoint1}</p><p className="flex items-center gap-2"><Check size={15} className="text-domify-soft-gold" /> {dict.home.heroPanelPoint2}</p></div>
            </div>
          </MotionDiv>
        </div>

        <MotionDiv className="absolute inset-x-0 bottom-0 z-20 mx-auto max-w-7xl translate-y-1/2 px-4 sm:px-6 lg:px-8" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}>
          <SearchBar cities={cities.map((city) => ({ slug: city.slug, name: city.name }))} propertyTypes={propertyTypes.map((propertyType) => ({ slug: propertyType.slug, name: propertyType.name }))} />
        </MotionDiv>
      </section>

      <section className="border-b border-domify-dark/7 bg-[linear-gradient(180deg,#f5f1e8_0%,#fbfaf7_100%)] pb-6 pt-24 sm:pb-8 sm:pt-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><StaggerReveal className="grid grid-cols-1 divide-y divide-domify-dark/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4" stagger={0.07}>{trust.map((item) => <MotionDiv key={item.title} variants={staggerItem} className="group flex items-start gap-4 px-0 py-5 sm:px-5 sm:py-1 first:pl-0 last:pr-0"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-domify-gold shadow-[0_12px_24px_-18px_rgba(16,47,66,0.65)] transition-luxury group-hover:-translate-y-1 group-hover:bg-domify-primary group-hover:text-domify-soft-gold"><item.icon size={19} strokeWidth={1.8} /></span><div><p className="font-semibold text-domify-dark">{item.title}</p><p className="mt-1 text-sm leading-5 text-domify-dark/58">{item.desc}</p></div></MotionDiv>)}</StaggerReveal></div>
      </section>

      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_8%_20%,rgba(232,203,145,0.13),transparent_24rem)] bg-[#fcfbf8] py-24 sm:py-32">
        <div className="pointer-events-none absolute -left-28 top-10 h-72 w-72 rounded-full border border-domify-gold/20" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div className="max-w-2xl"><p className="luxury-eyebrow flex items-center gap-3 text-domify-gold"><span className="h-px w-8 bg-domify-gold/70" /> {dict.home.featuredEyebrow}</p><h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.03em] text-domify-dark sm:text-6xl">{dict.home.featuredTitle}</h2><p className="mt-4 text-base leading-7 text-domify-dark/62">{dict.home.featuredSubtitle}</p></div><div className="flex items-center gap-4"><span className="hidden rounded-full border border-domify-dark/10 bg-white px-3 py-2 text-xs font-semibold text-domify-dark/55 sm:inline-flex">Sélection éditoriale</span><Link href="/proprietes" className="group inline-flex w-fit items-center gap-2 rounded-full border border-domify-primary/15 bg-white px-4 py-2.5 text-sm font-semibold text-domify-primary shadow-[0_16px_30px_-25px_rgba(16,47,66,0.75)] transition-luxury hover:-translate-y-0.5 hover:border-domify-gold/50 hover:text-domify-gold">{dict.home.seeAll}<ArrowUpRight size={16} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link></div></FadeIn>
          {featuredProperties.length === 0 ? <FadeIn className="relative overflow-hidden rounded-[1.65rem] border border-domify-dark/8 bg-domify-warm-white p-8 sm:p-12"><Sparkles className="relative text-domify-gold" size={28} strokeWidth={1.6} /><p className="relative mt-5 max-w-lg font-display text-2xl font-semibold text-domify-dark">{dict.home.noFeatured}</p><Link href="/proprietes" className="relative mt-6 inline-flex items-center gap-2 text-sm font-semibold text-domify-primary hover:text-domify-gold">{dict.home.seeAll}<ArrowUpRight size={15} /></Link></FadeIn> : <StaggerReveal className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4" stagger={0.08}>{featuredProperties.map((property) => <MotionDiv key={property.id} variants={staggerItem}><PropertyCard property={property} /></MotionDiv>)}</StaggerReveal>}
        </div>
      </section>

      {featuredCities.length > 0 && <section className="border-y border-domify-dark/7 bg-white py-20 sm:py-28"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><FadeIn className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="luxury-eyebrow text-domify-gold">Domify au Maroc</p><h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em] text-domify-dark sm:text-6xl">{dict.home.whyUsTitle}</h2></div><Link href="/quartiers" className="inline-flex items-center gap-2 text-sm font-semibold text-domify-primary transition-colors hover:text-domify-gold">{dict.nav.neighborhoods}<ArrowUpRight size={15} /></Link></FadeIn><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{featuredCities.map((city, index) => <Link key={city.slug} href={`/proprietes?city=${city.slug}`} className="group relative min-h-52 overflow-hidden rounded-[1.55rem] bg-domify-primary-dark p-6 text-white shadow-[0_24px_48px_-32px_rgba(16,47,66,0.7)]"><div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(205,156,32,0.3),transparent_35%)] transition-transform duration-500 group-hover:scale-110" /><span className="relative text-sm font-semibold text-domify-soft-gold">0{index + 1}</span><p className="relative mt-12 font-display text-2xl font-semibold">{city.name}</p><span className="relative mt-2 inline-flex items-center gap-1 text-xs text-white/60">{dict.home.seeAll}<ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5" /></span></Link>)}</div></div></section>}

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32"><FadeIn className="relative overflow-hidden rounded-[2rem] bg-domify-primary-dark px-7 py-14 text-white shadow-[0_30px_72px_-46px_rgba(16,47,66,0.9)] sm:px-12 sm:py-18 lg:px-16 lg:py-22"><div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full border border-white/14" /><div className="pointer-events-none absolute bottom-[-11rem] right-[21%] h-72 w-72 rounded-full bg-domify-primary/55 blur-3xl" /><div className="relative grid items-end gap-10 lg:grid-cols-[1fr_auto]"><div className="max-w-2xl"><p className="luxury-eyebrow text-domify-soft-gold">Votre projet, notre expertise</p><h3 className="mt-4 font-display text-4xl font-semibold leading-[1.04] tracking-[-0.03em] sm:text-6xl">{dict.home.valuationTitle}</h3><p className="mt-5 max-w-xl text-base leading-7 text-white/72 sm:text-lg">{dict.home.valuationSubtitle}</p></div><Link href="/estimation" className="group inline-flex w-fit items-center gap-2 rounded-full bg-domify-gold px-5 py-3 text-sm font-semibold text-white transition-luxury hover:-translate-y-0.5 hover:bg-domify-soft-gold hover:text-domify-primary-dark">{dict.home.valuationCta}<ArrowUpRight size={16} /></Link></div></FadeIn></section>

      <section className="border-y border-domify-dark/7 bg-domify-warm-white/42"><div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32"><FadeIn className="max-w-2xl"><p className="luxury-eyebrow text-domify-gold">L&apos;expérience Domify</p><h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.03em] text-domify-dark sm:text-6xl">{dict.home.whyUsTitle}</h2></FadeIn><StaggerReveal className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-[1.5rem] border border-domify-dark/8 bg-domify-dark/8 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>{method.map((item, index) => <MotionDiv key={item.title} variants={staggerItem} className="group min-h-60 bg-white/80 p-7 transition-luxury hover:bg-white sm:p-8"><span className="font-display text-4xl italic text-domify-gold/60">0{index + 1}</span><p className="mt-8 font-display text-xl font-semibold text-domify-dark">{item.title}</p><p className="mt-3 text-sm leading-6 text-domify-dark/60">{item.desc}</p></MotionDiv>)}</StaggerReveal></div></section>

      {testimonials.length > 0 && <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32"><FadeIn className="mb-10"><p className="luxury-eyebrow text-domify-gold">Ils nous font confiance</p></FadeIn><StaggerReveal className="grid grid-cols-1 gap-5 lg:grid-cols-3" stagger={0.08}>{testimonials.map((testimonial) => <MotionDiv key={testimonial.id} variants={staggerItem} className="rounded-[1.5rem] border border-domify-dark/8 bg-white p-7 shadow-[0_18px_42px_-34px_rgba(16,47,66,0.5)] sm:p-8"><Quote className="text-domify-gold" size={27} strokeWidth={1.6} /><p className="mt-6 font-display text-xl leading-8 text-domify-dark">{testimonial.quote}</p><p className="mt-6 text-sm font-semibold tracking-wide text-domify-primary">{testimonial.name}{testimonial.city ? ` · ${testimonial.city}` : ""}</p></MotionDiv>)}</StaggerReveal></section>}
    </>
  );
}
