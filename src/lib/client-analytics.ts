import { readConsent } from "@/lib/consent";

export type ClientAnalyticsEventType = "page_view" | "lead" | "search" | "favorite" | "appointment" | "valuation" | "whatsapp";

type Attribution = {
  source?: string;
  medium?: string;
  campaign?: string;
  referrer?: string;
};

type EventOptions = {
  path?: string;
  propertyId?: string;
  meta?: Record<string, unknown>;
};

const ATTRIBUTION_KEY = "domify_attribution_v1";
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
  return (["fr", "en", "ar"] as const).includes(value as "fr" | "en" | "ar") ? value as "fr" | "en" | "ar" : "fr";
}

function readAttribution(): Attribution {
  const params = new URLSearchParams(window.location.search);
  const fromUrl: Attribution = {
    source: params.get("utm_source") || undefined,
    medium: params.get("utm_medium") || undefined,
    campaign: params.get("utm_campaign") || undefined,
    referrer: document.referrer || undefined,
  };

  if (fromUrl.source || fromUrl.medium || fromUrl.campaign) {
    window.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(fromUrl));
    return fromUrl;
  }

  try {
    return JSON.parse(window.sessionStorage.getItem(ATTRIBUTION_KEY) || "{}") as Attribution;
  } catch {
    return { referrer: document.referrer || undefined };
  }
}

export function getClientAnalyticsAttribution() {
  if (typeof window === "undefined") return {};
  return readAttribution();
}

export function recordClientAnalyticsEvent(type: ClientAnalyticsEventType, options: EventOptions = {}) {
  if (typeof window === "undefined" || readConsent() !== "accepted") return;

  const attribution = readAttribution();
  const propertyFromPath = window.location.pathname.match(/^\/proprietes\/([^/]+)/)?.[1];
  const payload = {
    type,
    path: options.path || window.location.pathname,
    visitorId: getOrCreateId(window.localStorage, VISITOR_KEY),
    sessionId: getOrCreateId(window.sessionStorage, SESSION_KEY),
    deviceType: getDeviceType(),
    locale: getLocale(),
    propertyId: options.propertyId || propertyFromPath,
    ...attribution,
    meta: options.meta,
  };

  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}
