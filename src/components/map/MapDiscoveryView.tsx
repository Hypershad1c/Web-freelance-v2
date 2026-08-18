"use client";

import Image from "next/image";
import Link from "next/link";
import { Bed, Bath, ChevronRight, Heart, List, Map, Square, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { PropertyMapClient } from "@/components/map/PropertyMapClient";
import type { MapProperty } from "@/components/map/PropertyMap";
import { formatMAD } from "@/lib/utils";

export type DiscoveryProperty = MapProperty & {
  cityName: string;
  bedrooms: number;
  bathrooms: number;
  surfaceArea: number;
  image: string;
};

export function MapDiscoveryView({ properties }: { properties: DiscoveryProperty[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(properties[0]?.id ?? null);
  const [mobilePanel, setMobilePanel] = useState<"list" | "map">("list");
  const selectedIndex = Math.max(0, properties.findIndex((property) => property.id === selectedId));

  const selectProperty = (id: string) => {
    setSelectedId(id);
    setMobilePanel("list");
    window.requestAnimationFrame(() => document.getElementById(`map-result-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  };

  return (
    <div className="overflow-hidden rounded-[1.7rem] border border-domify-dark/8 bg-white shadow-[0_25px_60px_-40px_rgba(16,47,66,0.6)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-domify-dark/8 px-4 py-4 sm:px-5">
        <div><p className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-domify-gold">Exploration en direct</p><p className="mt-1 text-sm text-domify-dark/60"><span className="font-semibold text-domify-dark">{properties.length}</span> adresses géolocalisées</p></div>
        <div className="flex items-center gap-2"><div className="inline-flex rounded-full bg-domify-warm-white p-1 lg:hidden"><button type="button" onClick={() => setMobilePanel("list")} className={`pressable inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[11px] font-bold ${mobilePanel === "list" ? "bg-white text-domify-primary shadow-sm" : "text-domify-dark/48"}`}><List size={13} /> Liste</button><button type="button" onClick={() => setMobilePanel("map")} className={`pressable inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[11px] font-bold ${mobilePanel === "map" ? "bg-white text-domify-primary shadow-sm" : "text-domify-dark/48"}`}><Map size={13} /> Carte</button></div><span className="hidden items-center gap-1.5 rounded-full bg-domify-warm-white px-3 py-2 text-xs font-semibold text-domify-primary sm:inline-flex"><Map size={14} /> Carte interactive</span><Link href="/proprietes" className="pressable inline-flex items-center gap-1.5 rounded-full border border-domify-primary/15 px-3 py-2 text-xs font-semibold text-domify-primary transition-luxury hover:border-domify-gold hover:text-domify-gold"><SlidersHorizontal size={14} /> Filtres</Link></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_390px]">
        <div className={`order-2 min-h-[420px] lg:order-1 lg:block lg:min-h-[680px] ${mobilePanel === "map" ? "block" : "hidden"}`}><PropertyMapClient properties={properties} zoom={6} height={680} selectedId={selectedId} onSelect={selectProperty} /></div>
        <div className={`order-1 border-b border-domify-dark/8 bg-[#fcfbf8] lg:order-2 lg:block lg:max-h-[680px] lg:overflow-y-auto lg:border-b-0 lg:border-l ${mobilePanel === "list" ? "block" : "hidden"}`}>
          <div className="flex items-center justify-between px-4 py-3 text-xs font-semibold text-domify-dark/55 sm:px-5"><span>Résultats</span><span>{selectedIndex + 1} / {properties.length}</span></div>
          <div className="space-y-2 px-3 pb-3 sm:px-4 sm:pb-4">
            {properties.map((property) => {
              const active = selectedId === property.id;
              return <article id={`map-result-${property.id}`} key={property.id} className={`rounded-2xl border p-2 transition-luxury ${active ? "border-domify-gold/55 bg-white shadow-[0_14px_28px_-24px_rgba(16,47,66,0.7)]" : "border-transparent bg-white/55 hover:border-domify-dark/10 hover:bg-white"}`}>
                <button type="button" onClick={() => selectProperty(property.id)} className="flex w-full gap-3 text-left">
                  <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl"><Image src={property.image} alt={property.title} fill sizes="112px" className="object-cover transition-transform duration-500 group-hover:scale-105" /></div>
                  <span className="min-w-0 flex-1 py-1"><span className="flex items-start justify-between gap-2"><span className="line-clamp-2 text-sm font-semibold leading-5 text-domify-dark">{property.title}</span><Heart size={15} className="mt-0.5 shrink-0 text-domify-dark/25" /></span><span className="mt-1 block text-xs text-domify-dark/50">{property.cityName}</span><span className="mt-1.5 block text-sm font-bold text-domify-gold">{formatMAD(property.price)}{property.listingType === "LOCATION" && <small className="font-normal text-domify-dark/45"> /mois</small>}</span></span>
                </button>
                <div className="mt-2 flex items-center justify-between border-t border-domify-dark/6 px-1 pt-2"><div className="flex items-center gap-2 text-[11px] text-domify-dark/50"><span className="inline-flex items-center gap-1"><Bed size={11} />{property.bedrooms}</span><span className="inline-flex items-center gap-1"><Bath size={11} />{property.bathrooms}</span><span className="inline-flex items-center gap-1"><Square size={11} />{property.surfaceArea} m²</span></div><Link href={`/proprietes/${property.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-domify-primary hover:text-domify-gold">Détails <ChevronRight size={14} /></Link></div>
              </article>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
