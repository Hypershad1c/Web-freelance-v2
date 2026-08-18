import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Quote, ShieldCheck, Sparkles, TrendingUp, Users } from "lucide-react";
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

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoOverride("/");
  if (!seo) return {};
  return { title: seo.title, description: seo.description, openGraph: seo.ogImage ? { images: [seo.ogImage] } : undefined };
}

export default async function HomePage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const [featuredProperties, settings, cities, propertyTypes] = await Promise.all([
    getHomepageProperties(),
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
  const newestProperties = [...featuredProperties].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 3);
  const mostViewedProperties = [...featuredProperties].sort((a, b) => b.viewsCount - a.viewsCount).slice(0, 3);
  const investmentProperties = [...featuredProperties].filter((property) => property.listingType === "VENTE").sort((a, b) => b.viewsCount - a.viewsCount).slice(0, 3);
  const editorialCollections = [
    { eyebrow: "À découvrir", title: "Nouveautés cette semaine", description: "Les dernières adresses entrées dans la sélection Domify.", properties: newestProperties, href: "/proprietes?sort=recent" },
    { eyebrow: "Le regard Domify", title: "Les plus consultés", description: "Les biens qui retiennent l’attention de notre communauté.", properties: mostViewedProperties, href: "/proprietes?sort=popular" },
    { eyebrow: "Vision patrimoine", title: "Opportunités d’investissement", description: "Des adresses à étudier pour leur qualité de vie et leur potentiel.", properties: investmentProperties, href: "/proprietes?listingType=VENTE" },
  ].filter((collection) => collection.properties.length > 0);
  const cityLifestyles = ["Bord de mer", "Vie de famille", "Business & mobilité", "Centre-ville"];
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

      <section className="relative isolate min-h-[650px] overflow-hidden bg-domify-primary-dark text-white lg:min-h-[760px]">
        <Image src="/hero-domify-cinematic.jpg" alt="Villa contemporaine sur la côte marocaine" fill priority className="object-cover object-center" sizes="100vw" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,31,43,0.95)_0%,rgba(9,31,43,0.78)_38%,rgba(9,31,43,0.2)_78%,rgba(9,31,43,0.38)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(9,31,43,0.82)_0%,transparent_48%,rgba(9,31,43,0.2)_100%)]" />
        <div className="pointer-events-none absolute right-[8%] top-[22%] hidden h-56 w-56 rounded-full border border-white/15 lg:block" />
        <div className="pointer-events-none absolute right-[13%] top-[28%] hidden h-32 w-32 rounded-full border border-domify-soft-gold/35 lg:block" />

        <div className="relative mx-auto flex min-h-[650px] max-w-7xl items-center px-4 py-24 sm:px-6 lg:min-h-[760px] lg:px-8 lg:py-28">
          <MotionDiv initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }} className="relative z-10 max-w-3xl">
            <p className="luxury-eyebrow flex items-center gap-3 text-domify-soft-gold"><span className="h-px w-10 bg-domify-soft-gold" /> Find Your Perfect Place</p>
            <h1 className="mt-7 max-w-3xl font-display text-[3.45rem] font-semibold leading-[0.9] tracking-[-0.065em] text-white sm:text-7xl lg:text-[7.2rem]">{dict.home.heroTitle1} <span className="italic text-domify-soft-gold">{dict.home.heroTitleHighlight}</span> {dict.home.heroTitle2}</h1>
            <p className="mt-8 max-w-xl text-base leading-7 text-white/76 sm:text-lg">{dict.home.heroSubtitle}</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/proprietes" className="group pressable inline-flex items-center gap-2 rounded-full bg-domify-gold px-5 py-3 text-sm font-semibold text-white shadow-[0_24px_42px_-22px_rgba(232,203,145,0.9)] transition-luxury hover:-translate-y-0.5 hover:bg-domify-soft-gold hover:text-domify-primary-dark">{dict.home.seeAll}<ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link>
              <Link href="/estimation" className="pressable inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/[0.08] px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-luxury hover:-translate-y-0.5 hover:border-white/65 hover:bg-white/[0.14]">{dict.home.valuationCta}<ArrowUpRight size={15} /></Link>
            </div>
          </MotionDiv>
        </div>
      </section>

      <section className="relative z-10 border-b border-domify-dark/8 bg-[#f7f3eb] py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="rounded-[1.5rem] border border-domify-dark/10 bg-white p-3 shadow-[0_24px_55px_-38px_rgba(16,47,66,0.55)] sm:p-4">
              <SearchBar cities={cities.map((city) => ({ slug: city.slug, name: city.name }))} propertyTypes={propertyTypes.map((propertyType) => ({ slug: propertyType.slug, name: propertyType.name }))} locale={locale} />
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="border-b border-domify-dark/8 bg-[#f7f3eb] py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StaggerReveal className="grid grid-cols-1 divide-y divide-domify-dark/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4" stagger={0.07}>
            {trust.map((item) => (
              <MotionDiv key={item.title} variants={staggerItem} className="group flex items-start gap-4 px-0 py-5 sm:px-5 sm:py-1 first:pl-0 last:pr-0">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-domify-gold shadow-[0_12px_24px_-18px_rgba(16,47,66,0.65)] transition-luxury group-hover:-translate-y-1 group-hover:bg-domify-primary group-hover:text-domify-soft-gold"><item.icon size={19} strokeWidth={1.8} /></span>
                <div><p className="font-semibold text-domify-dark">{item.title}</p><p className="mt-1 text-sm leading-5 text-domify-dark/58">{item.desc}</p></div>
              </MotionDiv>
            ))}
          </StaggerReveal>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#fcfbf8] py-24 sm:py-32">
        <div className="pointer-events-none absolute -left-36 top-10 h-80 w-80 rounded-full border border-domify-gold/20" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="luxury-eyebrow flex items-center gap-3 text-domify-gold"><span className="h-px w-8 bg-domify-gold/70" /> {dict.home.featuredEyebrow}</p>
              <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.04em] text-domify-dark sm:text-6xl">{dict.home.featuredTitle}</h2>
              <p className="mt-4 text-base leading-7 text-domify-dark/62">{dict.home.featuredSubtitle}</p>
            </div>
            <Link href="/proprietes" className="group inline-flex w-fit items-center gap-2 rounded-full border border-domify-primary/15 bg-white px-4 py-2.5 text-sm font-semibold text-domify-primary shadow-[0_16px_30px_-25px_rgba(16,47,66,0.75)] transition-luxury hover:-translate-y-0.5 hover:border-domify-gold/50 hover:text-domify-gold">{dict.home.seeAll}<ArrowUpRight size={16} /></Link>
          </FadeIn>
          {featuredProperties.length === 0 ? (
            <FadeIn className="rounded-[1.65rem] border border-domify-dark/8 bg-domify-warm-white p-8 sm:p-12">
              <Sparkles className="text-domify-gold" size={28} strokeWidth={1.6} />
              <p className="mt-5 max-w-lg font-display text-2xl font-semibold text-domify-dark">{dict.home.noFeatured}</p>
              <Link href="/proprietes" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-domify-primary hover:text-domify-gold">{dict.home.seeAll}<ArrowUpRight size={15} /></Link>
            </FadeIn>
          ) : (
            <StaggerReveal className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4" stagger={0.08}>
              {featuredProperties.map((property) => <MotionDiv key={property.id} variants={staggerItem}><PropertyCard property={property} locale={locale} /></MotionDiv>)}
            </StaggerReveal>
          )}
        </div>
      </section>

      {editorialCollections.length > 0 && (
        <section className="border-y border-domify-dark/8 bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn className="max-w-2xl"><p className="luxury-eyebrow text-domify-gold">Sélections éditoriales</p><h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.04em] text-domify-dark sm:text-5xl">Explorez selon votre rythme de vie.</h2></FadeIn>
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {editorialCollections.map((collection, index) => {
                const cover = collection.properties[0];
                const coverImage = cover.media[0]?.url || "/hero-domify-cinematic.jpg";
                return <Link key={collection.title} href={collection.href} className="group relative min-h-[22rem] overflow-hidden rounded-[1.75rem] bg-domify-primary-dark p-6 text-white shadow-[0_24px_50px_-35px_rgba(16,47,66,0.7)] sm:p-7">
                  <Image src={coverImage} alt="" fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover opacity-45 transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,31,43,0.16)_0%,rgba(9,31,43,0.88)_100%)]" />
                  <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xs font-bold text-domify-soft-gold backdrop-blur-sm">0{index + 1}</span>
                  <span className="relative mt-10 block text-[0.66rem] font-bold uppercase tracking-[0.16em] text-domify-soft-gold">{collection.eyebrow}</span>
                  <h3 className="relative mt-2 font-display text-3xl font-semibold leading-[1.03]">{collection.title}</h3>
                  <p className="relative mt-3 max-w-sm text-sm leading-6 text-white/70">{collection.description}</p>
                  <span className="relative mt-7 inline-flex items-center gap-2 text-sm font-semibold text-white">Voir la sélection <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
                </Link>;
              })}
            </div>
          </div>
        </section>
      )}

      {featuredCities.length > 0 && (
        <section className="border-y border-domify-dark/8 bg-domify-primary-dark py-24 text-white sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="luxury-eyebrow text-domify-soft-gold">Domify au Maroc</p>
                <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">{dict.nav.neighborhoods}</h2>
              </div>
              <Link href="/quartiers" className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 transition-colors hover:text-domify-soft-gold">{dict.nav.neighborhoods}<ArrowUpRight size={15} /></Link>
            </FadeIn>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {featuredCities.map((city, index) => (
                <Link key={city.slug} href={`/proprietes?city=${city.slug}`} className="group relative min-h-56 overflow-hidden rounded-[1.55rem] border border-white/12 bg-white/[0.06] p-6 text-white backdrop-blur-sm transition-luxury hover:-translate-y-1 hover:border-domify-soft-gold/50 hover:bg-white/[0.1]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(205,156,32,0.26),transparent_36%)] transition-transform duration-500 group-hover:scale-110" />
                  <span className="relative text-sm font-semibold text-domify-soft-gold">{cityLifestyles[index] ?? "Art de vivre"}</span>
                  <p className="relative mt-14 font-display text-2xl font-semibold">{city.name}</p>
                  <span className="relative mt-2 block text-xs text-white/55">{city._count.properties} bien{city._count.properties > 1 ? "s" : ""} disponible{city._count.properties > 1 ? "s" : ""}</span>
                  <span className="relative mt-4 inline-flex items-center gap-1 text-xs font-semibold text-domify-soft-gold">Découvrir <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5" /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-y border-domify-dark/8 bg-[#f7f3eb]">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <FadeIn className="max-w-2xl">
            <p className="luxury-eyebrow text-domify-gold">L&apos;expérience Domify</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.04em] text-domify-dark sm:text-6xl">{dict.home.whyUsTitle}</h2>
          </FadeIn>
          <StaggerReveal className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-[1.5rem] border border-domify-dark/8 bg-domify-dark/8 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
            {method.map((item, index) => (
              <MotionDiv key={item.title} variants={staggerItem} className="group min-h-60 bg-white/80 p-7 transition-luxury hover:bg-white sm:p-8">
                <span className="font-display text-4xl italic text-domify-gold/60">0{index + 1}</span>
                <p className="mt-8 font-display text-xl font-semibold text-domify-dark">{item.title}</p>
                <p className="mt-3 text-sm leading-6 text-domify-dark/60">{item.desc}</p>
              </MotionDiv>
            ))}
          </StaggerReveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <FadeIn className="relative overflow-hidden rounded-[2rem] bg-domify-primary-dark px-7 py-14 text-white shadow-[0_30px_72px_-46px_rgba(16,47,66,0.9)] sm:px-12 lg:px-16 lg:py-22">
          <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full border border-white/14" />
          <div className="pointer-events-none absolute bottom-[-11rem] right-[21%] h-72 w-72 rounded-full bg-domify-primary/55 blur-3xl" />
          <div className="relative grid items-end gap-10 lg:grid-cols-[1fr_auto]">
            <div className="max-w-2xl">
              <p className="luxury-eyebrow text-domify-soft-gold">Votre projet, notre expertise</p>
              <h3 className="mt-4 font-display text-4xl font-semibold leading-[1.04] tracking-[-0.04em] sm:text-6xl">{dict.home.valuationTitle}</h3>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/72 sm:text-lg">{dict.home.valuationSubtitle}</p>
            </div>
            <Link href="/estimation" className="group inline-flex w-fit items-center gap-2 rounded-full bg-domify-gold px-5 py-3 text-sm font-semibold text-white transition-luxury hover:-translate-y-0.5 hover:bg-domify-soft-gold hover:text-domify-primary-dark">{dict.home.valuationCta}<ArrowUpRight size={16} /></Link>
          </div>
        </FadeIn>
      </section>

      {testimonials.length > 0 && (
        <section className="border-t border-domify-dark/8 bg-[#fcfbf8]">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
            <FadeIn className="mb-10">
              <p className="luxury-eyebrow text-domify-gold">Ils nous font confiance</p>
              <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-[-0.04em] text-domify-dark sm:text-6xl">Des projets accompagnés avec attention.</h2>
            </FadeIn>
            <StaggerReveal className="grid grid-cols-1 gap-5 lg:grid-cols-3" stagger={0.08}>
              {testimonials.map((testimonial) => (
                <MotionDiv key={testimonial.id} variants={staggerItem} className="rounded-[1.5rem] border border-domify-dark/8 bg-white p-7 shadow-[0_18px_42px_-34px_rgba(16,47,66,0.5)] sm:p-8">
                  <Quote className="text-domify-gold" size={27} strokeWidth={1.6} />
                  <p className="mt-6 font-display text-xl leading-8 text-domify-dark">{testimonial.quote}</p>
                  <p className="mt-6 text-sm font-semibold tracking-wide text-domify-primary">{testimonial.name}{testimonial.city ? ` · ${testimonial.city}` : ""}</p>
                </MotionDiv>
              ))}
            </StaggerReveal>
          </div>
        </section>
      )}
    </>
  );
}
