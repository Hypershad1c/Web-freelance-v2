import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendEmail, emailLayout } from "@/lib/email";
import { getSiteSettings } from "@/lib/data/settings";

const LeadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().optional(),
  propertyId: z.string().optional(),
  source: z.string().optional(),
});

type LeadForNotification = {
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  property?: { title: string; reference: string; agent?: { email: string | null } | null } | null;
};

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = LeadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const session = await auth();

  const lead = await prisma.lead.create({
    data: {
      ...parsed.data,
      userId: session?.user?.id,
    },
    include: { property: { include: { agent: true } } },
  });

  // Best-effort notifications — never block or fail the request if email is down.
  notifyNewLead(lead).catch((e) => console.error("[leads] notification failed:", e));

  return NextResponse.json(lead, { status: 201 });
}

async function notifyNewLead(lead: LeadForNotification) {
  const settings = await getSiteSettings();
  const recipientEmail = lead.property?.agent?.email || settings.contact_email;

  await sendEmail({
    to: recipientEmail,
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

  await sendEmail({
    to: lead.email,
    subject: "Nous avons bien reçu votre demande — Domify",
    html: emailLayout(
      "Merci pour votre demande !",
      `<p>Bonjour ${lead.name},</p><p>Votre demande a bien été transmise à notre équipe. Un conseiller vous recontactera très prochainement.</p>`
    ),
  });
}
