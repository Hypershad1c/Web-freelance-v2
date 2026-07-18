import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Users, Sparkles, TrendingUp, Quote } from "lucide-react";
import { SearchBar } from "@/components/home/SearchBar";
import { PropertyCard } from "@/components/home/PropertyCard";
import { featuredProperties } from "@/lib/mock-data";

const TRUST = [
  { icon: ShieldCheck, title: "Biens vérifiés", desc: "Sélection rigoureuse" },
  { icon: Users, title: "Accompagnement", desc: "Expert à vos côtés" },
  { icon: Sparkles, title: "Service premium", desc: "Expérience sur-mesure" },
  { icon: TrendingUp, title: "Investissement sûr", desc: "Achetez en confiance" },
];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="relative h-[560px] w-full sm:h-[620px]">
          <Image
            src="https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1920&auto=format&fit=crop"
            alt="Villa moderne au Maroc"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-domify-dark/80 via-domify-dark/50 to-transparent" />

          <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-center px-4 sm:px-6 lg:px-8">
            <h1 className="max-w-xl font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
              Trouvez votre <span className="text-domify-soft-gold">bien d&apos;exception</span> au Maroc
            </h1>
            <p className="mt-4 max-w-md text-white/80">
              Maisons, appartements, villas et terrains sélectionnés avec soin pour vous.
            </p>
          </div>
        </div>

        <div className="mx-auto -mt-14 max-w-6xl px-4 sm:px-6 lg:px-8">
          <SearchBar />
        </div>
      </section>

      {/* TRUST BADGES */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {TRUST.map((t) => (
            <div key={t.title} className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-domify-warm-white text-domify-gold">
                <t.icon size={20} />
              </span>
              <div>
                <p className="font-semibold text-domify-dark">{t.title}</p>
                <p className="text-sm text-domify-dark/60">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED PROPERTIES */}
      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold text-domify-dark sm:text-3xl">Biens à la une</h2>
          <Link href="/proprietes" className="text-sm font-semibold text-domify-primary hover:text-domify-gold transition-luxury">
            Voir tous les biens →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProperties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      </section>

      {/* VALUATION CTA */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-domify-primary-dark px-8 py-14 text-white sm:px-14">
          <div className="max-w-lg">
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

      {/* WHY CHOOSE US */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <h2 className="mb-8 font-display text-2xl font-bold text-domify-dark sm:text-3xl">Pourquoi choisir Domify ?</h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Expertise locale", desc: "Parfaite connaissance du marché marocain" },
            { title: "Large sélection", desc: "Des biens exclusifs et vérifiés" },
            { title: "Transparence", desc: "Des informations claires et détaillées" },
            { title: "Disponibilité", desc: "Une équipe à votre écoute 7j/7" },
          ].map((f) => (
            <div key={f.title}>
              <p className="font-display text-lg font-semibold text-domify-dark">{f.title}</p>
              <p className="mt-1 text-sm text-domify-dark/60">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-domify-warm-white p-10 sm:p-14">
          <Quote className="text-domify-gold" size={28} />
          <p className="mt-4 max-w-2xl font-display text-xl text-domify-dark">
            Grâce à Domify, j&apos;ai trouvé la maison de mes rêves. Service professionnel et réactif.
          </p>
          <p className="mt-4 text-sm font-semibold text-domify-primary">— Sara, Casablanca</p>
        </div>
      </section>
    </>
  );
}
