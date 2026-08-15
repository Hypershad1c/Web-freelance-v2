type TurnstileAction = "lead" | "contact" | "appointment" | "registration" | "valuation" | "financing" | "seller_property";

type TurnstileResult = {
  success: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

export async function verifyTurnstile({
  token,
  remoteIp,
  expectedAction,
}: {
  token?: string;
  remoteIp?: string;
  expectedAction: TurnstileAction;
}) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const expectedHostnames = new Set((process.env.TURNSTILE_HOSTNAMES ?? "domify.ma").split(",").map((hostname) => hostname.trim()).filter(Boolean));
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      return { ok: false, reason: "captcha_not_configured" as const };
    }
    return { ok: true, bypassed: true as const };
  }

  if (!token || token.length > 2048 || expectedHostnames.size === 0) {
    return { ok: false, reason: "missing_token" as const };
  }

  const payload = new FormData();
  payload.set("secret", secret);
  payload.set("response", token);
  payload.set("idempotency_key", crypto.randomUUID());
  if (remoteIp) payload.set("remoteip", remoteIp);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: payload,
      signal: controller.signal,
      cache: "no-store",
    });
    const result = await response.json() as TurnstileResult;
    if (!response.ok || !result.success) {
      return { ok: false, reason: "verification_failed" as const, errors: result["error-codes"] ?? [] };
    }
    if (result.action !== expectedAction) {
      return { ok: false, reason: "action_mismatch" as const };
    }
    if (!result.hostname || !expectedHostnames.has(result.hostname)) {
      return { ok: false, reason: "hostname_mismatch" as const };
    }
    return { ok: true, bypassed: false as const };
  } catch {
    return { ok: false, reason: "verification_unavailable" as const };
  } finally {
    clearTimeout(timeout);
  }
}
