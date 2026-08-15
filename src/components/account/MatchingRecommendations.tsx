"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Heart, LoaderCircle, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export function MatchingRecommendations() {
  const [data, setData] = useState<{ recommendations: Array<{ property: { id: string; title: string; reference: string; price: number; surfaceArea: number; bedrooms: number; listingType: string; city: { name: string }; propertyType: { name: string }; media: Array<{ url: string; alt: string | null }> }; score: number; matchedSearch: string }>; matchedSearchCount: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/matching/recommendations", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((result) => setData(result))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <section className="mt-10 rounded-[1.5rem] bg-domify-primary-dark p-6 text-white"><div className="flex items-center gap-2 text-sm text-white/70"><LoaderCircle size={16} className="animate-spin" /> Analyse de vos préférences…</div></section>;
  if (!data || data.recommendations.length === 0) return <section className="mt-10 rounded-[1.5rem] bg-domify-warm-white p-6 sm:p-7"><div className="flex items-start gap-3"><Sparkles className="mt-0.5 shrink-0 text-domify-gold" size={20} /><div><h2 className="font-display text-2xl font-semibold text-domify-dark">Vos recommandations personnalisées</h2><p className="mt-2 max-w-xl text-sm leading-6 text-domify-dark/60">Créez une alerte de recherche avec une ville, un type de bien et un budget pour recevoir des propositions plus précises.</p><Link href="#alertes" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-domify-primary hover:text-domify-gold">Créer une alerte <ArrowUpRight size={15} /></Link></div></div></section>;

  return <section className="mt-10 rounded-[1.5rem] bg-domify-primary-dark p-6 text-white sm:p-7"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="luxury-eyebrow text-domify-soft-gold">Sélection personnalisée</p><h2 className="mt-2 font-display text-3xl font-semibold">Des biens alignés sur votre projet.</h2><p className="mt-2 text-sm text-white/65">{data.recommendations.length} recommandation(s) à partir de {data.matchedSearchCount} alerte(s) active(s).</p></div><Link href="/proprietes" className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">Tout explorer <ArrowUpRight size={15} /></Link></div><div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.recommendations.map((item) => <article key={item.property.id} className="overflow-hidden rounded-2xl bg-white text-domify-dark shadow-[0_20px_45px_-30px_rgba(0,0,0,0.55)]"><div className="relative aspect-[1.35/1] bg-domify-warm-white">{item.property.media[0] ? <Image src={item.property.media[0].url} alt={item.property.media[0].alt || item.property.title} fill unoptimized className="object-cover" /> : <div className="flex h-full items-center justify-center text-domify-gold"><Heart size={28} /></div>}<span className="absolute left-3 top-3 rounded-full bg-domify-primary-dark/85 px-2.5 py-1 text-[0.68rem] font-bold text-white">{item.score}% correspondant</span></div><div className="p-4"><p className="text-[0.68rem] font-bold uppercase tracking-[0.13em] text-domify-gold">{item.matchedSearch}</p><h3 className="mt-2 line-clamp-2 font-display text-xl font-semibold">{item.property.title}</h3><p className="mt-2 text-xs text-domify-dark/55">{item.property.city.name} · {item.property.propertyType.name} · {item.property.bedrooms} ch. · {item.property.surfaceArea} m²</p><div className="mt-4 flex items-center justify-between gap-3"><span className="font-semibold text-domify-primary">{new Intl.NumberFormat("fr-MA").format(item.property.price)} MAD</span><Link href={`/proprietes/${item.property.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-domify-primary hover:text-domify-gold">Voir <ArrowUpRight size={15} /></Link></div></div></article>)}</div></section>;
}
