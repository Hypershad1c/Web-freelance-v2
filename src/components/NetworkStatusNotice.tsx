"use client";

import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export function NetworkStatusNotice() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);

  if (online) return null;

  return <div role="status" aria-live="polite" className="fixed inset-x-3 top-3 z-[100] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/95 px-4 py-3 text-sm text-amber-950 shadow-[0_18px_40px_-24px_rgba(120,53,15,0.6)] backdrop-blur-md dark:border-amber-300/20 dark:bg-amber-950/90 dark:text-amber-100"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-200/70 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200"><WifiOff size={16} /></span><p><span className="font-semibold">Connexion interrompue.</span> Certaines actions seront disponibles dès le retour du réseau.</p></div>;
}
