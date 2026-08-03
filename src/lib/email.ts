import { Resend } from "resend";

const FROM_ADDRESS = process.env.EMAIL_FROM || "Domify <onboarding@resend.dev>";

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
};

// Best-effort — never throws. If Resend isn't configured (no API key), this logs
// and no-ops instead of breaking whatever flow triggered it (lead submission,
// registration, etc. should never fail just because an email couldn't go out).
export async function sendEmail({ to, subject, html }: SendEmailInput) {
  if (!isEmailConfigured()) {
    console.warn(`[email] RESEND_API_KEY not set — skipping email "${subject}" to ${to}`);
    return { skipped: true };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });
    return { skipped: false };
  } catch (error) {
    console.error("[email] Failed to send:", error);
    return { skipped: true, error };
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
