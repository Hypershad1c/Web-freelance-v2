import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendEmail, emailLayout } from "@/lib/email";
import { resolveLeadNotificationRecipients } from "@/lib/lead-notification-recipients";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { syncInboundLead } from "@/lib/crm";

const LeadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().optional(),
  propertyId: z.string().optional(),
  source: z.string().max(160).optional(),
  utmSource: z.string().max(160).optional(),
  utmMedium: z.string().max(160).optional(),
  utmCampaign: z.string().max(240).optional(),
  referrer: z.string().max(500).optional(),
  website: z.string().optional(), // honeypot — real users never see/fill this field
  turnstileToken: z.string().optional(),
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed } = rateLimit(`leads:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json({ error: "Trop de demandes. Merci de réessayer plus tard." }, { status: 429 });
  }

  const body = await request.json();
  const parsed = LeadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  // Honeypot tripped — pretend success so the bot doesn't learn it was caught,
  // but never actually create the record.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const verification = await verifyTurnstile({ token: parsed.data.turnstileToken, remoteIp: ip, expectedAction: "lead" });
  if (!verification.ok) {
    return NextResponse.json({ error: "La vérification de sécurité a échoué. Merci de réessayer." }, { status: 400 });
  }

  const { website, turnstileToken, ...data } = parsed.data;
  void website;
  void turnstileToken;
  const session = await auth();

  const lead = await prisma.lead.create({
    data: {
      ...data,
      userId: session?.user?.id,
    },
    include: { property: { include: { agent: true } } },
  });

  if (!["ADMIN", "EDITOR", "AGENT"].includes(session?.user?.role ?? "")) {
    await prisma.analyticsEvent.create({
      data: {
        type: "lead",
        path: data.propertyId ? `/proprietes/${data.propertyId}` : "/vendre-louer",
        source: data.source || null,
        medium: data.utmMedium || null,
        campaign: data.utmCampaign || null,
        referrer: data.referrer || null,
        propertyId: data.propertyId || null,
        meta: { channel: "lead_form" },
      },
    }).catch((error) => console.error("[leads] Analytics event failed:", error));
  }

  // Complete auxiliary work before returning from this serverless request so a
  // successful lead response cannot terminate the notification promise early.
  // Delivery and CRM failures remain non-blocking for the visitor’s submission.
  const [crmResult, notificationResult] = await Promise.allSettled([
    syncInboundLead(lead),
    notifyNewLead(lead),
  ]);
  if (crmResult.status === "rejected") console.error("[leads] CRM sync failed:", crmResult.reason);
  if (notificationResult.status === "rejected") console.error("[leads] notification failed:", notificationResult.reason);

  return NextResponse.json(lead, { status: 201 });
}

type LeadWithProperty = {
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  property?: { title: string; reference: string; agent?: { email: string | null } | null } | null;
};

async function notifyNewLead(lead: LeadWithProperty) {
  const administrators = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { email: true },
  });
  const recipients = resolveLeadNotificationRecipients({
    administratorEmails: administrators.map((administrator) => administrator.email),
    agentEmail: lead.property?.agent?.email,
  });

  if (recipients.length > 0) {
    await sendEmail({
      to: recipients,
      subject: `Nouveau lead — ${lead.property?.title ?? "demande générale"}`,
      html: emailLayout(
        "Nouveau lead reçu",
        `
        <p><strong>${lead.name}</strong> (${lead.email}${lead.phone ? `, ${lead.phone}` : ""}) vient de soumettre une demande${
          lead.property ? ` pour <strong>${lead.property.title}</strong> (${lead.property.reference})` : ""
        }.</p>
        ${lead.message ? `<p style="background:#F2ECDD; padding:12px 16px; border-radius:8px;">${lead.message}</p>` : ""}
        <p>Connectez-vous à l'admin pour y répondre.</p>
        `
      ),
    });
  } else {
    console.error("[leads] No valid administrator or assigned-agent email is configured for new-lead notification");
  }

  await sendEmail({
    to: lead.email,
    subject: "Nous avons bien reçu votre demande — Domify",
    html: emailLayout(
      "Merci pour votre demande !",
      `<p>Bonjour ${lead.name},</p><p>Votre demande a bien été transmise à notre équipe. Un conseiller vous recontactera très prochainement.</p>`
    ),
  });
}
