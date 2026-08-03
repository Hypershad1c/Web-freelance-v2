import type { Metadata } from "next";
import { ShieldCheck, Users, Sparkles, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "À propos | Domify",
  description: "Domify — la plateforme immobilière premium au Maroc. Découvrez notre mission, nos valeurs et notre équipe.",
};

const VALUES = [
  { icon: ShieldCheck, title: "Confiance", desc: "Chaque bien publié sur Domify est vérifié par notre équipe avant sa mise en ligne." },
  { icon: Users, title: "Accompagnement", desc: "Un conseiller dédié vous suit de la première visite jusqu'à la signature." },
  { icon: Sparkles, title: "Exigence", desc: "Une sélection rigoureuse de biens d'exception, pensée pour un usage premium." },
  { icon: TrendingUp, title: "Expertise locale", desc: "Une connaissance fine du marché immobilier marocain, ville par ville." },
];

export default async function AboutPage() {
  const [propertiesCount, citiesCount, agenciesCount] = await Promise.all([
    prisma.property.count({ where: { status: "PUBLISHED" } }),
    prisma.city.count(),
    prisma.agency.count(),
  ]);

  const stats = [
    { value: `${propertiesCount}+`, label: "Biens publiés" },
    { value: `${citiesCount}+`, label: "Villes couvertes" },
    { value: `${agenciesCount}+`, label: "Agences partenaires" },
    { value: "98%", label: "Clients satisfaits" },
  ];

  return (
    <div>
      <section className="bg-domify-primary-dark py-20 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-bold sm:text-5xl">
            Find Your <span className="text-domify-soft-gold">Perfect Place</span>
          </h1>
          <p className="mt-5 text-lg text-white/70">
            Domify est la plateforme immobilière premium au Maroc, pensée pour celles et ceux qui recherchent
            l&apos;exception — que ce soit pour acheter, louer ou investir.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-3xl font-bold text-domify-primary sm:text-4xl">{s.value}</p>
              <p className="mt-1 text-sm text-domify-dark/60">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-bold text-domify-dark sm:text-3xl">Notre mission</h2>
        <p className="mt-4 leading-relaxed text-domify-dark/70">
          Fondée avec la conviction que l&apos;immobilier de qualité mérite une expérience à la hauteur, Domify
          réunit les plus belles propriétés du Maroc — villas contemporaines, appartements de standing, riads de
          charme — au sein d&apos;une plateforme unique, pensée pour l&apos;exigence de nos clients.
        </p>
        <p className="mt-4 leading-relaxed text-domify-dark/70">
          Nous travaillons main dans la main avec un réseau d&apos;agences et d&apos;agents sélectionnés pour leur
          expertise locale, afin de vous accompagner à chaque étape de votre projet, de la première visite à la
          signature.
        </p>
      </section>

      <section className="bg-domify-warm-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center font-display text-2xl font-bold text-domify-dark sm:text-3xl">
            Nos valeurs
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div key={v.title} className="text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-domify-gold shadow-luxury">
                  <v.icon size={20} />
                </span>
                <p className="mt-4 font-display text-lg font-semibold text-domify-dark">{v.title}</p>
                <p className="mt-1 text-sm text-domify-dark/60">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
