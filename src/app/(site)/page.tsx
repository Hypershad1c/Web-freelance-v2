import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ShieldCheck, Users, Sparkles, TrendingUp, Quote } from "lucide-react";
import { SearchBar } from "@/components/home/SearchBar";
import { PropertyCard } from "@/components/home/PropertyCard";
import { getFeaturedProperties } from "@/lib/data/properties";
import { getSeoOverride } from "@/lib/data/seo";
import { getSiteSettings } from "@/lib/data/settings";
import { JsonLd } from "@/components/JsonLd";
import { getLocale } from "@/i18n/get-locale";
import { getDictionary } from "@/i18n/get-dictionary";
import { Prisma } from "@prisma/client";
import { prisma, isPrismaReady } from "@/lib/prisma";
import { FadeIn, StaggerReveal, staggerItem } from "@/components/motion/FadeIn";
import { MotionDiv } from "@/components/motion/MotionPrimitives";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoOverride("/");
  if (!seo) return {};
  return {
    title: seo.title,
    description: seo.description,
    openGraph: seo.ogImage ? { images: [seo.ogImage] } : undefined,
  };
}

export default async function HomePage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  const featuredProperties = await getFeaturedProperties(4);
  const settings = await getSiteSettings();
  let testimonials: Array<{ id: string; name: string; quote: string; city?: string | null }> = [];

  if (await isPrismaReady()) {
    try {
      testimonials = await prisma.testimonial.findMany({
        where: { published: true },
        orderBy: { createdAt: "desc" },
        take: 3,
      });
    } catch (error) {
      if ((error as Prisma.PrismaClientKnownRequestError)?.code !== "P2021") {
        throw error;
      }
    }
  }

  const TRUST = [
    { icon: ShieldCheck, title: dict.home.trust1Title, desc: dict.home.trust1Desc },
    { icon: Users, title: dict.home.trust2Title, desc: dict.home.trust2Desc },
    { icon: Sparkles, title: dict.home.trust3Title, desc: dict.home.trust3Desc },
    { icon: TrendingUp, title: dict.home.trust4Title, desc: dict.home.trust4Desc },
  ];

  const WHY_US = [
    { title: dict.home.why1Title, desc: dict.home.why1Desc },
    { title: dict.home.why2Title, desc: dict.home.why2Desc },
    { title: dict.home.why3Title, desc: dict.home.why3Desc },
    { title: dict.home.why4Title, desc: dict.home.why4Desc },
  ];

  const baseUrl = process.env.NEXTAUTH_URL || "https://domify.ma";
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: settings.site_name,
    description: settings.site_tagline,
    url: baseUrl,
    logo: `${baseUrl}/Logo.jpeg`,
    telephone: settings.contact_phone,
    email: settings.contact_email,
    address: { "@type": "PostalAddress", streetAddress: settings.contact_address, addressCountry: "MA" },
    sameAs: [settings.social_facebook, settings.social_instagram, settings.social_linkedin].filter(Boolean),
  };

  return (
    <>
      <JsonLd data={organizationJsonLd} />
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="relative h-[520px] w-full sm:h-[600px]">
          <MotionDiv
            className="absolute inset-0"
            initial={{ scale: 1.08, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.1, ease: [0.25, 0.8, 0.25, 1] }}
          >
            <Image
              src="https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1920&auto=format&fit=crop"
              alt="Villa moderne au Maroc"
              fill
              priority
              className="object-cover"
            />
          </MotionDiv>
          <div className="absolute inset-0 bg-gradient-to-r from-domify-dark/80 via-domify-dark/50 to-transparent" />

          {/* Anchored to the bottom with reserved padding so the overlapping
              search bar below never collides with the headline/subtitle */}
          <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-24 sm:px-6 sm:pb-28 lg:px-8">
            <MotionDiv
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.8, 0.25, 1] }}
            >
              <h1 className="max-w-xl font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
                {dict.home.heroTitle1} <span className="text-domify-soft-gold">{dict.home.heroTitleHighlight}</span> {dict.home.heroTitle2}
              </h1>
              <p className="mt-4 max-w-md text-white/80">{dict.home.heroSubtitle}</p>
            </MotionDiv>
          </div>
        </div>

        {/* Responsive overlap: smaller pull-up on mobile, larger on desktop */}
        <MotionDiv
          className="relative z-10 mx-auto -mt-10 max-w-6xl px-4 sm:-mt-14 sm:px-6 lg:px-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: [0.25, 0.8, 0.25, 1] }}
        >
          <SearchBar />
        </MotionDiv>
      </section>

      {/* TRUST BADGES */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <StaggerReveal className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {TRUST.map((t) => (
            <MotionDiv key={t.title} variants={staggerItem} className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-domify-warm-white text-domify-gold">
                <t.icon size={20} />
              </span>
              <div>
                <p className="font-semibold text-domify-dark">{t.title}</p>
                <p className="text-sm text-domify-dark/60">{t.desc}</p>
              </div>
            </MotionDiv>
          ))}
        </StaggerReveal>
      </section>

      {/* FEATURED PROPERTIES */}
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <FadeIn className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold text-domify-dark sm:text-3xl">{dict.home.featuredTitle}</h2>
          <Link href="/proprietes" className="text-sm font-semibold text-domify-primary hover:text-domify-gold transition-luxury">
            {dict.home.seeAll}
          </Link>
        </FadeIn>
        {featuredProperties.length === 0 ? (
          <p className="rounded-2xl bg-domify-warm-white p-10 text-center text-domify-dark/60">{dict.home.noFeatured}</p>
        ) : (
          <StaggerReveal className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
            {featuredProperties.map((p) => (
              <MotionDiv key={p.id} variants={staggerItem}>
                <PropertyCard property={p} />
              </MotionDiv>
            ))}
          </StaggerReveal>
        )}
      </section>

      {/* VALUATION CTA */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <FadeIn className="relative overflow-hidden rounded-3xl bg-domify-primary-dark px-8 py-14 text-white sm:px-14">
          <div className="max-w-lg">
            <h3 className="font-display text-2xl font-bold sm:text-3xl">{dict.home.valuationTitle}</h3>
            <p className="mt-3 text-white/70">{dict.home.valuationSubtitle}</p>
            <Link
              href="/estimation"
              className="mt-6 inline-block rounded-full bg-domify-gold px-6 py-3 text-sm font-semibold text-white shadow-luxury transition-luxury hover:bg-domify-soft-gold hover:text-domify-dark"
            >
              {dict.home.valuationCta}
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* WHY CHOOSE US */}
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <FadeIn>
          <h2 className="mb-8 font-display text-2xl font-bold text-domify-dark sm:text-3xl">{dict.home.whyUsTitle}</h2>
        </FadeIn>
        <StaggerReveal className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_US.map((f) => (
            <MotionDiv key={f.title} variants={staggerItem}>
              <p className="font-display text-lg font-semibold text-domify-dark">{f.title}</p>
              <p className="mt-1 text-sm text-domify-dark/60">{f.desc}</p>
            </MotionDiv>
          ))}
        </StaggerReveal>
      </section>

      {/* TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <StaggerReveal className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <MotionDiv key={t.id} variants={staggerItem} className="rounded-3xl bg-domify-warm-white p-8">
                <Quote className="text-domify-gold" size={24} />
                <p className="mt-4 font-display text-lg text-domify-dark">{t.quote}</p>
                <p className="mt-4 text-sm font-semibold text-domify-primary">
                  — {t.name}{t.city ? `, ${t.city}` : ""}
                </p>
              </MotionDiv>
            ))}
          </StaggerReveal>
        </section>
      )}
    </>
  );
}