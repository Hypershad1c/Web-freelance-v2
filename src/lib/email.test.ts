import { afterEach, describe, expect, it, vi } from "vitest";

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }));

vi.mock("resend", () => ({
  Resend: vi.fn(function MockResend() {
    return { emails: { send: mockSend } };
  }),
}));

import { sendEmail, sendPropertyApprovalDecisionEmail, sendSubscriptionExpiringSoonEmail, sendSubscriptionPastDueEmail } from "@/lib/email";

const originalApiKey = process.env.RESEND_API_KEY;
const originalFromAddress = process.env.EMAIL_FROM;
const originalNextAuthUrl = process.env.NEXTAUTH_URL;
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
  if (originalNextAuthUrl === undefined) delete process.env.NEXTAUTH_URL;
  else process.env.NEXTAUTH_URL = originalNextAuthUrl;

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


describe("sendPropertyApprovalDecisionEmail", () => {
  it("sends an approval email with the published property link", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.NEXTAUTH_URL = "https://domify.ma";
    mockSend.mockResolvedValue({ data: { id: "approval_email_123" }, error: null });

    await expect(sendPropertyApprovalDecisionEmail({
      to: "owner@example.com",
      ownerName: "Nadia",
      propertyId: "property-123",
      propertyTitle: "Villa Atlas",
      reference: "OWN-ATLAS-123",
      approved: true,
    })).resolves.toEqual({ skipped: false, messageId: "approval_email_123" });

    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
      to: "owner@example.com",
      subject: "Votre bien est approuvé — Villa Atlas | Domify",
      html: expect.stringContaining("https://domify.ma/proprietes/property-123"),
    }));
  });

  it("sends a rejection email and escapes the reviewer reason", async () => {
    process.env.RESEND_API_KEY = "re_test";
    mockSend.mockResolvedValue({ data: { id: "rejection_email_123" }, error: null });

    await sendPropertyApprovalDecisionEmail({
      to: "owner@example.com",
      ownerName: "Nadia",
      propertyId: "property-123",
      propertyTitle: "Villa Atlas",
      reference: "OWN-ATLAS-123",
      approved: false,
      rejectionReason: "Ajoutez <strong>le titre</strong> & une photo.",
    });

    const payload = mockSend.mock.calls.at(-1)?.[0] as { subject: string; html: string };
    expect(payload.subject).toContain("Action requise pour votre annonce");
    expect(payload.html).toContain("Ajoutez &lt;strong&gt;le titre&lt;/strong&gt; &amp; une photo.");
    expect(payload.html).not.toContain("Ajoutez <strong>le titre</strong>");
  });
});

describe("subscription alert emails", () => {
  it("sends a seven-day expiry alert with the period end and plan", async () => {
    process.env.RESEND_API_KEY = "re_test";
    mockSend.mockResolvedValue({ data: { id: "expiry_email_123" }, error: null });
    const periodEnd = new Date("2026-08-21T00:00:00.000Z");

    await expect(sendSubscriptionExpiringSoonEmail({
      to: "agency@example.com",
      recipientName: "Nadia",
      plan: "PRO",
      amount: 1500,
      currency: "MAD",
      periodEnd,
    })).resolves.toEqual({ skipped: false, messageId: "expiry_email_123" });

    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
      to: "agency@example.com",
      subject: "Votre abonnement PRO arrive à échéance — Domify",
      html: expect.stringContaining("1.500 MAD"),
    }));
  });

  it("sends a past-due alert with the payment action message", async () => {
    process.env.RESEND_API_KEY = "re_test";
    mockSend.mockResolvedValue({ data: { id: "past_due_email_123" }, error: null });

    await expect(sendSubscriptionPastDueEmail({
      to: "agency@example.com",
      recipientName: "Nadia",
      plan: "PREMIUM",
      amount: 4000,
      currency: "MAD",
    })).resolves.toEqual({ skipped: false, messageId: "past_due_email_123" });

    const payload = mockSend.mock.calls.at(-1)?.[0] as { subject: string; html: string };
    expect(payload.subject).toContain("paiement d’abonnement en retard");
    expect(payload.html).toContain("impayé");
  });
});
