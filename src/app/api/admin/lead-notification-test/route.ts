import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emailLayout, sendEmail } from "@/lib/email";
import { resolveLeadNotificationRecipients } from "@/lib/lead-notification-recipients";
import { recordAudit } from "@/lib/workflow";

export async function POST() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé — réservé aux administrateurs." }, { status: 403 });
  }

  const administrators = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { email: true },
  });
  const recipients = resolveLeadNotificationRecipients({
    administratorEmails: administrators.map((administrator) => administrator.email),
  });

  if (recipients.length === 0) {
    return NextResponse.json({ error: "Aucun compte ADMIN avec une adresse email valide n’a été trouvé." }, { status: 422 });
  }

  const sentAt = new Intl.DateTimeFormat("fr-MA", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Africa/Casablanca",
  }).format(new Date());
  const result = await sendEmail({
    to: recipients,
    subject: "Test notification nouveau lead — Domify",
    html: emailLayout(
      "Test de notification nouveau lead",
      `<p>Ceci est un test administrateur envoyé le <strong>${sentAt}</strong>.</p>
       <p>Chaque compte Domify ayant le rôle <strong>ADMIN</strong> reçoit une notification lorsqu’un nouveau lead est enregistré.</p>
       <p>Aucun lead, contact CRM ou renseignement client n’a été créé pour ce test.</p>`
    ),
  });

  if (result.skipped) {
    console.error("[lead-notification-test] Provider did not accept test delivery", { reason: result.reason, recipientCount: recipients.length });
    return NextResponse.json({ error: "Le fournisseur email n’a pas accepté l’envoi du test. Vérifiez la configuration Resend et les journaux de déploiement." }, { status: 502 });
  }

  await recordAudit({
    actorId: session.user.id,
    action: "LEAD_NOTIFICATION_TEST_SENT",
    entityType: "User",
    entityId: session.user.id,
    summary: `Test de notification de lead envoyé à ${recipients.length} compte(s) ADMIN.`,
  }).catch((error) => console.error("[lead-notification-test] Failed to record audit entry", error));

  return NextResponse.json({ ok: true, recipientCount: recipients.length, messageId: result.messageId });
}
