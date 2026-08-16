"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export function PwaInstallPrompt() {
  const [event, setEvent] = useState<InstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const handler = (value: Event) => { value.preventDefault(); setEvent(value as InstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  if (!event || dismissed) return null;
  return <div className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-md rounded-2xl border border-domify-gold/25 bg-domify-primary-dark p-4 text-white shadow-[0_24px_60px_-24px_rgba(16,47,66,0.7)] lg:bottom-6"><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-domify-gold text-white"><Download size={18} /></span><div className="min-w-0 flex-1"><p className="font-semibold">Installer Domify</p><p className="mt-1 text-xs leading-5 text-white/70">Ajoutez Domify à votre écran d’accueil pour retrouver vos alertes et vos biens plus rapidement.</p><button type="button" onClick={() => void event.prompt()} className="mt-3 rounded-lg bg-domify-gold px-3 py-2 text-xs font-semibold text-white hover:bg-domify-soft-gold hover:text-domify-dark">Installer l’application</button></div><button type="button" aria-label="Fermer" onClick={() => setDismissed(true)} className="rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white"><X size={15} /></button></div></div>;
}
