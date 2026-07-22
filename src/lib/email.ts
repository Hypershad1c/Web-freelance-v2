import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM || "Domify <onboarding@resend.dev>";

let resend: Resend | null = null;
function getClient() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const client = getClient();
  if (!client) {
    // No API key configured — don't break the app, just skip silently
    // (visible in server logs so it's obvious in dev why no email arrived).
    console.warn(`[email] RESEND_API_KEY not set — skipped "${subject}" to ${to}`);
    return { skipped: true };
  }

  const { data, error } = await client.emails.send({ from: FROM, to, subject, html });
  if (error) {
    console.error("[email] send failed:", error);
    throw new Error(error.message);
  }
  return { skipped: false, id: data?.id };
}

// Shared layout so every transactional email looks like it belongs to Domify.
export function emailLayout(title: string, bodyHtml: string) {
  return `
  <div style="background:#F7F5F0; padding:32px 16px; font-family:Arial, Helvetica, sans-serif;">
    <div style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden;">
      <div style="background:#1F2A44; padding:24px 32px;">
        <span style="color:#ffffff; font-size:20px; font-weight:700; letter-spacing:0.05em;">DOMIFY</span>
      </div>
      <div style="padding:32px;">
        <h1 style="margin:0 0 16px; font-size:20px; color:#1F2A44;">${title}</h1>
        <div style="font-size:14px; line-height:1.6; color:#374151;">${bodyHtml}</div>
      </div>
      <div style="padding:16px 32px; border-top:1px solid #F0EDE5;">
        <p style="margin:0; font-size:12px; color:#9CA3AF;">Domify — Trouvez, Visitez, Vivez.</p>
      </div>
    </div>
  </div>`;
}
