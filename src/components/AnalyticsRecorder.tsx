"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CONSENT_EVENT, readConsent } from "@/lib/consent";
import { recordClientAnalyticsEvent } from "@/lib/client-analytics";

export function AnalyticsRecorder() {
  const pathname = usePathname();
  const [analyticsAllowed, setAnalyticsAllowed] = useState(false);

  useEffect(() => {
    const refreshConsent = () => setAnalyticsAllowed(readConsent() === "accepted");
    refreshConsent();
    window.addEventListener(CONSENT_EVENT, refreshConsent);
    return () => window.removeEventListener(CONSENT_EVENT, refreshConsent);
  }, []);

  useEffect(() => {
    if (!analyticsAllowed || !pathname) return;
    recordClientAnalyticsEvent("page_view", { path: pathname });
  }, [analyticsAllowed, pathname]);

  return null;
}
