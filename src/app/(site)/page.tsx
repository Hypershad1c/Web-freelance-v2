import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ShieldCheck, Users, Sparkles, TrendingUp, Quote } from "lucide-react";
import { SearchBar } from "@/components/home/SearchBar";
import { PropertyCard } from "@/components/home/PropertyCard";
import { getFeaturedProperties } from "@/lib/data/properties";
import { getSeoOverride } from "@/lib/data/seo";
import { prisma } from "@/lib/prisma";

const TRUST = [
  { icon: ShieldCheck, title: "Biens vérifiés", desc: "Sélection rigoureuse" },
  { icon: Users, title: "Accompagnement", desc: "Expert à vos côtés" },
  { icon: Sparkles, title: "Service premium", desc: "Expérience sur-mesure" },
  { icon: TrendingUp, title: "Investissement sûr", desc: "Achetez en confiance" },
];

// One spacing scale for the whole page: each section only carries top
// padding (pt-16 / sm:pt-24). Two adjacent sections then always add up to
// exactly one gap, never a doubled one. The first section after the hero
// gets extra clearance for the floating search card; the last section
// carries the bottom margin before the footer.
const SECTION = "mx-auto max-w-7xl px-4 pt-16 sm:px-6 sm:pt-24 lg:px-8";

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
  const featuredProperties = await getFeaturedProperties(4);
  const testimonials = await prisma.testimonial.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <>
      {/* HERO — sits under the fixed, transparent Header. -mt-20 cancels the
          global `pt-20` on <main> so the image reaches the very top of the
          viewport and the header stays truly see-through until scrolled. */}
      <section className="relative -mt-20 overflow-hidden">
        <div className="relative h-[620px] w-full sm:h-[680px]">
          <Image
            src="https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1920&auto=format&fit=crop"
            alt="Villa moderne au Maroc"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-domify-dark/80 via-domify-dark/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-domify-dark/60 via-transparent to-domify-dark/30" />

          <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-center px-4 pt-20 sm:px-6 lg:px-8">
            <span className="mb-4 w-fit rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/90 backdrop-blur">
              Trouvez · Visitez · Vivez
            </span>
            <h1 className="max-w-xl font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
              Trouvez votre <span className="text-domify-soft-gold">bien d&apos;exception</span> au Maroc
            </h1>
            <p className="mt-4 max-w-md text-white/80">
              Maisons, appartements, villas et terrains sélectionnés avec soin pour vous.
            </p>
          </div>
        </div>

        <div className="relative z-10 mx-auto -mt-14 max-w-6xl px-4 sm:px-6 lg:px-8">
          <SearchBar />
        </div>
      </section>

      {/* TRUST BADGES — extra top clearance below the floating search card */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 sm:pt-32 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:gap-8 lg:grid-cols-4">
          {TRUST.map((t) => (
            <div key={t.title} className="group flex items-start gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-domify-warm-white text-domify-gold transition-luxury group-hover:bg-domify-gold group-hover:text-white">
                <t.icon size={20} />
              </span>
              <div>
                <p className="font-semibold text-domify-dark">{t.title}</p>
                <p className="mt-0.5 text-sm text-domify-dark/60">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED PROPERTIES */}
      <section className={SECTION}>
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold text-domify-dark sm:text-3xl">Biens à la une</h2>
          <Link href="/proprietes" className="text-sm font-semibold text-domify-primary hover:text-domify-gold transition-luxury">
            Voir tous les biens →
          </Link>
        </div>
        {featuredProperties.length === 0 ? (
          <p className="rounded-2xl bg-domify-warm-white p-10 text-center text-domify-dark/60">
            Aucun bien mis en avant pour le moment. Ajoutez-en depuis l&apos;admin (Propriétés → cocher &laquo; Mis en avant &raquo;, statut Publié).
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProperties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </section>

      {/* VALUATION CTA */}
      <section className={SECTION}>
        <div className="relative overflow-hidden rounded-3xl bg-domify-primary-dark px-8 py-14 text-white sm:px-14 sm:py-16">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-domify-gold/20 blur-3xl"
            aria-hidden
          />
          <div className="relative max-w-lg">
            <h3 className="font-display text-2xl font-bold sm:text-3xl">Estimez la valeur de votre bien</h3>
            <p className="mt-3 text-white/70">
              Obtenez une estimation gratuite et fiable en quelques clics.
            </p>
            <Link
              href="/estimation"
              className="mt-6 inline-block rounded-full bg-domify-gold px-6 py-3 text-sm font-semibold text-white shadow-luxury transition-luxury hover:bg-domify-soft-gold hover:text-domify-dark"
            >
              Estimer mon bien
            </Link>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US — falls back to closing the page (pb-24/32) when there are no testimonials */}
      <section className={`${SECTION} ${testimonials.length === 0 ? "pb-24 sm:pb-32" : ""}`}>
        <h2 className="mb-8 font-display text-2xl font-bold text-domify-dark sm:text-3xl">Pourquoi choisir Domify ?</h2>
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Expertise locale", desc: "Parfaite connaissance du marché marocain" },
            { title: "Large sélection", desc: "Des biens exclusifs et vérifiés" },
            { title: "Transparence", desc: "Des informations claires et détaillées" },
            { title: "Disponibilité", desc: "Une équipe à votre écoute 7j/7" },
          ].map((f) => (
            <div key={f.title}>
              <p className="font-display text-lg font-semibold text-domify-dark">{f.title}</p>
              <p className="mt-1.5 text-sm text-domify-dark/60">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS — closes the page, so it also carries the bottom margin */}
      {testimonials.length > 0 && (
        <section className={`${SECTION} pb-24 sm:pb-32`}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.id} className="rounded-3xl bg-domify-warm-white p-8">
                <Quote className="text-domify-gold" size={24} />
                <p className="mt-4 font-display text-lg text-domify-dark">{t.quote}</p>
                <p className="mt-4 text-sm font-semibold text-domify-primary">
                  — {t.name}{t.city ? `, ${t.city}` : ""}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}