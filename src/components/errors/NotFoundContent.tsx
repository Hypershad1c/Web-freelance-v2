import { ArrowLeft, ArrowRight, Home, MapPin, MessageCircle, Search } from "lucide-react";
import Link from "next/link";
import type { Dictionary } from "@/i18n/get-dictionary";

export function NotFoundContent({ copy, mapLabel, rtl }: { copy: Dictionary["notFound"]; mapLabel: string; rtl: boolean }) {
  const DirectionArrow = rtl ? ArrowLeft : ArrowRight;

  return (
    <section
      aria-labelledby="not-found-title"
      className="relative isolate flex min-h-screen items-center overflow-hidden bg-domify-primary-dark px-4 py-16 text-white sm:px-6 lg:px-8"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute -start-40 -top-44 h-[30rem] w-[30rem] rounded-full border border-white/10 bg-domify-primary/25 blur-3xl" />
        <div className="absolute -end-32 bottom-[-14rem] h-[32rem] w-[32rem] rounded-full border border-domify-soft-gold/20 bg-domify-gold/15 blur-3xl" />
        <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute inset-y-0 start-1/2 hidden w-px bg-white/10 lg:block" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
        <div className="relative text-center lg:text-start">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] border border-domify-soft-gold/40 bg-white/10 shadow-2xl shadow-black/20 backdrop-blur lg:mx-0">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-domify-soft-gold text-domify-primary-dark shadow-luxury">
              <Home size={30} strokeWidth={1.8} aria-hidden="true" />
            </div>
          </div>
          <p className="luxury-eyebrow mt-8 text-domify-soft-gold">{copy.eyebrow}</p>
          <p className="mt-3 font-display text-7xl font-semibold tracking-[-0.08em] text-white/95 sm:text-8xl">404</p>
          <div className="mx-auto mt-5 h-px w-20 bg-domify-soft-gold lg:mx-0" />
        </div>

        <div className="max-w-2xl text-center lg:text-start">
          <p className="luxury-eyebrow text-white/45">{copy.code}</p>
          <h1 id="not-found-title" className="mt-4 font-display text-4xl font-semibold leading-[1.06] text-white sm:text-5xl lg:text-6xl">
            {copy.title}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-white/68 sm:text-lg">{copy.description}</p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link
              href="/"
              className="pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-domify-soft-gold px-6 py-3 text-sm font-bold text-domify-primary-dark shadow-luxury hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-domify-soft-gold"
            >
              <Home size={17} aria-hidden="true" />
              {copy.homeCta}
            </Link>
            <Link
              href="/proprietes"
              className="pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:border-white/40 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-domify-soft-gold"
            >
              <Search size={17} aria-hidden="true" />
              {copy.searchCta}
              <DirectionArrow size={16} aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-white/52 lg:justify-start">
            <Link className="inline-flex items-center gap-2 transition-colors hover:text-domify-soft-gold" href="/contact">
              <MessageCircle size={16} aria-hidden="true" />
              {copy.contactCta}
            </Link>
            <Link className="inline-flex items-center gap-2 transition-colors hover:text-domify-soft-gold" href="/carte">
              <MapPin size={16} aria-hidden="true" />
              {mapLabel}
            </Link>
          </div>

          <Link href="/" className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-domify-soft-gold transition-colors hover:text-white">
            <ArrowLeft size={16} aria-hidden="true" className={rtl ? "rtl-mirror" : ""} />
            {copy.homeCta}
          </Link>
        </div>
      </div>
    </section>
  );
}
