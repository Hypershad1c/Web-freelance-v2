import { Resend } from "resend";

const FROM_ADDRESS = process.env.EMAIL_FROM || "Domify <onboarding@resend.dev>";

type EmailSkipReason = "not_configured" | "provider_error" | "delivery_exception";

export type SendEmailResult =
  | { skipped: false; messageId: string }
  | { skipped: true; reason: EmailSkipReason };

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
};

function logDeliveryFailure(reason: EmailSkipReason, subject: string, to: string | string[], details?: string) {
  console.error("[email] Delivery submission failed", {
    reason,
    subject,
    recipientCount: Array.isArray(to) ? to.length : 1,
    details,
  });
}

// This helper never throws so a secondary transactional email cannot break the
// primary user flow. It nevertheless returns an explicit failure result so
// security-critical callers, such as password reset, can observe and log a
// rejected provider submission instead of treating it as a sent message.
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<SendEmailResult> {
  if (!isEmailConfigured()) {
    logDeliveryFailure("not_configured", subject, to, "RESEND_API_KEY is not set");
    return { skipped: true, reason: "not_configured" };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });

    if (error) {
      logDeliveryFailure("provider_error", subject, to, error.message);
      return { skipped: true, reason: "provider_error" };
    }

    if (!data?.id) {
      logDeliveryFailure("provider_error", subject, to, "Resend returned no message identifier");
      return { skipped: true, reason: "provider_error" };
    }

    return { skipped: false, messageId: data.id };
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown mail delivery exception";
    logDeliveryFailure("delivery_exception", subject, to, details);
    return { skipped: true, reason: "delivery_exception" };
  }
}

// Shared, minimal HTML wrapper so every email looks consistent without a template engine.
export function emailLayout(title: string, bodyHtml: string) {
  return `
  <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1F2937;">
    <p style="font-family: Georgia, serif; font-size: 22px; font-weight: 600; color: #336699; margin: 0 0 24px;">Domify</p>
    <h1 style="font-size: 18px; margin: 0 0 16px;">${title}</h1>
    <div style="font-size: 14px; line-height: 1.6; color: #1F2937CC;">${bodyHtml}</div>
    <p style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #1F293714; font-size: 12px; color: #1F293766;">
      Domify — Find Your Perfect Place.
    </p>
  </div>`;
}
