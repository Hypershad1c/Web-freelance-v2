"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Minus, ShieldCheck, Sparkles, X } from "lucide-react";
import { useCompare } from "@/lib/compare-context";
import { formatMAD } from "@/lib/utils";
import type { PropertyWithRelations } from "@/lib/data/properties";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop";

export default function ComparePage() {
  const { compareIds, toggleCompare, clearCompare } = useCompare();
  const [properties, setProperties] = useState<PropertyWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (compareIds.length === 0) { setProperties([]); setLoading(false); return; }
    setLoading(true);
    fetch(`/api/properties?ids=${compareIds.join(",")}`).then((res) => res.json()).then((data: PropertyWithRelations[]) => setProperties(compareIds.map((id) => data.find((p) => p.id === id)).filter(Boolean) as PropertyWithRelations[])).catch(() => setProperties([])).finally(() => setLoading(false));
  }, [compareIds]);

  const allAmenities = useMemo(() => Array.from(new Set(properties.flatMap((p) => p.amenities.map((a) => a.name)))).sort(), [properties]);
  const bestValue = properties.length ? properties.reduce((best, current) => current.surfaceArea / Math.max(current.price, 1) > best.surfaceArea / Math.max(best.price, 1) ? current : best, properties[0]) : null;

  return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
    <section className="relative overflow-hidden rounded-[2rem] bg-domify-primary px-6 py-10 text-white shadow-luxury sm:px-10"><div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full border border-white/15" /><div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="luxury-eyebrow text-domify-gold">Décision éclairée</p><h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Comparer les biens</h1><p className="mt-3 max-w-xl text-sm leading-6 text-white/70">Mettez côte à côte vos adresses préférées et identifiez rapidement celle qui correspond le mieux à votre projet.</p></div>{properties.length > 0 && <button onClick={clearCompare} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/75 transition-colors hover:bg-white/10 hover:text-white">Tout effacer</button>}</div></section>

    {loading ? <p className="mt-10 rounded-2xl bg-domify-warm-white p-10 text-center text-domify-dark/60">Chargement...</p> : properties.length === 0 ? <div className="mt-10 rounded-[1.5rem] bg-domify-warm-white p-16 text-center"><Sparkles className="mx-auto text-domify-gold" size={28} /><p className="mt-4 text-domify-dark/60">Sélectionnez jusqu&apos;à 4 biens depuis les listes pour créer votre shortlist.</p><Link href="/proprietes" className="mt-5 inline-flex items-center gap-2 rounded-full bg-domify-primary px-6 py-2.5 text-sm font-semibold text-white">Parcourir les biens <ArrowRight size={15} /></Link></div> : <>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3"><SummaryCard label="Sélection" value={`${properties.length} bien${properties.length > 1 ? "s" : ""}`} detail="Votre shortlist active" /><SummaryCard label="Meilleur ratio surface/prix" value={bestValue ? bestValue.title.slice(0, 22) : "—"} detail={bestValue ? `${Math.round(bestValue.surfaceArea / Math.max(bestValue.price, 1) * 1000000)} m² / M MAD` : "Analyse en cours"} /><SummaryCard label="Confiance Domify" value="Sélection vérifiée" detail="Données comparées côte à côte" icon={<ShieldCheck size={18} />} /></div>
      <div className="mt-8 overflow-x-auto rounded-[1.5rem] border border-domify-dark/8 bg-white shadow-[0_20px_50px_-40px_rgba(16,47,66,0.45)]"><table className="w-full min-w-[760px] border-separate border-spacing-0"><thead><tr><th className="w-44 p-4 text-left text-[0.62rem] uppercase tracking-[0.14em] text-domify-dark/40">Critères</th>{properties.map((p) => <th key={p.id} className="p-4 text-left align-top"><div className="relative overflow-hidden rounded-2xl"><button onClick={() => toggleCompare(p.id)} className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-domify-dark hover:bg-domify-gold hover:text-white" aria-label="Retirer"><X size={13} /></button><div className="relative h-36 w-full"><Image src={p.media[0]?.url ?? FALLBACK_IMAGE} alt={p.title} fill className="object-cover" /></div></div><Link href={`/proprietes/${p.id}`} className="mt-3 block font-display text-sm font-semibold text-domify-dark hover:text-domify-primary">{p.title}</Link><p className="mt-1 text-sm font-bold text-domify-gold">{formatMAD(p.price)}</p><p className="mt-2 text-xs text-domify-dark/50">{p.city.name} · {p.propertyType.name}</p></th>)}</tr></thead><tbody><Row label="Transaction" values={properties.map((p) => p.listingType === "LOCATION" ? "Location" : "Vente")} /><Row label="Surface" values={properties.map((p) => `${p.surfaceArea} m²`)} /><Row label="Chambres" values={properties.map((p) => String(p.bedrooms))} /><Row label="Salles de bain" values={properties.map((p) => String(p.bathrooms))} /><Row label="Quartier" values={properties.map((p) => p.neighborhood?.name ?? "—")} /><Row label="Agence" values={properties.map((p) => p.agency?.name ?? "—")} /><Row label="Statut de vérification" values={properties.map(() => "Dossier Domify")}/>{allAmenities.map((amenity) => <tr key={amenity} className="border-t border-black/5"><td className="p-4 text-sm font-medium text-domify-dark/70">{amenity}</td>{properties.map((p) => <td key={p.id} className="p-4 text-center">{p.amenities.some((a) => a.name === amenity) ? <Check size={16} className="mx-auto text-domify-primary" /> : <Minus size={16} className="mx-auto text-domify-dark/20" />}</td>)}</tr>)}</tbody></table></div>
    </>}
  </div>;
}

function SummaryCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon?: React.ReactNode }) { return <div className="rounded-2xl border border-domify-dark/8 bg-domify-warm-white p-5"><div className="flex items-center justify-between"><p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-domify-dark/45">{label}</p><span className="text-domify-gold">{icon}</span></div><p className="mt-3 truncate font-display text-xl font-semibold text-domify-dark">{value}</p><p className="mt-1 text-xs text-domify-dark/55">{detail}</p></div>; }
function Row({ label, values }: { label: string; values: string[] }) { return <tr className="border-t border-black/5"><td className="p-4 text-sm font-medium text-domify-dark/70">{label}</td>{values.map((value, index) => <td key={index} className="p-4 text-sm text-domify-dark">{value}</td>)}</tr>; }
