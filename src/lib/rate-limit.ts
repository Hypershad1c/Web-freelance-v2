// Lightweight in-memory rate limiter — no Redis/external dependency needed.
//
// Trade-off to be upfront about: this only works correctly for a single running
// instance. On serverless (each invocation can be a fresh process) or multiple
// server instances behind a load balancer, each instance has its own counters, so
// the effective limit is "N times the number of instances," not a hard global cap.
// Fine for a single-server deployment (e.g. the Docker/Compose setup in this repo);
// for real horizontal scaling, swap this for Redis/Upstash-backed limiting.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Periodic cleanup so `buckets` doesn't grow unbounded over a long-running process.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref?.();

export function rateLimit(key: string, { limit, windowMs }: { limit: number; windowMs: number }) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count };
}

// Best-effort client identifier from standard proxy headers (works behind Vercel,
// most reverse proxies, and Docker setups with a proxy in front). Falls back to a
// constant if nothing is available — degrades to a single shared bucket rather
// than throwing, since "no rate limiting" is safer than "500 error for everyone."
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
