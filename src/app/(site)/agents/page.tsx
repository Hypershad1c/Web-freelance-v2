import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Building2, UserRound } from "lucide-react";
import { getAgents } from "@/lib/data/network";
import { FadeIn, StaggerReveal, staggerItem } from "@/components/motion/FadeIn";
import { MotionDiv } from "@/components/motion/MotionPrimitives";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Nos conseillers immobiliers | Domify",
  description: "Rencontrez les conseillers Domify qui vous accompagnent dans votre projet immobilier au Maroc.",
};

export default async function AgentsPage() {
  const agents = await getAgents();

  return (
    <>
      <section className="relative overflow-hidden border-b border-domify-dark/8 bg-domify-warm-white/80">
        <div className="pointer-events-none absolute -right-16 top-[-9rem] h-80 w-80 rounded-full border border-domify-gold/25" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <FadeIn className="max-w-2xl">
            <p className="luxury-eyebrow flex items-center gap-3 text-domify-gold"><span className="h-px w-8 bg-domify-gold" /> Expertise Domify</p>
            <h1 className="mt-4 font-display text-5xl font-semibold text-domify-dark sm:text-6xl">Nos conseillers</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-domify-dark/62 sm:text-lg">Des interlocuteurs engagés, à l&apos;écoute de vos critères et présents à chaque étape de votre projet.</p>
          </FadeIn>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {agents.length === 0 ? (
          <div className="rounded-[1.6rem] border border-domify-dark/8 bg-domify-warm-white p-10 text-center sm:p-14">
            <UserRound className="mx-auto text-domify-gold" size={30} strokeWidth={1.6} />
            <h2 className="mt-5 font-display text-2xl font-semibold text-domify-dark">Notre équipe se présente bientôt</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-domify-dark/60">En attendant, envoyez-nous votre projet et nous vous mettrons en relation avec le bon conseiller.</p>
            <Link href="/contact" className="pressable mt-6 inline-flex rounded-full bg-domify-primary px-5 py-3 text-sm font-semibold text-white hover:bg-domify-primary-dark">Parler à Domify</Link>
          </div>
        ) : (
          <StaggerReveal className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.06}>
            {agents.map((agent) => (
              <MotionDiv key={agent.id} variants={staggerItem}>
                <Link href={`/agents/${agent.slug}`} className="group flex h-full flex-col rounded-[1.45rem] border border-domify-dark/8 bg-white p-6 shadow-[0_18px_38px_-30px_rgba(16,47,66,0.38)] transition-luxury hover:-translate-y-1 hover:border-domify-gold/35 hover:shadow-[0_26px_46px_-30px_rgba(16,47,66,0.42)]">
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-domify-warm-white text-domify-primary ring-1 ring-domify-gold/12">
                      {agent.photo ? <Image src={agent.photo} alt={agent.name} fill className="object-cover" /> : <UserRound size={26} strokeWidth={1.6} />}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-2xl font-semibold text-domify-dark transition-colors duration-200 group-hover:text-domify-primary">{agent.name}</h2>
                      {agent.agency && <p className="mt-1 flex items-center gap-1.5 text-sm text-domify-dark/56"><Building2 size={14} className="text-domify-gold" /> <span className="truncate">{agent.agency.name}</span></p>}
                    </div>
                  </div>
                  <p className="mt-6 line-clamp-3 text-sm leading-6 text-domify-dark/60">{agent.bio || `Découvrez l’accompagnement personnalisé proposé par ${agent.name} pour votre projet immobilier.`}</p>
                  <div className="mt-auto flex items-center justify-between border-t border-domify-dark/8 pt-5 text-sm font-semibold text-domify-primary">
                    <span>{agent._count.properties} bien(s) publié(s)</span>
                    <span className="inline-flex items-center gap-1.5 text-domify-gold">Voir le profil <ArrowUpRight size={15} className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
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
