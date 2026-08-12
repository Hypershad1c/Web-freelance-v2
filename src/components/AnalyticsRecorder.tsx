"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CONSENT_EVENT, readConsent } from "@/lib/consent";

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
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "page_view", path: pathname }),
      keepalive: true,
    }).catch(() => {});
  }, [analyticsAllowed, pathname, searchParams]);

  return null;
}
