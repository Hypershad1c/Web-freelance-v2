"use client";

import { useEffect, useState } from "react";
import { Share, Plus, X } from "lucide-react";

const DISMISS_KEY = "domify-ios-install-prompt-dismissed";

function isIosSafari() {
  if (typeof window === "undefined") return false;
  const userAgent = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(userAgent) || (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
  const isWebKit = /WebKit/.test(userAgent);
  const isOtherIosBrowser = /CriOS|FxiOS|OPiOS|EdgiOS/.test(userAgent);
  return isIos && isWebKit && !isOtherIosBrowser;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  const safariStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return safariStandalone || window.matchMedia("(display-mode: standalone)").matches;
}

export function IosInstallPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isIosSafari() || isStandalone() || window.localStorage.getItem(DISMISS_KEY)) return;
    const timeout = window.setTimeout(() => setVisible(true), 900);
    return () => window.clearTimeout(timeout);
  }, []);

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside className="fixed inset-x-4 bottom-5 z-[70] mx-auto max-w-sm rounded-2xl border border-white/15 bg-[#132C45]/95 p-4 text-white shadow-[0_22px_60px_-18px_rgba(10,25,40,0.8)] backdrop-blur-xl sm:bottom-6" aria-label="Installer Domify sur iPhone ou iPad">
      <button type="button" onClick={dismiss} className="pressable absolute right-3 top-3 rounded-full p-1.5 text-white/65 hover:bg-white/10 hover:text-white" aria-label="Fermer le guide d’installation">
        <X size={16} />
      </button>
      <div className="pr-7">
        <p className="font-display text-base font-semibold">Installez Domify</p>
        <p className="mt-1 text-sm leading-5 text-white/72">Accédez plus vite à votre recherche immobilière depuis l’écran d’accueil.</p>
      </div>
      <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-white/8 px-3 py-2.5 text-xs leading-5 text-white/86">
        <Share size={17} className="shrink-0 text-[#78A8FF]" aria-hidden="true" />
        <span>Dans Safari, touchez <strong>Partager</strong>, puis <strong className="inline-flex items-center gap-1">Sur l’écran d’accueil <Plus size={12} aria-hidden="true" /></strong>.</span>
      </div>
    </aside>
  );
}
