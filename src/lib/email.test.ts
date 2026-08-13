import { afterEach, describe, expect, it, vi } from "vitest";

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }));

vi.mock("resend", () => ({
  Resend: vi.fn(function MockResend() {
    return { emails: { send: mockSend } };
  }),
}));

import { sendEmail } from "@/lib/email";

const originalApiKey = process.env.RESEND_API_KEY;
const originalFromAddress = process.env.EMAIL_FROM;
const email = {
  to: "client@example.com",
  subject: "Réinitialisez votre mot de passe — Domify",
  html: "<p>Reset</p>",
};

afterEach(() => {
  if (originalApiKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = originalApiKey;

  if (originalFromAddress === undefined) delete process.env.EMAIL_FROM;
  else process.env.EMAIL_FROM = originalFromAddress;

  mockSend.mockReset();
  vi.restoreAllMocks();
});

describe("sendEmail", () => {
  it("reports an explicit configuration failure when the Resend key is unavailable", async () => {
    delete process.env.RESEND_API_KEY;
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(sendEmail(email)).resolves.toEqual({ skipped: true, reason: "not_configured" });
  });

  it("returns the provider message identifier for an accepted email", async () => {
    process.env.RESEND_API_KEY = "re_test";
    mockSend.mockResolvedValue({ data: { id: "email_123" }, error: null });

    await expect(sendEmail(email)).resolves.toEqual({ skipped: false, messageId: "email_123" });
  });

  it("reports Resend API rejections instead of treating them as delivered", async () => {
    process.env.RESEND_API_KEY = "re_test";
    mockSend.mockResolvedValue({ data: null, error: { message: "The sender domain is not verified" } });
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(sendEmail(email)).resolves.toEqual({ skipped: true, reason: "provider_error" });
  });

  it("reports unexpected mailer exceptions without throwing into the caller", async () => {
    process.env.RESEND_API_KEY = "re_test";
    mockSend.mockRejectedValue(new Error("Network unavailable"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(sendEmail(email)).resolves.toEqual({ skipped: true, reason: "delivery_exception" });
  });
});
