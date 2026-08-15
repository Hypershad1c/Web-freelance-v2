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

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

export async function sendPropertyApprovalDecisionEmail({
  to,
  ownerName,
  propertyId,
  propertyTitle,
  reference,
  approved,
  rejectionReason,
}: {
  to: string;
  ownerName?: string | null;
  propertyId: string;
  propertyTitle: string;
  reference: string;
  approved: boolean;
  rejectionReason?: string | null;
}) {
  const baseUrl = (process.env.NEXTAUTH_URL || "https://domify.ma").replace(/\/$/, "");
  const safeName = escapeHtml(ownerName?.trim() || "propriétaire");
  const safeTitle = escapeHtml(propertyTitle);
  const safeReference = escapeHtml(reference);
  const portalUrl = `${baseUrl}/espace-vendeur`;
  const propertyUrl = `${baseUrl}/proprietes/${encodeURIComponent(propertyId)}`;
  const safeReason = escapeHtml(rejectionReason?.trim() || "Notre équipe a demandé quelques corrections avant publication.");

  if (approved) {
    return sendEmail({
      to,
      subject: `Votre bien est approuvé — ${propertyTitle} | Domify`,
      html: emailLayout(
        "Votre bien est approuvé",
        `<p>Bonjour ${safeName},</p>
         <p>Bonne nouvelle : votre annonce <strong>${safeTitle}</strong> (${safeReference}) a été vérifiée et approuvée par l'équipe Domify.</p>
         <p>Elle est maintenant publiée sur notre plateforme et peut être consultée par les acheteurs et locataires intéressés.</p>
         <p style="margin: 24px 0;"><a href="${propertyUrl}" style="display: inline-block; background: #336699; color: #ffffff; padding: 12px 18px; border-radius: 8px; text-decoration: none; font-weight: 600;">Voir mon bien publié</a></p>
         <p>Vous pouvez également suivre les demandes et les prochaines étapes depuis votre <a href="${portalUrl}" style="color: #336699;">espace vendeur</a>.</p>`
      ),
    });
  }

  return sendEmail({
    to,
    subject: `Action requise pour votre annonce — ${propertyTitle} | Domify`,
    html: emailLayout(
      "Des corrections sont nécessaires",
      `<p>Bonjour ${safeName},</p>
       <p>Votre annonce <strong>${safeTitle}</strong> (${safeReference}) a été examinée par l'équipe Domify.</p>
       <p>Avant sa publication, veuillez prendre en compte le retour suivant :</p>
       <div style="margin: 16px 0; padding: 14px 16px; border-left: 3px solid #C58B43; background: #FBF7EF; color: #4B5563;">${safeReason}</div>
       <p>Connectez-vous à votre <a href="${portalUrl}" style="color: #336699;">espace vendeur</a> pour consulter le statut de votre dépôt et contacter un conseiller si nécessaire.</p>`
    ),
  });
}


export async function sendPortalMessageNotificationEmail({
  to,
  recipientName,
  propertyTitle,
  propertyReference,
  senderName,
  portalPath,
}: {
  to: string;
  recipientName?: string | null;
  propertyTitle: string;
  propertyReference: string;
  senderName: string;
  portalPath: string;
}) {
  const baseUrl = (process.env.NEXTAUTH_URL || "https://domify.ma").replace(/\/$/, "");
  const safeRecipient = escapeHtml(recipientName?.trim() || "");
  const safeTitle = escapeHtml(propertyTitle);
  const safeReference = escapeHtml(propertyReference);
  const safeSender = escapeHtml(senderName);
  const portalUrl = `${baseUrl}${portalPath}`;

  return sendEmail({
    to,
    subject: `Nouveau message concernant ${propertyTitle} — Domify`,
    html: emailLayout(
      "Nouveau message immobilier",
      `<p>Bonjour ${safeRecipient},</p>
       <p><strong>${safeSender}</strong> vous a envoyé un message au sujet de <strong>${safeTitle}</strong> (${safeReference}).</p>
       <p style="margin: 24px 0;"><a href="${portalUrl}" style="display: inline-block; background: #336699; color: #ffffff; padding: 12px 18px; border-radius: 8px; text-decoration: none; font-weight: 600;">Ouvrir la messagerie</a></p>
       <p>Connectez-vous à votre espace Domify pour consulter l’échange et répondre en toute sécurité.</p>`
    ),
  });
}
