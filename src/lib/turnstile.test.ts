import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstile } from "@/lib/turnstile";

const originalNodeEnv = process.env.NODE_ENV;
const originalSecret = process.env.TURNSTILE_SECRET_KEY;

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  if (originalSecret === undefined) delete process.env.TURNSTILE_SECRET_KEY;
  else process.env.TURNSTILE_SECRET_KEY = originalSecret;
  vi.unstubAllGlobals();
});

describe("verifyTurnstile", () => {
  it("allows local development when no secret is configured", async () => {
    process.env.NODE_ENV = "test";
    delete process.env.TURNSTILE_SECRET_KEY;

    await expect(verifyTurnstile({ token: undefined, expectedAction: "contact" })).resolves.toEqual({ ok: true, bypassed: true });
  });

  it("fails closed in production when CAPTCHA is not configured", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.TURNSTILE_SECRET_KEY;

    await expect(verifyTurnstile({ token: "token", expectedAction: "contact" })).resolves.toEqual({ ok: false, reason: "captcha_not_configured" });
  });

  it("rejects a missing token when the secret is configured", async () => {
    process.env.NODE_ENV = "production";
    process.env.TURNSTILE_SECRET_KEY = "secret";

    await expect(verifyTurnstile({ expectedAction: "lead" })).resolves.toEqual({ ok: false, reason: "missing_token" });
  });

  it("accepts a valid verification returned for the expected form action", async () => {
    process.env.NODE_ENV = "production";
    process.env.TURNSTILE_SECRET_KEY = "secret";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, action: "contact", hostname: "domify.ma" }), { status: 200 })));

    await expect(verifyTurnstile({ token: "token", remoteIp: "127.0.0.1", expectedAction: "contact" })).resolves.toEqual({ ok: true, bypassed: false });
  });

  it("rejects a token issued for a different action", async () => {
    process.env.NODE_ENV = "production";
    process.env.TURNSTILE_SECRET_KEY = "secret";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, action: "lead" }), { status: 200 })));

    await expect(verifyTurnstile({ token: "token", expectedAction: "contact" })).resolves.toEqual({ ok: false, reason: "action_mismatch" });
  });
});
