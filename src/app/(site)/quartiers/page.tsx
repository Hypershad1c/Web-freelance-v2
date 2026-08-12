import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, MapPinned } from "lucide-react";
import { getNeighborhoods } from "@/lib/data/network";
import { FadeIn, StaggerReveal, staggerItem } from "@/components/motion/FadeIn";
import { MotionDiv } from "@/components/motion/MotionPrimitives";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Quartiers du Maroc | Domify",
  description: "Explorez les quartiers recherchés et les biens immobiliers sélectionnés par Domify au Maroc.",
};

export default async function NeighborhoodsPage() {
  const neighborhoods = await getNeighborhoods();

  return (
    <>
      <section className="relative overflow-hidden border-b border-domify-dark/8 bg-domify-warm-white/80">
        <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full border border-domify-gold/25" />
        <div className="pointer-events-none absolute bottom-[-7rem] left-[11%] h-48 w-48 rounded-full bg-domify-soft-gold/15 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <FadeIn className="max-w-2xl">
            <p className="luxury-eyebrow flex items-center gap-3 text-domify-gold"><span className="h-px w-8 bg-domify-gold" /> Guide Domify</p>
            <h1 className="mt-4 font-display text-5xl font-semibold text-domify-dark sm:text-6xl">Explorez les quartiers</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-domify-dark/62 sm:text-lg">Découvrez les adresses, atmosphères et opportunités qui correspondent à votre projet immobilier.</p>
          </FadeIn>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {neighborhoods.length === 0 ? (
          <div className="relative overflow-hidden rounded-[1.6rem] border border-domify-dark/8 bg-domify-warm-white p-10 text-center sm:p-14">
            <MapPinned className="mx-auto text-domify-gold" size={30} strokeWidth={1.6} />
            <h2 className="mt-5 font-display text-2xl font-semibold text-domify-dark">Les quartiers arrivent bientôt</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-domify-dark/60">Notre équipe enrichit actuellement le guide des quartiers. Vous pouvez déjà parcourir les propriétés disponibles.</p>
            <Link href="/proprietes" className="pressable mt-6 inline-flex items-center gap-2 rounded-full bg-domify-primary px-5 py-3 text-sm font-semibold text-white hover:bg-domify-primary-dark">
              Voir les propriétés <ArrowUpRight size={16} />
            </Link>
          </div>
        ) : (
          <StaggerReveal className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.06}>
            {neighborhoods.map((neighborhood) => (
              <MotionDiv key={neighborhood.id} variants={staggerItem}>
                <Link href={`/quartiers/${neighborhood.slug}`} className="group block h-full rounded-[1.45rem] border border-domify-dark/8 bg-white p-6 shadow-[0_18px_38px_-30px_rgba(16,47,66,0.38)] transition-luxury hover:-translate-y-1 hover:border-domify-gold/35 hover:shadow-[0_26px_46px_-30px_rgba(16,47,66,0.42)]">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-domify-warm-white text-domify-gold transition-luxury group-hover:bg-domify-primary group-hover:text-domify-soft-gold">
                    <MapPinned size={20} strokeWidth={1.7} />
                  </span>
                  <p className="mt-6 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-domify-primary/70">{neighborhood.city.name}</p>
                  <h2 className="mt-2 font-display text-2xl font-semibold text-domify-dark transition-colors duration-200 group-hover:text-domify-primary">{neighborhood.name}</h2>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-domify-dark/60">{neighborhood.description || `Explorez les biens et opportunités à ${neighborhood.name}, ${neighborhood.city.name}.`}</p>
                  <div className="mt-6 flex items-center justify-between border-t border-domify-dark/8 pt-4 text-sm font-semibold text-domify-primary">
                    <span>{neighborhood._count.properties} bien(s)</span>
                    <span className="inline-flex items-center gap-1.5 text-domify-gold">Découvrir <ArrowUpRight size={15} className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
                  </div>
                </Link>
              </MotionDiv>
            ))}
          </StaggerReveal>
        )}
      </main>
    </>
  );
}
