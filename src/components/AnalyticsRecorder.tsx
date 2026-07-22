"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function AnalyticsRecorder() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Best-effort, fire-and-forget — never blocks or breaks the page if it fails.
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "page_view", path: pathname }),
      keepalive: true,
    }).catch(() => {});
    // Re-fires on query param changes too (e.g. /proprietes?city=rabat counts as its own view).
  }, [pathname, searchParams]);

  return null;
}
