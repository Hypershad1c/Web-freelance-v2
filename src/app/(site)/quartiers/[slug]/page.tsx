import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MapPinned } from "lucide-react";
import { notFound } from "next/navigation";
import { getNeighborhoodBySlug } from "@/lib/data/network";
import { getProperties } from "@/lib/data/properties";
import { PropertyCard } from "@/components/home/PropertyCard";
import { FadeIn, StaggerReveal, staggerItem } from "@/components/motion/FadeIn";
import { MotionDiv } from "@/components/motion/MotionPrimitives";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const neighborhood = await getNeighborhoodBySlug(slug);
  if (!neighborhood) return {};

  return {
    title: `Immobilier à ${neighborhood.name}, ${neighborhood.city.name} | Domify`,
    description: neighborhood.description || `Découvrez les propriétés à vendre et à louer à ${neighborhood.name}, ${neighborhood.city.name}.`,
  };
}

export default async function NeighborhoodDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const neighborhood = await getNeighborhoodBySlug(slug);
  if (!neighborhood) notFound();

  const properties = await getProperties({ neighborhood: slug });

  return (
    <>
      <section className="relative overflow-hidden border-b border-domify-dark/8 bg-domify-warm-white/80">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border border-domify-gold/25" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <FadeIn className="max-w-3xl">
            <Link href="/quartiers" className="pressable inline-flex items-center gap-2 rounded-full text-sm font-semibold text-domify-primary hover:text-domify-gold">
              <ArrowLeft size={16} /> Tous les quartiers
            </Link>
            <p className="luxury-eyebrow mt-8 flex items-center gap-3 text-domify-gold"><span className="h-px w-8 bg-domify-gold" /> {neighborhood.city.name}</p>
            <h1 className="mt-4 font-display text-5xl font-semibold text-domify-dark sm:text-6xl">{neighborhood.name}</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-domify-dark/62 sm:text-lg">{neighborhood.description || `Découvrez une sélection de propriétés et le cadre de vie de ${neighborhood.name}.`}</p>
          </FadeIn>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-8 flex flex-col gap-3 border-b border-domify-dark/8 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.15em] text-domify-gold">Collection locale</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-domify-dark">Biens à {neighborhood.name}</h2>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-domify-warm-white px-4 py-2 text-sm font-semibold text-domify-primary"><MapPinned size={15} /> {properties.length} bien(s)</span>
        </div>

        {properties.length === 0 ? (
          <div className="rounded-[1.5rem] border border-domify-dark/8 bg-domify-warm-white p-10 text-center sm:p-14">
            <p className="font-display text-2xl font-semibold text-domify-dark">Aucun bien publié pour le moment.</p>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-domify-dark/60">Élargissez votre recherche pour découvrir d&apos;autres opportunités dans {neighborhood.city.name}.</p>
            <Link href={`/proprietes?city=${neighborhood.city.slug}`} className="pressable mt-6 inline-flex rounded-full border border-domify-primary/20 px-5 py-3 text-sm font-semibold text-domify-primary hover:border-domify-primary hover:bg-domify-primary hover:text-white">Voir les biens à {neighborhood.city.name}</Link>
          </div>
        ) : (
          <StaggerReveal className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3" stagger={0.06}>
            {properties.map((property) => (
              <MotionDiv key={property.id} variants={staggerItem}>
                <PropertyCard property={property} />
              </MotionDiv>
            ))}
          </StaggerReveal>
        )}
      </main>
    </>
  );
}
