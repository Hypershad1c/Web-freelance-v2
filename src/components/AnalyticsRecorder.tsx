"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CONSENT_EVENT, readConsent } from "@/lib/consent";

type Attribution = { source?: string; medium?: string; campaign?: string; referrer?: string };
const STORAGE_KEY = "domify_attribution_v1";

function readAttribution(searchParams: ReturnType<typeof useSearchParams>): Attribution {
  const fromUrl = { source: searchParams.get("utm_source") || undefined, medium: searchParams.get("utm_medium") || undefined, campaign: searchParams.get("utm_campaign") || undefined };
  if (fromUrl.source || fromUrl.medium || fromUrl.campaign) {
    const value = { ...fromUrl, referrer: document.referrer || undefined };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    return value;
  }
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}") as Attribution; } catch { return { referrer: document.referrer || undefined }; }
}

export function AnalyticsRecorder() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);

  useEffect(() => {
    const refreshConsent = () => setAnalyticsAllowed(readConsent() === "accepted");
    refreshConsent();
    window.addEventListener(CONSENT_EVENT, refreshConsent);
    return () => window.removeEventListener(CONSENT_EVENT, refreshConsent);
  }, []);

  useEffect(() => {
    if (!analyticsAllowed) return;
    const attribution = readAttribution(searchParams);
    fetch("/api/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "page_view", path: pathname, ...attribution }), keepalive: true }).catch(() => {});
  }, [analyticsAllowed, pathname, searchParams]);

  return null;
}
