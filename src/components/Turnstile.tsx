"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

type Action = "lead" | "contact" | "appointment" | "registration" | "valuation" | "financing";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove?: (widgetId: string) => void;
    };
  }
}

export function Turnstile({ action, onTokenChange }: { action: Action; onTokenChange: (token: string | null) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!siteKey || !ready || !containerRef.current || !window.turnstile || widgetId.current) return;
    widgetId.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action,
      size: "flexible",
      theme: "light",
      callback: (token: string) => {
        setError(null);
        onTokenChange(token);
      },
      "expired-callback": () => onTokenChange(null),
      "timeout-callback": () => onTokenChange(null),
      "error-callback": () => {
        onTokenChange(null);
        setError("La vérification de sécurité est indisponible. Réessayez dans un instant.");
      },
    });
    return () => {
      if (widgetId.current && window.turnstile?.remove) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [action, onTokenChange, ready, siteKey]);

  if (!siteKey) return null;

  return (
    <div className="space-y-1" data-no-runtime-translation>
      <Script
        id="cloudflare-turnstile"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />
      <div ref={containerRef} className="min-h-[65px]" aria-label="Vérification de sécurité" />
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );
}
