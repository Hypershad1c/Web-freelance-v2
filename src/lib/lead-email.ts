import { emailLayout, sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { resolveLeadNotificationRecipients } from "@/lib/lead-notification-recipients";
import { recordAudit } from "@/lib/workflow";

export type LeadEmailPayload = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  property?: { title: string; reference: string; agent?: { email: string | null } | null } | null;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

export async function sendLeadAdministratorNotification(lead: LeadEmailPayload, actorId?: string | null) {
  const administrators = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { email: true } });
  const recipients = resolveLeadNotificationRecipients({
    administratorEmails: administrators.map((administrator) => administrator.email),
    agentEmail: lead.property?.agent?.email,
  });

  if (recipients.length === 0) {
    await recordAudit({ actorId, action: "LEAD_EMAIL_FAILED", entityType: "Lead", entityId: lead.id, summary: "Notification email non envoyée : aucun destinataire ADMIN ou agent valide." });
    return { accepted: false, recipientCount: 0, reason: "no_recipient" as const };
  }

  const propertyContext = lead.property ? ` pour <strong>${escapeHtml(lead.property.title)}</strong> (${escapeHtml(lead.property.reference)})` : "";
  const result = await sendEmail({
    to: recipients,
    subject: `Nouveau lead — ${lead.property?.title ?? "demande générale"}`,
    html: emailLayout(
      "Nouveau lead reçu",
      `<p><strong>${escapeHtml(lead.name)}</strong> (${escapeHtml(lead.email)}${lead.phone ? `, ${escapeHtml(lead.phone)}` : ""}) vient de soumettre une demande${propertyContext}.</p>
       ${lead.message ? `<p style="background:#F2ECDD; padding:12px 16px; border-radius:8px;">${escapeHtml(lead.message)}</p>` : ""}
       <p>Connectez-vous à l’administration pour y répondre.</p>`
    ),
  });

  if (result.skipped) {
    await recordAudit({ actorId, action: "LEAD_EMAIL_FAILED", entityType: "Lead", entityId: lead.id, summary: `Notification email non acceptée par le fournisseur · ${recipients.length} destinataire(s) · ${result.reason}.` });
    return { accepted: false, recipientCount: recipients.length, reason: result.reason };
  }

  await recordAudit({ actorId, action: "LEAD_EMAIL_ACCEPTED", entityType: "Lead", entityId: lead.id, summary: `Notification email acceptée par le fournisseur · ${recipients.length} destinataire(s) · message ${result.messageId}.` });
  return { accepted: true, recipientCount: recipients.length, messageId: result.messageId };
}

export async function sendLeadReceipt(lead: LeadEmailPayload) {
  return sendEmail({
    to: lead.email,
    subject: "Nous avons bien reçu votre demande — Domify",
    html: emailLayout(
      "Merci pour votre demande !",
      `<p>Bonjour ${escapeHtml(lead.name)},</p><p>Votre demande a bien été transmise à notre équipe. Un conseiller vous recontactera très prochainement.</p>`
    ),
  });
}
