const FALLBACK_CALLBACK = "/";

/**
 * Accept only same-origin relative callback paths for post-authentication navigation.
 * Full URLs are intentionally rejected so a user-controlled query parameter cannot
 * turn login or registration into an open redirect.
 */
export function sanitizeCallbackUrl(value: string | null | undefined, fallback = FALLBACK_CALLBACK): string {
  if (!value) return fallback;

  let candidate = value.trim();
  try {
    candidate = decodeURIComponent(candidate);
  } catch {
    return fallback;
  }

  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) {
    return fallback;
  }

  try {
    const parsed = new URL(candidate, "https://domify.local");
    if (parsed.origin !== "https://domify.local") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
