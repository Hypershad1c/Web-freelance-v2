"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Images, Maximize2, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";

export function PropertyGallery({ images, title }: { images: string[]; title: string }) {
  const gallery = images.length > 0 ? images : ["/brand/domify-logo-horizontal.png"];
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [shareLabel, setShareLabel] = useState("Partager");

  const goTo = (index: number) => setActive((index + gallery.length) % gallery.length);
  const goNext = () => goTo(active + 1);
  const goPrevious = () => goTo(active - 1);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxOpen(false);
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goPrevious();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, active]);

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShareLabel("Lien copié");
        window.setTimeout(() => setShareLabel("Partager"), 1800);
      }
    } catch {
      // Sharing can be cancelled by the user; the gallery should remain usable.
    }
  };

  const handleTouchEnd = (endX: number) => {
    if (touchStart === null) return;
    const distance = endX - touchStart;
    if (Math.abs(distance) > 45) distance < 0 ? goNext() : goPrevious();
    setTouchStart(null);
  };

  return (
    <>
      <div className="group relative overflow-hidden rounded-[1.6rem] bg-domify-primary-dark shadow-[0_24px_55px_-34px_rgba(16,47,66,0.72)]">
        <div
          className="relative h-[320px] w-full sm:h-[460px] lg:h-[540px]"
          onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX ?? null)}
          onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
        >
          <Image src={gallery[active]} alt={`${title} — image ${active + 1}`} fill priority={active === 0} sizes="(max-width: 1024px) 100vw, 850px" className="object-cover transition-transform duration-700 group-hover:scale-[1.015]" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-domify-primary-dark/60 via-transparent to-domify-primary-dark/10" />
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/20 bg-domify-primary-dark/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
            <Images size={14} className="text-domify-soft-gold" />
            <span>{active + 1} / {gallery.length}</span>
          </div>
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <button type="button" onClick={share} className="pressable inline-flex h-10 items-center gap-2 rounded-full border border-white/20 bg-domify-primary-dark/60 px-3 text-xs font-semibold text-white backdrop-blur-md transition-luxury hover:bg-domify-primary" aria-label="Partager ce bien">
              <Share2 size={15} /> <span className="hidden sm:inline">{shareLabel}</span>
            </button>
            <button type="button" onClick={() => setLightboxOpen(true)} className="pressable inline-flex h-10 items-center gap-2 rounded-full border border-white/20 bg-domify-primary-dark/60 px-3 text-xs font-semibold text-white backdrop-blur-md transition-luxury hover:bg-domify-primary" aria-label="Ouvrir la galerie en plein écran">
              <Maximize2 size={15} /> <span className="hidden sm:inline">Plein écran</span>
            </button>
          </div>
          {gallery.length > 1 && (
            <>
              <button type="button" onClick={goPrevious} className="pressable absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-domify-primary-dark/55 text-white backdrop-blur-md transition-luxury hover:bg-domify-primary" aria-label="Image précédente"><ChevronLeft size={20} /></button>
              <button type="button" onClick={goNext} className="pressable absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-domify-primary-dark/55 text-white backdrop-blur-md transition-luxury hover:bg-domify-primary" aria-label="Image suivante"><ChevronRight size={20} /></button>
            </>
          )}
          <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4">
            <p className="max-w-[75%] truncate text-sm font-medium text-white/90">{title}</p>
            <div className="flex gap-1.5" aria-label="Position dans la galerie">
              {gallery.slice(0, 8).map((_, index) => <button type="button" key={index} onClick={() => goTo(index)} aria-label={`Voir l'image ${index + 1}`} className={`h-1.5 rounded-full transition-all ${index === active ? "w-7 bg-domify-soft-gold" : "w-1.5 bg-white/55 hover:bg-white"}`} />)}
            </div>
          </div>
        </div>
      </div>

      {gallery.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6 sm:gap-3">
          {gallery.map((image, index) => (
            <button type="button" key={`${image}-${index}`} onClick={() => goTo(index)} aria-label={`Voir l'image ${index + 1}`} className={`relative h-16 overflow-hidden rounded-xl transition-luxury sm:h-20 ${active === index ? "ring-2 ring-domify-gold ring-offset-2 ring-offset-white" : "opacity-65 hover:opacity-100"}`}>
              <Image src={image} alt="" fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-domify-primary-dark/95 p-4 backdrop-blur-xl" role="dialog" aria-modal="true" aria-label={`Galerie de ${title}`} onClick={() => setLightboxOpen(false)}>
          <button type="button" onClick={() => setLightboxOpen(false)} className="pressable absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20" aria-label="Fermer la galerie"><X size={21} /></button>
          <div className="relative h-[76vh] w-full max-w-6xl" onClick={(event) => event.stopPropagation()} onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX ?? null)} onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}>
            <Image src={gallery[active]} alt={`${title} — image ${active + 1}`} fill sizes="100vw" className="object-contain" />
            <div className="absolute bottom-[-3.5rem] inset-x-0 flex items-center justify-center gap-3 text-sm text-white/80"><span>{active + 1} / {gallery.length}</span><span className="text-white/35">•</span><span className="hidden sm:inline">Utilisez ← → ou balayez pour naviguer</span></div>
            {gallery.length > 1 && <><button type="button" onClick={goPrevious} className="pressable absolute left-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:-left-16" aria-label="Image précédente"><ChevronLeft size={25} /></button><button type="button" onClick={goNext} className="pressable absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:-right-16" aria-label="Image suivante"><ChevronRight size={25} /></button></>}
          </div>
        </div>
      )}
    </>
  );
}
