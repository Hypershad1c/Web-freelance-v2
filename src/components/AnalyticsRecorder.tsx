"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CONSENT_EVENT, readConsent } from "@/lib/consent";

type Attribution = { source?: string; medium?: string; campaign?: string; referrer?: string };
const STORAGE_KEY = "domify_attribution_v1";
const VISITOR_KEY = "domify_analytics_visitor_v1";
const SESSION_KEY = "domify_analytics_session_v1";

function getOrCreateId(storage: Storage, key: string) {
  const existing = storage.getItem(key);
  if (existing) return existing;
  const value = crypto.randomUUID();
  storage.setItem(key, value);
  return value;
}

function getDeviceType() {
  if (window.innerWidth < 640) return "mobile" as const;
  if (window.innerWidth < 1024) return "tablet" as const;
  return "desktop" as const;
}

function getLocale() {
  const value = document.documentElement.lang.slice(0, 2);
  return (["fr", "en", "ar"] as const).includes(value as "fr" | "en" | "ar") ? value as "fr" | "en" | "ar" : "fr" as const;
}

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
    const propertyMatch = pathname.match(/^\/proprietes\/([^/]+)/);
    const payload = {
      type: "page_view",
      path: pathname,
      visitorId: getOrCreateId(localStorage, VISITOR_KEY),
      sessionId: getOrCreateId(sessionStorage, SESSION_KEY),
      deviceType: getDeviceType(),
      locale: getLocale(),
      propertyId: propertyMatch?.[1],
      ...attribution,
    };
    fetch("/api/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), keepalive: true }).catch(() => {});
  }, [analyticsAllowed, pathname, searchParams]);

  return null;
}
